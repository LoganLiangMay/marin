# Terraform Outputs
# Expose key infrastructure details for use by application and other systems

# Networking Module Outputs
# Will expose VPC ID, subnet IDs, security group IDs

# Storage Module Outputs
# Will expose S3 bucket ARNs and names

# Database Module Outputs
# Will expose MongoDB connection strings and endpoints

# ECS Module Outputs
# Will expose ECS cluster details and service information

# Monitoring Module Outputs
# Will expose CloudWatch log groups and alarm details

# IAM Module Outputs
# Will expose IAM role ARNs

# Queue Module Outputs
# Expose SQS queue URLs and ARNs for application configuration

output "processing_queue_url" {
  description = "URL of the main processing queue for Celery workers"
  value       = module.queue.processing_queue_url
}

output "processing_queue_arn" {
  description = "ARN of the main processing queue"
  value       = module.queue.processing_queue_arn
}

output "dlq_url" {
  description = "URL of the Dead Letter Queue"
  value       = module.queue.dlq_url
}

output "dlq_arn" {
  description = "ARN of the Dead Letter Queue"
  value       = module.queue.dlq_arn
}

output "queue_cloudwatch_alarms" {
  description = "CloudWatch alarm ARNs for queue monitoring"
  value = {
    dlq_alarm         = module.queue.dlq_alarm_arn
    queue_depth_alarm = module.queue.queue_depth_alarm_arn
  }
}

output "queue_sns_topic_arn" {
  description = "SNS topic ARN for queue alarms (empty if not created)"
  value       = module.queue.sns_topic_arn
}

# OpenSearch Module Outputs (Epic 4)
# Expose OpenSearch Serverless collection details for application configuration

output "opensearch_collection_id" {
  description = "ID of the OpenSearch Serverless collection"
  value       = module.opensearch.collection_id
}

output "opensearch_collection_arn" {
  description = "ARN of the OpenSearch Serverless collection"
  value       = module.opensearch.collection_arn
}

output "opensearch_collection_endpoint" {
  description = "Endpoint of the OpenSearch Serverless collection"
  value       = module.opensearch.collection_endpoint
}

output "opensearch_collection_name" {
  description = "Name of the OpenSearch Serverless collection"
  value       = module.opensearch.collection_name
}

output "opensearch_index_name" {
  description = "Name of the vector search index"
  value       = module.opensearch.index_name
}

output "opensearch_index_config" {
  description = "Vector index configuration for application initialization"
  value       = module.opensearch.index_config
}

# Cognito Module Outputs (Story 5.1)
# Expose Cognito User Pool details for application authentication

output "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = module.cognito.user_pool_id
}

output "cognito_user_pool_arn" {
  description = "ARN of the Cognito User Pool"
  value       = module.cognito.user_pool_arn
}

output "cognito_app_client_id" {
  description = "App Client ID for API authentication"
  value       = module.cognito.app_client_id
  sensitive   = true
}

output "cognito_user_pool_domain" {
  description = "Cognito User Pool domain"
  value       = module.cognito.user_pool_domain
}

output "cognito_hosted_ui_url" {
  description = "Cognito Hosted UI URL"
  value       = module.cognito.cognito_hosted_ui_url
}

output "cognito_jwks_uri" {
  description = "JWKS URI for JWT token verification"
  value       = module.cognito.cognito_jwks_uri
}

output "cognito_issuer" {
  description = "JWT issuer URL for token validation"
  value       = module.cognito.cognito_issuer
}

output "cognito_region" {
  description = "AWS region where Cognito is deployed"
  value       = module.cognito.cognito_region
}

output "cognito_user_groups" {
  description = "Cognito user group names"
  value = {
    admins   = module.cognito.admin_group_name
    analysts = module.cognito.analyst_group_name
    users    = module.cognito.user_group_name
  }
}

output "cognito_api_env_vars" {
  description = "Environment variables for backend API Cognito configuration"
  value       = module.cognito.api_environment_variables
  sensitive   = false
}

# Outputs will be populated as modules are implemented in subsequent stories
