"""
Semantic search API endpoints.

Implements Story 4.4: Natural language semantic search across call transcripts
using AWS Bedrock Titan embeddings and OpenSearch vector search.
"""

import logging
import time
import json
from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase
import boto3

from backend.models.search import (
    SearchRequest,
    SearchResponse,
    SearchResult,
    ChunkMetadata,
    CallMetadataSummary
)
from backend.services.opensearch_service import OpenSearchService
from backend.core.dependencies import get_db, get_opensearch_service, get_current_user
from backend.core.config import settings
from backend.models.auth import AuthenticatedUser

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/search", tags=["Search"])


@router.post("/", response_model=SearchResponse)
async def search_transcripts(
    request: SearchRequest,
    opensearch_service: OpenSearchService = Depends(get_opensearch_service),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
) -> SearchResponse:
    """
    Semantic search across all call transcripts.

    Uses AWS Bedrock Titan to generate query embedding and OpenSearch
    for vector similarity search. Returns ranked results with call context.

    **Process:**
    1. Generate query embedding using Bedrock Titan V2
    2. Perform vector search in OpenSearch
    3. Apply filters (company, call_type, dates)
    4. Enrich results with call metadata from MongoDB
    5. Return ranked results sorted by similarity score

    **Args:**
        request: Search parameters (query, filters, k, min_score)

    **Returns:**
        SearchResponse: Ranked search results with metadata

    **Raises:**
        HTTPException 400: Invalid request parameters
        HTTPException 503: Bedrock or OpenSearch service unavailable
    """
    start_time = time.time()

    try:
        # 1. Validate request
        if not request.query or request.query.strip() == "":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Query cannot be empty"
            )

        logger.info(f"Semantic search query: '{request.query}' (k={request.k}, min_score={request.min_score})")

        # 2. Generate query embedding using Bedrock Titan
        try:
            query_embedding = await generate_query_embedding(request.query)
        except Exception as e:
            logger.error(f"Bedrock embedding generation failed: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Embedding generation service unavailable"
            )

        # 3. Prepare filters for OpenSearch
        opensearch_filters = {}
        if request.filters:
            if request.filters.company_name:
                opensearch_filters['metadata.company_name'] = request.filters.company_name

            if request.filters.call_type:
                opensearch_filters['metadata.call_type'] = request.filters.call_type

            if request.filters.date_from or request.filters.date_to:
                date_range = {}
                if request.filters.date_from:
                    date_range['gte'] = request.filters.date_from
                if request.filters.date_to:
                    date_range['lte'] = request.filters.date_to
                opensearch_filters['timestamp'] = date_range

        # 4. Perform vector search in OpenSearch
        try:
            search_results = await opensearch_service.vector_search(
                query_vector=query_embedding,
                k=request.k,
                filters=opensearch_filters if opensearch_filters else None,
                min_score=request.min_score
            )
        except Exception as e:
            logger.error(f"OpenSearch vector search failed: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Search service unavailable"
            )

        logger.info(f"OpenSearch returned {len(search_results)} results")

        # 5. Enrich results with call metadata from MongoDB
        enriched_results: List[SearchResult] = []

        for result in search_results:
            try:
                # Fetch call document
                call_doc = await db.calls.find_one({"call_id": result['call_id']})

                if not call_doc:
                    logger.warning(f"Call not found: {result['call_id']}")
                    continue

                # Extract metadata
                metadata = result.get('metadata', {})

                # Build enriched result
                enriched_result = SearchResult(
                    call_id=result['call_id'],
                    chunk_id=result.get('chunk_id', f"{result['call_id']}_chunk_0"),
                    chunk_index=result.get('chunk_index', 0),
                    score=result['score'],
                    text=result['text'],
                    metadata=ChunkMetadata(
                        company_name=metadata.get('company_name'),
                        call_type=metadata.get('call_type'),
                        start_time=metadata.get('start_time'),
                        end_time=metadata.get('end_time'),
                        word_count=metadata.get('word_count'),
                        character_count=metadata.get('character_count')
                    ),
                    call_metadata=CallMetadataSummary(
                        uploaded_at=call_doc.get('created_at') or call_doc.get('processing', {}).get('uploaded_at'),
                        duration_seconds=call_doc.get('audio', {}).get('duration_seconds')
                    )
                )

                enriched_results.append(enriched_result)

            except Exception as e:
                logger.error(f"Error enriching result for call {result.get('call_id')}: {e}")
                # Skip this result but continue with others
                continue

        # 6. Calculate processing time
        processing_time_ms = int((time.time() - start_time) * 1000)

        logger.info(f"Search completed: {len(enriched_results)} results in {processing_time_ms}ms")

        # 7. Build and return response
        return SearchResponse(
            query=request.query,
            results=enriched_results,
            total_results=len(enriched_results),
            processing_time_ms=processing_time_ms
        )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise

    except Exception as e:
        logger.error(f"Unexpected search error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during search"
        )


async def generate_query_embedding(query: str) -> List[float]:
    """
    Generate embedding for search query using AWS Bedrock Titan.

    Args:
        query: Natural language search query

    Returns:
        List of 1536 floats representing the query embedding

    Raises:
        Exception: On Bedrock API errors
    """
    try:
        # Initialize Bedrock client
        bedrock = boto3.client('bedrock-runtime', region_name=settings.aws_region)

        # Prepare request
        request_body = json.dumps({
            "inputText": query,
            "dimensions": 1536,
            "normalize": True
        })

        # Call Bedrock Titan
        response = bedrock.invoke_model(
            modelId='amazon.titan-embed-text-v2:0',
            body=request_body,
            contentType='application/json',
            accept='application/json'
        )

        # Parse response
        response_body = json.loads(response['body'].read())
        embedding = response_body['embedding']

        # Validate dimensions
        if len(embedding) != 1536:
            raise ValueError(f"Expected 1536 dimensions, got {len(embedding)}")

        return embedding

    except Exception as e:
        logger.error(f"Query embedding generation failed: {e}")
        raise
