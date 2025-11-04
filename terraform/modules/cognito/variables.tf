variable "project_name" {
  description = "Project name for resource naming and tagging"
  type        = string

  validation {
    condition     = length(var.project_name) > 0 && length(var.project_name) <= 32
    error_message = "Project name must be between 1 and 32 characters"
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod"
  }
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}

# User Pool Configuration
variable "mfa_configuration" {
  description = "MFA configuration (OFF, ON, OPTIONAL)"
  type        = string
  default     = "OPTIONAL"

  validation {
    condition     = contains(["OFF", "ON", "OPTIONAL"], var.mfa_configuration)
    error_message = "MFA configuration must be OFF, ON, or OPTIONAL"
  }
}

variable "password_minimum_length" {
  description = "Minimum password length"
  type        = number
  default     = 12

  validation {
    condition     = var.password_minimum_length >= 8 && var.password_minimum_length <= 99
    error_message = "Password minimum length must be between 8 and 99"
  }
}

variable "password_require_lowercase" {
  description = "Require lowercase characters in password"
  type        = bool
  default     = true
}

variable "password_require_uppercase" {
  description = "Require uppercase characters in password"
  type        = bool
  default     = true
}

variable "password_require_numbers" {
  description = "Require numbers in password"
  type        = bool
  default     = true
}

variable "password_require_symbols" {
  description = "Require symbols in password"
  type        = bool
  default     = true
}

variable "temporary_password_validity_days" {
  description = "Number of days a temporary password is valid"
  type        = number
  default     = 7

  validation {
    condition     = var.temporary_password_validity_days >= 1 && var.temporary_password_validity_days <= 365
    error_message = "Temporary password validity must be between 1 and 365 days"
  }
}

# Email Configuration
variable "email_verification_message" {
  description = "Email verification message template"
  type        = string
  default     = "Your verification code is {####}"
}

variable "email_verification_subject" {
  description = "Email verification subject"
  type        = string
  default     = "Verify your email for Marin Audio Pipeline"
}

variable "ses_email_identity" {
  description = "SES verified email identity for sending emails (optional, uses Cognito default if not provided)"
  type        = string
  default     = ""
}

# App Client Configuration
variable "access_token_validity" {
  description = "Access token validity in minutes"
  type        = number
  default     = 60

  validation {
    condition     = var.access_token_validity >= 5 && var.access_token_validity <= 1440
    error_message = "Access token validity must be between 5 minutes and 24 hours"
  }
}

variable "id_token_validity" {
  description = "ID token validity in minutes"
  type        = number
  default     = 60

  validation {
    condition     = var.id_token_validity >= 5 && var.id_token_validity <= 1440
    error_message = "ID token validity must be between 5 minutes and 24 hours"
  }
}

variable "refresh_token_validity" {
  description = "Refresh token validity in days"
  type        = number
  default     = 30

  validation {
    condition     = var.refresh_token_validity >= 1 && var.refresh_token_validity <= 3650
    error_message = "Refresh token validity must be between 1 and 3650 days"
  }
}

# User Groups
variable "create_user_groups" {
  description = "Whether to create user groups (admins, analysts, users)"
  type        = bool
  default     = true
}

variable "admin_group_description" {
  description = "Description for admin user group"
  type        = string
  default     = "Administrators with full access to all features"
}

variable "analyst_group_description" {
  description = "Description for analyst user group"
  type        = string
  default     = "Analysts with read access to insights and analytics"
}

variable "user_group_description" {
  description = "Description for standard user group"
  type        = string
  default     = "Standard users with basic access"
}

# Advanced Settings
variable "enable_username_case_sensitivity" {
  description = "Whether username is case sensitive"
  type        = bool
  default     = false
}

variable "allow_admin_create_user_only" {
  description = "Whether only admins can create users (disable self-registration)"
  type        = bool
  default     = false
}

variable "account_recovery_mechanisms" {
  description = "Account recovery mechanisms"
  type        = list(string)
  default     = ["verified_email"]

  validation {
    condition = alltrue([
      for mechanism in var.account_recovery_mechanisms :
      contains(["verified_email", "verified_phone_number"], mechanism)
    ])
    error_message = "Recovery mechanisms must be 'verified_email' or 'verified_phone_number'"
  }
}
