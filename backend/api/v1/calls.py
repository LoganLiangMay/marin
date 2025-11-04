"""
Call endpoints.
Placeholder for Epic 2 - Story 2.2 will implement upload and retrieval endpoints.
"""

from fastapi import APIRouter, Depends
from backend.core.dependencies import get_db

router = APIRouter()


@router.get(
    "/calls",
    tags=["Calls"],
    summary="List calls (placeholder)",
    description="Placeholder endpoint - will be implemented in Story 2.2"
)
async def list_calls(db=Depends(get_db)):
    """
    List all calls (placeholder).

    TODO: Implement in Story 2.2 (Audio Upload Endpoint)
    """
    return {
        "message": "Calls endpoint - to be implemented in Story 2.2",
        "calls": []
    }


@router.post(
    "/calls/upload",
    tags=["Calls"],
    summary="Upload call audio (placeholder)",
    description="Placeholder endpoint - will be implemented in Story 2.2"
)
async def upload_call():
    """
    Upload call audio file (placeholder).

    TODO: Implement in Story 2.2 (Audio Upload Endpoint)
    """
    return {
        "message": "Upload endpoint - to be implemented in Story 2.2"
    }
