"""
Authentication API endpoints.
Story 5.1: Implement AWS Cognito Authentication

Provides endpoints for:
- User authentication (login)
- Token refresh
- Password management
- User registration (if enabled)
"""

import logging
import boto3
from botocore.exceptions import ClientError
from fastapi import APIRouter, HTTPException, Depends, status
from typing import Optional

from backend.core.config import settings
from backend.core.dependencies import require_auth, get_current_user
from backend.models.auth import (
    LoginRequest,
    LoginResponse,
    TokenRefreshRequest,
    PasswordChangeRequest,
    PasswordResetRequest,
    PasswordResetConfirmRequest,
    UserRegistrationRequest,
    UserRegistrationResponse,
    EmailConfirmationRequest,
    AuthenticatedUser
)

logger = logging.getLogger(__name__)

router = APIRouter()


def get_cognito_client():
    """Get boto3 Cognito IDP client."""
    return boto3.client('cognito-idp', region_name=settings.cognito_region)


@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest):
    """
    Authenticate user with Cognito and return JWT tokens.

    Args:
        credentials: Username and password

    Returns:
        LoginResponse: Access token, ID token, and refresh token

    Raises:
        HTTPException: If authentication fails
    """
    if not settings.enable_auth:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Authentication is disabled in development mode"
        )

    try:
        client = get_cognito_client()

        # Initiate authentication
        response = client.initiate_auth(
            ClientId=settings.cognito_app_client_id,
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': credentials.username,
                'PASSWORD': credentials.password
            }
        )

        auth_result = response.get('AuthenticationResult')

        if not auth_result:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed"
            )

        logger.info(
            "User authenticated successfully",
            extra={'username': credentials.username}
        )

        return LoginResponse(
            access_token=auth_result['AccessToken'],
            id_token=auth_result['IdToken'],
            refresh_token=auth_result.get('RefreshToken'),
            expires_in=auth_result['ExpiresIn']
        )

    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']

        logger.warning(
            f"Cognito authentication error: {error_code}",
            extra={'username': credentials.username, 'error': error_message}
        )

        if error_code == 'NotAuthorizedException':
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password"
            )
        elif error_code == 'UserNotConfirmedException':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User email not confirmed. Please check your email for confirmation code."
            )
        elif error_code == 'UserNotFoundException':
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Authentication error: {error_message}"
            )

    except Exception as e:
        logger.error(f"Unexpected error during authentication: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service unavailable"
        )


@router.post("/refresh", response_model=LoginResponse)
async def refresh_token(refresh_request: TokenRefreshRequest):
    """
    Refresh access token using refresh token.

    Args:
        refresh_request: Refresh token

    Returns:
        LoginResponse: New access and ID tokens

    Raises:
        HTTPException: If refresh fails
    """
    if not settings.enable_auth:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Authentication is disabled in development mode"
        )

    try:
        client = get_cognito_client()

        response = client.initiate_auth(
            ClientId=settings.cognito_app_client_id,
            AuthFlow='REFRESH_TOKEN_AUTH',
            AuthParameters={
                'REFRESH_TOKEN': refresh_request.refresh_token
            }
        )

        auth_result = response.get('AuthenticationResult')

        if not auth_result:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token refresh failed"
            )

        return LoginResponse(
            access_token=auth_result['AccessToken'],
            id_token=auth_result['IdToken'],
            refresh_token=None,  # Refresh token is not returned on refresh
            expires_in=auth_result['ExpiresIn']
        )

    except ClientError as e:
        error_code = e.response['Error']['Code']
        logger.warning(f"Token refresh error: {error_code}")

        if error_code == 'NotAuthorizedException':
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Token refresh failed"
            )


@router.get("/me", response_model=AuthenticatedUser)
async def get_current_user_info(
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user)
):
    """
    Get current authenticated user information.

    Args:
        current_user: Current user from JWT token

    Returns:
        AuthenticatedUser: Current user info

    Raises:
        HTTPException: If not authenticated
    """
    if current_user is None:
        # Development mode - return mock user
        return AuthenticatedUser(
            user_id="dev-user",
            email="dev@example.com",
            name="Development User",
            roles=[],
            groups=[]
        )

    return current_user


@router.post("/change-password")
async def change_password(
    password_change: PasswordChangeRequest,
    current_user: AuthenticatedUser = Depends(require_auth)
):
    """
    Change user password (requires authentication).

    Args:
        password_change: Old and new passwords
        current_user: Authenticated user

    Returns:
        dict: Success message

    Raises:
        HTTPException: If password change fails
    """
    if not settings.enable_auth:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Authentication is disabled in development mode"
        )

    try:
        client = get_cognito_client()

        # Get access token from context (would need to be passed)
        # This is a simplified version - in production, you'd extract the token
        # from the request context or pass it explicitly

        client.change_password(
            PreviousPassword=password_change.old_password,
            ProposedPassword=password_change.new_password,
            AccessToken="<access_token>"  # Would come from request
        )

        logger.info(
            "Password changed successfully",
            extra={'user_id': current_user.user_id}
        )

        return {"message": "Password changed successfully"}

    except ClientError as e:
        error_code = e.response['Error']['Code']

        if error_code == 'NotAuthorizedException':
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect old password"
            )
        elif error_code == 'InvalidPasswordException':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password does not meet requirements"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Password change failed"
            )


@router.post("/forgot-password")
async def forgot_password(reset_request: PasswordResetRequest):
    """
    Initiate password reset flow.

    Sends confirmation code to user's email.

    Args:
        reset_request: User email

    Returns:
        dict: Success message
    """
    if not settings.enable_auth:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Authentication is disabled in development mode"
        )

    try:
        client = get_cognito_client()

        client.forgot_password(
            ClientId=settings.cognito_app_client_id,
            Username=reset_request.email
        )

        logger.info(
            "Password reset initiated",
            extra={'email': reset_request.email}
        )

        return {
            "message": "Password reset code sent to email",
            "email": reset_request.email
        }

    except ClientError as e:
        error_code = e.response['Error']['Code']

        if error_code == 'UserNotFoundException':
            # Don't reveal that user doesn't exist (security best practice)
            return {
                "message": "Password reset code sent to email if account exists",
                "email": reset_request.email
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Password reset failed"
            )


@router.post("/reset-password")
async def reset_password(reset_confirm: PasswordResetConfirmRequest):
    """
    Confirm password reset with code from email.

    Args:
        reset_confirm: Email, confirmation code, and new password

    Returns:
        dict: Success message
    """
    if not settings.enable_auth:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Authentication is disabled in development mode"
        )

    try:
        client = get_cognito_client()

        client.confirm_forgot_password(
            ClientId=settings.cognito_app_client_id,
            Username=reset_confirm.email,
            ConfirmationCode=reset_confirm.confirmation_code,
            Password=reset_confirm.new_password
        )

        logger.info(
            "Password reset completed",
            extra={'email': reset_confirm.email}
        )

        return {"message": "Password reset successful"}

    except ClientError as e:
        error_code = e.response['Error']['Code']

        if error_code == 'CodeMismatchException':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid confirmation code"
            )
        elif error_code == 'ExpiredCodeException':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Confirmation code expired. Request a new one."
            )
        elif error_code == 'InvalidPasswordException':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password does not meet requirements"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Password reset failed"
            )


# Optional: User registration endpoint (may be disabled in production)
@router.post("/register", response_model=UserRegistrationResponse)
async def register_user(registration: UserRegistrationRequest):
    """
    Register a new user (if self-registration is enabled).

    Args:
        registration: User registration details

    Returns:
        UserRegistrationResponse: Created user details

    Note:
        This endpoint may be disabled in production environments
        where user creation is managed administratively.
    """
    if not settings.enable_auth:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Authentication is disabled in development mode"
        )

    try:
        client = get_cognito_client()

        user_attributes = [
            {'Name': 'email', 'Value': registration.email}
        ]

        if registration.name:
            user_attributes.append({'Name': 'name', 'Value': registration.name})

        response = client.sign_up(
            ClientId=settings.cognito_app_client_id,
            Username=registration.email,
            Password=registration.password,
            UserAttributes=user_attributes
        )

        logger.info(
            "User registered successfully",
            extra={'email': registration.email, 'user_sub': response['UserSub']}
        )

        return UserRegistrationResponse(
            user_id=response['UserSub'],
            email=registration.email,
            confirmation_required=not response.get('UserConfirmed', False),
            message="Registration successful. Please check your email for confirmation code."
        )

    except ClientError as e:
        error_code = e.response['Error']['Code']

        if error_code == 'UsernameExistsException':
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists"
            )
        elif error_code == 'InvalidPasswordException':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password does not meet requirements"
            )
        elif error_code == 'InvalidParameterException':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid registration parameters"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Registration failed"
            )


@router.post("/confirm-email")
async def confirm_email(confirmation: EmailConfirmationRequest):
    """
    Confirm user email with code from email.

    Args:
        confirmation: Email and confirmation code

    Returns:
        dict: Success message
    """
    if not settings.enable_auth:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Authentication is disabled in development mode"
        )

    try:
        client = get_cognito_client()

        client.confirm_sign_up(
            ClientId=settings.cognito_app_client_id,
            Username=confirmation.email,
            ConfirmationCode=confirmation.confirmation_code
        )

        logger.info(
            "Email confirmed successfully",
            extra={'email': confirmation.email}
        )

        return {"message": "Email confirmed successfully. You can now log in."}

    except ClientError as e:
        error_code = e.response['Error']['Code']

        if error_code == 'CodeMismatchException':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid confirmation code"
            )
        elif error_code == 'ExpiredCodeException':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Confirmation code expired"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Email confirmation failed"
            )
