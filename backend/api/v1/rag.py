"""
RAG (Retrieval-Augmented Generation) API endpoints.

Implements Story 4.5: AI-powered question answering using semantic search
combined with LLM-based answer generation.
"""

import logging
import time
from fastapi import APIRouter, HTTPException, Depends, status

from backend.models.rag import RAGRequest, RAGResponse
from backend.services.rag_service import RAGService
from backend.services.opensearch_service import OpenSearchService
from backend.api.v1.search import generate_query_embedding
from backend.core.dependencies import get_opensearch_service, get_current_user
from backend.core.config import settings
from backend.models.auth import AuthenticatedUser

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rag", tags=["RAG"])


# Initialize RAG service (singleton)
_rag_service: RAGService = None


def get_rag_service() -> RAGService:
    """Get RAG service instance (singleton pattern)."""
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService(
            openai_api_key=settings.openai_api_key,
            anthropic_api_key=getattr(settings, 'anthropic_api_key', None)
        )
    return _rag_service


@router.post("/answer", response_model=RAGResponse)
async def answer_question(
    request: RAGRequest,
    opensearch_service: OpenSearchService = Depends(get_opensearch_service),
    current_user: AuthenticatedUser = Depends(get_current_user)
) -> RAGResponse:
    """
    Answer questions using RAG (Retrieval-Augmented Generation).

    This endpoint:
    1. Uses semantic search to retrieve relevant call transcript chunks
    2. Formats the chunks as context for an LLM
    3. Generates a comprehensive answer using GPT-4o, Claude, or other models
    4. Returns the answer with source citations

    **Process:**
    1. Generate question embedding using Bedrock Titan V2
    2. Retrieve top-k relevant chunks from OpenSearch
    3. Format chunks as context with metadata
    4. Call LLM (OpenAI or Anthropic) with RAG prompt
    5. Return generated answer with source chunks

    **Args:**
        request: RAG request with question, filters, k, model

    **Returns:**
        RAGResponse: AI-generated answer with source citations

    **Raises:**
        HTTPException 400: Invalid request parameters
        HTTPException 503: Search or LLM service unavailable
    """
    start_time = time.time()

    try:
        # 1. Validate request
        if not request.question or request.question.strip() == "":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Question cannot be empty"
            )

        # Validate model
        supported_models = ["gpt-4o", "gpt-4", "gpt-3.5-turbo", "claude-3-5-sonnet-20241022", "claude-3-opus", "claude-3-haiku"]
        if request.model not in supported_models:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported model: {request.model}. Supported: {supported_models}"
            )

        logger.info(f"RAG question: '{request.question}' (model={request.model}, k={request.k})")

        # 2. Generate query embedding
        try:
            query_embedding = await generate_query_embedding(request.question)
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}", exc_info=True)
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

        # 4. Retrieve relevant context from OpenSearch
        try:
            search_results = await opensearch_service.vector_search(
                query_vector=query_embedding,
                k=request.k,
                filters=opensearch_filters if opensearch_filters else None,
                min_score=0.6  # Lower threshold for RAG to get more context
            )
        except Exception as e:
            logger.error(f"OpenSearch retrieval failed: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Search service unavailable"
            )

        logger.info(f"Retrieved {len(search_results)} context chunks for RAG")

        # 5. Get RAG service and generate answer
        rag_service = get_rag_service()

        try:
            answer = await rag_service.answer_question(
                question=request.question,
                search_results=search_results,
                model=request.model
            )
        except ValueError as e:
            # Model validation error
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            logger.error(f"LLM generation failed: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Answer generation service unavailable"
            )

        # 6. Format sources
        sources = []
        if request.include_sources:
            sources = rag_service.format_sources(search_results)

        # 7. Calculate processing time
        processing_time_ms = int((time.time() - start_time) * 1000)

        logger.info(f"RAG answer generated: {len(answer)} chars, {processing_time_ms}ms")

        # 8. Build and return response
        return RAGResponse(
            question=request.question,
            answer=answer,
            sources=sources,
            model_used=request.model,
            total_sources=len(search_results),
            processing_time_ms=processing_time_ms
        )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise

    except Exception as e:
        logger.error(f"Unexpected RAG error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during answer generation"
        )
