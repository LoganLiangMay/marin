"""
Tests for configuration management.
Validates Settings class loads correctly from environment.
"""

import pytest
from backend.core.config import Settings


def test_settings_loads_from_env(mock_env):
    """Test that settings load from environment variables."""
    settings = Settings()

    assert settings.aws_region == "us-east-1"
    assert settings.s3_bucket_audio == "test-audio-bucket"
    assert settings.s3_bucket_transcripts == "test-transcripts-bucket"
    assert settings.mongodb_uri == "mongodb://localhost:27017/test_db"
    assert settings.redis_endpoint == "localhost:6379"
    assert settings.sqs_queue_url.startswith("https://sqs.")
    assert settings.openai_api_key == "test-key"


def test_settings_has_default_values():
    """Test that settings have sensible defaults."""
    settings = Settings(
        _env_file=None,  # Don't load from .env
        s3_bucket_audio="test",
        s3_bucket_transcripts="test",
        mongodb_uri="mongodb://localhost",
        redis_endpoint="localhost:6379",
        sqs_queue_url="https://test",
        openai_api_key="test"
    )

    assert settings.aws_region == "us-east-1"  # Default
    assert settings.mongodb_database == "audio_pipeline"  # Default
    assert settings.redis_ssl is True  # Default
    assert settings.api_v1_prefix == "/api/v1"  # Default


def test_redis_url_generation():
    """Test Redis URL generation."""
    settings = Settings(
        _env_file=None,
        s3_bucket_audio="test",
        s3_bucket_transcripts="test",
        mongodb_uri="mongodb://localhost",
        redis_endpoint="localhost:6379",
        redis_password="secret",
        redis_ssl=True,
        sqs_queue_url="https://test",
        openai_api_key="test"
    )

    assert settings.redis_url == "rediss://:secret@localhost:6379"


def test_redis_url_without_password():
    """Test Redis URL without password."""
    settings = Settings(
        _env_file=None,
        s3_bucket_audio="test",
        s3_bucket_transcripts="test",
        mongodb_uri="mongodb://localhost",
        redis_endpoint="localhost:6379",
        redis_ssl=False,
        sqs_queue_url="https://test",
        openai_api_key="test"
    )

    assert settings.redis_url == "redis://localhost:6379"


def test_cors_origins_default():
    """Test CORS origins have defaults."""
    settings = Settings(
        _env_file=None,
        s3_bucket_audio="test",
        s3_bucket_transcripts="test",
        mongodb_uri="mongodb://localhost",
        redis_endpoint="localhost:6379",
        sqs_queue_url="https://test",
        openai_api_key="test"
    )

    assert isinstance(settings.cors_origins, list)
    assert len(settings.cors_origins) > 0
