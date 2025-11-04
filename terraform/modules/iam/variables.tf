# IAM Module Variables
# Defines input variables for IAM roles, policies, and service-to-service access

variable "project_name" {
  description = "Project name for resource tagging and naming"
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

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

# S3 Bucket References
variable "recordings_bucket_arn" {
  description = "ARN of the S3 bucket for audio recordings"
  type        = string
}

variable "recordings_bucket_name" {
  description = "Name of the S3 bucket for audio recordings"
  type        = string
}

variable "transcripts_bucket_arn" {
  description = "ARN of the S3 bucket for transcripts"
  type        = string
}

variable "transcripts_bucket_name" {
  description = "Name of the S3 bucket for transcripts"
  type        = string
}

# SQS Queue References
variable "processing_queue_arn" {
  description = "ARN of the SQS queue for async processing"
  type        = string
}

variable "processing_queue_url" {
  description = "URL of the SQS queue for async processing"
  type        = string
}

# OpenSearch Collection Reference (Optional - for Epic 4)
variable "opensearch_collection_arn" {
  description = "ARN of the OpenSearch Serverless collection (optional, for Epic 4)"
  type        = string
  default     = ""
}

# Tagging
variable "tags" {
  description = "Additional tags to apply to IAM resources"
  type        = map(string)
  default     = {}
}
