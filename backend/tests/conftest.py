"""
Pytest configuration and fixtures.
Provides reusable test fixtures for all tests.
"""

import os
import pytest

# Set test environment variables before importing the app
# This ensures Settings loads with test values
os.environ.setdefault("AWS_REGION", "us-east-1")
os.environ.setdefault("S3_BUCKET_AUDIO", "test-audio-bucket")
os.environ.setdefault("S3_BUCKET_TRANSCRIPTS", "test-transcripts-bucket")
os.environ.setdefault("MONGODB_URI", "mongodb://localhost:27017/test_db")
os.environ.setdefault("REDIS_ENDPOINT", "localhost:6379")
os.environ.setdefault("SQS_QUEUE_URL", "https://sqs.us-east-1.amazonaws.com/123456789/test-queue")
os.environ.setdefault("OPENAI_API_KEY", "test-key")

from fastapi.testclient import TestClient
from backend.main import app


@pytest.fixture
def client():
    """
    FastAPI test client fixture.

    Yields:
        TestClient for making requests to the API
    """
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def mock_env(monkeypatch):
    """
    Mock environment variables for testing.

    Args:
        monkeypatch: pytest monkeypatch fixture
    """
    # Set required environment variables for testing
    monkeypatch.setenv("AWS_REGION", "us-east-1")
    monkeypatch.setenv("S3_BUCKET_AUDIO", "test-audio-bucket")
    monkeypatch.setenv("S3_BUCKET_TRANSCRIPTS", "test-transcripts-bucket")
    monkeypatch.setenv("MONGODB_URI", "mongodb://localhost:27017/test_db")
    monkeypatch.setenv("REDIS_ENDPOINT", "localhost:6379")
    monkeypatch.setenv("SQS_QUEUE_URL", "https://sqs.us-east-1.amazonaws.com/123456789/test-queue")
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
