# Local variables
locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      Module      = "cognito"
    }
  )
}

# ============================================================================
# Cognito User Pool
# ============================================================================

resource "aws_cognito_user_pool" "main" {
  name = "${local.name_prefix}-user-pool"

  # Username Configuration
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  username_configuration {
    case_sensitive = var.enable_username_case_sensitivity
  }

  # Password Policy
  password_policy {
    minimum_length                   = var.password_minimum_length
    require_lowercase                = var.password_require_lowercase
    require_uppercase                = var.password_require_uppercase
    require_numbers                  = var.password_require_numbers
    require_symbols                  = var.password_require_symbols
    temporary_password_validity_days = var.temporary_password_validity_days
  }

  # MFA Configuration
  mfa_configuration = var.mfa_configuration

  # Enable software token MFA (TOTP apps like Google Authenticator)
  software_token_mfa_configuration {
    enabled = var.mfa_configuration != "OFF"
  }

  # Account Recovery
  account_recovery_setting {
    dynamic "recovery_mechanism" {
      for_each = var.account_recovery_mechanisms
      content {
        name     = recovery_mechanism.value
        priority = index(var.account_recovery_mechanisms, recovery_mechanism.value) + 1
      }
    }
  }

  # Email Configuration
  email_configuration {
    email_sending_account = var.ses_email_identity != "" ? "DEVELOPER" : "COGNITO_DEFAULT"
    source_arn            = var.ses_email_identity != "" ? "arn:aws:ses:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:identity/${var.ses_email_identity}" : null
  }

  # Verification Messages
  email_verification_message = var.email_verification_message
  email_verification_subject = var.email_verification_subject

  # Admin Create User Configuration
  admin_create_user_config {
    allow_admin_create_user_only = var.allow_admin_create_user_only
  }

  # User Attribute Schema
  schema {
    name                     = "email"
    attribute_data_type      = "String"
    required                 = true
    mutable                  = true
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                     = "name"
    attribute_data_type      = "String"
    required                 = false
    mutable                  = true
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  # User Pool Add-ons
  user_pool_add_ons {
    advanced_security_mode = "ENFORCED" # Protects against compromised credentials
  }

  # Deletion Protection
  deletion_protection = var.environment == "prod" ? "ACTIVE" : "INACTIVE"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-user-pool"
    }
  )

  lifecycle {
    # Prevent accidental deletion
    prevent_destroy = false # Set to true in production
  }
}

# ============================================================================
# Cognito User Pool Client (App Client)
# ============================================================================

resource "aws_cognito_user_pool_client" "main" {
  name         = "${local.name_prefix}-app-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # Token Validity
  access_token_validity  = var.access_token_validity
  id_token_validity      = var.id_token_validity
  refresh_token_validity = var.refresh_token_validity

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  # Authentication Flows
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",      # Username/password authentication
    "ALLOW_REFRESH_TOKEN_AUTH",      # Refresh token authentication
    "ALLOW_USER_SRP_AUTH",           # SRP (Secure Remote Password) authentication
    "ALLOW_ADMIN_USER_PASSWORD_AUTH" # Admin authentication (for admin APIs)
  ]

  # OAuth Settings (for future use with hosted UI)
  allowed_oauth_flows_user_pool_client = false
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]

  # Callback URLs (for future hosted UI)
  callback_urls = [
    "http://localhost:3000/callback",
    "https://localhost:3000/callback"
  ]

  logout_urls = [
    "http://localhost:3000/logout",
    "https://localhost:3000/logout"
  ]

  # Read Attributes
  read_attributes = [
    "email",
    "email_verified",
    "name"
  ]

  # Write Attributes
  write_attributes = [
    "email",
    "name"
  ]

  # Prevent user existence errors (security best practice)
  prevent_user_existence_errors = "ENABLED"

  # Enable token revocation
  enable_token_revocation = true

  # Enable Cognito hosted UI (optional)
  generate_secret = false # Set to true if using server-side OAuth flow
}

# ============================================================================
# User Pool Domain (for Hosted UI)
# ============================================================================

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${local.name_prefix}-auth"
  user_pool_id = aws_cognito_user_pool.main.id
}

# ============================================================================
# User Groups
# ============================================================================

# Admin Group
resource "aws_cognito_user_group" "admins" {
  count = var.create_user_groups ? 1 : 0

  name         = "admins"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = var.admin_group_description
  precedence   = 1 # Highest priority
}

# Analyst Group
resource "aws_cognito_user_group" "analysts" {
  count = var.create_user_groups ? 1 : 0

  name         = "analysts"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = var.analyst_group_description
  precedence   = 2
}

# User Group
resource "aws_cognito_user_group" "users" {
  count = var.create_user_groups ? 1 : 0

  name         = "users"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = var.user_group_description
  precedence   = 3 # Lowest priority
}

# ============================================================================
# Data Sources
# ============================================================================

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}
