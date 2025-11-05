"""
Pydantic models for call-related data.
Defines data structures for API requests and responses.
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class CallStatus(str, Enum):
    """Call processing status."""
    UPLOADED = "uploaded"
    TRANSCRIBING = "transcribing"
    TRANSCRIBED = "transcribed"
    ANALYZING = "analyzing"
    ANALYZED = "analyzed"
    INDEXED = "indexed"  # After embeddings are generated and indexed
    COMPLETED = "completed"
    FAILED = "failed"


class AudioInfo(BaseModel):
    """Audio file information."""
    s3_bucket: str
    s3_key: str
    format: str
    file_size_bytes: int
    duration_seconds: Optional[float] = None


class CallMetadata(BaseModel):
    """Call metadata."""
    company_name: str = Field(..., description="Company name")
    contact_email: str = Field(..., description="Contact email")
    call_type: str = Field(..., description="Type of call (sales, support, etc.)")
    tags: List[str] = Field(default_factory=list, description="Custom tags")


class TranscriptSegment(BaseModel):
    """Transcript segment with timestamp."""
    start_time: float
    end_time: float
    speaker: Optional[str] = None
    text: str


class Transcript(BaseModel):
    """Call transcript."""
    full_text: str
    segments: List[Dict[str, Any]] = Field(default_factory=list)  # Flexible for Whisper format
    word_count: Optional[int] = None
    duration_seconds: Optional[float] = None
    language: str = "en"
    confidence: Optional[float] = None


class TranscriptionMetadata(BaseModel):
    """Transcription processing metadata."""
    model: str
    provider: str
    processing_time_seconds: float
    cost_usd: float
    audio_duration_minutes: float


class EmbeddingMetadata(BaseModel):
    """Embedding generation metadata (Story 4.3)."""
    model: str
    provider: str
    chunk_count: int
    processing_time_seconds: float
    cost_usd: float


class ProcessingMetadata(BaseModel):
    """Processing metadata for all stages."""
    transcription: Optional[TranscriptionMetadata] = None
    embeddings: Optional[EmbeddingMetadata] = None


class ProcessingTimestamps(BaseModel):
    """Processing timestamps."""
    uploaded_at: Optional[datetime] = None
    transcribed_at: Optional[datetime] = None
    analyzed_at: Optional[datetime] = None
    indexed_at: Optional[datetime] = None  # When embeddings were indexed (Story 4.3)


class ErrorInfo(BaseModel):
    """Error information for failed calls."""
    message: str
    timestamp: datetime
    retry_count: Optional[int] = None


class CallCreate(BaseModel):
    """Model for creating a new call."""
    metadata: CallMetadata


class CallResponse(BaseModel):
    """Model for call API response."""
    call_id: str
    status: CallStatus
    metadata: CallMetadata
    audio: Optional[AudioInfo] = None
    transcript: Optional[Transcript] = None
    processing: Optional[ProcessingTimestamps] = None
    processing_metadata: Optional[ProcessingMetadata] = None
    error: Optional[ErrorInfo] = None
    created_at: datetime
    updated_at: datetime


class CallListResponse(BaseModel):
    """Model for list calls response."""
    calls: List[CallResponse]
    total: int
    page: int
    page_size: int


class UploadResponse(BaseModel):
    """Model for upload response."""
    call_id: str
    message: str
    s3_uri: str
