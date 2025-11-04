# Queue Module Variables
# Configures SQS queues, DLQ, and CloudWatch alarms for audio pipeline

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

# Queue Configuration
variable "visibility_timeout_seconds" {
  description = "Visibility timeout for main processing queue (seconds)"
  type        = number
  default     = 600 # 10 minutes - enough for transcription processing
  validation {
    condition     = var.visibility_timeout_seconds >= 0 && var.visibility_timeout_seconds <= 43200
    error_message = "Visibility timeout must be between 0 and 43200 seconds (12 hours)."
  }
}

variable "message_retention_seconds" {
  description = "Message retention period for main queue (seconds)"
  type        = number
  default     = 1209600 # 14 days
  validation {
    condition     = var.message_retention_seconds >= 60 && var.message_retention_seconds <= 1209600
    error_message = "Message retention must be between 60 seconds and 14 days."
  }
}

variable "receive_wait_time_seconds" {
  description = "Long polling wait time for ReceiveMessage calls (seconds)"
  type        = number
  default     = 20 # Maximum for long polling
  validation {
    condition     = var.receive_wait_time_seconds >= 0 && var.receive_wait_time_seconds <= 20
    error_message = "Receive wait time must be between 0 and 20 seconds."
  }
}

variable "max_receive_count" {
  description = "Maximum number of receive attempts before message goes to DLQ"
  type        = number
  default     = 3
  validation {
    condition     = var.max_receive_count >= 1 && var.max_receive_count <= 1000
    error_message = "Max receive count must be between 1 and 1000."
  }
}

# DLQ Configuration
variable "dlq_message_retention_seconds" {
  description = "Message retention period for Dead Letter Queue (seconds)"
  type        = number
  default     = 1209600 # 14 days
  validation {
    condition     = var.dlq_message_retention_seconds >= 60 && var.dlq_message_retention_seconds <= 1209600
    error_message = "DLQ message retention must be between 60 seconds and 14 days."
  }
}

# IAM Configuration
variable "api_role_arn" {
  description = "IAM role ARN for API (allowed to SendMessage)"
  type        = string
  default     = "*" # Placeholder - should be replaced with actual API role ARN from IAM module
}

variable "worker_role_arn" {
  description = "IAM role ARN for Workers (allowed to ReceiveMessage, DeleteMessage)"
  type        = string
  default     = "*" # Placeholder - should be replaced with actual Worker role ARN from IAM module
}

# CloudWatch Alarm Configuration
variable "dlq_alarm_threshold" {
  description = "Number of messages in DLQ before alarm triggers"
  type        = number
  default     = 10
}

variable "queue_depth_alarm_threshold" {
  description = "Number of messages in main queue before alarm triggers"
  type        = number
  default     = 100
}

variable "alarm_evaluation_periods" {
  description = "Number of periods for alarm evaluation"
  type        = number
  default     = 2
}

variable "alarm_period_seconds" {
  description = "Period for alarm evaluation (seconds)"
  type        = number
  default     = 300 # 5 minutes
}

# SNS Topic Configuration
variable "create_sns_topic" {
  description = "Whether to create SNS topic for alarm notifications"
  type        = bool
  default     = false # Optional for MVP
}
