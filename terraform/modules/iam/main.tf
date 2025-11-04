# IAM Module - Main Configuration
# Creates IAM roles and policies for ECS tasks with least-privilege access

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Local variables
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  account_id  = data.aws_caller_identity.current.account_id
  region      = data.aws_region.current.name

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      Module      = "iam"
    }
  )
}

# ============================================================================
# ECS Task Execution Role
# ============================================================================
# This role is used by ECS to pull container images and write logs
# It's the role that ECS itself uses, not the application running in the container

resource "aws_iam_role" "ecs_task_execution" {
  name        = "${local.name_prefix}-ecs-task-execution"
  description = "ECS Task Execution Role for ${var.project_name} ${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-ecs-task-execution"
      Role = "ECSTaskExecution"
    }
  )
}

# Attach AWS managed policy for ECS task execution
resource "aws_iam_role_policy_attachment" "ecs_task_execution_policy" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Additional policy for Secrets Manager access (to fetch secrets at container startup)
resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  name = "${local.name_prefix}-ecs-execution-secrets"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          "arn:aws:secretsmanager:${local.region}:${local.account_id}:secret:${var.environment}/audio-pipeline/*"
        ]
      }
    ]
  })
}

# ============================================================================
# API Task Role
# ============================================================================
# This role is used by the FastAPI application running in ECS
# It needs access to S3 (write), SQS (send), Secrets Manager, CloudWatch

resource "aws_iam_role" "api_task" {
  name        = "${local.name_prefix}-api-task"
  description = "Task Role for API service in ${var.project_name} ${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-api-task"
      Role = "APITask"
    }
  )
}

# API Task Policy - S3 Access
resource "aws_iam_role_policy" "api_task_s3" {
  name = "${local.name_prefix}-api-s3"
  role = aws_iam_role.api_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3RecordingsWrite"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:GetObject",
          "s3:GetObjectAttributes"
        ]
        Resource = [
          "${var.recordings_bucket_arn}/*"
        ]
      },
      {
        Sid    = "S3TranscriptsRead"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectAttributes"
        ]
        Resource = [
          "${var.transcripts_bucket_arn}/*"
        ]
      },
      {
        Sid    = "S3BucketList"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          var.recordings_bucket_arn,
          var.transcripts_bucket_arn
        ]
      }
    ]
  })
}

# API Task Policy - SQS Send Messages
resource "aws_iam_role_policy" "api_task_sqs" {
  name = "${local.name_prefix}-api-sqs"
  role = aws_iam_role.api_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SQSSendMessages"
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl"
        ]
        Resource = [
          var.processing_queue_arn
        ]
      }
    ]
  })
}

# API Task Policy - OpenSearch Access (for semantic search - Epic 4)
resource "aws_iam_role_policy" "api_task_opensearch" {
  count = var.opensearch_collection_arn != "" ? 1 : 0
  name  = "${local.name_prefix}-api-opensearch"
  role  = aws_iam_role.api_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "OpenSearchDataAccess"
        Effect = "Allow"
        Action = [
          "aoss:APIAccessAll"
        ]
        Resource = [
          var.opensearch_collection_arn
        ]
      }
    ]
  })
}

# API Task Policy - Bedrock Access (for AI analysis)
resource "aws_iam_role_policy" "api_task_bedrock" {
  name = "${local.name_prefix}-api-bedrock"
  role = aws_iam_role.api_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "BedrockInvokeModel"
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Resource = [
          "arn:aws:bedrock:${local.region}::foundation-model/anthropic.claude-*",
          "arn:aws:bedrock:${local.region}::foundation-model/amazon.titan-embed-*"
        ]
      }
    ]
  })
}

# API Task Policy - CloudWatch Logs
resource "aws_iam_role_policy" "api_task_logs" {
  name = "${local.name_prefix}-api-logs"
  role = aws_iam_role.api_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          "arn:aws:logs:${local.region}:${local.account_id}:log-group:/ecs/${var.project_name}-${var.environment}/*"
        ]
      }
    ]
  })
}

# API Task Policy - Secrets Manager
resource "aws_iam_role_policy" "api_task_secrets" {
  name = "${local.name_prefix}-api-secrets"
  role = aws_iam_role.api_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SecretsManagerRead"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          "arn:aws:secretsmanager:${local.region}:${local.account_id}:secret:${var.environment}/audio-pipeline/*"
        ]
      }
    ]
  })
}

# ============================================================================
# Worker Task Role
# ============================================================================
# This role is used by Celery workers running in ECS
# It needs access to S3 (read/write), SQS (receive/delete), Bedrock, Secrets Manager

resource "aws_iam_role" "worker_task" {
  name        = "${local.name_prefix}-worker-task"
  description = "Task Role for Worker service in ${var.project_name} ${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-worker-task"
      Role = "WorkerTask"
    }
  )
}

# Worker Task Policy - S3 Full Access (read/write)
resource "aws_iam_role_policy" "worker_task_s3" {
  name = "${local.name_prefix}-worker-s3"
  role = aws_iam_role.worker_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3RecordingsRead"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectAttributes"
        ]
        Resource = [
          "${var.recordings_bucket_arn}/*"
        ]
      },
      {
        Sid    = "S3TranscriptsWrite"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:GetObject",
          "s3:GetObjectAttributes"
        ]
        Resource = [
          "${var.transcripts_bucket_arn}/*"
        ]
      },
      {
        Sid    = "S3BucketList"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          var.recordings_bucket_arn,
          var.transcripts_bucket_arn
        ]
      }
    ]
  })
}

# Worker Task Policy - SQS Receive and Delete Messages
resource "aws_iam_role_policy" "worker_task_sqs" {
  name = "${local.name_prefix}-worker-sqs"
  role = aws_iam_role.worker_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SQSReceiveDelete"
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl",
          "sqs:ChangeMessageVisibility"
        ]
        Resource = [
          var.processing_queue_arn
        ]
      }
    ]
  })
}

# Worker Task Policy - OpenSearch Access (for indexing - Epic 4)
resource "aws_iam_role_policy" "worker_task_opensearch" {
  count = var.opensearch_collection_arn != "" ? 1 : 0
  name  = "${local.name_prefix}-worker-opensearch"
  role  = aws_iam_role.worker_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "OpenSearchDataAccess"
        Effect = "Allow"
        Action = [
          "aoss:APIAccessAll"
        ]
        Resource = [
          var.opensearch_collection_arn
        ]
      }
    ]
  })
}

# Worker Task Policy - Bedrock Access (for AI processing)
resource "aws_iam_role_policy" "worker_task_bedrock" {
  name = "${local.name_prefix}-worker-bedrock"
  role = aws_iam_role.worker_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "BedrockInvokeModel"
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Resource = [
          "arn:aws:bedrock:${local.region}::foundation-model/anthropic.claude-*",
          "arn:aws:bedrock:${local.region}::foundation-model/amazon.titan-embed-*"
        ]
      }
    ]
  })
}

# Worker Task Policy - CloudWatch Logs
resource "aws_iam_role_policy" "worker_task_logs" {
  name = "${local.name_prefix}-worker-logs"
  role = aws_iam_role.worker_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          "arn:aws:logs:${local.region}:${local.account_id}:log-group:/ecs/${var.project_name}-${var.environment}/*"
        ]
      }
    ]
  })
}

# Worker Task Policy - Secrets Manager
resource "aws_iam_role_policy" "worker_task_secrets" {
  name = "${local.name_prefix}-worker-secrets"
  role = aws_iam_role.worker_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SecretsManagerRead"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          "arn:aws:secretsmanager:${local.region}:${local.account_id}:secret:${var.environment}/audio-pipeline/*"
        ]
      }
    ]
  })
}
