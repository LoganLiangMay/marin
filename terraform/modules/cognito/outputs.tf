# ============================================================================
# User Pool Outputs
# ============================================================================

output "user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_arn" {
  description = "ARN of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.arn
}

output "user_pool_endpoint" {
  description = "Endpoint of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.endpoint
}

output "user_pool_domain" {
  description = "Domain of the Cognito User Pool (for hosted UI)"
  value       = aws_cognito_user_pool_domain.main.domain
}

output "user_pool_domain_cloudfront" {
  description = "CloudFront distribution for the User Pool domain"
  value       = aws_cognito_user_pool_domain.main.cloudfront_distribution
}

# ============================================================================
# App Client Outputs
# ============================================================================

output "app_client_id" {
  description = "ID of the Cognito App Client"
  value       = aws_cognito_user_pool_client.main.id
}

output "app_client_name" {
  description = "Name of the Cognito App Client"
  value       = aws_cognito_user_pool_client.main.name
}

# ============================================================================
# Authentication Configuration Outputs (for API)
# ============================================================================

output "cognito_region" {
  description = "AWS region where Cognito is deployed"
  value       = data.aws_region.current.name
}

output "cognito_issuer" {
  description = "Cognito token issuer URL (for JWT validation)"
  value       = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.main.id}"
}

output "cognito_jwks_uri" {
  description = "JWKS URI for JWT signature verification"
  value       = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.main.id}/.well-known/jwks.json"
}

output "cognito_hosted_ui_url" {
  description = "Cognito Hosted UI URL"
  value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${data.aws_region.current.name}.amazoncognito.com"
}

# ============================================================================
# User Group Outputs
# ============================================================================

output "admin_group_name" {
  description = "Name of the admin user group"
  value       = var.create_user_groups ? aws_cognito_user_group.admins[0].name : null
}

output "analyst_group_name" {
  description = "Name of the analyst user group"
  value       = var.create_user_groups ? aws_cognito_user_group.analysts[0].name : null
}

output "user_group_name" {
  description = "Name of the standard user group"
  value       = var.create_user_groups ? aws_cognito_user_group.users[0].name : null
}

# ============================================================================
# Complete Configuration Map (for easy consumption)
# ============================================================================

output "cognito_config" {
  description = "Complete Cognito configuration map for API use"
  value = {
    user_pool_id  = aws_cognito_user_pool.main.id
    app_client_id = aws_cognito_user_pool_client.main.id
    region        = data.aws_region.current.name
    issuer        = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.main.id}"
    jwks_uri      = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.main.id}/.well-known/jwks.json"
    hosted_ui_url = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${data.aws_region.current.name}.amazoncognito.com"
    domain        = aws_cognito_user_pool_domain.main.domain
    admin_group   = var.create_user_groups ? aws_cognito_user_group.admins[0].name : null
    analyst_group = var.create_user_groups ? aws_cognito_user_group.analysts[0].name : null
    user_group    = var.create_user_groups ? aws_cognito_user_group.users[0].name : null
  }
}

# ============================================================================
# Environment Variables for Backend API
# ============================================================================

output "api_environment_variables" {
  description = "Environment variables for backend API configuration"
  value = {
    COGNITO_REGION        = data.aws_region.current.name
    COGNITO_USER_POOL_ID  = aws_cognito_user_pool.main.id
    COGNITO_APP_CLIENT_ID = aws_cognito_user_pool_client.main.id
    COGNITO_ISSUER        = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.main.id}"
    COGNITO_JWKS_URI      = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.main.id}/.well-known/jwks.json"
    ENABLE_AUTH           = "True"
  }
  sensitive = false
}
