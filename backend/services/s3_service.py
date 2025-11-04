"""
S3 service for audio file operations.
Handles upload, download, and management of audio files in S3.
"""

import boto3
from botocore.exceptions import ClientError
from typing import BinaryIO, Optional
import logging

from backend.core.config import settings

logger = logging.getLogger(__name__)


class S3Service:
    """Service for S3 operations."""

    def __init__(self):
        """Initialize S3 client."""
        self.s3_client = boto3.client('s3', region_name=settings.aws_region)
        self.audio_bucket = settings.s3_bucket_audio
        self.transcripts_bucket = settings.s3_bucket_transcripts

    async def upload_audio(
        self,
        file: BinaryIO,
        s3_key: str,
        content_type: Optional[str] = None
    ) -> str:
        """
        Upload audio file to S3.

        Args:
            file: File object to upload
            s3_key: S3 key (path) for the file
            content_type: MIME type of the file

        Returns:
            S3 URI of uploaded file

        Raises:
            ClientError: If upload fails
        """
        try:
            extra_args = {}
            if content_type:
                extra_args['ContentType'] = content_type

            self.s3_client.upload_fileobj(
                file,
                self.audio_bucket,
                s3_key,
                ExtraArgs=extra_args
            )

            s3_uri = f"s3://{self.audio_bucket}/{s3_key}"
            logger.info(f"Uploaded audio to {s3_uri}")
            return s3_uri

        except ClientError as e:
            logger.error(f"Failed to upload audio to S3: {e}")
            raise

    async def get_presigned_url(
        self,
        s3_key: str,
        expiration: int = 3600,
        bucket: Optional[str] = None
    ) -> str:
        """
        Generate presigned URL for downloading file.

        Args:
            s3_key: S3 key of the file
            expiration: URL expiration time in seconds (default: 1 hour)
            bucket: S3 bucket name (defaults to audio bucket)

        Returns:
            Presigned URL string
        """
        bucket = bucket or self.audio_bucket

        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': bucket, 'Key': s3_key},
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            raise

    async def delete_file(self, s3_key: str, bucket: Optional[str] = None) -> None:
        """
        Delete file from S3.

        Args:
            s3_key: S3 key of the file
            bucket: S3 bucket name (defaults to audio bucket)
        """
        bucket = bucket or self.audio_bucket

        try:
            self.s3_client.delete_object(Bucket=bucket, Key=s3_key)
            logger.info(f"Deleted file s3://{bucket}/{s3_key}")
        except ClientError as e:
            logger.error(f"Failed to delete file from S3: {e}")
            raise


# Singleton instance
s3_service = S3Service()
