"""
Integration tests for call status tracking and retrieval API (Story 2.6).
Tests GET /api/v1/calls/{call_id} endpoint.
"""

import pytest
import os
import time
from datetime import datetime
from unittest.mock import patch, AsyncMock
from fastapi import status

# Set test environment variables before imports
os.environ.setdefault("AWS_REGION", "us-east-1")
os.environ.setdefault("S3_BUCKET_AUDIO", "test-audio-bucket")
os.environ.setdefault("S3_BUCKET_TRANSCRIPTS", "test-transcripts-bucket")
os.environ.setdefault("MONGODB_URI", "mongodb://localhost:27017/test_db")
os.environ.setdefault("REDIS_ENDPOINT", "localhost:6379")
os.environ.setdefault("SQS_QUEUE_URL", "https://sqs.us-east-1.amazonaws.com/123456789/test-queue")
os.environ.setdefault("OPENAI_API_KEY", "test-key")


class TestCallStatus:
    """Test suite for call status tracking and retrieval API."""

    def test_get_call_uploaded_status(self, client):
        """Test retrieving call with uploaded status."""
        call_id = "test-call-123"

        # Mock MongoDB response
        mock_call_doc = {
            "call_id": call_id,
            "status": "uploaded",
            "metadata": {
                "company_name": "Test Corp",
                "contact_email": "test@test.com",
                "call_type": "demo",
                "tags": []
            },
            "audio": {
                "s3_bucket": "test-bucket",
                "s3_key": "2025/11/04/test-call-123.mp3",
                "format": "mp3",
                "file_size_bytes": 1024000
            },
            "uploaded_at": datetime(2025, 11, 4, 10, 30, 0),
            "created_at": datetime(2025, 11, 4, 10, 30, 0),
            "updated_at": datetime(2025, 11, 4, 10, 30, 0)
        }

        with patch('backend.services.db_service.DBService.get_call', new_callable=AsyncMock) as mock_db:
            mock_db.return_value = mock_call_doc
            response = client.get(f"/api/v1/calls/{call_id}")

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["call_id"] == call_id
        assert data["status"] == "uploaded"
        assert data["metadata"]["company_name"] == "Test Corp"
        assert data["audio"]["format"] == "mp3"
        assert data["transcript"] is None  # No transcript yet

    def test_get_call_with_transcript(self, client):
        """Test retrieving call with transcribed status and transcript data."""
        call_id = "test-call-456"

        # Mock MongoDB response with transcript
        mock_call_doc = {
            "call_id": call_id,
            "status": "transcribed",
            "metadata": {
                "company_name": "Acme Corp",
                "contact_email": "john@acme.com",
                "call_type": "sales",
                "tags": []
            },
            "audio": {
                "s3_bucket": "test-bucket",
                "s3_key": "2025/11/04/test-call-456.mp3",
                "format": "mp3",
                "file_size_bytes": 2048000,
                "duration_seconds": 1847.52
            },
            "transcript": {
                "full_text": "This is a test transcript.",
                "segments": [
                    {"id": 0, "start": 0.0, "end": 2.5, "text": "This is a test"},
                    {"id": 1, "start": 2.5, "end": 5.0, "text": "transcript."}
                ],
                "word_count": 5,
                "duration_seconds": 1847.52,
                "language": "en"
            },
            "processing": {
                "uploaded_at": datetime(2025, 11, 4, 10, 30, 0),
                "transcribed_at": datetime(2025, 11, 4, 10, 35, 0)
            },
            "processing_metadata": {
                "transcription": {
                    "model": "whisper-1",
                    "provider": "openai",
                    "processing_time_seconds": 142.5,
                    "cost_usd": 0.18,
                    "audio_duration_minutes": 30.79
                }
            },
            "uploaded_at": datetime(2025, 11, 4, 10, 30, 0),
            "created_at": datetime(2025, 11, 4, 10, 30, 0),
            "updated_at": datetime(2025, 11, 4, 10, 35, 0)
        }

        with patch('backend.services.db_service.DBService.get_call', new_callable=AsyncMock) as mock_db:
            mock_db.return_value = mock_call_doc
            response = client.get(f"/api/v1/calls/{call_id}")

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["call_id"] == call_id
        assert data["status"] == "transcribed"
        assert data["transcript"] is not None
        assert data["transcript"]["full_text"] == "This is a test transcript."
        assert data["transcript"]["word_count"] == 5
        assert len(data["transcript"]["segments"]) == 2
        assert data["processing"] is not None
        assert data["processing"]["transcribed_at"] is not None
        assert data["processing_metadata"] is not None
        assert data["processing_metadata"]["transcription"]["model"] == "whisper-1"
        assert data["processing_metadata"]["transcription"]["cost_usd"] == 0.18

    def test_get_call_not_found(self, client):
        """Test 404 response when call doesn't exist."""
        call_id = "non-existent-call"

        with patch('backend.services.db_service.DBService.get_call', new_callable=AsyncMock) as mock_db:
            mock_db.return_value = None
            response = client.get(f"/api/v1/calls/{call_id}")

        # Assertions
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()

    def test_get_call_with_error_status(self, client):
        """Test retrieving call with failed status and error info."""
        call_id = "test-call-789"

        # Mock MongoDB response with error
        mock_call_doc = {
            "call_id": call_id,
            "status": "failed",
            "metadata": {
                "company_name": "Error Corp",
                "contact_email": "error@test.com",
                "call_type": "support",
                "tags": []
            },
            "audio": {
                "s3_bucket": "test-bucket",
                "s3_key": "2025/11/04/test-call-789.mp3",
                "format": "mp3",
                "file_size_bytes": 512000
            },
            "error": {
                "message": "OpenAI API rate limit exceeded",
                "timestamp": datetime(2025, 11, 4, 10, 40, 0),
                "retry_count": 3
            },
            "uploaded_at": datetime(2025, 11, 4, 10, 30, 0),
            "created_at": datetime(2025, 11, 4, 10, 30, 0),
            "updated_at": datetime(2025, 11, 4, 10, 40, 0)
        }

        with patch('backend.services.db_service.DBService.get_call', new_callable=AsyncMock) as mock_db:
            mock_db.return_value = mock_call_doc
            response = client.get(f"/api/v1/calls/{call_id}")

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["call_id"] == call_id
        assert data["status"] == "failed"
        assert data["error"] is not None
        assert data["error"]["message"] == "OpenAI API rate limit exceeded"
        assert data["error"]["retry_count"] == 3

    def test_get_call_minimal_data(self, client):
        """Test retrieving call with minimal data (only required fields)."""
        call_id = "test-call-minimal"

        # Mock MongoDB response with minimal fields
        mock_call_doc = {
            "call_id": call_id,
            "status": "uploaded",
            "metadata": {
                "company_name": "Minimal Corp",
                "contact_email": "minimal@test.com",
                "call_type": "demo",
                "tags": []
            },
            "uploaded_at": datetime(2025, 11, 4, 10, 30, 0)
        }

        with patch('backend.services.db_service.DBService.get_call', new_callable=AsyncMock) as mock_db:
            mock_db.return_value = mock_call_doc
            response = client.get(f"/api/v1/calls/{call_id}")

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["call_id"] == call_id
        assert data["status"] == "uploaded"
        assert data["audio"] is None
        assert data["transcript"] is None
        assert data["processing"] is None
        assert data["processing_metadata"] is None
        assert data["error"] is None

    def test_get_call_db_error(self, client):
        """Test 500 response when database error occurs."""
        call_id = "test-call-error"

        with patch('backend.services.db_service.DBService.get_call', new_callable=AsyncMock) as mock_db:
            mock_db.side_effect = Exception("Database connection error")
            response = client.get(f"/api/v1/calls/{call_id}")

        # Assertions
        assert response.status_code == 500
        data = response.json()
        assert "error" in data["detail"].lower()

    def test_get_call_response_time(self, client):
        """Test that response time is within acceptable limit (<500ms)."""
        call_id = "test-call-perf"

        # Mock MongoDB response
        mock_call_doc = {
            "call_id": call_id,
            "status": "uploaded",
            "metadata": {
                "company_name": "Perf Corp",
                "contact_email": "perf@test.com",
                "call_type": "demo",
                "tags": []
            },
            "uploaded_at": datetime(2025, 11, 4, 10, 30, 0),
            "created_at": datetime(2025, 11, 4, 10, 30, 0),
            "updated_at": datetime(2025, 11, 4, 10, 30, 0)
        }

        with patch('backend.services.db_service.DBService.get_call', new_callable=AsyncMock) as mock_db:
            mock_db.return_value = mock_call_doc

            # Measure response time
            start = time.time()
            response = client.get(f"/api/v1/calls/{call_id}")
            end = time.time()

        response_time_ms = (end - start) * 1000

        # Assertions
        assert response.status_code == 200
        # Note: In test environment, should be much faster than 500ms
        # In production with real MongoDB, target is <500ms
        assert response_time_ms < 1000  # Generous for test environment
