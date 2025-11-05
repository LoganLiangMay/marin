"""
Transcription tasks using OpenAI Whisper API.

This module contains tasks for audio transcription (Story 2.5).
"""

import logging
import os
import time
import json
from datetime import datetime
from typing import Dict, Any
import boto3
from botocore.exceptions import ClientError
from openai import OpenAI
from pymongo import MongoClient
from celery_app import celery_app
from core.config import settings

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name='tasks.transcription.test_connection')
def test_connection(self):
    """
    Test task to verify Celery worker connectivity.

    This task validates that:
    - Worker can receive tasks from SQS
    - Worker can execute Python code
    - Worker can store results in Redis
    - Task routing is working correctly

    Returns:
        dict: Status information including worker details
    """
    worker_info = {
        'status': 'success',
        'message': 'Celery worker is operational',
        'task_id': self.request.id,
        'task_name': self.name,
        'queue': self.request.delivery_info.get('routing_key', 'unknown'),
        'timestamp': datetime.utcnow().isoformat(),
        'worker_hostname': self.request.hostname,
    }

    logger.info(
        "Test connection task executed successfully",
        extra=worker_info
    )

    return worker_info


@celery_app.task(bind=True, name='tasks.transcription.transcribe_audio', max_retries=3)
def transcribe_audio(self, call_id: str, s3_key: str):
    """
    Transcribe audio file using OpenAI Whisper API.

    This task:
    1. Downloads audio from S3
    2. Transcribes using Whisper API
    3. Saves transcript to MongoDB
    4. Saves transcript JSON to S3
    5. Triggers next analysis task (if available)

    Args:
        call_id: Unique identifier for the call
        s3_key: S3 key for the audio file

    Returns:
        dict: Transcription results with metadata

    Raises:
        Exception: On unrecoverable errors (will trigger retry)
    """
    start_time = time.time()
    temp_audio_path = None
    mongo_client = None

    logger.info(
        "Starting transcription task",
        extra={'call_id': call_id, 's3_key': s3_key, 'task_id': self.request.id}
    )

    try:
        # Step 1: Check if already transcribed (idempotency)
        mongo_client = MongoClient(settings.mongodb_uri)
        db = mongo_client[settings.mongodb_database]
        calls_collection = db.calls

        existing_call = calls_collection.find_one({'call_id': call_id})
        if existing_call and existing_call.get('status') == 'transcribed':
            logger.info(
                "Call already transcribed, skipping",
                extra={'call_id': call_id}
            )
            return {
                'status': 'already_transcribed',
                'call_id': call_id,
                'message': 'Transcription already exists'
            }

        # Step 2: Download audio from S3
        s3_client = boto3.client('s3', region_name=settings.aws_region)
        file_extension = os.path.splitext(s3_key)[1] or '.mp3'
        temp_audio_path = f"/tmp/{call_id}{file_extension}"

        logger.info(
            "Downloading audio from S3",
            extra={'call_id': call_id, 's3_key': s3_key, 'temp_path': temp_audio_path}
        )

        s3_client.download_file(
            settings.s3_bucket_audio,
            s3_key,
            temp_audio_path
        )

        file_size_mb = os.path.getsize(temp_audio_path) / (1024 * 1024)
        logger.info(
            "Audio downloaded successfully",
            extra={'call_id': call_id, 'file_size_mb': round(file_size_mb, 2)}
        )

        # Step 3: Transcribe with OpenAI Whisper
        logger.info(
            "Calling OpenAI Whisper API",
            extra={'call_id': call_id, 'model': 'whisper-1'}
        )

        openai_client = OpenAI(api_key=settings.openai_api_key)

        with open(temp_audio_path, 'rb') as audio_file:
            transcript_response = openai_client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json",
                language="en",
                timestamp_granularities=["segment"]
            )

        # Step 4: Parse Whisper response
        full_text = transcript_response.text
        segments = [
            {
                'id': segment.id,
                'start': segment.start,
                'end': segment.end,
                'text': segment.text,
            }
            for segment in transcript_response.segments
        ]

        duration_seconds = transcript_response.duration
        word_count = len(full_text.split())
        duration_minutes = duration_seconds / 60

        # Calculate cost ($0.006 per minute)
        cost_usd = round(duration_minutes * 0.006, 4)

        transcription_time = time.time() - start_time

        logger.info(
            "Transcription completed",
            extra={
                'call_id': call_id,
                'duration_seconds': round(duration_seconds, 2),
                'word_count': word_count,
                'segments_count': len(segments),
                'transcription_time_seconds': round(transcription_time, 2),
                'cost_usd': cost_usd
            }
        )

        # Step 5: Update MongoDB call document
        update_data = {
            'status': 'transcribed',
            'transcript': {
                'full_text': full_text,
                'segments': segments,
                'duration_seconds': duration_seconds,
                'word_count': word_count,
                'language': 'en'
            },
            'processing': {
                'transcribed_at': datetime.utcnow()
            },
            'processing_metadata': {
                'transcription': {
                    'model': 'whisper-1',
                    'provider': 'openai',
                    'processing_time_seconds': round(transcription_time, 2),
                    'cost_usd': cost_usd,
                    'audio_duration_minutes': round(duration_minutes, 2)
                }
            },
            'updated_at': datetime.utcnow()
        }

        result = calls_collection.update_one(
            {'call_id': call_id},
            {'$set': update_data}
        )

        if result.modified_count == 0:
            logger.warning(
                "MongoDB update did not modify document",
                extra={'call_id': call_id}
            )

        logger.info(
            "MongoDB updated successfully",
            extra={'call_id': call_id, 'modified_count': result.modified_count}
        )

        # Step 6: Save transcript JSON to S3
        now = datetime.utcnow()
        transcript_s3_key = f"{now.year}/{now.month:02d}/{now.day:02d}/{call_id}.json"

        transcript_json = json.dumps({
            'call_id': call_id,
            'transcribed_at': now.isoformat(),
            'full_text': full_text,
            'segments': segments,
            'duration_seconds': duration_seconds,
            'word_count': word_count,
            'language': 'en',
            'model': 'whisper-1',
            'provider': 'openai'
        }, indent=2)

        s3_client.put_object(
            Bucket=settings.s3_bucket_transcripts,
            Key=transcript_s3_key,
            Body=transcript_json.encode('utf-8'),
            ContentType='application/json'
        )

        logger.info(
            "Transcript saved to S3",
            extra={'call_id': call_id, 's3_key': transcript_s3_key}
        )

        # Step 7: Trigger next task (analysis)
        # Story 3.2: Chain to AI analysis task after successful transcription
        try:
            from tasks.analysis import analyze_call
            analyze_call.delay(call_id)
            logger.info(
                "Triggered AI analysis task",
                extra={'call_id': call_id, 'next_task': 'analyze_call'}
            )
        except ImportError as e:
            logger.warning(
                "Analysis task not available",
                extra={'call_id': call_id, 'error': str(e)}
            )
        except Exception as e:
            # Don't fail transcription if analysis trigger fails
            logger.error(
                "Failed to trigger analysis task",
                extra={'call_id': call_id, 'error': str(e)},
                exc_info=True
            )

        total_time = time.time() - start_time

        return {
            'status': 'success',
            'call_id': call_id,
            'word_count': word_count,
            'duration_seconds': round(duration_seconds, 2),
            'segments_count': len(segments),
            'processing_time_seconds': round(total_time, 2),
            'cost_usd': cost_usd,
            'transcript_s3_key': transcript_s3_key
        }

    except ClientError as e:
        # S3 error - will retry
        logger.error(
            "S3 error during transcription",
            extra={'call_id': call_id, 'error': str(e)},
            exc_info=True
        )
        # Update status to failed if max retries exceeded
        if self.request.retries >= self.max_retries:
            _update_call_status_to_failed(call_id, str(e))
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))

    except Exception as e:
        # Other errors - will retry
        logger.error(
            "Error during transcription",
            extra={'call_id': call_id, 'error': str(e)},
            exc_info=True
        )
        # Update status to failed if max retries exceeded
        if self.request.retries >= self.max_retries:
            _update_call_status_to_failed(call_id, str(e))
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))

    finally:
        # Step 8: Cleanup temporary file
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.remove(temp_audio_path)
                logger.info(
                    "Temporary audio file deleted",
                    extra={'call_id': call_id, 'temp_path': temp_audio_path}
                )
            except Exception as e:
                logger.warning(
                    "Failed to delete temporary file",
                    extra={'call_id': call_id, 'error': str(e)}
                )

        # Close MongoDB connection
        if mongo_client:
            try:
                mongo_client.close()
            except:
                pass


def _update_call_status_to_failed(call_id: str, error_message: str):
    """
    Update call status to failed in MongoDB.

    Args:
        call_id: Call identifier
        error_message: Error message to store
    """
    try:
        mongo_client = MongoClient(settings.mongodb_uri)
        db = mongo_client[settings.mongodb_database]
        db.calls.update_one(
            {'call_id': call_id},
            {
                '$set': {
                    'status': 'failed',
                    'error': error_message,
                    'updated_at': datetime.utcnow()
                }
            }
        )
        mongo_client.close()
        logger.info("Updated call status to failed", extra={'call_id': call_id})
    except Exception as db_error:
        logger.error(
            "Failed to update status to failed",
            extra={'call_id': call_id, 'error': str(db_error)}
        )
