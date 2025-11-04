"""
Celery tasks package for audio pipeline processing.

This package contains task modules for different processing types:
- transcription: OpenAI Whisper transcription tasks (Story 2.5)
- analysis: GPT-4o AI analysis tasks (Epic 3)
- embedding: Bedrock Titan embedding generation tasks (Epic 4)
"""

# Import tasks for Celery autodiscovery
from tasks.transcription import test_connection, transcribe_audio  # noqa: F401

__all__ = [
    'test_connection',
    'transcribe_audio',
]
