# SQS Queue Module for Audio Pipeline
# Creates processing queue, dead letter queue, and CloudWatch monitoring

# Local variables for consistent naming and tagging
locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Module      = "queue"
  }
}

# Dead Letter Queue (DLQ)
# Captures messages that fail processing after max_receive_count attempts
resource "aws_sqs_queue" "dlq" {
  name                      = "${local.name_prefix}-processing-dlq"
  message_retention_seconds = var.dlq_message_retention_seconds

  # Enable server-side encryption (SSE-SQS)
  sqs_managed_sse_enabled = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-processing-dlq"
      Type = "dead-letter-queue"
    }
  )
}

# Main Processing Queue
# Distributes async tasks to Celery workers (transcription, analysis, embedding)
resource "aws_sqs_queue" "processing" {
  name                       = "${local.name_prefix}-processing"
  visibility_timeout_seconds = var.visibility_timeout_seconds
  message_retention_seconds  = var.message_retention_seconds
  receive_wait_time_seconds  = var.receive_wait_time_seconds

  # Enable server-side encryption (SSE-SQS)
  sqs_managed_sse_enabled = true

  # Configure Dead Letter Queue with redrive policy
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = var.max_receive_count
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-processing"
      Type = "processing-queue"
    }
  )
}

# Queue Policy
# Grants IAM roles permission to send/receive messages
resource "aws_sqs_queue_policy" "processing" {
  queue_url = aws_sqs_queue.processing.url

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowAPISendMessage"
        Effect = "Allow"
        Principal = {
          AWS = var.api_role_arn
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.processing.arn
      },
      {
        Sid    = "AllowWorkerReceiveDelete"
        Effect = "Allow"
        Principal = {
          AWS = var.worker_role_arn
        }
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.processing.arn
      }
    ]
  })
}

# SNS Topic for CloudWatch Alarms (optional)
resource "aws_sns_topic" "queue_alarms" {
  count = var.create_sns_topic ? 1 : 0

  name = "${local.name_prefix}-queue-alarms"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-queue-alarms"
    }
  )
}

# CloudWatch Alarm for DLQ Message Count
# Triggers when DLQ has more than threshold messages
resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "${local.name_prefix}-dlq-messages-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = var.alarm_period_seconds
  statistic           = "Average"
  threshold           = var.dlq_alarm_threshold
  alarm_description   = "Triggers when DLQ has more than ${var.dlq_alarm_threshold} messages"
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.dlq.name
  }

  # Attach SNS topic if created
  alarm_actions = var.create_sns_topic ? [aws_sns_topic.queue_alarms[0].arn] : []

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-dlq-alarm"
    }
  )
}

# CloudWatch Alarm for Main Queue Depth
# Triggers when main queue has too many messages (indicates worker issues)
resource "aws_cloudwatch_metric_alarm" "queue_depth" {
  alarm_name          = "${local.name_prefix}-queue-depth-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = var.alarm_period_seconds
  statistic           = "Average"
  threshold           = var.queue_depth_alarm_threshold
  alarm_description   = "Triggers when processing queue has more than ${var.queue_depth_alarm_threshold} messages"
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.processing.name
  }

  # Attach SNS topic if created
  alarm_actions = var.create_sns_topic ? [aws_sns_topic.queue_alarms[0].arn] : []

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-queue-depth-alarm"
    }
  )
}
