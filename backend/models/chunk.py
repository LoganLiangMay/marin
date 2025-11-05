"""
Data models for text chunks.
Chunks are segments of call transcripts optimized for embedding and search.
"""

from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class Chunk(BaseModel):
    """
    Represents a chunk of text from a call transcript.

    Chunks are created by the ChunkingService to break down transcripts
    into optimal-sized segments for embedding generation and semantic search.
    """

    chunk_id: str = Field(..., description="Unique identifier: {call_id}_chunk_{index}")
    call_id: str = Field(..., description="ID of the parent call")
    chunk_index: int = Field(..., description="Position of this chunk in the call (0-indexed)")
    text: str = Field(..., description="The text content of this chunk")
    character_count: int = Field(..., description="Number of characters in the chunk")
    word_count: int = Field(..., description="Number of words in the chunk")
    start_time: Optional[float] = Field(default=None, description="Start timestamp in seconds (from Whisper)")
    end_time: Optional[float] = Field(default=None, description="End timestamp in seconds (from Whisper)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

    class Config:
        json_schema_extra = {
            "example": {
                "chunk_id": "call_123_chunk_0",
                "call_id": "call_123",
                "chunk_index": 0,
                "text": "Hello, this is a sample call transcript chunk...",
                "character_count": 512,
                "word_count": 95,
                "start_time": 0.0,
                "end_time": 15.3,
                "metadata": {
                    "company_name": "Acme Corp",
                    "call_type": "sales"
                }
            }
        }
