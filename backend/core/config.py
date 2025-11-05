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
    anthropic_api_key: Optional[str] = Field(default=None, description="Anthropic API key for Claude models (optional)")

    # OpenSearch Configuration (Epic 4)
    opensearch_endpoint: Optional[str] = Field(default=None, description="OpenSearch Serverless collection endpoint")
    opensearch_index_name: str = Field(default="call-transcripts", description="OpenSearch vector index name")

    # Text Chunking Configuration (Story 4.2)
    chunk_size: int = Field(default=512, description="Target chunk size in characters (optimized for Titan embeddings)")
    overlap_percentage: int = Field(default=10, description="Percentage of overlap between consecutive chunks")
    min_chunk_size: int = Field(default=100, description="Minimum chunk size in characters")
    max_chunk_size: int = Field(default=1000, description="Maximum chunk size in characters")

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

    # Authentication Configuration (Story 5.1)
    cognito_region: str = Field(default="us-east-1", description="AWS Cognito region")
    cognito_user_pool_id: Optional[str] = Field(default=None, description="Cognito User Pool ID")
    cognito_app_client_id: Optional[str] = Field(default=None, description="Cognito App Client ID")
    cognito_jwks_uri: Optional[str] = Field(default=None, description="Cognito JWKS URI for JWT verification")
    cognito_issuer: Optional[str] = Field(default=None, description="Cognito JWT issuer URL")

    # Authentication flags
    enable_auth: bool = Field(default=False, description="Enable authentication (set to True in production)")
    auth_algorithms: list[str] = Field(default=["RS256"], description="JWT algorithms to support")

    @property
    def redis_url(self) -> str:
        """Generate Redis connection URL."""
        protocol = "rediss" if self.redis_ssl else "redis"
        if self.redis_password:
            return f"{protocol}://:{self.redis_password}@{self.redis_endpoint}"
        return f"{protocol}://{self.redis_endpoint}"


# Global settings instance
settings = Settings()
