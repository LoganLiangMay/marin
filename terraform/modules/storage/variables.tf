# Storage Module Variables
# Configuration for S3 buckets, lifecycle policies, and CORS settings

###########################################
# Required Variables
###########################################

variable "project_name" {
  description = "Name of the project (used for bucket naming and tagging)"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

###########################################
# S3 Bucket Configuration
###########################################

variable "recordings_bucket_name" {
  description = "Name for the call recordings S3 bucket (must be globally unique)"
  type        = string
  default     = null # Will use {project_name}-{environment}-call-recordings if not specified
}

variable "transcripts_bucket_name" {
  description = "Name for the call transcripts S3 bucket (must be globally unique)"
  type        = string
  default     = null # Will use {project_name}-{environment}-call-transcripts if not specified
}

variable "enable_versioning" {
  description = "Enable versioning on S3 buckets for data protection"
  type        = bool
  default     = true
}

variable "encryption_algorithm" {
  description = "Server-side encryption algorithm (AES256 for SSE-S3)"
  type        = string
  default     = "AES256"

  validation {
    condition     = contains(["AES256", "aws:kms"], var.encryption_algorithm)
    error_message = "Encryption algorithm must be either AES256 (SSE-S3) or aws:kms (SSE-KMS)"
  }
}

###########################################
# Lifecycle Policy Configuration
###########################################

variable "recordings_glacier_transition_days" {
  description = "Number of days before recordings transition to Glacier storage class"
  type        = number
  default     = 365
}

variable "recordings_expiration_days" {
  description = "Number of days before recordings are permanently deleted"
  type        = number
  default     = 1095 # 3 years
}

variable "transcripts_expiration_days" {
  description = "Number of days before transcripts are permanently deleted"
  type        = number
  default     = 1095 # 3 years
}

###########################################
# CORS Configuration
###########################################

variable "cors_allowed_origins" {
  description = "List of allowed origins for CORS configuration (e.g., dashboard URLs)"
  type        = list(string)
  default     = ["*"] # Will be restricted to actual dashboard origin in production

  validation {
    condition     = length(var.cors_allowed_origins) > 0
    error_message = "At least one CORS origin must be specified"
  }
}

variable "cors_allowed_methods" {
  description = "List of allowed HTTP methods for CORS"
  type        = list(string)
  default     = ["GET"]
}

variable "cors_allowed_headers" {
  description = "List of allowed headers for CORS preflight requests"
  type        = list(string)
  default     = ["*"]
}

variable "cors_expose_headers" {
  description = "List of headers to expose in CORS responses"
  type        = list(string)
  default     = ["ETag"]
}

variable "cors_max_age_seconds" {
  description = "Maximum time (in seconds) browsers can cache CORS preflight results"
  type        = number
  default     = 3600 # 1 hour
}

###########################################
# CloudTrail Configuration (Optional)
###########################################

variable "enable_cloudtrail" {
  description = "Enable CloudTrail logging for S3 data events (optional)"
  type        = bool
  default     = false # Optional - can be enabled later for audit requirements
}

variable "cloudtrail_log_bucket_name" {
  description = "Name of S3 bucket to store CloudTrail logs (required if enable_cloudtrail is true)"
  type        = string
  default     = null
}

###########################################
# Tagging
###########################################

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
