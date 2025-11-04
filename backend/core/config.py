"""
Configuration management using Pydantic Settings.
Loads settings from environment variables with .env file support.
"""

from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # Application Settings
    app_name: str = "Audio Call Data Ingestion Pipeline"
    app_version: str = "1.0.0"
    debug: bool = False

    # AWS Configuration
    aws_region: str = Field(default="us-east-1", description="AWS region")

    # S3 Configuration
    s3_bucket_audio: str = Field(..., description="S3 bucket for audio files")
    s3_bucket_transcripts: str = Field(..., description="S3 bucket for transcripts")

    # MongoDB Configuration
    mongodb_uri: str = Field(..., description="MongoDB connection URI")
    mongodb_database: str = Field(default="audio_pipeline", description="MongoDB database name")

    # Redis Configuration
    redis_endpoint: str = Field(..., description="Redis endpoint (host:port)")
    redis_password: Optional[str] = Field(default=None, description="Redis password")
    redis_ssl: bool = Field(default=True, description="Use SSL for Redis connection")

    # SQS Configuration
    sqs_queue_url: str = Field(..., description="SQS queue URL for async processing")

    # External APIs
    openai_api_key: str = Field(..., description="OpenAI API key for Whisper and GPT-4")

    # API Configuration
    api_v1_prefix: str = "/api/v1"
    cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:8000"],
        description="Allowed CORS origins"
    )

    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 4

    @property
    def redis_url(self) -> str:
        """Generate Redis connection URL."""
        protocol = "rediss" if self.redis_ssl else "redis"
        if self.redis_password:
            return f"{protocol}://:{self.redis_password}@{self.redis_endpoint}"
        return f"{protocol}://{self.redis_endpoint}"


# Global settings instance
settings = Settings()
