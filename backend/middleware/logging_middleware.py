"""
Request/Response Logging Middleware.
Story 5.4: Add Comprehensive API Request/Response Logging

Provides:
- Structured logging of all API requests and responses
- Request/response timing
- User identification in logs
- Sensitive data masking
- Error logging with stack traces
"""

import logging
import time
import json
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import Message

logger = logging.getLogger(__name__)


class RequestResponseLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for comprehensive request/response logging.

    Logs:
    - Request method, path, query parameters
    - Request headers (excluding sensitive ones)
    - Response status code
    - Request/response timing
    - User identification (if authenticated)
    - Error details for failed requests
    """

    # Sensitive headers to exclude from logs
    SENSITIVE_HEADERS = {
        "authorization",
        "cookie",
        "x-api-key",
        "x-auth-token",
        "proxy-authorization"
    }

    # Paths to exclude from detailed logging (too noisy)
    EXCLUDE_PATHS = {
        "/health",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/favicon.ico"
    }

    def __init__(self, app, enable_request_logging: bool = True, enable_response_logging: bool = True):
        """
        Initialize logging middleware.

        Args:
            app: FastAPI application
            enable_request_logging: Enable request logging
            enable_response_logging: Enable response logging
        """
        super().__init__(app)
        self.enable_request_logging = enable_request_logging
        self.enable_response_logging = enable_response_logging

    def should_log_request(self, request: Request) -> bool:
        """
        Determine if request should be logged.

        Args:
            request: FastAPI request

        Returns:
            bool: True if should log
        """
        if not self.enable_request_logging:
            return False

        # Skip excluded paths
        if request.url.path in self.EXCLUDE_PATHS:
            return False

        return True

    def get_safe_headers(self, headers: dict) -> dict:
        """
        Get headers with sensitive values masked.

        Args:
            headers: Request headers

        Returns:
            dict: Sanitized headers
        """
        safe_headers = {}
        for key, value in headers.items():
            if key.lower() in self.SENSITIVE_HEADERS:
                safe_headers[key] = "***REDACTED***"
            else:
                safe_headers[key] = value
        return safe_headers

    def get_user_info(self, request: Request) -> dict:
        """
        Extract user information from request state.

        Args:
            request: FastAPI request

        Returns:
            dict: User information
        """
        return {
            "user_id": getattr(request.state, "user_id", None),
            "user_roles": getattr(request.state, "user_roles", [])
        }

    def get_client_info(self, request: Request) -> dict:
        """
        Extract client information from request.

        Args:
            request: FastAPI request

        Returns:
            dict: Client information
        """
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"

        return {
            "ip": client_ip,
            "user_agent": request.headers.get("User-Agent", "unknown")
        }

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request and log request/response details.

        Args:
            request: FastAPI request
            call_next: Next middleware/handler

        Returns:
            Response: HTTP response
        """
        # Skip logging for excluded paths
        if not self.should_log_request(request):
            return await call_next(request)

        # Record start time
        start_time = time.time()

        # Prepare request log data
        request_log = {
            "event": "http_request",
            "method": request.method,
            "path": request.url.path,
            "query_params": dict(request.query_params),
            "client": self.get_client_info(request),
            "user": self.get_user_info(request),
            "headers": self.get_safe_headers(dict(request.headers))
        }

        # Log request
        logger.info(
            f"{request.method} {request.url.path}",
            extra=request_log
        )

        # Process request and capture response
        try:
            response = await call_next(request)

            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000

            # Prepare response log data
            response_log = {
                "event": "http_response",
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": round(duration_ms, 2),
                "client": self.get_client_info(request),
                "user": self.get_user_info(request)
            }

            # Log response at appropriate level
            if response.status_code >= 500:
                logger.error(
                    f"{request.method} {request.url.path} - {response.status_code} ({duration_ms:.2f}ms)",
                    extra=response_log
                )
            elif response.status_code >= 400:
                logger.warning(
                    f"{request.method} {request.url.path} - {response.status_code} ({duration_ms:.2f}ms)",
                    extra=response_log
                )
            else:
                logger.info(
                    f"{request.method} {request.url.path} - {response.status_code} ({duration_ms:.2f}ms)",
                    extra=response_log
                )

            return response

        except Exception as e:
            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000

            # Log error
            error_log = {
                "event": "http_error",
                "method": request.method,
                "path": request.url.path,
                "duration_ms": round(duration_ms, 2),
                "error_type": type(e).__name__,
                "error_message": str(e),
                "client": self.get_client_info(request),
                "user": self.get_user_info(request)
            }

            logger.error(
                f"{request.method} {request.url.path} - ERROR: {str(e)} ({duration_ms:.2f}ms)",
                extra=error_log,
                exc_info=True
            )

            # Re-raise the exception
            raise


class StructuredLogger:
    """
    Helper class for structured JSON logging.

    Provides convenient methods for logging with structured data.
    """

    def __init__(self, name: str):
        """
        Initialize structured logger.

        Args:
            name: Logger name (usually __name__)
        """
        self.logger = logging.getLogger(name)

    def info(self, message: str, **kwargs):
        """Log info level message with structured data."""
        self.logger.info(message, extra=kwargs)

    def warning(self, message: str, **kwargs):
        """Log warning level message with structured data."""
        self.logger.warning(message, extra=kwargs)

    def error(self, message: str, exc_info: bool = False, **kwargs):
        """Log error level message with structured data."""
        self.logger.error(message, extra=kwargs, exc_info=exc_info)

    def debug(self, message: str, **kwargs):
        """Log debug level message with structured data."""
        self.logger.debug(message, extra=kwargs)

    def log_api_call(self, service: str, operation: str, duration_ms: float, success: bool, **kwargs):
        """
        Log external API call.

        Args:
            service: Service name (e.g., 'openai', 's3')
            operation: Operation name (e.g., 'transcribe', 'upload')
            duration_ms: Call duration in milliseconds
            success: Whether call was successful
            **kwargs: Additional context
        """
        log_data = {
            "event": "api_call",
            "service": service,
            "operation": operation,
            "duration_ms": round(duration_ms, 2),
            "success": success,
            **kwargs
        }

        if success:
            self.logger.info(
                f"API call: {service}.{operation} ({duration_ms:.2f}ms)",
                extra=log_data
            )
        else:
            self.logger.error(
                f"API call failed: {service}.{operation} ({duration_ms:.2f}ms)",
                extra=log_data
            )

    def log_database_query(self, collection: str, operation: str, duration_ms: float, count: int = None, **kwargs):
        """
        Log database query.

        Args:
            collection: Collection/table name
            operation: Operation type (find, insert, update, delete)
            duration_ms: Query duration in milliseconds
            count: Number of documents affected
            **kwargs: Additional context
        """
        log_data = {
            "event": "database_query",
            "collection": collection,
            "operation": operation,
            "duration_ms": round(duration_ms, 2),
            "count": count,
            **kwargs
        }

        self.logger.debug(
            f"DB query: {collection}.{operation} ({duration_ms:.2f}ms, count={count})",
            extra=log_data
        )

    def log_task_execution(self, task_name: str, task_id: str, status: str, duration_s: float, **kwargs):
        """
        Log Celery task execution.

        Args:
            task_name: Task name
            task_id: Task ID
            status: Task status (started, success, failed, retry)
            duration_s: Task duration in seconds
            **kwargs: Additional context
        """
        log_data = {
            "event": "task_execution",
            "task_name": task_name,
            "task_id": task_id,
            "status": status,
            "duration_s": round(duration_s, 2),
            **kwargs
        }

        if status == "failed":
            self.logger.error(
                f"Task failed: {task_name} [{task_id}] ({duration_s:.2f}s)",
                extra=log_data
            )
        else:
            self.logger.info(
                f"Task {status}: {task_name} [{task_id}] ({duration_s:.2f}s)",
                extra=log_data
            )


# Convenience function for creating structured loggers
def get_structured_logger(name: str) -> StructuredLogger:
    """
    Get a structured logger instance.

    Args:
        name: Logger name (usually __name__)

    Returns:
        StructuredLogger: Structured logger instance
    """
    return StructuredLogger(name)
