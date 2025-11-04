# ECR Module Outputs
# Exposes ECR repository URLs and ARNs for use by CI/CD and ECS

###########################################
# API Repository Outputs
###########################################

output "api_repository_url" {
  description = "URL of the API ECR repository"
  value       = aws_ecr_repository.api.repository_url
}

output "api_repository_arn" {
  description = "ARN of the API ECR repository"
  value       = aws_ecr_repository.api.arn
}

output "api_repository_name" {
  description = "Name of the API ECR repository"
  value       = aws_ecr_repository.api.name
}

###########################################
# Worker Repository Outputs
###########################################

output "worker_repository_url" {
  description = "URL of the Worker ECR repository"
  value       = aws_ecr_repository.worker.repository_url
}

output "worker_repository_arn" {
  description = "ARN of the Worker ECR repository"
  value       = aws_ecr_repository.worker.arn
}

output "worker_repository_name" {
  description = "Name of the Worker ECR repository"
  value       = aws_ecr_repository.worker.name
}

###########################################
# Combined Outputs for Convenience
###########################################

output "repository_urls" {
  description = "Map of all ECR repository URLs"
  value = {
    api    = aws_ecr_repository.api.repository_url
    worker = aws_ecr_repository.worker.repository_url
  }
}

output "repository_arns" {
  description = "Map of all ECR repository ARNs"
  value = {
    api    = aws_ecr_repository.api.arn
    worker = aws_ecr_repository.worker.arn
  }
}
