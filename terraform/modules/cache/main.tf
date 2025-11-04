# Cache Module
# Manages AWS ElastiCache Redis cluster, parameter group, and monitoring

# Local variables for resource naming and tagging
locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Module      = "cache"
    }
  )
}

###########################################
# ElastiCache Subnet Group
###########################################

resource "aws_elasticache_subnet_group" "main" {
  name       = "${local.name_prefix}-redis-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-redis-subnet-group"
    }
  )
}

###########################################
# ElastiCache Parameter Group
###########################################

resource "aws_elasticache_parameter_group" "main" {
  name   = "${local.name_prefix}-redis-params"
  family = "redis7"

  # Timeout parameter: closes idle connections after specified seconds
  parameter {
    name  = "timeout"
    value = var.parameter_timeout
  }

  # Maxmemory policy: determines which keys to evict when memory is full
  # allkeys-lru: evicts least recently used keys across all keys
  parameter {
    name  = "maxmemory-policy"
    value = var.maxmemory_policy
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-redis-params"
    }
  )
}

###########################################
# ElastiCache Redis Replication Group
###########################################

resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "${local.name_prefix}-redis"
  description          = "Redis cluster for ${var.project_name} ${var.environment} environment"

  # Node configuration
  node_type            = var.node_type
  num_cache_clusters   = var.num_cache_clusters
  parameter_group_name = aws_elasticache_parameter_group.main.name
  port                 = 6379

  # Engine configuration
  engine         = "redis"
  engine_version = var.redis_version

  # Network configuration
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [var.redis_security_group_id] # Use existing security group from networking module

  # High Availability: Multi-AZ with automatic failover
  automatic_failover_enabled = var.enable_automatic_failover
  multi_az_enabled           = var.enable_automatic_failover

  # Security: Encryption at rest and in transit
  at_rest_encryption_enabled = var.enable_at_rest_encryption
  transit_encryption_enabled = var.enable_transit_encryption

  # Backup configuration
  snapshot_window          = var.snapshot_window
  snapshot_retention_limit = var.snapshot_retention_limit

  # Maintenance window (avoid snapshot window)
  maintenance_window = "mon:05:00-mon:06:00"

  # Apply updates immediately in non-prod, during maintenance window in prod
  apply_immediately = var.environment != "prod"

  # Notifications (optional - can be configured later)
  # notification_topic_arn = var.sns_topic_arn

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-redis"
    }
  )

  lifecycle {
    prevent_destroy = false # Set to true for production environments
  }
}

###########################################
# AWS Secrets Manager - Redis Endpoint
###########################################

# Store Redis endpoint for application configuration
resource "aws_secretsmanager_secret" "redis_endpoint" {
  name_prefix             = "${var.secrets_manager_secret_name}-"
  description             = "Redis endpoint for ${var.environment} environment"
  recovery_window_in_days = 7

  tags = merge(
    local.common_tags,
    {
      Name = var.secrets_manager_secret_name
    }
  )
}

resource "aws_secretsmanager_secret_version" "redis_endpoint" {
  secret_id = aws_secretsmanager_secret.redis_endpoint.id
  secret_string = jsonencode({
    primary_endpoint       = aws_elasticache_replication_group.main.primary_endpoint_address
    reader_endpoint        = aws_elasticache_replication_group.main.reader_endpoint_address
    configuration_endpoint = aws_elasticache_replication_group.main.configuration_endpoint_address
    port                   = 6379
    engine                 = "redis"
    engine_version         = var.redis_version
    cluster_name           = aws_elasticache_replication_group.main.id
    environment            = var.environment
    # Auth token is not set for this configuration (no auth_token parameter)
    # If auth token is needed, it would be added via transit_encryption_enabled with auth_token parameter
  })
}

###########################################
# CloudWatch Alarms
###########################################

# Alarm: CPU Utilization > 80%
resource "aws_cloudwatch_metric_alarm" "cpu_utilization" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${local.name_prefix}-redis-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = 300 # 5 minutes
  statistic           = "Average"
  threshold           = var.alarm_cpu_threshold
  alarm_description   = "Redis CPU utilization is above ${var.alarm_cpu_threshold}%"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.main.id
  }

  tags = local.common_tags
}

# Alarm: Memory Usage > 85%
resource "aws_cloudwatch_metric_alarm" "memory_usage" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${local.name_prefix}-redis-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = 300 # 5 minutes
  statistic           = "Average"
  threshold           = var.alarm_memory_threshold
  alarm_description   = "Redis memory usage is above ${var.alarm_memory_threshold}%"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.main.id
  }

  tags = local.common_tags
}

# Alarm: Evictions > 100/min
resource "aws_cloudwatch_metric_alarm" "evictions" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${local.name_prefix}-redis-evictions-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Evictions"
  namespace           = "AWS/ElastiCache"
  period              = 60 # 1 minute
  statistic           = "Sum"
  threshold           = var.alarm_evictions_threshold
  alarm_description   = "Redis evictions per minute exceed ${var.alarm_evictions_threshold}"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.main.id
  }

  tags = local.common_tags
}

###########################################
# Documentation Comments
###########################################

# Redis Use Cases:
# 1. API Response Caching - Cache frequently accessed data (call metadata, analytics)
# 2. Celery Result Backend - Store async task results temporarily
# 3. Session Storage - Fast user session retrieval (if needed)
#
# Connection Configuration (for application):
# - Endpoint: Get from Secrets Manager (aws_secretsmanager_secret.redis_endpoint)
# - Port: 6379
# - TLS: Required (transit_encryption_enabled = true)
# - Connection pool settings: min=10, max=50, timeout=60s
#
# Monitoring:
# - CPU alarm: indicates need for vertical scaling (larger node type)
# - Memory alarm: indicates need for vertical scaling or TTL adjustment
# - Evictions alarm: indicates cache is too small for workload
