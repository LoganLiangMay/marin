"""
Health check endpoint.
Provides system health status for monitoring and load balancer health checks.
"""

from fastapi import APIRouter, status
from pydantic import BaseModel
from datetime import datetime


router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str
    timestamp: datetime
    version: str


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    tags=["Health"],
    summary="Health check endpoint",
    description="Returns the health status of the API service"
)
async def health_check() -> HealthResponse:
    """
    Health check endpoint for ALB and monitoring.

    Returns:
        HealthResponse with status 'healthy' and current timestamp
    """
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow(),
        version="1.0.0"
    )
