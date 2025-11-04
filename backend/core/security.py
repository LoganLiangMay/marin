"""
Security and authentication helpers.
Placeholder for Epic 5 - AWS Cognito authentication will be implemented here.
"""

from typing import Optional
from fastapi import Header, HTTPException, status


async def verify_token(authorization: Optional[str] = Header(None)) -> dict:
    """
    Verify JWT token from Authorization header.

    Placeholder for Epic 5 (Story 5.1: AWS Cognito Authentication).
    Currently allows all requests (no authentication).

    Args:
        authorization: Authorization header with Bearer token

    Returns:
        User information dict

    Raises:
        HTTPException: If token is invalid (when implemented)
    """
    # TODO: Implement Cognito JWT verification in Epic 5
    # For now, return a mock user for development
    return {
        "user_id": "dev-user",
        "email": "dev@example.com",
        "roles": ["user"]
    }


async def require_role(required_role: str):
    """
    Dependency to require specific role.

    Placeholder for Epic 5.

    Args:
        required_role: Required role name

    Returns:
        Dependency function
    """
    async def role_checker(user: dict = None):
        # TODO: Implement role checking in Epic 5
        return user

    return role_checker
