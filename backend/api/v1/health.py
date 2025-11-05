"""
Health check and metrics endpoints.
Story 5.6: Implement Health Checks and Metrics Endpoints

Provides:
- Basic health check for load balancers
- Detailed health check with dependency status
- System metrics and statistics
"""

import time
import psutil
from datetime import datetime
from typing import Dict, Any, Optional
from fastapi import APIRouter, status, HTTPException
from pydantic import BaseModel, Field
from pymongo import MongoClient
import redis.asyncio as aioredis

from backend.core.config import settings

router = APIRouter()


# Response Models
class HealthResponse(BaseModel):
    """Basic health check response model."""
    status: str = Field(..., description="Health status (healthy, degraded, unhealthy)")
    timestamp: datetime = Field(..., description="Current timestamp")
    version: str = Field(..., description="API version")


class DependencyStatus(BaseModel):
    """Dependency health status."""
    name: str = Field(..., description="Dependency name")
    status: str = Field(..., description="Status (healthy, unhealthy, unknown)")
    response_time_ms: Optional[float] = Field(None, description="Response time in milliseconds")
    error: Optional[str] = Field(None, description="Error message if unhealthy")
    details: Dict[str, Any] = Field(default_factory=dict, description="Additional details")


class DetailedHealthResponse(BaseModel):
    """Detailed health check response."""
    status: str = Field(..., description="Overall health status")
    timestamp: datetime = Field(..., description="Current timestamp")
    version: str = Field(..., description="API version")
    uptime_seconds: float = Field(..., description="Application uptime in seconds")
    dependencies: Dict[str, DependencyStatus] = Field(..., description="Dependency health status")


class SystemMetrics(BaseModel):
    """System metrics response."""
    cpu: Dict[str, Any] = Field(..., description="CPU metrics")
    memory: Dict[str, Any] = Field(..., description="Memory metrics")
    disk: Dict[str, Any] = Field(..., description="Disk metrics")
    process: Dict[str, Any] = Field(..., description="Process metrics")


class ApplicationMetrics(BaseModel):
    """Application-specific metrics."""
    total_calls: int = Field(..., description="Total calls processed")
    calls_analyzed: int = Field(..., description="Successfully analyzed calls")
    calls_failed: int = Field(..., description="Failed calls")
    average_processing_time: float = Field(..., description="Average processing time (seconds)")
    total_cost_usd: float = Field(..., description="Total API costs (USD)")


class MetricsResponse(BaseModel):
    """Complete metrics response."""
    timestamp: datetime = Field(..., description="Metrics timestamp")
    system: SystemMetrics = Field(..., description="System metrics")
    application: ApplicationMetrics = Field(..., description="Application metrics")


# Application start time (for uptime calculation)
_app_start_time = time.time()


async def check_mongodb() -> DependencyStatus:
    """
    Check MongoDB connectivity and health.

    Returns:
        DependencyStatus: MongoDB health status
    """
    start = time.time()
    try:
        client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)

        # Test connection
        client.admin.command('ping')

        # Get database stats
        db = client[settings.mongodb_database]
        stats = db.command('dbStats')

        response_time = (time.time() - start) * 1000

        client.close()

        return DependencyStatus(
            name="mongodb",
            status="healthy",
            response_time_ms=round(response_time, 2),
            details={
                "database": settings.mongodb_database,
                "collections": stats.get('collections', 0),
                "data_size_mb": round(stats.get('dataSize', 0) / 1024 / 1024, 2)
            }
        )
    except Exception as e:
        response_time = (time.time() - start) * 1000
        return DependencyStatus(
            name="mongodb",
            status="unhealthy",
            response_time_ms=round(response_time, 2),
            error=str(e)
        )


async def check_redis() -> DependencyStatus:
    """
    Check Redis connectivity and health.

    Returns:
        DependencyStatus: Redis health status
    """
    start = time.time()
    try:
        redis_client = await aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
            socket_timeout=5
        )

        # Test connection
        await redis_client.ping()

        # Get info
        info = await redis_client.info()

        response_time = (time.time() - start) * 1000

        await redis_client.close()

        return DependencyStatus(
            name="redis",
            status="healthy",
            response_time_ms=round(response_time, 2),
            details={
                "version": info.get('redis_version', 'unknown'),
                "connected_clients": info.get('connected_clients', 0),
                "used_memory_mb": round(info.get('used_memory', 0) / 1024 / 1024, 2)
            }
        )
    except Exception as e:
        response_time = (time.time() - start) * 1000
        return DependencyStatus(
            name="redis",
            status="unhealthy",
            response_time_ms=round(response_time, 2),
            error=str(e)
        )


def get_system_metrics() -> SystemMetrics:
    """
    Get system metrics (CPU, memory, disk).

    Returns:
        SystemMetrics: System resource metrics
    """
    # CPU metrics
    cpu_percent = psutil.cpu_percent(interval=0.1)
    cpu_count = psutil.cpu_count()

    # Memory metrics
    memory = psutil.virtual_memory()

    # Disk metrics
    disk = psutil.disk_usage('/')

    # Process metrics
    process = psutil.Process()

    return SystemMetrics(
        cpu={
            "percent": cpu_percent,
            "count": cpu_count
        },
        memory={
            "total_gb": round(memory.total / 1024 / 1024 / 1024, 2),
            "available_gb": round(memory.available / 1024 / 1024 / 1024, 2),
            "used_gb": round(memory.used / 1024 / 1024 / 1024, 2),
            "percent": memory.percent
        },
        disk={
            "total_gb": round(disk.total / 1024 / 1024 / 1024, 2),
            "used_gb": round(disk.used / 1024 / 1024 / 1024, 2),
            "free_gb": round(disk.free / 1024 / 1024 / 1024, 2),
            "percent": disk.percent
        },
        process={
            "memory_mb": round(process.memory_info().rss / 1024 / 1024, 2),
            "cpu_percent": process.cpu_percent(),
            "num_threads": process.num_threads()
        }
    )


async def get_application_metrics() -> ApplicationMetrics:
    """
    Get application-specific metrics from MongoDB.

    Returns:
        ApplicationMetrics: Application metrics
    """
    try:
        client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
        db = client[settings.mongodb_database]
        calls_collection = db.calls

        # Get call statistics
        total_calls = calls_collection.count_documents({})
        calls_analyzed = calls_collection.count_documents({'status': 'analyzed'})
        calls_failed = calls_collection.count_documents({'status': 'failed'})

        # Get average processing time
        pipeline = [
            {
                '$match': {'status': 'analyzed'}
            },
            {
                '$project': {
                    'processing_time': {
                        '$subtract': ['$processing.analyzed_at', '$processing.uploaded_at']
                    }
                }
            },
            {
                '$group': {
                    '_id': None,
                    'avg_time_ms': {'$avg': '$processing_time'}
                }
            }
        ]

        avg_result = list(calls_collection.aggregate(pipeline))
        avg_processing_time = (avg_result[0]['avg_time_ms'] / 1000) if avg_result else 0

        # Get total costs
        pipeline = [
            {
                '$match': {'status': 'analyzed'}
            },
            {
                '$project': {
                    'total_cost': {
                        '$add': [
                            {'$ifNull': ['$processing_metadata.transcription.cost_usd', 0]},
                            {'$ifNull': ['$processing_metadata.analysis.cost_usd', 0]}
                        ]
                    }
                }
            },
            {
                '$group': {
                    '_id': None,
                    'total': {'$sum': '$total_cost'}
                }
            }
        ]

        cost_result = list(calls_collection.aggregate(pipeline))
        total_cost = cost_result[0]['total'] if cost_result else 0

        client.close()

        return ApplicationMetrics(
            total_calls=total_calls,
            calls_analyzed=calls_analyzed,
            calls_failed=calls_failed,
            average_processing_time=round(avg_processing_time, 2),
            total_cost_usd=round(total_cost, 2)
        )

    except Exception as e:
        # Return zero metrics on error
        return ApplicationMetrics(
            total_calls=0,
            calls_analyzed=0,
            calls_failed=0,
            average_processing_time=0,
            total_cost_usd=0
        )


# Endpoints

@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    tags=["Health"],
    summary="Basic health check",
    description="Simple health check for load balancers. Returns 200 if service is running."
)
async def health_check() -> HealthResponse:
    """
    Basic health check endpoint for ALB and monitoring.

    This endpoint always returns 200 OK if the service is running.
    For detailed health information, use /health/detailed.

    Returns:
        HealthResponse with status 'healthy' and current timestamp
    """
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow(),
        version=settings.app_version
    )


@router.get(
    "/health/detailed",
    response_model=DetailedHealthResponse,
    tags=["Health"],
    summary="Detailed health check",
    description="Detailed health check including dependency status (MongoDB, Redis, etc.)"
)
async def detailed_health_check() -> DetailedHealthResponse:
    """
    Detailed health check with dependency status.

    Checks connectivity and health of:
    - MongoDB
    - Redis
    - Other critical dependencies

    Returns:
        DetailedHealthResponse with overall status and dependency details
    """
    # Calculate uptime
    uptime = time.time() - _app_start_time

    # Check dependencies
    dependencies = {}

    # Check MongoDB
    mongodb_status = await check_mongodb()
    dependencies['mongodb'] = mongodb_status

    # Check Redis
    redis_status = await check_redis()
    dependencies['redis'] = redis_status

    # Determine overall status
    unhealthy_deps = [d for d in dependencies.values() if d.status == "unhealthy"]

    if len(unhealthy_deps) == 0:
        overall_status = "healthy"
    elif len(unhealthy_deps) < len(dependencies):
        overall_status = "degraded"
    else:
        overall_status = "unhealthy"

    return DetailedHealthResponse(
        status=overall_status,
        timestamp=datetime.utcnow(),
        version=settings.app_version,
        uptime_seconds=round(uptime, 2),
        dependencies=dependencies
    )


@router.get(
    "/metrics",
    response_model=MetricsResponse,
    tags=["Health"],
    summary="System and application metrics",
    description="Get comprehensive system and application metrics"
)
async def get_metrics() -> MetricsResponse:
    """
    Get system and application metrics.

    Includes:
    - System metrics (CPU, memory, disk)
    - Application metrics (calls processed, costs, etc.)

    Returns:
        MetricsResponse with all metrics
    """
    system_metrics = get_system_metrics()
    app_metrics = await get_application_metrics()

    return MetricsResponse(
        timestamp=datetime.utcnow(),
        system=system_metrics,
        application=app_metrics
    )


@router.get(
    "/ready",
    status_code=status.HTTP_200_OK,
    tags=["Health"],
    summary="Readiness check",
    description="Kubernetes readiness probe - checks if service is ready to accept traffic"
)
async def readiness_check():
    """
    Readiness probe for Kubernetes.

    Checks if the service is ready to accept traffic.
    Returns 200 if dependencies are healthy, 503 otherwise.

    Returns:
        dict: Readiness status
    """
    # Check critical dependencies
    mongodb_status = await check_mongodb()
    redis_status = await check_redis()

    # Service is ready if critical dependencies are healthy
    if mongodb_status.status == "healthy" and redis_status.status == "healthy":
        return {
            "status": "ready",
            "timestamp": datetime.utcnow().isoformat()
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service not ready - dependencies unhealthy"
        )


@router.get(
    "/live",
    status_code=status.HTTP_200_OK,
    tags=["Health"],
    summary="Liveness check",
    description="Kubernetes liveness probe - checks if service is alive"
)
async def liveness_check():
    """
    Liveness probe for Kubernetes.

    Simple check to see if the service process is alive.
    Returns 200 if the service is running.

    Returns:
        dict: Liveness status
    """
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat()
    }
