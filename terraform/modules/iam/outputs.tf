# IAM Module Outputs
# Exposes IAM role ARNs, names, and IDs for use in other modules

# ECS Task Execution Role Outputs
output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS Task Execution Role"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_execution_role_name" {
  description = "Name of the ECS Task Execution Role"
  value       = aws_iam_role.ecs_task_execution.name
}

output "ecs_task_execution_role_id" {
  description = "ID of the ECS Task Execution Role"
  value       = aws_iam_role.ecs_task_execution.id
}

# API Task Role Outputs
output "api_task_role_arn" {
  description = "ARN of the API Task Role"
  value       = aws_iam_role.api_task.arn
}

output "api_task_role_name" {
  description = "Name of the API Task Role"
  value       = aws_iam_role.api_task.name
}

output "api_task_role_id" {
  description = "ID of the API Task Role"
  value       = aws_iam_role.api_task.id
}

# Worker Task Role Outputs
output "worker_task_role_arn" {
  description = "ARN of the Worker Task Role"
  value       = aws_iam_role.worker_task.arn
}

output "worker_task_role_name" {
  description = "Name of the Worker Task Role"
  value       = aws_iam_role.worker_task.name
}

output "worker_task_role_id" {
  description = "ID of the Worker Task Role"
  value       = aws_iam_role.worker_task.id
}

# Combined Outputs (for convenience)
output "role_arns" {
  description = "Map of all IAM role ARNs"
  value = {
    ecs_task_execution = aws_iam_role.ecs_task_execution.arn
    api_task           = aws_iam_role.api_task.arn
    worker_task        = aws_iam_role.worker_task.arn
  }
}

output "role_names" {
  description = "Map of all IAM role names"
  value = {
    ecs_task_execution = aws_iam_role.ecs_task_execution.name
    api_task           = aws_iam_role.api_task.name
    worker_task        = aws_iam_role.worker_task.name
  }
}

output "role_ids" {
  description = "Map of all IAM role IDs"
  value = {
    ecs_task_execution = aws_iam_role.ecs_task_execution.id
    api_task           = aws_iam_role.api_task.id
    worker_task        = aws_iam_role.worker_task.id
  }
}
