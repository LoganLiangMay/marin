"""
FastAPI application entry point.
Audio Call Data Ingestion Pipeline API.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.core.config import settings
from backend.core.dependencies import close_mongodb_connection, close_redis_connection
from backend.api.v1 import health, calls, insights, quality, auth, analytics, search, rag
from backend.middleware.rate_limit import RateLimitMiddleware
from backend.middleware.logging_middleware import RequestResponseLoggingMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "name": "%(name)s", "message": "%(message)s"}',
    datefmt='%Y-%m-%dT%H:%M:%S%z'
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Environment: {'Development' if settings.debug else 'Production'}")
    logger.info(f"API v1 prefix: {settings.api_v1_prefix}")

    yield

    # Shutdown
    logger.info("Shutting down application...")
    await close_mongodb_connection()
    await close_redis_connection()
    logger.info("Cleanup complete")


# Create FastAPI application with enhanced OpenAPI documentation (Story 5.5)
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
## Audio Call Data Ingestion Pipeline API

Enterprise-grade API for processing and analyzing sales call recordings with AI.

### Key Features

- **Audio Upload & Transcription**: Upload audio files and get accurate transcriptions using OpenAI Whisper
- **AI-Powered Analysis**: Extract insights, sentiment, entities, pain points, and objections using GPT-4o
- **Entity Resolution**: Automatic deduplication and linking of mentioned entities
- **Daily Insights**: Aggregated analytics and trends across all calls
- **Quality Monitoring**: Automated quality validation with alerting
- **Semantic Search**: Vector-based search across call transcripts (RAG-enabled)
- **Analytics**: Comprehensive analytics on call volume, sentiment, topics, and performance

### Authentication

Most endpoints require authentication via JWT tokens from AWS Cognito.

To authenticate:
1. Obtain access token via `/api/v1/auth/login`
2. Include in Authorization header: `Authorization: Bearer <token>`

### Rate Limiting

API requests are rate-limited based on user role:
- Anonymous: 30 requests/minute
- Authenticated: 60 requests/minute
- Analyst: 120 requests/minute
- Admin: 300 requests/minute

Rate limit information is returned in response headers:
- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

### Support

For issues or questions, please contact the development team.
    """,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    contact={
        "name": "API Support",
        "email": "support@example.com"
    },
    license_info={
        "name": "Proprietary",
        "url": "https://example.com/license"
    },
    openapi_tags=[
        {
            "name": "Health",
            "description": "Health check and system status endpoints"
        },
        {
            "name": "Authentication",
            "description": "User authentication and token management"
        },
        {
            "name": "Calls",
            "description": "Audio call upload, processing, and retrieval"
        },
        {
            "name": "Insights",
            "description": "Daily and weekly aggregated insights"
        },
        {
            "name": "Quality",
            "description": "Quality monitoring, alerts, and validation"
        },
        {
            "name": "Analytics",
            "description": "Comprehensive analytics and reporting"
        },
        {
            "name": "Search",
            "description": "Semantic search across call transcripts using vector embeddings"
        },
        {
            "name": "RAG",
            "description": "AI-powered question answering using Retrieval-Augmented Generation"
        }
    ]
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Add Rate Limiting Middleware (Story 5.3)
# Enabled in production, disabled in development (controlled by DEBUG setting)
app.add_middleware(
    RateLimitMiddleware,
    enable_rate_limiting=not settings.debug
)

# Add Request/Response Logging Middleware (Story 5.4)
# Logs all API requests and responses with structured data
app.add_middleware(
    RequestResponseLoggingMiddleware,
    enable_request_logging=True,
    enable_response_logging=True
)

# Include routers
app.include_router(
    health.router,
    prefix=settings.api_v1_prefix,
    tags=["Health"]
)

app.include_router(
    calls.router,
    prefix=f"{settings.api_v1_prefix}/calls",
    tags=["Calls"]
)

app.include_router(
    insights.router,
    prefix=settings.api_v1_prefix,
    tags=["Insights"]
)

app.include_router(
    quality.router,
    prefix=settings.api_v1_prefix,
    tags=["Quality"]
)

app.include_router(
    auth.router,
    prefix=f"{settings.api_v1_prefix}/auth",
    tags=["Authentication"]
)

app.include_router(
    analytics.router,
    prefix=f"{settings.api_v1_prefix}/analytics",
    tags=["Analytics"]
)

app.include_router(
    search.router,
    prefix=settings.api_v1_prefix,
    tags=["Search"]
)

app.include_router(
    rag.router,
    prefix=settings.api_v1_prefix,
    tags=["RAG"]
)


@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint redirect to docs."""
    return JSONResponse(
        content={
            "message": f"Welcome to {settings.app_name}",
            "version": settings.app_version,
            "docs": "/docs",
            "health": f"{settings.api_v1_prefix}/health"
        }
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )
