"""
Authentication utilities for JWT token validation with AWS Cognito.
Story 5.1: Implement AWS Cognito Authentication
"""

import logging
from typing import Optional
from functools import lru_cache
import httpx
from jose import jwt, JWTError
from fastapi import HTTPException, status

from backend.core.config import settings
from backend.models.auth import TokenPayload, AuthenticatedUser, UserRole

logger = logging.getLogger(__name__)


class CognitoJWTValidator:
    """
    Validates JWT tokens from AWS Cognito.

    Downloads and caches JWKS (JSON Web Key Set) from Cognito,
    then validates JWT signatures and claims.
    """

    def __init__(
        self,
        region: str,
        user_pool_id: str,
        app_client_id: str,
        jwks_uri: Optional[str] = None
    ):
        """
        Initialize Cognito JWT validator.

        Args:
            region: AWS region
            user_pool_id: Cognito User Pool ID
            app_client_id: App Client ID
            jwks_uri: Optional JWKS URI (will be constructed if not provided)
        """
        self.region = region
        self.user_pool_id = user_pool_id
        self.app_client_id = app_client_id

        # Construct JWKS URI if not provided
        if jwks_uri:
            self.jwks_uri = jwks_uri
        else:
            self.jwks_uri = (
                f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json"
            )

        # Construct issuer
        self.issuer = f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}"

        # Cache for JWKS
        self._jwks_cache: Optional[dict] = None

    def get_jwks(self) -> dict:
        """
        Get JWKS from Cognito (cached).

        Returns:
            dict: JWKS data
        """
        if self._jwks_cache is None:
            try:
                response = httpx.get(self.jwks_uri, timeout=10.0)
                response.raise_for_status()
                self._jwks_cache = response.json()
                logger.info(f"Downloaded JWKS from {self.jwks_uri}")
            except Exception as e:
                logger.error(f"Failed to download JWKS: {e}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Unable to validate tokens: JWKS unavailable"
                )

        return self._jwks_cache

    def validate_token(self, token: str, token_use: str = "access") -> TokenPayload:
        """
        Validate JWT token from Cognito.

        Args:
            token: JWT token string
            token_use: Expected token use ("access" or "id")

        Returns:
            TokenPayload: Validated token payload

        Raises:
            HTTPException: If token is invalid
        """
        try:
            # Get JWKS
            jwks = self.get_jwks()

            # Decode JWT header to get key ID
            unverified_headers = jwt.get_unverified_headers(token)
            kid = unverified_headers.get("kid")

            if not kid:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token: missing key ID"
                )

            # Find matching key in JWKS
            key = None
            for jwk_key in jwks.get("keys", []):
                if jwk_key.get("kid") == kid:
                    key = jwk_key
                    break

            if not key:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token: key not found in JWKS"
                )

            # Verify and decode token
            payload = jwt.decode(
                token,
                key,
                algorithms=settings.auth_algorithms,
                audience=self.app_client_id,
                issuer=self.issuer,
                options={
                    "verify_signature": True,
                    "verify_aud": True,
                    "verify_iss": True,
                    "verify_exp": True
                }
            )

            # Verify token_use claim
            if payload.get("token_use") != token_use:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid token: expected token_use={token_use}, got {payload.get('token_use')}"
                )

            # Extract Cognito groups
            cognito_groups = payload.get("cognito:groups", [])

            # Parse into TokenPayload model
            token_payload = TokenPayload(
                sub=payload.get("sub"),
                email=payload.get("email"),
                name=payload.get("name"),
                cognito_groups=cognito_groups,
                iss=payload.get("iss"),
                aud=payload.get("aud"),
                exp=payload.get("exp"),
                iat=payload.get("iat"),
                auth_time=payload.get("auth_time"),
                token_use=payload.get("token_use"),
                client_id=payload.get("client_id")
            )

            logger.debug(
                f"Token validated successfully for user {token_payload.sub}",
                extra={"user_id": token_payload.sub, "groups": cognito_groups}
            )

            return token_payload

        except JWTError as e:
            logger.warning(f"JWT validation error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"}
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Unexpected error during token validation: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Token validation failed"
            )

    def token_payload_to_user(self, payload: TokenPayload) -> AuthenticatedUser:
        """
        Convert token payload to AuthenticatedUser model.

        Args:
            payload: Token payload

        Returns:
            AuthenticatedUser: User model with roles
        """
        # Map Cognito groups to roles
        roles = []
        for group in payload.cognito_groups:
            try:
                role = UserRole(group)
                roles.append(role)
            except ValueError:
                # Unknown group, skip
                logger.debug(f"Unknown Cognito group: {group}")

        return AuthenticatedUser(
            user_id=payload.sub,
            email=payload.email,
            name=payload.name,
            roles=roles,
            groups=payload.cognito_groups
        )


# Singleton instance
_jwt_validator: Optional[CognitoJWTValidator] = None


@lru_cache()
def get_jwt_validator() -> CognitoJWTValidator:
    """
    Get JWT validator singleton instance.

    Returns:
        CognitoJWTValidator: Configured validator

    Raises:
        ValueError: If authentication is not configured
    """
    global _jwt_validator

    if _jwt_validator is None:
        if not settings.cognito_user_pool_id or not settings.cognito_app_client_id:
            raise ValueError(
                "Cognito authentication not configured. "
                "Set COGNITO_USER_POOL_ID and COGNITO_APP_CLIENT_ID environment variables."
            )

        _jwt_validator = CognitoJWTValidator(
            region=settings.cognito_region,
            user_pool_id=settings.cognito_user_pool_id,
            app_client_id=settings.cognito_app_client_id,
            jwks_uri=settings.cognito_jwks_uri
        )

    return _jwt_validator


def validate_access_token(token: str) -> AuthenticatedUser:
    """
    Validate access token and return authenticated user.

    Args:
        token: JWT access token

    Returns:
        AuthenticatedUser: Authenticated user model

    Raises:
        HTTPException: If token is invalid
    """
    validator = get_jwt_validator()
    payload = validator.validate_token(token, token_use="access")
    return validator.token_payload_to_user(payload)


def validate_id_token(token: str) -> AuthenticatedUser:
    """
    Validate ID token and return authenticated user.

    Args:
        token: JWT ID token

    Returns:
        AuthenticatedUser: Authenticated user model

    Raises:
        HTTPException: If token is invalid
    """
    validator = get_jwt_validator()
    payload = validator.validate_token(token, token_use="id")
    return validator.token_payload_to_user(payload)
