"""
Dependency injection for FastAPI endpoints.
Provides reusable dependencies for services and connections.
"""

from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import redis.asyncio as aioredis

from backend.core.config import settings
from backend.core.auth import validate_access_token
from backend.models.auth import AuthenticatedUser, UserRole


# MongoDB Connection
_mongodb_client: Optional[AsyncIOMotorClient] = None


async def get_mongodb_client() -> AsyncIOMotorClient:
    """Get MongoDB client (singleton pattern)."""
    global _mongodb_client
    if _mongodb_client is None:
        _mongodb_client = AsyncIOMotorClient(settings.mongodb_uri)
    return _mongodb_client


async def get_database() -> AsyncIOMotorDatabase:
    """Get MongoDB database instance."""
    client = await get_mongodb_client()
    return client[settings.mongodb_database]


# Redis Connection
_redis_client: Optional[aioredis.Redis] = None


async def get_redis_client() -> aioredis.Redis:
    """Get Redis client (singleton pattern)."""
    global _redis_client
    if _redis_client is None:
        _redis_client = await aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True
        )
    return _redis_client


# Dependency for injecting database
async def get_db() -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    """FastAPI dependency for database connection."""
    db = await get_database()
    yield db


# Dependency for injecting Redis
async def get_redis() -> AsyncGenerator[aioredis.Redis, None]:
    """FastAPI dependency for Redis connection."""
    redis = await get_redis_client()
    yield redis


# OpenSearch Connection (Story 4.1, 4.4)
_opensearch_service: Optional['OpenSearchService'] = None


async def get_opensearch_service():
    """
    Get OpenSearch service instance (singleton pattern).

    Returns:
        OpenSearchService: OpenSearch service for vector search
    """
    global _opensearch_service
    if _opensearch_service is None:
        from backend.services.opensearch_service import OpenSearchService
        _opensearch_service = OpenSearchService(
            endpoint=settings.opensearch_endpoint,
            region=settings.aws_region,
            index_name=settings.opensearch_index_name
        )
    return _opensearch_service


# Cleanup functions
async def close_mongodb_connection():
    """Close MongoDB connection on application shutdown."""
    global _mongodb_client
    if _mongodb_client is not None:
        _mongodb_client.close()
        _mongodb_client = None


async def close_redis_connection():
    """Close Redis connection on application shutdown."""
    global _redis_client
    if _redis_client is not None:
        await _redis_client.close()
        _redis_client = None


# Authentication Dependencies (Story 5.1)
security = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[AuthenticatedUser]:
    """
    Get current authenticated user from JWT token.

    If authentication is disabled (development), returns None.
    If authentication is enabled and token is missing/invalid, raises HTTPException.

    Also stores user info in request.state for other middleware (e.g., rate limiting).

    Args:
        request: FastAPI request
        credentials: HTTP Bearer token credentials

    Returns:
        AuthenticatedUser: Authenticated user or None if auth disabled

    Raises:
        HTTPException: If auth enabled and token is invalid
    """
    # If authentication is disabled, allow all requests
    if not settings.enable_auth:
        return None

    # If auth is enabled, token is required
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Validate token
    try:
        user = validate_access_token(credentials.credentials)

        # Store user info in request.state for middleware
        request.state.user_id = user.user_id
        request.state.user_roles = user.groups

        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"}
        )


async def require_auth(
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user)
) -> AuthenticatedUser:
    """
    Require authentication for endpoint.

    Args:
        current_user: Current user from get_current_user

    Returns:
        AuthenticatedUser: Authenticated user

    Raises:
        HTTPException: If user is not authenticated
    """
    if current_user is None and settings.enable_auth:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # In development mode with auth disabled, create a mock user
    if current_user is None:
        from backend.models.auth import AuthenticatedUser, UserRole
        return AuthenticatedUser(
            user_id="dev-user",
            email="dev@example.com",
            name="Development User",
            roles=[UserRole.ADMIN],
            groups=["admins"]
        )

    return current_user


async def require_admin(
    current_user: AuthenticatedUser = Depends(require_auth)
) -> AuthenticatedUser:
    """
    Require admin role for endpoint.

    Args:
        current_user: Authenticated user

    Returns:
        AuthenticatedUser: Admin user

    Raises:
        HTTPException: If user is not an admin
    """
    if not current_user.is_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )

    return current_user


async def require_analyst(
    current_user: AuthenticatedUser = Depends(require_auth)
) -> AuthenticatedUser:
    """
    Require analyst role (or admin) for endpoint.

    Args:
        current_user: Authenticated user

    Returns:
        AuthenticatedUser: Analyst or admin user

    Raises:
        HTTPException: If user is not an analyst or admin
    """
    if not current_user.is_analyst():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Analyst privileges required"
        )

    return current_user
