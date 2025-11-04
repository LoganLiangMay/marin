# Cache Module Outputs
# Exposes Redis cluster endpoints, security group, and Secrets Manager integration

###########################################
# ElastiCache Redis Outputs
###########################################

output "replication_group_id" {
  description = "ID of the ElastiCache replication group"
  value       = aws_elasticache_replication_group.main.id
}

output "replication_group_arn" {
  description = "ARN of the ElastiCache replication group"
  value       = aws_elasticache_replication_group.main.arn
}

output "primary_endpoint_address" {
  description = "Primary endpoint address for Redis cluster"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "reader_endpoint_address" {
  description = "Reader endpoint address for Redis cluster (read replicas)"
  value       = aws_elasticache_replication_group.main.reader_endpoint_address
}

output "configuration_endpoint_address" {
  description = "Configuration endpoint address for Redis cluster"
  value       = aws_elasticache_replication_group.main.configuration_endpoint_address
}

output "port" {
  description = "Redis port"
  value       = 6379
}

output "redis_version" {
  description = "Redis engine version"
  value       = aws_elasticache_replication_group.main.engine_version
}

###########################################
# Network Configuration Outputs
###########################################

output "security_group_id" {
  description = "Security group ID used by Redis cluster"
  value       = var.redis_security_group_id
}

output "subnet_group_name" {
  description = "Name of the ElastiCache subnet group"
  value       = aws_elasticache_subnet_group.main.name
}

###########################################
# Parameter Group Outputs
###########################################

output "parameter_group_name" {
  description = "Name of the ElastiCache parameter group"
  value       = aws_elasticache_parameter_group.main.name
}

output "parameter_group_id" {
  description = "ID of the ElastiCache parameter group"
  value       = aws_elasticache_parameter_group.main.id
}

###########################################
# Secrets Manager Outputs
###########################################

output "secrets_manager_secret_id" {
  description = "AWS Secrets Manager secret ID for Redis endpoint"
  value       = aws_secretsmanager_secret.redis_endpoint.id
}

output "secrets_manager_secret_arn" {
  description = "AWS Secrets Manager secret ARN for Redis endpoint"
  value       = aws_secretsmanager_secret.redis_endpoint.arn
}

output "secrets_manager_secret_name" {
  description = "AWS Secrets Manager secret name"
  value       = aws_secretsmanager_secret.redis_endpoint.name
}

###########################################
# CloudWatch Alarms Outputs
###########################################

output "alarm_cpu_id" {
  description = "ID of the CPU utilization alarm"
  value       = var.enable_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.cpu_utilization[0].id : null
}

output "alarm_memory_id" {
  description = "ID of the memory usage alarm"
  value       = var.enable_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.memory_usage[0].id : null
}

output "alarm_evictions_id" {
  description = "ID of the evictions alarm"
  value       = var.enable_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.evictions[0].id : null
}

###########################################
# Connection Information
###########################################

output "connection_details" {
  description = "Redis connection details"
  value = {
    primary_endpoint = aws_elasticache_replication_group.main.primary_endpoint_address
    reader_endpoint  = aws_elasticache_replication_group.main.reader_endpoint_address
    port             = 6379
    engine           = "redis"
    engine_version   = var.redis_version
    cluster_name     = aws_elasticache_replication_group.main.id
    environment      = var.environment
    tls_enabled      = var.enable_transit_encryption
    multi_az         = var.enable_automatic_failover
  }
}

###########################################
# Configuration Summary
###########################################

output "redis_config" {
  description = "Complete Redis configuration for application use"
  value = {
    secrets_manager_arn = aws_secretsmanager_secret.redis_endpoint.arn
    primary_endpoint    = aws_elasticache_replication_group.main.primary_endpoint_address
    reader_endpoint     = aws_elasticache_replication_group.main.reader_endpoint_address
    port                = 6379
    cluster_name        = aws_elasticache_replication_group.main.id
    node_type           = var.node_type
    num_cache_clusters  = var.num_cache_clusters
    environment         = var.environment
  }
}
