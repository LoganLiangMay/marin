"""
Embedding generation tasks using AWS Bedrock Titan.

Implements Story 4.3: Generate embeddings for call transcripts using
AWS Bedrock Titan Text Embeddings V2 and index them in OpenSearch.
"""

import logging
import json
import time
from datetime import datetime
from typing import Dict, Any, List
from celery import Task

from backend.celery_app import celery_app
from backend.services.chunking_service import ChunkingService
from backend.services.opensearch_service import OpenSearchService
from backend.core.config import settings
from backend.models.chunk import Chunk

import boto3
from pymongo import MongoClient

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name='tasks.embedding.generate_embeddings', max_retries=3)
def generate_embeddings(self: Task, call_id: str) -> Dict[str, Any]:
    """
    Generate embeddings for call transcript using AWS Bedrock Titan.

    This task:
    1. Retrieves call document from MongoDB
    2. Chunks the transcript using ChunkingService
    3. Generates 1536-dimensional embeddings for each chunk using Bedrock Titan V2
    4. Indexes chunks + embeddings in OpenSearch
    5. Updates MongoDB with indexing metadata

    Args:
        call_id: Unique identifier for the call

    Returns:
        dict: Results with chunks_indexed, processing_time, cost

    Raises:
        ValueError: If call_id not found in MongoDB
        Exception: On Bedrock API or OpenSearch errors (with retry)
    """
    start_time = time.time()
    logger.info(f"Starting embedding generation for call_id={call_id}")

    # Connect to MongoDB (synchronous for Celery)
    mongo_client = MongoClient(settings.mongodb_uri)
    db = mongo_client[settings.mongodb_database]

    try:
        # 1. Check if already indexed (idempotency)
        call_doc = db.calls.find_one({"call_id": call_id})

        if not call_doc:
            raise ValueError(f"Call not found: {call_id}")

        if call_doc.get("status") == "indexed":
            logger.info(f"Call {call_id} already indexed, skipping")
            return {
                "status": "already_indexed",
                "call_id": call_id,
                "chunks_indexed": call_doc.get("embeddings", {}).get("chunk_count", 0)
            }

        # 2. Extract transcript and metadata
        transcript_data = call_doc.get("transcript", {})
        transcript = transcript_data.get("full_text", "")
        segments = transcript_data.get("segments", [])

        if not transcript:
            logger.warning(f"No transcript found for call_id={call_id}")
            return {"status": "no_transcript", "call_id": call_id}

        metadata = {
            "company_name": call_doc.get("metadata", {}).get("company_name"),
            "call_type": call_doc.get("metadata", {}).get("call_type")
        }

        logger.info(f"Retrieved transcript for {call_id}: {len(transcript)} chars")

        # 3. Chunk transcript
        chunking_service = ChunkingService(
            chunk_size=settings.chunk_size,
            overlap_percentage=settings.overlap_percentage,
            min_chunk_size=settings.min_chunk_size,
            max_chunk_size=settings.max_chunk_size
        )

        chunks = chunking_service.chunk_transcript(
            call_id=call_id,
            transcript=transcript,
            segments=segments,
            strategy="overlapping",
            metadata=metadata
        )

        logger.info(f"Generated {len(chunks)} chunks for call_id={call_id}")

        if len(chunks) == 0:
            logger.warning(f"No chunks generated for call_id={call_id}")
            return {"status": "no_chunks", "call_id": call_id}

        # 4. Initialize AWS Bedrock client
        bedrock = boto3.client('bedrock-runtime', region_name=settings.aws_region)

        # 5. Initialize OpenSearch service
        opensearch_service = OpenSearchService(
            endpoint=settings.opensearch_endpoint,
            region=settings.aws_region,
            index_name=settings.opensearch_index_name
        )

        # 6. Generate embeddings and index
        api_calls = 0
        indexed_count = 0
        embeddings_batch = []

        for chunk in chunks:
            try:
                # Generate embedding using Bedrock Titan V2
                embedding = _generate_embedding_bedrock(bedrock, chunk.text)
                api_calls += 1

                # Prepare for batch indexing
                embeddings_batch.append({
                    "doc_id": chunk.chunk_id,
                    "vector": embedding,
                    "text": chunk.text,
                    "call_id": call_id,
                    "chunk_index": chunk.chunk_index,
                    "metadata": {
                        **chunk.metadata,
                        "start_time": chunk.start_time,
                        "end_time": chunk.end_time,
                        "word_count": chunk.word_count,
                        "character_count": chunk.character_count
                    }
                })

                # Batch index every 100 chunks or on last chunk
                if len(embeddings_batch) >= 100 or chunk == chunks[-1]:
                    _batch_index_opensearch(opensearch_service, embeddings_batch)
                    indexed_count += len(embeddings_batch)
                    logger.info(f"Indexed {indexed_count}/{len(chunks)} chunks for {call_id}")
                    embeddings_batch = []

            except Exception as e:
                logger.error(f"Error processing chunk {chunk.chunk_index} for {call_id}: {e}")
                # Retry on error
                if self.request.retries < self.max_retries:
                    logger.warning(f"Retrying task for {call_id} (attempt {self.request.retries + 1})")
                    raise self.retry(exc=e, countdown=2 ** self.request.retries)
                else:
                    # Max retries exceeded
                    logger.error(f"Max retries exceeded for {call_id}")
                    db.calls.update_one(
                        {"call_id": call_id},
                        {
                            "$set": {
                                "status": "failed",
                                "error": {
                                    "message": str(e),
                                    "timestamp": datetime.utcnow(),
                                    "stage": "embedding_generation"
                                }
                            }
                        }
                    )
                    raise

        # 7. Calculate metrics
        processing_time = time.time() - start_time

        # Cost calculation:
        # Bedrock Titan V2: ~$0.0001 per 1K tokens
        # Assume avg 150 tokens per chunk
        tokens_per_chunk = 150
        cost = api_calls * (tokens_per_chunk / 1000) * 0.0001

        logger.info(f"Embedding generation complete for {call_id}: "
                   f"{indexed_count} chunks, {processing_time:.2f}s, ${cost:.4f}")

        # 8. Update MongoDB with results
        db.calls.update_one(
            {"call_id": call_id},
            {
                "$set": {
                    "status": "indexed",
                    "processing.indexed_at": datetime.utcnow(),
                    "processing_metadata.embeddings": {
                        "model": "amazon.titan-embed-text-v2:0",
                        "provider": "aws-bedrock",
                        "chunk_count": indexed_count,
                        "processing_time_seconds": processing_time,
                        "cost_usd": cost
                    }
                }
            }
        )

        return {
            "status": "success",
            "call_id": call_id,
            "chunks_indexed": indexed_count,
            "processing_time": processing_time,
            "cost": cost
        }

    except Exception as e:
        logger.error(f"Embedding generation failed for {call_id}: {e}", exc_info=True)
        raise

    finally:
        # Close MongoDB connection
        mongo_client.close()


def _generate_embedding_bedrock(bedrock_client, text: str) -> List[float]:
    """
    Generate embedding for text using AWS Bedrock Titan Text Embeddings V2.

    Args:
        bedrock_client: Boto3 bedrock-runtime client
        text: Text to embed

    Returns:
        List of 1536 floats representing the embedding vector

    Raises:
        Exception: On Bedrock API errors
    """
    try:
        # Prepare request body
        request_body = json.dumps({
            "inputText": text,
            "dimensions": 1536,
            "normalize": True
        })

        # Call Bedrock Titan
        response = bedrock_client.invoke_model(
            modelId='amazon.titan-embed-text-v2:0',
            body=request_body,
            contentType='application/json',
            accept='application/json'
        )

        # Parse response
        response_body = json.loads(response['body'].read())
        embedding = response_body['embedding']

        # Validate embedding dimensions
        if len(embedding) != 1536:
            raise ValueError(f"Expected 1536 dimensions, got {len(embedding)}")

        return embedding

    except Exception as e:
        logger.error(f"Bedrock embedding generation failed: {e}")
        raise


def _batch_index_opensearch(opensearch_service: OpenSearchService, embeddings_batch: List[Dict[str, Any]]):
    """
    Batch index embeddings in OpenSearch.

    Args:
        opensearch_service: OpenSearchService instance
        embeddings_batch: List of dicts with doc_id, vector, text, call_id, chunk_index, metadata

    Raises:
        Exception: On OpenSearch indexing errors
    """
    try:
        # Prepare documents for bulk indexing
        documents = []
        for item in embeddings_batch:
            document = {
                'id': item['doc_id'],
                'embedding': item['vector'],
                'text': item['text'],
                'call_id': item['call_id'],
                'chunk_id': item['doc_id'],
                'chunk_index': item['chunk_index'],
                'timestamp': datetime.utcnow().isoformat(),
                'metadata': item['metadata']
            }
            documents.append(document)

        # Bulk index (synchronous, not async)
        # Note: OpenSearchService.bulk_index expects to be called with await
        # For Celery (synchronous), we need to use the sync client directly
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(opensearch_service.bulk_index(documents))
        loop.close()

    except Exception as e:
        logger.error(f"OpenSearch batch indexing failed: {e}")
        raise
