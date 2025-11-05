"""
Pydantic models for RAG (Retrieval-Augmented Generation) API.

Defines request and response structures for RAG-based question answering.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from backend.models.search import SearchFilters


class RAGRequest(BaseModel):
    """
    Request model for RAG answer generation.

    Combines semantic search with LLM-based answer generation.
    """
    question: str = Field(..., min_length=1, description="Natural language question to answer")
    filters: Optional[SearchFilters] = Field(default=None, description="Optional filters for context retrieval")
    k: int = Field(default=5, ge=1, le=20, description="Number of context chunks to retrieve (1-20)")
    model: str = Field(default="gpt-4o", description="LLM model to use (gpt-4o, gpt-4, gpt-3.5-turbo, claude-3-5-sonnet)")
    include_sources: bool = Field(default=True, description="Include source chunks in response")

    class Config:
        json_schema_extra = {
            "example": {
                "question": "What are the most common customer complaints about billing?",
                "filters": {
                    "company_name": "Acme Corp",
                    "call_type": "support",
                    "date_from": "2025-01-01",
                    "date_to": "2025-12-31"
                },
                "k": 5,
                "model": "gpt-4o",
                "include_sources": True
            }
        }


class SourceChunk(BaseModel):
    """
    Source chunk used to generate RAG answer.

    Includes relevance score and metadata for citation.
    """
    call_id: str = Field(..., description="Unique identifier for the call")
    chunk_id: str = Field(..., description="Unique identifier for the chunk")
    score: float = Field(..., description="Similarity score (0.0-1.0)")
    text: str = Field(..., description="Chunk text content")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Chunk metadata")

    class Config:
        json_schema_extra = {
            "example": {
                "call_id": "call_123",
                "chunk_id": "call_123_chunk_5",
                "score": 0.92,
                "text": "The customer mentioned they were charged twice this month...",
                "metadata": {
                    "company_name": "Acme Corp",
                    "call_type": "support",
                    "start_time": 45.2,
                    "end_time": 58.7
                }
            }
        }


class RAGResponse(BaseModel):
    """
    Response model for RAG answer endpoint.

    Returns AI-generated answer with source citations.
    """
    question: str = Field(..., description="Original question")
    answer: str = Field(..., description="AI-generated answer based on context")
    sources: List[SourceChunk] = Field(..., description="Source chunks used to generate answer")
    model_used: str = Field(..., description="LLM model that generated the answer")
    total_sources: int = Field(..., description="Total number of source chunks retrieved")
    processing_time_ms: int = Field(..., description="Total processing time in milliseconds")

    class Config:
        json_schema_extra = {
            "example": {
                "question": "What are the most common customer complaints about billing?",
                "answer": "Based on the call transcripts, the most common billing complaints are:\n\n1. **Double charging** - Multiple customers reported being charged twice for the same service\n2. **Unclear pricing** - Customers expressed confusion about the pricing structure\n3. **Late fees** - Several calls discussed unexpected late fees",
                "sources": [
                    {
                        "call_id": "call_123",
                        "chunk_id": "call_123_chunk_5",
                        "score": 0.92,
                        "text": "The customer mentioned they were charged twice this month...",
                        "metadata": {
                            "company_name": "Acme Corp",
                            "start_time": 45.2
                        }
                    }
                ],
                "model_used": "gpt-4o",
                "total_sources": 5,
                "processing_time_ms": 1250
            }
        }
