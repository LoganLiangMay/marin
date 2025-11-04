# Terraform Variables
# Global configuration for the Audio Call Data Ingestion Pipeline

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource tagging"
  type        = string
  default     = "audio-pipeline"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
}

variable "mongodb_atlas_public_key" {
  description = "MongoDB Atlas API public key"
  type        = string
  sensitive   = true
}

variable "mongodb_atlas_private_key" {
  description = "MongoDB Atlas API private key"
  type        = string
  sensitive   = true
}

variable "atlas_org_id" {
  description = "MongoDB Atlas organization ID"
  type        = string
  sensitive   = true
}

# Additional variables will be added as modules are populated in subsequent stories
