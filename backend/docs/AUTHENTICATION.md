# Authentication System

Story 5.1: AWS Cognito Authentication Implementation

## Overview

The application uses AWS Cognito for user authentication with JWT (JSON Web Token) validation. Authentication can be enabled/disabled via environment configuration, making it flexible for development and production environments.

## Architecture

- **Identity Provider**: AWS Cognito User Pool
- **Token Type**: JWT (JSON Web Tokens)
- **Token Algorithm**: RS256 (RSA Signature with SHA-256)
- **Token Validation**: JWKS (JSON Web Key Set) from Cognito
- **Authorization**: Role-based access control (RBAC) with Cognito Groups

## User Roles

Three user roles are defined:

1. **admins** - Full administrative access
2. **analysts** - Read access to insights and analytics
3. **users** - Standard read access

## Configuration

### Environment Variables

```bash
# Enable/disable authentication (set to True in production)
ENABLE_AUTH=False

# Cognito Configuration (from Terraform outputs)
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_APP_CLIENT_ID=your-app-client-id
COGNITO_JWKS_URI=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX/.well-known/jwks.json
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX
```

### Terraform Setup

The Cognito User Pool is provisioned via Terraform:

```bash
cd terraform
terraform init
terraform apply
```

Terraform outputs will provide the required configuration values.

## API Endpoints

### Authentication Endpoints

All authentication endpoints are under `/api/v1/auth`:

- **POST /auth/login** - Authenticate with username and password
- **POST /auth/refresh** - Refresh access token using refresh token
- **GET /auth/me** - Get current user information
- **POST /auth/register** - Register new user (optional)
- **POST /auth/confirm-email** - Confirm email with code
- **POST /auth/forgot-password** - Initiate password reset
- **POST /auth/reset-password** - Complete password reset
- **POST /auth/change-password** - Change password (authenticated)

### Protected Endpoints

Protected endpoints require a valid JWT token in the Authorization header:

```bash
Authorization: Bearer <access_token>
```

## Usage Examples

### 1. User Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

Response:
```json
{
  "access_token": "eyJraWQiOiI...",
  "id_token": "eyJraWQiOiI...",
  "refresh_token": "eyJjdHkiOi...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### 2. Accessing Protected Endpoints

```bash
curl -X GET http://localhost:8000/api/v1/calls \
  -H "Authorization: Bearer eyJraWQiOiI..."
```

### 3. Token Refresh

```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJjdHkiOi..."
  }'
```

### 4. Get Current User

```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer eyJraWQiOiI..."
```

## Protecting API Endpoints

### Basic Authentication

```python
from fastapi import APIRouter, Depends
from backend.core.dependencies import require_auth
from backend.models.auth import AuthenticatedUser

router = APIRouter()

@router.get("/protected")
async def protected_endpoint(
    current_user: AuthenticatedUser = Depends(require_auth)
):
    return {"message": f"Hello {current_user.email}"}
```

### Admin-Only Endpoints

```python
from backend.core.dependencies import require_admin

@router.post("/admin-only")
async def admin_endpoint(
    current_user: AuthenticatedUser = Depends(require_admin)
):
    return {"message": "Admin access granted"}
```

### Analyst-Only Endpoints

```python
from backend.core.dependencies import require_analyst

@router.get("/analytics")
async def analytics_endpoint(
    current_user: AuthenticatedUser = Depends(require_analyst)
):
    # Accessible by analysts and admins
    return {"data": "analytics"}
```

### Optional Authentication

```python
from backend.core.dependencies import get_current_user

@router.get("/optional-auth")
async def optional_auth_endpoint(
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user)
):
    if current_user:
        return {"message": f"Authenticated as {current_user.email}"}
    else:
        return {"message": "Anonymous access"}
```

## Development Mode

When `ENABLE_AUTH=False` (development mode):

- Authentication endpoints return "not implemented" errors
- Protected endpoints allow all requests without tokens
- `require_auth` dependency returns a mock admin user
- Useful for local development and testing

## Production Deployment

For production:

1. **Enable Authentication**:
   ```bash
   ENABLE_AUTH=True
   ```

2. **Configure Cognito** with Terraform outputs:
   ```bash
   terraform output cognito_user_pool_id
   terraform output cognito_user_pool_client_id
   terraform output cognito_jwks_uri
   terraform output cognito_issuer
   ```

3. **Create Admin Users** via AWS Console or CLI:
   ```bash
   aws cognito-idp admin-create-user \
     --user-pool-id us-east-1_XXXXXXXXX \
     --username admin@example.com \
     --user-attributes Name=email,Value=admin@example.com \
     --temporary-password TempPassword123!
   ```

4. **Assign Users to Groups**:
   ```bash
   aws cognito-idp admin-add-user-to-group \
     --user-pool-id us-east-1_XXXXXXXXX \
     --username admin@example.com \
     --group-name admins
   ```

## Security Considerations

1. **HTTPS Only** - Always use HTTPS in production
2. **Token Expiration** - Access tokens expire after 1 hour
3. **Refresh Tokens** - Refresh tokens valid for 30 days
4. **Password Policy** - Enforced by Cognito:
   - Minimum 12 characters
   - Requires: uppercase, lowercase, numbers, symbols
5. **MFA** - Can be enabled in Cognito User Pool settings
6. **CORS** - Configure allowed origins appropriately

## Troubleshooting

### Token Validation Errors

**Issue**: "Invalid token: key not found in JWKS"

**Solution**: Check that JWKS URI is correct and accessible:
```bash
curl https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX/.well-known/jwks.json
```

### Authentication Disabled

**Issue**: "Authentication is disabled in development mode"

**Solution**: Set `ENABLE_AUTH=True` in environment

### Incorrect Username or Password

**Issue**: 401 Unauthorized

**Solution**:
- Verify user exists in Cognito
- Check if email is confirmed
- Verify password meets requirements

## Testing

### Unit Tests

```bash
pytest backend/tests/test_auth.py
```

### Integration Tests

```bash
# Start the application
uvicorn backend.main:app --reload

# Run integration tests
pytest backend/tests/integration/test_auth_flow.py
```

## Related Documentation

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [JWT.io](https://jwt.io/) - JWT debugger
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
