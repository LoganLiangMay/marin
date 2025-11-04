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

# Outputs will be populated as modules are implemented in subsequent stories
