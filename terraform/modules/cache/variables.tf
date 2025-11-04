# Cache Module Variables
# Configuration for AWS ElastiCache Redis cluster

###########################################
# Required Variables
###########################################

variable "project_name" {
  description = "Name of the project (used for naming and tagging)"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where ElastiCache will be deployed"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for ElastiCache subnet group"
  type        = list(string)
}

variable "redis_security_group_id" {
  description = "Security group ID for Redis (from networking module)"
  type        = string
}

###########################################
# Redis Configuration
###########################################

variable "node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t4g.micro"

  validation {
    condition     = can(regex("^cache\\.", var.node_type))
    error_message = "Node type must start with 'cache.' prefix"
  }
}

variable "redis_version" {
  description = "Redis version"
  type        = string
  default     = "7.0"
}

variable "num_cache_clusters" {
  description = "Number of cache clusters (1 primary + replicas)"
  type        = number
  default     = 2 # 1 primary + 1 replica for Multi-AZ

  validation {
    condition     = var.num_cache_clusters >= 1 && var.num_cache_clusters <= 6
    error_message = "Number of cache clusters must be between 1 and 6"
  }
}

variable "enable_automatic_failover" {
  description = "Enable automatic failover for Multi-AZ"
  type        = bool
  default     = true
}

variable "enable_at_rest_encryption" {
  description = "Enable encryption at rest"
  type        = bool
  default     = true
}

variable "enable_transit_encryption" {
  description = "Enable encryption in transit (TLS)"
  type        = bool
  default     = true
}

###########################################
# Parameter Group Configuration
###########################################

variable "parameter_timeout" {
  description = "Timeout parameter in seconds (closes idle connections)"
  type        = number
  default     = 300
}

variable "maxmemory_policy" {
  description = "Maxmemory eviction policy"
  type        = string
  default     = "allkeys-lru"

  validation {
    condition = contains([
      "volatile-lru", "allkeys-lru", "volatile-lfu", "allkeys-lfu",
      "volatile-random", "allkeys-random", "volatile-ttl", "noeviction"
    ], var.maxmemory_policy)
    error_message = "Invalid maxmemory policy"
  }
}

###########################################
# Backup Configuration
###########################################

variable "snapshot_window" {
  description = "Daily backup window in UTC (format: HH:MM-HH:MM)"
  type        = string
  default     = "03:00-04:00"
}

variable "snapshot_retention_limit" {
  description = "Number of days to retain automatic snapshots"
  type        = number
  default     = 7

  validation {
    condition     = var.snapshot_retention_limit >= 0 && var.snapshot_retention_limit <= 35
    error_message = "Snapshot retention must be between 0 and 35 days"
  }
}

###########################################
# Secrets Manager Configuration
###########################################

variable "secrets_manager_secret_name" {
  description = "AWS Secrets Manager secret name for Redis endpoint"
  type        = string
  default     = "audio-pipeline/redis-endpoint"
}

###########################################
# CloudWatch Monitoring Configuration
###########################################

variable "alarm_cpu_threshold" {
  description = "CPU utilization alarm threshold (percentage)"
  type        = number
  default     = 80

  validation {
    condition     = var.alarm_cpu_threshold >= 0 && var.alarm_cpu_threshold <= 100
    error_message = "CPU threshold must be between 0 and 100"
  }
}

variable "alarm_memory_threshold" {
  description = "Memory usage alarm threshold (percentage)"
  type        = number
  default     = 85

  validation {
    condition     = var.alarm_memory_threshold >= 0 && var.alarm_memory_threshold <= 100
    error_message = "Memory threshold must be between 0 and 100"
  }
}

variable "alarm_evictions_threshold" {
  description = "Evictions per minute alarm threshold"
  type        = number
  default     = 100
}

variable "enable_cloudwatch_alarms" {
  description = "Enable CloudWatch alarms for monitoring"
  type        = bool
  default     = true
}

###########################################
# Tagging
###########################################

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
