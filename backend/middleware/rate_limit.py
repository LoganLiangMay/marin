"""
Rate Limiting and Throttling Middleware.
Story 5.3: Implement API Rate Limiting and Throttling

Provides:
- Token bucket rate limiting using Redis
- Per-user and per-IP rate limits
- Different rate limits for different user roles
- Configurable rate limit windows
"""

import logging
import time
from typing import Optional, Callable
from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import redis.asyncio as aioredis

from backend.core.config import settings
from backend.core.dependencies import get_redis_client

logger = logging.getLogger(__name__)


class RateLimitConfig:
    """Rate limit configuration."""

    # Default rate limits (requests per minute)
    ANONYMOUS_RATE_LIMIT = 30  # 30 requests per minute for unauthenticated users
    USER_RATE_LIMIT = 60  # 60 requests per minute for authenticated users
    ANALYST_RATE_LIMIT = 120  # 120 requests per minute for analysts
    ADMIN_RATE_LIMIT = 300  # 300 requests per minute for admins

    # Rate limit window (seconds)
    RATE_LIMIT_WINDOW = 60  # 1 minute

    # Burst allowance (max requests in burst)
    BURST_ALLOWANCE = 10


class RateLimiter:
    """
    Token bucket rate limiter using Redis.

    Implements a token bucket algorithm for distributed rate limiting.
    """

    def __init__(self, redis_client: aioredis.Redis):
        """
        Initialize rate limiter.

        Args:
            redis_client: Redis client for storing rate limit state
        """
        self.redis = redis_client

    async def is_rate_limited(
        self,
        key: str,
        max_requests: int,
        window_seconds: int = 60
    ) -> tuple[bool, dict]:
        """
        Check if a request should be rate limited using token bucket algorithm.

        Args:
            key: Unique identifier for rate limiting (e.g., user_id or IP)
            max_requests: Maximum requests allowed in the window
            window_seconds: Time window in seconds

        Returns:
            Tuple of (is_limited, rate_limit_info)
            rate_limit_info contains: limit, remaining, reset_at
        """
        now = time.time()
        bucket_key = f"rate_limit:{key}"

        try:
            # Use Redis pipeline for atomic operations
            pipe = self.redis.pipeline()

            # Get current bucket state
            await pipe.get(bucket_key)
            await pipe.ttl(bucket_key)
            results = await pipe.execute()

            current_tokens_str = results[0]
            ttl = results[1]

            # Initialize or refill bucket
            if current_tokens_str is None or ttl <= 0:
                # New bucket or expired - start fresh
                current_tokens = max_requests - 1  # Consume one token for this request
                await self.redis.setex(
                    bucket_key,
                    window_seconds,
                    str(current_tokens)
                )
                reset_at = int(now + window_seconds)

                return False, {
                    "limit": max_requests,
                    "remaining": current_tokens,
                    "reset_at": reset_at,
                    "retry_after": None
                }

            # Parse current tokens
            current_tokens = int(current_tokens_str)

            # Check if we have tokens available
            if current_tokens <= 0:
                # Rate limited
                reset_at = int(now + ttl)
                return True, {
                    "limit": max_requests,
                    "remaining": 0,
                    "reset_at": reset_at,
                    "retry_after": ttl
                }

            # Consume a token
            new_tokens = current_tokens - 1
            await self.redis.setex(
                bucket_key,
                ttl,  # Preserve remaining TTL
                str(new_tokens)
            )

            reset_at = int(now + ttl)

            return False, {
                "limit": max_requests,
                "remaining": new_tokens,
                "reset_at": reset_at,
                "retry_after": None
            }

        except Exception as e:
            logger.error(f"Rate limiting error: {e}", exc_info=True)
            # On error, allow the request (fail open)
            return False, {
                "limit": max_requests,
                "remaining": max_requests,
                "reset_at": int(now + window_seconds),
                "retry_after": None
            }

    def get_rate_limit_for_user(self, user_id: Optional[str], user_roles: list = None) -> int:
        """
        Get rate limit based on user role.

        Args:
            user_id: User ID (None for anonymous)
            user_roles: List of user roles

        Returns:
            int: Maximum requests per minute
        """
        if not user_id:
            return RateLimitConfig.ANONYMOUS_RATE_LIMIT

        if user_roles:
            # Check role hierarchy (admin > analyst > user)
            if "admins" in user_roles:
                return RateLimitConfig.ADMIN_RATE_LIMIT
            elif "analysts" in user_roles:
                return RateLimitConfig.ANALYST_RATE_LIMIT

        return RateLimitConfig.USER_RATE_LIMIT


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware for rate limiting.

    Applies rate limits based on user authentication and role.
    """

    def __init__(self, app, enable_rate_limiting: bool = True):
        """
        Initialize rate limiting middleware.

        Args:
            app: FastAPI application
            enable_rate_limiting: Whether to enable rate limiting
        """
        super().__init__(app)
        self.enable_rate_limiting = enable_rate_limiting
        self._rate_limiter: Optional[RateLimiter] = None

    async def get_rate_limiter(self) -> RateLimiter:
        """Get or create rate limiter instance."""
        if self._rate_limiter is None:
            redis_client = await get_redis_client()
            self._rate_limiter = RateLimiter(redis_client)
        return self._rate_limiter

    def get_client_identifier(self, request: Request) -> str:
        """
        Get unique identifier for rate limiting.

        Uses user_id if authenticated, otherwise IP address.

        Args:
            request: FastAPI request

        Returns:
            str: Unique identifier
        """
        # Check if user is authenticated (stored in request.state by auth middleware)
        user_id = getattr(request.state, "user_id", None)
        if user_id:
            return f"user:{user_id}"

        # Fall back to IP address
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Get first IP from X-Forwarded-For
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"

        return f"ip:{client_ip}"

    def get_user_roles(self, request: Request) -> list:
        """
        Get user roles from request state.

        Args:
            request: FastAPI request

        Returns:
            list: User roles
        """
        return getattr(request.state, "user_roles", [])

    def should_skip_rate_limiting(self, request: Request) -> bool:
        """
        Determine if rate limiting should be skipped for this request.

        Args:
            request: FastAPI request

        Returns:
            bool: True if rate limiting should be skipped
        """
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/api/v1/health", "/"]:
            return True

        # Skip for docs
        if request.url.path in ["/docs", "/redoc", "/openapi.json"]:
            return True

        return False

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request and apply rate limiting.

        Args:
            request: FastAPI request
            call_next: Next middleware/handler

        Returns:
            Response: HTTP response
        """
        # Skip if rate limiting is disabled
        if not self.enable_rate_limiting:
            return await call_next(request)

        # Skip for certain endpoints
        if self.should_skip_rate_limiting(request):
            return await call_next(request)

        try:
            # Get rate limiter
            rate_limiter = await self.get_rate_limiter()

            # Get client identifier
            client_id = self.get_client_identifier(request)

            # Get user roles for rate limit tier
            user_id = getattr(request.state, "user_id", None)
            user_roles = self.get_user_roles(request)
            max_requests = rate_limiter.get_rate_limit_for_user(user_id, user_roles)

            # Check rate limit
            is_limited, rate_info = await rate_limiter.is_rate_limited(
                key=client_id,
                max_requests=max_requests,
                window_seconds=RateLimitConfig.RATE_LIMIT_WINDOW
            )

            # Add rate limit headers to response
            if is_limited:
                # Rate limited - return 429
                logger.warning(
                    f"Rate limit exceeded for {client_id}",
                    extra={
                        "client_id": client_id,
                        "path": request.url.path,
                        "limit": rate_info["limit"],
                        "retry_after": rate_info["retry_after"]
                    }
                )

                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "error": "Rate limit exceeded",
                        "message": f"Too many requests. Please try again in {rate_info['retry_after']} seconds.",
                        "limit": rate_info["limit"],
                        "retry_after": rate_info["retry_after"],
                        "reset_at": rate_info["reset_at"]
                    },
                    headers={
                        "X-RateLimit-Limit": str(rate_info["limit"]),
                        "X-RateLimit-Remaining": str(rate_info["remaining"]),
                        "X-RateLimit-Reset": str(rate_info["reset_at"]),
                        "Retry-After": str(int(rate_info["retry_after"]))
                    }
                )

            # Process request
            response = await call_next(request)

            # Add rate limit info to response headers
            response.headers["X-RateLimit-Limit"] = str(rate_info["limit"])
            response.headers["X-RateLimit-Remaining"] = str(rate_info["remaining"])
            response.headers["X-RateLimit-Reset"] = str(rate_info["reset_at"])

            return response

        except Exception as e:
            logger.error(f"Error in rate limiting middleware: {e}", exc_info=True)
            # On error, allow request (fail open)
            return await call_next(request)


# Configuration helper
def create_rate_limit_middleware(enable: bool = None):
    """
    Create rate limiting middleware with configuration.

    Args:
        enable: Whether to enable rate limiting (None = use settings)

    Returns:
        RateLimitMiddleware: Configured middleware
    """
    if enable is None:
        # Enable rate limiting in production, disable in development
        enable = not settings.debug

    return lambda app: RateLimitMiddleware(app, enable_rate_limiting=enable)
