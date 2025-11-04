"""
Integration tests for call upload endpoint.
Tests the complete upload flow including validation, S3 upload, MongoDB, and SQS.
"""

import pytest
import os
from io import BytesIO
from unittest.mock import Mock, patch, AsyncMock
from fastapi import status

# Set test environment variables before imports
os.environ.setdefault("AWS_REGION", "us-east-1")
os.environ.setdefault("S3_BUCKET_AUDIO", "test-audio-bucket")
os.environ.setdefault("S3_BUCKET_TRANSCRIPTS", "test-transcripts-bucket")
os.environ.setdefault("MONGODB_URI", "mongodb://localhost:27017/test_db")
os.environ.setdefault("REDIS_ENDPOINT", "localhost:6379")
os.environ.setdefault("SQS_QUEUE_URL", "https://sqs.us-east-1.amazonaws.com/123456789/test-queue")
os.environ.setdefault("OPENAI_API_KEY", "test-key")

from backend.models.call import CallStatus


class TestCallUpload:
    """Test suite for call upload endpoint."""

    def test_upload_success_mp3(self, client):
        """Test successful upload of MP3 file."""
        # Create test audio file
        audio_content = b"fake mp3 audio content"
        files = {
            "file": ("test_call.mp3", BytesIO(audio_content), "audio/mpeg")
        }
        data = {
            "company_name": "Test Company",
            "contact_email": "test@example.com",
            "call_type": "demo"
        }

        # Mock S3, MongoDB, and SQS
        with patch('backend.services.s3_service.s3_service.upload_audio', new_callable=AsyncMock) as mock_s3, \
             patch('backend.services.db_service.DBService.create_call', new_callable=AsyncMock) as mock_db, \
             patch('backend.services.queue_service.queue_service.send_transcription_task', new_callable=AsyncMock) as mock_sqs:

            mock_s3.return_value = "s3://test-audio-bucket/2025/11/04/test-id.mp3"
            mock_db.return_value = "mock_mongo_id"
            mock_sqs.return_value = "mock_message_id"

            response = client.post(
                "/api/v1/calls/upload",
                files=files,
                data=data
            )

        assert response.status_code == status.HTTP_201_CREATED
        response_data = response.json()
        assert "call_id" in response_data
        assert response_data["message"] == "Audio file uploaded successfully. Processing will begin shortly."
        assert "s3_uri" in response_data

    def test_upload_invalid_format(self, client):
        """Test upload with invalid file format."""
        audio_content = b"fake text content"
        files = {
            "file": ("test_call.txt", BytesIO(audio_content), "text/plain")
        }
        data = {
            "company_name": "Test Company",
            "contact_email": "test@example.com",
            "call_type": "demo"
        }

        response = client.post(
            "/api/v1/calls/upload",
            files=files,
            data=data
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Invalid file format" in response.json()["detail"]

    def test_upload_empty_file(self, client):
        """Test upload with empty file."""
        files = {
            "file": ("test_call.mp3", BytesIO(b""), "audio/mpeg")
        }
        data = {
            "company_name": "Test Company",
            "contact_email": "test@example.com",
            "call_type": "demo"
        }

        response = client.post(
            "/api/v1/calls/upload",
            files=files,
            data=data
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "empty" in response.json()["detail"].lower()

    def test_upload_missing_metadata(self, client):
        """Test upload with missing required metadata."""
        audio_content = b"fake mp3 audio content"
        files = {
            "file": ("test_call.mp3", BytesIO(audio_content), "audio/mpeg")
        }
        # Missing company_name
        data = {
            "contact_email": "test@example.com",
            "call_type": "demo"
        }

        response = client.post(
            "/api/v1/calls/upload",
            files=files,
            data=data
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_upload_all_formats(self, client):
        """Test upload with all supported formats."""
        formats = ["mp3", "wav", "m4a", "flac"]

        for fmt in formats:
            audio_content = f"fake {fmt} audio content".encode()
            files = {
                "file": (f"test_call.{fmt}", BytesIO(audio_content), f"audio/{fmt}")
            }
            data = {
                "company_name": "Test Company",
                "contact_email": "test@example.com",
                "call_type": "demo"
            }

            with patch('backend.services.s3_service.s3_service.upload_audio', new_callable=AsyncMock) as mock_s3, \
                 patch('backend.services.db_service.DBService.create_call', new_callable=AsyncMock) as mock_db, \
                 patch('backend.services.queue_service.queue_service.send_transcription_task', new_callable=AsyncMock) as mock_sqs:

                mock_s3.return_value = f"s3://test-audio-bucket/2025/11/04/test-id.{fmt}"
                mock_db.return_value = "mock_mongo_id"
                mock_sqs.return_value = "mock_message_id"

                response = client.post(
                    "/api/v1/calls/upload",
                    files=files,
                    data=data
                )

            assert response.status_code == status.HTTP_201_CREATED, f"Format {fmt} should be accepted"

    def test_upload_s3_failure_returns_500(self, client):
        """Test S3 upload failure returns 500 error."""
        audio_content = b"fake mp3 audio content"
        files = {
            "file": ("test_call.mp3", BytesIO(audio_content), "audio/mpeg")
        }
        data = {
            "company_name": "Test Company",
            "contact_email": "test@example.com",
            "call_type": "demo"
        }

        # Mock S3 to raise exception
        with patch('backend.services.s3_service.s3_service.upload_audio', new_callable=AsyncMock) as mock_s3:
            mock_s3.side_effect = Exception("S3 connection failed")

            response = client.post(
                "/api/v1/calls/upload",
                files=files,
                data=data
            )

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "Failed to upload file to storage" in response.json()["detail"]

    def test_upload_mongodb_failure_rollback(self, client):
        """Test MongoDB failure triggers S3 rollback."""
        audio_content = b"fake mp3 audio content"
        files = {
            "file": ("test_call.mp3", BytesIO(audio_content), "audio/mpeg")
        }
        data = {
            "company_name": "Test Company",
            "contact_email": "test@example.com",
            "call_type": "demo"
        }

        # Mock S3 success but MongoDB failure
        with patch('backend.services.s3_service.s3_service.upload_audio', new_callable=AsyncMock) as mock_s3, \
             patch('backend.services.s3_service.s3_service.delete_file', new_callable=AsyncMock) as mock_delete, \
             patch('backend.services.db_service.DBService.create_call', new_callable=AsyncMock) as mock_db:

            mock_s3.return_value = "s3://test-audio-bucket/2025/11/04/test-id.mp3"
            mock_db.side_effect = Exception("MongoDB connection failed")

            response = client.post(
                "/api/v1/calls/upload",
                files=files,
                data=data
            )

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "Failed to create database record" in response.json()["detail"]
        # Verify rollback was attempted
        mock_delete.assert_called_once()

    def test_upload_sqs_failure_does_not_fail_request(self, client):
        """Test SQS failure does not fail the upload request."""
        audio_content = b"fake mp3 audio content"
        files = {
            "file": ("test_call.mp3", BytesIO(audio_content), "audio/mpeg")
        }
        data = {
            "company_name": "Test Company",
            "contact_email": "test@example.com",
            "call_type": "demo"
        }

        # Mock S3 and MongoDB success, but SQS failure
        with patch('backend.services.s3_service.s3_service.upload_audio', new_callable=AsyncMock) as mock_s3, \
             patch('backend.services.db_service.DBService.create_call', new_callable=AsyncMock) as mock_db, \
             patch('backend.services.queue_service.queue_service.send_transcription_task', new_callable=AsyncMock) as mock_sqs:

            mock_s3.return_value = "s3://test-audio-bucket/2025/11/04/test-id.mp3"
            mock_db.return_value = "mock_mongo_id"
            mock_sqs.side_effect = Exception("SQS connection failed")

            response = client.post(
                "/api/v1/calls/upload",
                files=files,
                data=data
            )

        # Should still succeed even with SQS failure
        assert response.status_code == status.HTTP_201_CREATED

    def test_list_calls_empty(self, client):
        """Test listing calls with no results."""
        with patch('backend.services.db_service.DBService.list_calls', new_callable=AsyncMock) as mock_list, \
             patch('backend.services.db_service.DBService.get_call_count', new_callable=AsyncMock) as mock_count:

            mock_list.return_value = []
            mock_count.return_value = 0

            response = client.get("/api/v1/calls")

        assert response.status_code == status.HTTP_200_OK
        response_data = response.json()
        assert response_data["calls"] == []
        assert response_data["total"] == 0

    def test_list_calls_with_results(self, client):
        """Test listing calls with results."""
        from datetime import datetime

        mock_calls = [
            {
                "call_id": "test-id-1",
                "status": "uploaded",
                "metadata": {
                    "company_name": "Test Company",
                    "contact_email": "test@example.com",
                    "call_type": "demo"
                },
                "audio": {
                    "s3_bucket": "test-bucket",
                    "s3_key": "2025/11/04/test-id-1.mp3",
                    "format": "mp3",
                    "file_size_bytes": 1024
                },
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        ]

        with patch('backend.services.db_service.DBService.list_calls', new_callable=AsyncMock) as mock_list, \
             patch('backend.services.db_service.DBService.get_call_count', new_callable=AsyncMock) as mock_count:

            mock_list.return_value = mock_calls
            mock_count.return_value = 1

            response = client.get("/api/v1/calls")

        assert response.status_code == status.HTTP_200_OK
        response_data = response.json()
        assert len(response_data["calls"]) == 1
        assert response_data["calls"][0]["call_id"] == "test-id-1"
        assert response_data["total"] == 1

    def test_list_calls_pagination(self, client):
        """Test listing calls with pagination."""
        with patch('backend.services.db_service.DBService.list_calls', new_callable=AsyncMock) as mock_list, \
             patch('backend.services.db_service.DBService.get_call_count', new_callable=AsyncMock) as mock_count:

            mock_list.return_value = []
            mock_count.return_value = 100

            response = client.get("/api/v1/calls?skip=20&limit=10")

        assert response.status_code == status.HTTP_200_OK
        response_data = response.json()
        assert response_data["page"] == 3  # (20 / 10) + 1
        assert response_data["page_size"] == 10
        mock_list.assert_called_once_with(skip=20, limit=10, status=None)

    def test_list_calls_limit_max(self, client):
        """Test listing calls respects maximum limit."""
        with patch('backend.services.db_service.DBService.list_calls', new_callable=AsyncMock) as mock_list, \
             patch('backend.services.db_service.DBService.get_call_count', new_callable=AsyncMock) as mock_count:

            mock_list.return_value = []
            mock_count.return_value = 200

            # Request more than max
            response = client.get("/api/v1/calls?limit=500")

        assert response.status_code == status.HTTP_200_OK
        # Should be capped at 100
        mock_list.assert_called_once_with(skip=0, limit=100, status=None)
