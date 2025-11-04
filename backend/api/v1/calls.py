"""
Call endpoints.
Handles audio upload, call retrieval, and call management.
"""

import uuid
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from backend.core.dependencies import get_db
from backend.services.s3_service import s3_service
from backend.services.db_service import get_db_service
from backend.services.queue_service import queue_service
from backend.models.call import (
    UploadResponse,
    CallStatus,
    CallMetadata,
    AudioInfo,
    CallListResponse,
    CallResponse
)

logger = logging.getLogger(__name__)

router = APIRouter()

# File validation constants
ALLOWED_FORMATS = {"mp3", "wav", "m4a", "flac"}
MAX_FILE_SIZE = 1024 * 1024 * 1024  # 1GB in bytes
CONTENT_TYPE_MAP = {
    "mp3": "audio/mpeg",
    "wav": "audio/wav",
    "m4a": "audio/mp4",
    "flac": "audio/flac"
}


@router.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Calls"],
    summary="Upload call audio file",
    description="Upload an audio call recording to S3 and queue for transcription"
)
async def upload_call(
    file: UploadFile = File(..., description="Audio file (MP3, WAV, M4A, or FLAC)"),
    company_name: str = Form(..., description="Company name"),
    contact_email: str = Form(..., description="Contact email address"),
    call_type: str = Form(..., description="Type of call (sales, support, demo, etc.)"),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Upload audio call recording.

    This endpoint:
    1. Validates file format and size
    2. Uploads audio to S3 with date-based folder structure
    3. Creates MongoDB record with status="uploaded"
    4. Publishes message to SQS queue for transcription
    5. Returns call_id and confirmation

    **Supported formats:** MP3, WAV, M4A, FLAC
    **Max file size:** 1GB
    **Required metadata:** company_name, contact_email, call_type
    """
    # Extract file extension and validate format
    filename = file.filename or ""
    file_extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if file_extension not in ALLOWED_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file format. Allowed formats: {', '.join(f.upper() for f in ALLOWED_FORMATS)}"
        )

    # Read file content
    file_content = await file.read()
    file_size = len(file_content)

    # Validate file size
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed size of 1GB. File size: {file_size / (1024**3):.2f}GB"
        )

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is empty"
        )

    # Generate unique call ID
    call_id = str(uuid.uuid4())

    # Build S3 key with date hierarchy
    now = datetime.utcnow()
    s3_key = f"{now.year}/{now.month:02d}/{now.day:02d}/{call_id}.{file_extension}"

    # Get content type
    content_type = CONTENT_TYPE_MAP.get(file_extension, "application/octet-stream")

    try:
        # Upload to S3
        from io import BytesIO
        file_obj = BytesIO(file_content)
        s3_uri = await s3_service.upload_audio(
            file=file_obj,
            s3_key=s3_key,
            content_type=content_type
        )
        logger.info(f"Uploaded audio for call {call_id} to S3: {s3_uri}")

    except Exception as e:
        logger.error(f"S3 upload failed for call {call_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file to storage. Please try again. Error: {str(e)}"
        )

    # Create MongoDB record
    try:
        call_data = {
            "call_id": call_id,
            "status": CallStatus.UPLOADED.value,
            "audio": {
                "s3_bucket": s3_service.audio_bucket,
                "s3_key": s3_key,
                "format": file_extension,
                "file_size_bytes": file_size
            },
            "metadata": {
                "company_name": company_name,
                "contact_email": contact_email,
                "call_type": call_type
            },
            "uploaded_at": now
        }

        db_service = get_db_service(db)
        await db_service.create_call(call_data)
        logger.info(f"Created MongoDB record for call {call_id}")

    except Exception as e:
        # Attempt rollback - delete S3 object
        logger.error(f"MongoDB insert failed for call {call_id}: {e}")
        try:
            await s3_service.delete_file(s3_key)
            logger.info(f"Rolled back S3 upload for call {call_id}")
        except Exception as rollback_error:
            logger.error(f"Failed to rollback S3 upload for call {call_id}: {rollback_error}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create database record. Please try again. Error: {str(e)}"
        )

    # Publish to SQS for transcription
    try:
        message_id = await queue_service.send_transcription_task(
            call_id=call_id,
            s3_key=s3_key
        )
        logger.info(f"Published transcription task for call {call_id}, message_id: {message_id}")

    except Exception as e:
        # Don't fail the request - log error and continue
        # A background job can republish failed messages
        logger.error(f"SQS publish failed for call {call_id}: {e}")
        # Continue execution - call is still successfully uploaded

    return UploadResponse(
        call_id=call_id,
        message="Audio file uploaded successfully. Processing will begin shortly.",
        s3_uri=s3_uri
    )


@router.get(
    "",
    response_model=CallListResponse,
    tags=["Calls"],
    summary="List calls",
    description="List all calls with pagination and optional status filter"
)
async def list_calls(
    skip: int = 0,
    limit: int = 20,
    status_filter: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    List calls with pagination.

    Args:
        skip: Number of records to skip (for pagination)
        limit: Maximum number of records to return (max 100)
        status_filter: Filter by call status (optional)

    Returns:
        List of calls with pagination metadata
    """
    # Validate limit
    if limit > 100:
        limit = 100

    db_service = get_db_service(db)

    # Get calls and total count
    calls = await db_service.list_calls(skip=skip, limit=limit, status=status_filter)
    total = await db_service.get_call_count(status=status_filter)

    # Convert to response models
    call_responses = []
    for call in calls:
        call_responses.append(CallResponse(
            call_id=call["call_id"],
            status=CallStatus(call["status"]),
            metadata=CallMetadata(**call["metadata"]),
            audio=AudioInfo(**call["audio"]) if "audio" in call else None,
            transcript=None,  # Will be populated in future stories
            created_at=call.get("created_at", call.get("uploaded_at")),
            updated_at=call.get("updated_at", call.get("uploaded_at"))
        ))

    return CallListResponse(
        calls=call_responses,
        total=total,
        page=skip // limit + 1,
        page_size=limit
    )
