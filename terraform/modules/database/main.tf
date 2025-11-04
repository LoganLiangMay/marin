# Database Module
# Manages MongoDB Atlas cluster, users, PrivateLink, and AWS Secrets Manager integration

# Local variables for resource naming and tagging
locals {
  name_prefix = "${var.project_name}-${var.environment}"

  # Default cluster name if not provided
  cluster_name = var.cluster_name != null ? var.cluster_name : "${var.project_name}-${var.environment}-mongodb"

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Module      = "database"
    }
  )

  # Collections to be created (documented for manual/script creation)
  collections = ["calls", "contacts", "insights_aggregated", "processing_metrics"]
}

###########################################
# Generate Random Password for Database User
###########################################

resource "random_password" "db_password" {
  count   = var.database_user_password == null ? 1 : 0
  length  = 32
  special = true
}

###########################################
# MongoDB Atlas Project
###########################################

resource "mongodbatlas_project" "main" {
  name   = var.atlas_project_name
  org_id = var.atlas_org_id

  # Enable continuous backup at project level
  with_default_alerts_settings = true
}

###########################################
# MongoDB Atlas Cluster
###########################################

resource "mongodbatlas_cluster" "main" {
  project_id = mongodbatlas_project.main.id
  name       = local.cluster_name

  # Cluster Configuration
  cluster_type           = "REPLICASET"
  mongo_db_major_version = var.mongodb_version

  # Provider Settings
  provider_name               = var.cloud_provider
  backing_provider_name       = var.cloud_provider
  provider_instance_size_name = var.cluster_tier
  provider_region_name        = var.region

  # High Availability: Multi-AZ replication
  replication_specs {
    num_shards = 1
    regions_config {
      region_name     = var.region
      electable_nodes = 3 # 3-node replica set for HA
      priority        = 7
      read_only_nodes = 0
    }
  }

  # Backup Configuration
  backup_enabled               = var.enable_continuous_backup
  pit_enabled                  = var.enable_continuous_backup # Point-in-time recovery
  cloud_backup                 = var.enable_continuous_backup
  auto_scaling_disk_gb_enabled = true

  # Advanced Configuration
  advanced_configuration {
    javascript_enabled                   = true
    minimum_enabled_tls_protocol         = "TLS1_2"
    no_table_scan                        = false
    oplog_size_mb                        = 2048
    sample_size_bi_connector             = 5000
    sample_refresh_interval_bi_connector = 300
  }

  lifecycle {
    ignore_changes = [
      backing_provider_name,
    ]
  }
}

###########################################
# Database User
###########################################

resource "mongodbatlas_database_user" "app_user" {
  username           = var.database_user_username
  password           = var.database_user_password != null ? var.database_user_password : random_password.db_password[0].result
  project_id         = mongodbatlas_project.main.id
  auth_database_name = "admin"

  # Read/write permissions on the application database
  roles {
    role_name     = "readWrite"
    database_name = var.database_name
  }

  # Additional permissions for admin tasks if needed
  roles {
    role_name     = "read"
    database_name = "admin"
  }

  scopes {
    name = local.cluster_name
    type = "CLUSTER"
  }
}

###########################################
# IP Allowlist (VPC CIDR)
###########################################

resource "mongodbatlas_project_ip_access_list" "vpc_cidr" {
  project_id = mongodbatlas_project.main.id
  cidr_block = var.vpc_cidr
  comment    = "VPC CIDR allowlist for ${var.environment} environment"
}

###########################################
# AWS PrivateLink Configuration
###########################################

# MongoDB Atlas PrivateLink Endpoint
resource "mongodbatlas_privatelink_endpoint" "main" {
  count = var.enable_privatelink ? 1 : 0

  project_id    = mongodbatlas_project.main.id
  provider_name = var.cloud_provider
  region        = replace(var.region, "_", "-") # Convert US_EAST_1 to us-east-1 for AWS
}

# AWS VPC Endpoint for PrivateLink
resource "aws_vpc_endpoint" "mongodb_atlas" {
  count = var.enable_privatelink ? 1 : 0

  vpc_id             = var.vpc_id
  service_name       = mongodbatlas_privatelink_endpoint.main[0].endpoint_service_name
  vpc_endpoint_type  = "Interface"
  subnet_ids         = var.private_subnet_ids
  security_group_ids = [aws_security_group.mongodb[0].id]

  private_dns_enabled = false # MongoDB Atlas handles DNS

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-mongodb-privatelink"
    }
  )
}

# Link AWS VPC Endpoint to MongoDB Atlas
resource "mongodbatlas_privatelink_endpoint_service" "main" {
  count = var.enable_privatelink ? 1 : 0

  project_id          = mongodbatlas_project.main.id
  private_link_id     = mongodbatlas_privatelink_endpoint.main[0].id
  endpoint_service_id = aws_vpc_endpoint.mongodb_atlas[0].id
  provider_name       = var.cloud_provider
}

###########################################
# AWS Security Group for MongoDB Access
###########################################

resource "aws_security_group" "mongodb" {
  count = var.enable_privatelink ? 1 : 0

  name_prefix = "${local.name_prefix}-mongodb-sg-"
  description = "Security group for MongoDB Atlas PrivateLink endpoint"
  vpc_id      = var.vpc_id

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-mongodb-sg"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Ingress rule: Allow MongoDB traffic from VPC
resource "aws_vpc_security_group_ingress_rule" "mongodb_from_vpc" {
  count = var.enable_privatelink ? 1 : 0

  security_group_id = aws_security_group.mongodb[0].id
  description       = "Allow MongoDB traffic from VPC CIDR"

  from_port   = 27017
  to_port     = 27017
  ip_protocol = "tcp"
  cidr_ipv4   = var.vpc_cidr
}

# Egress rule: Allow all outbound traffic
resource "aws_vpc_security_group_egress_rule" "mongodb_egress" {
  count = var.enable_privatelink ? 1 : 0

  security_group_id = aws_security_group.mongodb[0].id
  description       = "Allow all outbound traffic"

  ip_protocol = "-1"
  cidr_ipv4   = "0.0.0.0/0"
}

###########################################
# AWS Secrets Manager - Connection String
###########################################

# Build connection string
locals {
  # Get password from either provided or generated
  db_password = var.database_user_password != null ? var.database_user_password : random_password.db_password[0].result

  # Build connection string based on PrivateLink or standard connection
  connection_string = var.enable_privatelink ? (
    "mongodb+srv://${var.database_user_username}:${local.db_password}@${mongodbatlas_privatelink_endpoint_service.main[0].private_endpoint_connection_name}/${var.database_name}?retryWrites=true&w=majority"
    ) : (
    "mongodb+srv://${var.database_user_username}:${local.db_password}@${replace(mongodbatlas_cluster.main.connection_strings[0].standard_srv, "mongodb+srv://", "")}/${var.database_name}?retryWrites=true&w=majority"
  )
}

# Store connection string in AWS Secrets Manager
resource "aws_secretsmanager_secret" "mongodb_uri" {
  name_prefix             = "${var.secrets_manager_secret_name}-"
  description             = "MongoDB Atlas connection string for ${var.environment} environment"
  recovery_window_in_days = 7

  tags = merge(
    local.common_tags,
    {
      Name = var.secrets_manager_secret_name
    }
  )
}

resource "aws_secretsmanager_secret_version" "mongodb_uri" {
  secret_id = aws_secretsmanager_secret.mongodb_uri.id
  secret_string = jsonencode({
    connection_string = local.connection_string
    username          = var.database_user_username
    database          = var.database_name
    cluster_name      = local.cluster_name
    environment       = var.environment
  })
}

# Optional: Secret rotation configuration (disabled by default for MVP)
resource "aws_secretsmanager_secret_rotation" "mongodb_uri" {
  count = var.enable_secret_rotation ? 1 : 0

  secret_id           = aws_secretsmanager_secret.mongodb_uri.id
  rotation_lambda_arn = var.enable_secret_rotation ? null : null # Lambda ARN would be required

  rotation_rules {
    automatically_after_days = 30
  }
}

###########################################
# MongoDB Atlas Cloud Backup Schedule
###########################################

resource "mongodbatlas_cloud_backup_schedule" "main" {
  count = var.enable_continuous_backup ? 1 : 0

  project_id   = mongodbatlas_project.main.id
  cluster_name = mongodbatlas_cluster.main.name

  # Daily snapshot at 03:00 UTC
  policy_item_daily {
    frequency_interval = 1
    retention_unit     = "days"
    retention_value    = var.backup_retention_days
  }

  # Weekly snapshot on Sunday at 03:00 UTC
  policy_item_weekly {
    frequency_interval = 1 # Sunday
    retention_unit     = "weeks"
    retention_value    = 4 # Keep 4 weeks
  }

  # Monthly snapshot on the 1st at 03:00 UTC
  policy_item_monthly {
    frequency_interval = 1 # 1st of month
    retention_unit     = "months"
    retention_value    = 3 # Keep 3 months
  }

  # Restore window
  restore_window_days = 7
}

###########################################
# Documentation Comments
###########################################

# Database Collections (to be created manually or via application initialization):
# - calls: {call_id (unique), status, metadata, created_at, updated_at}
# - contacts: {contact_id (unique), name, company, title, extracted_from_calls}
# - insights_aggregated: {date, company_name, metrics}
# - processing_metrics: {timestamp, metric_name, value, dimensions}
#
# Indexes to create on 'calls' collection:
# db.calls.createIndex({ "call_id": 1 }, { unique: true })
# db.calls.createIndex({ "status": 1 })
# db.calls.createIndex({ "metadata.company_name": 1 })
# db.calls.createIndex({ "created_at": 1 })
#
# Connection pool settings for application:
# - minPoolSize: 10
# - maxPoolSize: 50
# - maxIdleTimeMS: 60000
# - waitQueueTimeoutMS: 10000
