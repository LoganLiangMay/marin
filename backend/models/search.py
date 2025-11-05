"""
Pydantic models for semantic search API.

Defines request and response structures for semantic search endpoints.
"""

from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class SearchFilters(BaseModel):
    """
    Optional filters for semantic search.

    Allows filtering results by company, call type, and date range.
    """
    company_name: Optional[str] = Field(default=None, description="Filter by company name")
    call_type: Optional[str] = Field(default=None, description="Filter by call type (sales, support, etc.)")
    date_from: Optional[str] = Field(default=None, description="Filter calls from this date (ISO format)")
    date_to: Optional[str] = Field(default=None, description="Filter calls until this date (ISO format)")


class SearchRequest(BaseModel):
    """
    Request model for semantic search endpoint.

    Supports natural language queries with optional filters and parameters.
    """
    query: str = Field(..., min_length=1, description="Natural language search query")
    filters: Optional[SearchFilters] = Field(default=None, description="Optional search filters")
    k: int = Field(default=10, ge=1, le=100, description="Number of results to return (1-100)")
    min_score: float = Field(default=0.7, ge=0.0, le=1.0, description="Minimum similarity score (0.0-1.0)")

    class Config:
        json_schema_extra = {
            "example": {
                "query": "customer complained about billing",
                "filters": {
                    "company_name": "Acme Corp",
                    "call_type": "support",
                    "date_from": "2025-01-01",
                    "date_to": "2025-12-31"
                },
                "k": 10,
                "min_score": 0.7
            }
        }


class ChunkMetadata(BaseModel):
    """
    Metadata for a transcript chunk in search results.

    Includes contextual information about the chunk's source and timing.
    """
    company_name: Optional[str] = None
    call_type: Optional[str] = None
    start_time: Optional[float] = Field(default=None, description="Chunk start time in seconds")
    end_time: Optional[float] = Field(default=None, description="Chunk end time in seconds")
    word_count: Optional[int] = None
    character_count: Optional[int] = None


class CallMetadataSummary(BaseModel):
    """
    Summary of call metadata for search results.

    Provides key call information without returning the full call document.
    """
    uploaded_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None


class SearchResult(BaseModel):
    """
    Single search result from semantic search.

    Contains chunk text, similarity score, and contextual metadata.
    """
    call_id: str = Field(..., description="Unique identifier for the call")
    chunk_id: str = Field(..., description="Unique identifier for the chunk")
    chunk_index: int = Field(..., description="Position of chunk in call transcript")
    score: float = Field(..., description="Similarity score (0.0-1.0)")
    text: str = Field(..., description="Chunk text content")
    metadata: ChunkMetadata = Field(..., description="Chunk metadata")
    call_metadata: CallMetadataSummary = Field(..., description="Call metadata summary")

    class Config:
        json_schema_extra = {
            "example": {
                "call_id": "call_123",
                "chunk_id": "call_123_chunk_5",
                "chunk_index": 5,
                "score": 0.92,
                "text": "The customer mentioned they were charged twice this month...",
                "metadata": {
                    "company_name": "Acme Corp",
                    "call_type": "support",
                    "start_time": 45.2,
                    "end_time": 58.7,
                    "word_count": 25,
                    "character_count": 120
                },
                "call_metadata": {
                    "uploaded_at": "2025-01-15T10:30:00Z",
                    "duration_seconds": 180
                }
            }
        }


class SearchResponse(BaseModel):
    """
    Response model for semantic search endpoint.

    Returns search results with query metadata and timing information.
    """
    query: str = Field(..., description="Original search query")
    results: List[SearchResult] = Field(..., description="List of search results sorted by score")
    total_results: int = Field(..., description="Total number of results returned")
    processing_time_ms: int = Field(..., description="Search processing time in milliseconds")

    class Config:
        json_schema_extra = {
            "example": {
                "query": "customer complained about billing",
                "results": [
                    {
                        "call_id": "call_123",
                        "chunk_id": "call_123_chunk_5",
                        "chunk_index": 5,
                        "score": 0.92,
                        "text": "The customer mentioned they were charged twice this month...",
                        "metadata": {
                            "company_name": "Acme Corp",
                            "call_type": "support",
                            "start_time": 45.2,
                            "end_time": 58.7
                        },
                        "call_metadata": {
                            "uploaded_at": "2025-01-15T10:30:00Z",
                            "duration_seconds": 180
                        }
                    }
                ],
                "total_results": 1,
                "processing_time_ms": 245
            }
        }
