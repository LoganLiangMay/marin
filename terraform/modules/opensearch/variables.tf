# OpenSearch Serverless Module - Input Variables

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for OpenSearch VPC endpoint"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for OpenSearch VPC endpoint"
  type        = list(string)
}

variable "worker_task_role_arn" {
  description = "ARN of the worker task IAM role (for data access policy)"
  type        = string
}

variable "api_task_role_arn" {
  description = "ARN of the API task IAM role (for data access policy)"
  type        = string
}

variable "index_name" {
  description = "Name of the vector search index"
  type        = string
  default     = "call-transcripts"
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
