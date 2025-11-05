"""
Authentication models for JWT token handling.
Story 5.1: Implement AWS Cognito Authentication
"""

from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """User role enumeration."""
    ADMIN = "admins"
    USER = "users"
    ANALYST = "analysts"


class TokenType(str, Enum):
    """Token type enumeration."""
    ACCESS = "access"
    ID = "id"
    REFRESH = "refresh"


class TokenPayload(BaseModel):
    """JWT token payload model."""
    sub: str = Field(..., description="Subject (user ID)")
    email: Optional[str] = Field(None, description="User email")
    name: Optional[str] = Field(None, description="User name")
    cognito_groups: List[str] = Field(default_factory=list, description="Cognito groups")

    # Token metadata
    iss: Optional[str] = Field(None, description="Issuer")
    aud: Optional[str] = Field(None, description="Audience")
    exp: Optional[int] = Field(None, description="Expiration time")
    iat: Optional[int] = Field(None, description="Issued at time")
    auth_time: Optional[int] = Field(None, description="Authentication time")
    token_use: Optional[str] = Field(None, description="Token use (access or id)")

    # Custom claims
    client_id: Optional[str] = Field(None, description="Client ID")


class AuthenticatedUser(BaseModel):
    """Authenticated user model."""
    user_id: str = Field(..., description="User ID (Cognito sub)")
    email: Optional[str] = Field(None, description="User email")
    name: Optional[str] = Field(None, description="User name")
    roles: List[UserRole] = Field(default_factory=list, description="User roles")
    groups: List[str] = Field(default_factory=list, description="Cognito groups")

    def has_role(self, role: UserRole) -> bool:
        """Check if user has a specific role."""
        return role in self.roles

    def is_admin(self) -> bool:
        """Check if user is an admin."""
        return UserRole.ADMIN in self.roles

    def is_analyst(self) -> bool:
        """Check if user is an analyst."""
        return UserRole.ANALYST in self.roles or self.is_admin()


class LoginRequest(BaseModel):
    """Login request model."""
    username: str = Field(..., description="Username or email")
    password: str = Field(..., description="User password")


class LoginResponse(BaseModel):
    """Login response model."""
    access_token: str = Field(..., description="JWT access token")
    id_token: str = Field(..., description="JWT ID token")
    refresh_token: Optional[str] = Field(None, description="Refresh token")
    token_type: str = Field(default="Bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration in seconds")


class TokenRefreshRequest(BaseModel):
    """Token refresh request model."""
    refresh_token: str = Field(..., description="Refresh token")


class PasswordChangeRequest(BaseModel):
    """Password change request model."""
    old_password: str = Field(..., description="Current password")
    new_password: str = Field(..., description="New password")


class PasswordResetRequest(BaseModel):
    """Password reset request model."""
    email: str = Field(..., description="User email")


class PasswordResetConfirmRequest(BaseModel):
    """Password reset confirmation model."""
    email: str = Field(..., description="User email")
    confirmation_code: str = Field(..., description="Confirmation code")
    new_password: str = Field(..., description="New password")


class UserRegistrationRequest(BaseModel):
    """User registration request model."""
    email: str = Field(..., description="User email")
    password: str = Field(..., description="User password")
    name: Optional[str] = Field(None, description="User full name")


class UserRegistrationResponse(BaseModel):
    """User registration response model."""
    user_id: str = Field(..., description="Created user ID")
    email: str = Field(..., description="User email")
    confirmation_required: bool = Field(default=True, description="Email confirmation required")
    message: str = Field(default="User created successfully")


class EmailConfirmationRequest(BaseModel):
    """Email confirmation request model."""
    email: str = Field(..., description="User email")
    confirmation_code: str = Field(..., description="Confirmation code")
