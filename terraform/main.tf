# Main Terraform Configuration
# Audio Call Data Ingestion Pipeline - Infrastructure as Code

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    mongodbatlas = {
      source  = "mongodb/mongodbatlas"
      version = "~> 1.0"
    }
  }
}

# AWS Provider Configuration
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# MongoDB Atlas Provider Configuration
provider "mongodbatlas" {
  public_key  = var.mongodb_atlas_public_key
  private_key = var.mongodb_atlas_private_key
}

# Networking Module
# Creates VPC, subnets, security groups, and routing
module "networking" {
  source = "./modules/networking"

  project_name = var.project_name
  environment  = var.environment

  # Additional variables will be passed in subsequent stories
}

# Storage Module
# Creates S3 buckets for audio files and transcripts
module "storage" {
  source = "./modules/storage"

  project_name = var.project_name
  environment  = var.environment

  # Optional: Override default bucket names if needed
  # recordings_bucket_name  = "custom-recordings-bucket-name"
  # transcripts_bucket_name = "custom-transcripts-bucket-name"

  # Optional: Override default lifecycle policies
  # recordings_glacier_transition_days = 365
  # recordings_expiration_days         = 1095
  # transcripts_expiration_days        = 1095

  # Optional: Override CORS configuration
  # cors_allowed_origins = ["https://dashboard.example.com"]

  # Optional: Enable CloudTrail for audit logging
  # enable_cloudtrail           = true
  # cloudtrail_log_bucket_name  = "cloudtrail-logs-bucket"
}

# Database Module
# Creates MongoDB Atlas cluster configuration
module "database" {
  source = "./modules/database"

  # Variables will be passed in subsequent stories
}

# ECS Module
# Creates ECS clusters, task definitions, and services
module "ecs" {
  source = "./modules/ecs"

  # Variables will be passed in subsequent stories
}

# Monitoring Module
# Creates CloudWatch logs, metrics, and alarms
module "monitoring" {
  source = "./modules/monitoring"

  # Variables will be passed in subsequent stories
}

# IAM Module
# Creates IAM roles, policies, and service-to-service access
module "iam" {
  source = "./modules/iam"

  # Variables will be passed in subsequent stories
}

# Queue Module
# Creates SQS queues for async processing
module "queue" {
  source = "./modules/queue"

  # Variables will be passed in subsequent stories
}
