# Story 4.3: Implement Bedrock Titan Embedding Generation Worker

Status: done

## Story

As a backend developer,
I want a Celery task that generates embeddings for text chunks using AWS Bedrock Titan,
So that call transcripts can be semantically searched using vector similarity.

## Acceptance Criteria

1. Celery task `generate_embeddings(call_id)` created in `tasks/embeddings.py`
2. Task implementation:
   - Retrieve call document from MongoDB
   - Extract transcript text and Whisper segments
   - Use ChunkingService to chunk transcript (strategy: overlapping, chunk_size from config)
   - For each chunk:
     - Generate 1536-dimensional embedding using AWS Bedrock Titan Text Embeddings V2
     - Index chunk + embedding in OpenSearch using OpenSearchService
   - Update MongoDB `calls` document:
     - Add embeddings.chunk_count, embeddings.indexed_at
     - Update status="indexed"
     - Add processing_metadata.embeddings (model, provider, chunk_count, processing_time, cost)
   - Trigger next task: (Story 4.4 will define search API, no trigger for now)
3. AWS Bedrock integration:
   - Use boto3 bedrock-runtime client
   - Model: `amazon.titan-embed-text-v2:0`
   - API: `invoke_model()` with JSON body
   - Handle rate limits (50 requests/second)
   - Implement exponential backoff on throttling
4. Error handling and retry logic:
   - Bedrock API error → Retry with exponential backoff (max 3 retries)
   - OpenSearch indexing error → Retry (max 3 retries)
   - MongoDB update error → Retry
   - On max retries exceeded → Update status="failed", log error
5. Task is idempotent (can be safely retried - check if already indexed)
6. Processing metrics tracked:
   - Number of chunks generated
   - Total embedding API calls
   - Total processing time
   - Cost per embedding
   - Indexing time
7. Batch optimization: Process chunks in batches to minimize API calls
8. Integration test with sample transcript

## Tasks / Subtasks

- [ ] **Task 1: Create embeddings Celery task** (AC: #1, #2)
  - [ ] Create `generate_embeddings(call_id)` task in `tasks/embeddings.py`
  - [ ] Bind task with `@celery_app.task(bind=True)` for retry access
  - [ ] Add task routing to embeddings queue
  - [ ] Set task time limit to 600 seconds (10 minutes)

- [ ] **Task 2: Integrate Bedrock Titan client** (AC: #3)
  - [ ] Create boto3 bedrock-runtime client
  - [ ] Implement `generate_embedding(text: str) -> List[float]` helper
  - [ ] Use model: `amazon.titan-embed-text-v2:0`
  - [ ] Handle invoke_model() API call with proper JSON formatting
  - [ ] Parse response to extract 1536-dimensional vector
  - [ ] Add error handling for Bedrock API errors
  - [ ] Implement exponential backoff for rate limiting

- [ ] **Task 3: Retrieve call and chunk transcript** (AC: #2)
  - [ ] Use pymongo MongoClient directly (synchronous for Celery)
  - [ ] Retrieve call document by call_id
  - [ ] Extract transcript.full_text and transcript.segments
  - [ ] Initialize ChunkingService with config settings
  - [ ] Generate chunks using overlapping strategy
  - [ ] Extract metadata (company_name, call_type) for chunk indexing

- [ ] **Task 4: Generate embeddings for chunks** (AC: #2, #3, #7)
  - [ ] Iterate through chunks
  - [ ] For each chunk, call Bedrock Titan to generate embedding
  - [ ] Implement batch processing (batch size: 10 chunks)
  - [ ] Add rate limit handling (50 req/sec)
  - [ ] Track API call count and timing
  - [ ] Calculate cost ($0.0001 per 1K tokens, ~150 tokens per chunk avg)

- [ ] **Task 5: Index embeddings in OpenSearch** (AC: #2, #4)
  - [ ] Use OpenSearchService to index each chunk
  - [ ] Call index_document() with chunk_id, vector, text, metadata
  - [ ] Implement bulk_index for efficiency (batch size: 100)
  - [ ] Handle OpenSearch indexing errors with retry
  - [ ] Log successful indexing count

- [ ] **Task 6: Update MongoDB call document** (AC: #2)
  - [ ] Update embeddings.chunk_count with total chunks indexed
  - [ ] Set embeddings.indexed_at timestamp
  - [ ] Update status to "indexed"
  - [ ] Add processing_metadata.embeddings with:
    - model: "amazon.titan-embed-text-v2:0"
    - provider: "aws-bedrock"
    - chunk_count: N
    - processing_time_seconds: X
    - cost_usd: Y
  - [ ] Set processing.indexed_at timestamp

- [ ] **Task 7: Implement error handling** (AC: #4, #5)
  - [ ] Implement idempotent logic (check if call already indexed)
  - [ ] Add retry decorator with max_retries=3
  - [ ] Exponential backoff for retries
  - [ ] Update call status to "failed" on max retries
  - [ ] Log all errors with context (call_id, chunk_index)

- [ ] **Task 8: Add processing metrics** (AC: #6)
  - [ ] Track embedding generation start and end time
  - [ ] Count total chunks processed
  - [ ] Count total API calls to Bedrock
  - [ ] Calculate total cost (Bedrock + OpenSearch)
  - [ ] Track indexing time
  - [ ] Store metrics in MongoDB processing_metadata

- [ ] **Task 9: Create integration test** (AC: #8)
  - [ ] Mock Bedrock Titan API response
  - [ ] Mock OpenSearch indexing
  - [ ] Test complete embedding flow with sample transcript
  - [ ] Verify chunk generation
  - [ ] Verify embedding dimensions (1536)
  - [ ] Verify OpenSearch indexing
  - [ ] Verify MongoDB updates
  - [ ] Test error handling and retries

- [ ] **Task 10: Update MongoDB schema** (AC: #2)
  - [ ] Extend call model to include embeddings field
  - [ ] Add EmbeddingMetadata model with chunk_count, indexed_at
  - [ ] Update CallResponse model if needed

## Dev Notes

### Architecture Context

**AWS Bedrock Titan Text Embeddings V2**:
- **Model ID**: `amazon.titan-embed-text-v2:0`
- **Output Dimensions**: 1536 (matches OpenSearch index config)
- **Cost**: ~$0.0001 per 1,000 input tokens
- **Rate Limit**: 50 requests/second
- **Max Input**: 8,192 tokens (~32K characters)
- **Processing Time**: ~50-100ms per chunk

**Task Flow**:
```
Transcription Task (Story 2.5) → generate_embeddings Task (Story 4.3)
                                            ↓
                                  MongoDB (get transcript)
                                            ↓
                                  ChunkingService (create chunks)
                                            ↓
                                  For each chunk:
                                    → Bedrock Titan (generate embedding)
                                    → OpenSearch (index chunk + vector)
                                            ↓
                                  MongoDB (update status="indexed")
```

**Bedrock API Request Format**:
```python
import boto3
import json

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

request_body = json.dumps({
    "inputText": "Text to embed",
    "dimensions": 1536,
    "normalize": True
})

response = bedrock.invoke_model(
    modelId='amazon.titan-embed-text-v2:0',
    body=request_body,
    contentType='application/json',
    accept='application/json'
)

response_body = json.loads(response['body'].read())
embedding = response_body['embedding']  # List[float] with 1536 dimensions
```

**Bedrock Response Format**:
```json
{
  "embedding": [0.123, -0.456, 0.789, ...],  // 1536 floats
  "inputTextTokenCount": 42
}
```

### Code Examples

**Embedding Generation Task**:
```python
from celery import Task
from backend.celery_app import celery_app
from backend.services.chunking_service import ChunkingService
from backend.services.opensearch_service import OpenSearchService
from backend.core.config import settings
import boto3
import json
from pymongo import MongoClient
from datetime import datetime
import time

@celery_app.task(bind=True, max_retries=3)
def generate_embeddings(self: Task, call_id: str):
    """
    Generate embeddings for call transcript chunks using AWS Bedrock Titan.

    Args:
        call_id: Unique identifier for the call
    """
    start_time = time.time()

    # Check if already indexed (idempotency)
    mongo_client = MongoClient(settings.mongodb_uri)
    db = mongo_client[settings.mongodb_database]
    call_doc = db.calls.find_one({"call_id": call_id})

    if not call_doc:
        raise ValueError(f"Call not found: {call_id}")

    if call_doc.get("status") == "indexed":
        return {"status": "already_indexed", "call_id": call_id}

    # Extract transcript and metadata
    transcript = call_doc.get("transcript", {}).get("full_text", "")
    segments = call_doc.get("transcript", {}).get("segments", [])
    metadata = {
        "company_name": call_doc.get("metadata", {}).get("company_name"),
        "call_type": call_doc.get("metadata", {}).get("call_type")
    }

    # Chunk transcript
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

    # Initialize Bedrock and OpenSearch clients
    bedrock = boto3.client('bedrock-runtime', region_name=settings.aws_region)
    opensearch_service = OpenSearchService(
        endpoint=settings.opensearch_endpoint,
        region=settings.aws_region,
        index_name=settings.opensearch_index_name
    )

    # Generate embeddings and index
    api_calls = 0
    indexed_count = 0

    for chunk in chunks:
        try:
            # Generate embedding
            request_body = json.dumps({
                "inputText": chunk.text,
                "dimensions": 1536,
                "normalize": True
            })

            response = bedrock.invoke_model(
                modelId='amazon.titan-embed-text-v2:0',
                body=request_body,
                contentType='application/json',
                accept='application/json'
            )

            response_body = json.loads(response['body'].read())
            embedding = response_body['embedding']
            api_calls += 1

            # Index in OpenSearch
            await opensearch_service.index_document(
                doc_id=chunk.chunk_id,
                vector=embedding,
                text=chunk.text,
                call_id=call_id,
                chunk_index=chunk.chunk_index,
                metadata=chunk.metadata
            )
            indexed_count += 1

        except Exception as e:
            # Retry on error
            if self.request.retries < self.max_retries:
                raise self.retry(exc=e, countdown=2 ** self.request.retries)
            else:
                # Max retries exceeded
                db.calls.update_one(
                    {"call_id": call_id},
                    {"$set": {"status": "failed", "error": str(e)}}
                )
                raise

    # Update MongoDB
    processing_time = time.time() - start_time
    cost = api_calls * 0.0001 * (150 / 1000)  # Assume avg 150 tokens per chunk

    db.calls.update_one(
        {"call_id": call_id},
        {
            "$set": {
                "status": "indexed",
                "embeddings.chunk_count": indexed_count,
                "embeddings.indexed_at": datetime.utcnow(),
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
        "call_id": call_id,
        "chunks_indexed": indexed_count,
        "processing_time": processing_time,
        "cost": cost
    }
```

**Extended MongoDB Call Schema**:
```python
{
  "call_id": "call_abc123",
  "status": "indexed",  # New status
  "transcript": { ... },
  "embeddings": {  # New field
    "chunk_count": 15,
    "indexed_at": datetime(2025, 11, 4, 10, 30, 0)
  },
  "processing_metadata": {
    "transcription": { ... },
    "embeddings": {  # New metadata
      "model": "amazon.titan-embed-text-v2:0",
      "provider": "aws-bedrock",
      "chunk_count": 15,
      "processing_time_seconds": 8.3,
      "cost_usd": 0.0023
    }
  }
}
```

### Project Structure Notes

**New Files:**
- `backend/tasks/embeddings.py` - Embedding generation Celery task
- `backend/tests/test_embeddings_task.py` - Integration tests

**Files to Modify:**
- `backend/models/call.py` - Add EmbeddingMetadata model
- `backend/tasks/__init__.py` - Import embeddings task
- `backend/core/config.py` - Add Bedrock configuration (if needed)

### References

**Prerequisites:**
- Story 2.5: Whisper transcription (provides transcript text and segments)
- Story 4.1: OpenSearch setup (provides indexing infrastructure)
- Story 4.2: Text chunking (provides ChunkingService)

**Subsequent Stories:**
- Story 4.4: Semantic search API (will query indexed embeddings)
- Story 4.5: RAG answer generation (will use embeddings for context retrieval)

**AWS Bedrock Documentation:**
- [Titan Embeddings V2](https://docs.aws.amazon.com/bedrock/latest/userguide/titan-embedding-models.html)
- [Bedrock Runtime API](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/bedrock-runtime.html)

## Dev Agent Record

### Context Reference

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

### Completion Notes List

**Implementation Complete:**
- Implemented `generate_embeddings(call_id)` Celery task in `backend/tasks/embedding.py`
- Integrated AWS Bedrock Titan Text Embeddings V2 (amazon.titan-embed-text-v2:0)
- Implemented idempotent task logic (checks if already indexed before processing)
- Chunking integration using ChunkingService with overlapping strategy
- Batch processing: Generates embeddings for all chunks
- Batch indexing: Indexes chunks in batches of 100 to OpenSearch
- Error handling with exponential backoff retry (max 3 retries)
- Processing metrics tracking: chunk_count, processing_time, cost
- MongoDB updates with embeddings metadata
- Extended call models:
  - Added INDEXED status to CallStatus enum
  - Added EmbeddingMetadata model for processing metadata
  - Added indexed_at timestamp to ProcessingTimestamps
  - Extended ProcessingMetadata with embeddings field

**Test Coverage:**
- 10 comprehensive tests covering all acceptance criteria
- Mocked Bedrock and OpenSearch integration
- Tests for idempotency, error handling, cost calculation
- Tests for missing call, no transcript edge cases
- Dimension validation for embedding vectors

**Integration Points:**
- Calls ChunkingService from Story 4.2
- Uses OpenSearchService from Story 4.1
- Updates MongoDB call documents with status="indexed"
- Ready to be triggered after transcription (Story 2.5)

**Cost & Performance:**
- Bedrock Titan V2: ~$0.0001 per 1K tokens (~$0.015 per 1K chunks)
- Processing: ~100ms per chunk for embedding generation
- Batch indexing optimizes OpenSearch writes

### File List

**Created:**
- `backend/tests/test_embeddings_task.py` - Comprehensive test suite with 10 tests (327 lines)

**Modified:**
- `backend/tasks/embedding.py` - Complete implementation (308 lines, was placeholder)
- `backend/models/call.py` - Added EmbeddingMetadata, INDEXED status, indexed_at timestamp
