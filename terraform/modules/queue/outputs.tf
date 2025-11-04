# Queue Module Outputs
# Exposes queue URLs, ARNs, and monitoring resources for application configuration

# Main Processing Queue Outputs
output "processing_queue_url" {
  description = "URL of the main processing queue for Celery workers"
  value       = aws_sqs_queue.processing.url
}

output "processing_queue_arn" {
  description = "ARN of the main processing queue"
  value       = aws_sqs_queue.processing.arn
}

output "processing_queue_name" {
  description = "Name of the main processing queue"
  value       = aws_sqs_queue.processing.name
}

# Dead Letter Queue Outputs
output "dlq_url" {
  description = "URL of the Dead Letter Queue"
  value       = aws_sqs_queue.dlq.url
}

output "dlq_arn" {
  description = "ARN of the Dead Letter Queue"
  value       = aws_sqs_queue.dlq.arn
}

output "dlq_name" {
  description = "Name of the Dead Letter Queue"
  value       = aws_sqs_queue.dlq.name
}

# CloudWatch Alarm Outputs
output "dlq_alarm_arn" {
  description = "ARN of the DLQ message count alarm"
  value       = aws_cloudwatch_metric_alarm.dlq_messages.arn
}

output "queue_depth_alarm_arn" {
  description = "ARN of the queue depth alarm"
  value       = aws_cloudwatch_metric_alarm.queue_depth.arn
}

# SNS Topic Output (conditional)
output "sns_topic_arn" {
  description = "ARN of the SNS topic for queue alarms (empty if not created)"
  value       = var.create_sns_topic ? aws_sns_topic.queue_alarms[0].arn : ""
}

# Queue Configuration Outputs (useful for validation)
output "queue_configuration" {
  description = "Queue configuration summary"
  value = {
    visibility_timeout_seconds = var.visibility_timeout_seconds
    message_retention_seconds  = var.message_retention_seconds
    receive_wait_time_seconds  = var.receive_wait_time_seconds
    max_receive_count          = var.max_receive_count
    environment                = var.environment
  }
}
