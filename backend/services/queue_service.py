"""
SQS queue service for async processing.
Handles message publishing to SQS for Celery workers.
"""

import boto3
from botocore.exceptions import ClientError
from typing import Dict, Any
import json
import logging

from backend.core.config import settings

logger = logging.getLogger(__name__)


class QueueService:
    """Service for SQS operations."""

    def __init__(self):
        """Initialize SQS client."""
        self.sqs_client = boto3.client('sqs', region_name=settings.aws_region)
        self.queue_url = settings.sqs_queue_url

    async def send_message(
        self,
        message_body: Dict[str, Any],
        delay_seconds: int = 0
    ) -> str:
        """
        Send message to SQS queue.

        Args:
            message_body: Message data as dictionary
            delay_seconds: Delay before message becomes visible (0-900 seconds)

        Returns:
            Message ID

        Raises:
            ClientError: If sending fails
        """
        try:
            response = self.sqs_client.send_message(
                QueueUrl=self.queue_url,
                MessageBody=json.dumps(message_body),
                DelaySeconds=delay_seconds
            )

            message_id = response['MessageId']
            logger.info(f"Sent message to SQS: {message_id}")
            return message_id

        except ClientError as e:
            logger.error(f"Failed to send message to SQS: {e}")
            raise

    async def send_transcription_task(
        self,
        call_id: str,
        s3_key: str
    ) -> str:
        """
        Send transcription task to queue.

        Args:
            call_id: Call ID
            s3_key: S3 key of audio file

        Returns:
            Message ID
        """
        message = {
            "task": "transcribe",
            "call_id": call_id,
            "s3_key": s3_key
        }

        return await self.send_message(message)

    async def send_analysis_task(
        self,
        call_id: str,
        transcript: str
    ) -> str:
        """
        Send analysis task to queue.

        Args:
            call_id: Call ID
            transcript: Call transcript text

        Returns:
            Message ID
        """
        message = {
            "task": "analyze",
            "call_id": call_id,
            "transcript": transcript
        }

        return await self.send_message(message)


# Singleton instance
queue_service = QueueService()
