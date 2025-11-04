# Database Module Variables
# Configuration for MongoDB Atlas cluster, users, and PrivateLink

###########################################
# Required Variables
###########################################

variable "project_name" {
  description = "Name of the project (used for Atlas project naming and tagging)"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

###########################################
# MongoDB Atlas Configuration
###########################################

variable "atlas_org_id" {
  description = "MongoDB Atlas organization ID"
  type        = string
}

variable "atlas_project_name" {
  description = "MongoDB Atlas project name"
  type        = string
  default     = "audio-pipeline"
}

variable "cluster_name" {
  description = "MongoDB Atlas cluster name"
  type        = string
  default     = null # Will use {project_name}-{environment}-mongodb if not specified
}

variable "cluster_tier" {
  description = "MongoDB Atlas cluster tier (M2, M10, M20, etc.)"
  type        = string
  default     = "M2"

  validation {
    condition     = can(regex("^M[0-9]+$", var.cluster_tier))
    error_message = "Cluster tier must be in format M2, M10, M20, etc."
  }
}

variable "mongodb_version" {
  description = "MongoDB version"
  type        = string
  default     = "7.0"
}

variable "cloud_provider" {
  description = "Cloud provider for MongoDB Atlas cluster"
  type        = string
  default     = "AWS"

  validation {
    condition     = contains(["AWS", "GCP", "AZURE"], var.cloud_provider)
    error_message = "Cloud provider must be AWS, GCP, or AZURE"
  }
}

variable "region" {
  description = "Cloud provider region for MongoDB Atlas cluster"
  type        = string
  default     = "US_EAST_1" # MongoDB Atlas region format
}

###########################################
# Database Configuration
###########################################

variable "database_name" {
  description = "Primary database name"
  type        = string
  default     = "audio_pipeline"
}

variable "database_user_username" {
  description = "MongoDB database username"
  type        = string
  default     = "app_user"
}

variable "database_user_password" {
  description = "MongoDB database user password (will be generated if not provided)"
  type        = string
  default     = null
  sensitive   = true
}

###########################################
# VPC PrivateLink Configuration
###########################################

variable "vpc_id" {
  description = "VPC ID for PrivateLink endpoint"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for PrivateLink endpoint"
  type        = list(string)
}

variable "vpc_cidr" {
  description = "VPC CIDR block for IP allowlist"
  type        = string
  default     = "10.0.0.0/16"
}

variable "enable_privatelink" {
  description = "Enable AWS PrivateLink for secure VPC access"
  type        = bool
  default     = true
}

###########################################
# Backup Configuration
###########################################

variable "enable_continuous_backup" {
  description = "Enable continuous backup (point-in-time recovery)"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Backup retention period in days"
  type        = number
  default     = 7

  validation {
    condition     = var.backup_retention_days >= 1 && var.backup_retention_days <= 365
    error_message = "Backup retention must be between 1 and 365 days"
  }
}

###########################################
# Secrets Manager Configuration
###########################################

variable "secrets_manager_secret_name" {
  description = "AWS Secrets Manager secret name for MongoDB connection string"
  type        = string
  default     = "audio-pipeline/mongodb-uri"
}

variable "enable_secret_rotation" {
  description = "Enable automatic secret rotation in AWS Secrets Manager"
  type        = bool
  default     = false # Optional for MVP
}

###########################################
# Monitoring Configuration
###########################################

variable "enable_cloudwatch_integration" {
  description = "Enable CloudWatch integration for monitoring (if available in tier)"
  type        = bool
  default     = true
}

###########################################
# Tagging
###########################################

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
