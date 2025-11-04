# Database Module Outputs
# Exposes MongoDB Atlas cluster details, connection information, and AWS integration outputs

###########################################
# MongoDB Atlas Project Outputs
###########################################

output "project_id" {
  description = "MongoDB Atlas project ID"
  value       = mongodbatlas_project.main.id
}

output "project_name" {
  description = "MongoDB Atlas project name"
  value       = mongodbatlas_project.main.name
}

###########################################
# MongoDB Atlas Cluster Outputs
###########################################

output "cluster_id" {
  description = "MongoDB Atlas cluster ID"
  value       = mongodbatlas_cluster.main.id
}

output "cluster_name" {
  description = "MongoDB Atlas cluster name"
  value       = mongodbatlas_cluster.main.name
}

output "cluster_state" {
  description = "Current state of the MongoDB Atlas cluster"
  value       = mongodbatlas_cluster.main.state_name
}

output "cluster_version" {
  description = "MongoDB version of the cluster"
  value       = mongodbatlas_cluster.main.mongo_db_version
}

output "cluster_tier" {
  description = "MongoDB Atlas cluster tier"
  value       = mongodbatlas_cluster.main.provider_instance_size_name
}

output "cluster_connection_strings" {
  description = "MongoDB Atlas cluster connection strings (standard)"
  value       = mongodbatlas_cluster.main.connection_strings
  sensitive   = true
}

output "cluster_srv_address" {
  description = "MongoDB Atlas cluster SRV address"
  value       = try(mongodbatlas_cluster.main.connection_strings[0].standard_srv, "")
  sensitive   = true
}

###########################################
# Database User Outputs
###########################################

output "database_username" {
  description = "MongoDB database username"
  value       = mongodbatlas_database_user.app_user.username
}

output "database_name" {
  description = "Primary database name"
  value       = var.database_name
}

###########################################
# PrivateLink Outputs
###########################################

output "privatelink_enabled" {
  description = "Whether PrivateLink is enabled"
  value       = var.enable_privatelink
}

output "privatelink_endpoint_id" {
  description = "MongoDB Atlas PrivateLink endpoint ID"
  value       = var.enable_privatelink ? mongodbatlas_privatelink_endpoint.main[0].id : null
}

output "privatelink_endpoint_service_name" {
  description = "AWS VPC endpoint service name for MongoDB Atlas"
  value       = var.enable_privatelink ? mongodbatlas_privatelink_endpoint.main[0].endpoint_service_name : null
}

output "vpc_endpoint_id" {
  description = "AWS VPC endpoint ID for MongoDB Atlas PrivateLink"
  value       = var.enable_privatelink ? aws_vpc_endpoint.mongodb_atlas[0].id : null
}

output "vpc_endpoint_dns_names" {
  description = "AWS VPC endpoint DNS names"
  value       = var.enable_privatelink ? aws_vpc_endpoint.mongodb_atlas[0].dns_entry : []
}

output "mongodb_security_group_id" {
  description = "Security group ID for MongoDB Atlas PrivateLink endpoint"
  value       = var.enable_privatelink ? aws_security_group.mongodb[0].id : null
}

###########################################
# AWS Secrets Manager Outputs
###########################################

output "secrets_manager_secret_id" {
  description = "AWS Secrets Manager secret ID for MongoDB connection string"
  value       = aws_secretsmanager_secret.mongodb_uri.id
}

output "secrets_manager_secret_arn" {
  description = "AWS Secrets Manager secret ARN for MongoDB connection string"
  value       = aws_secretsmanager_secret.mongodb_uri.arn
}

output "secrets_manager_secret_name" {
  description = "AWS Secrets Manager secret name"
  value       = aws_secretsmanager_secret.mongodb_uri.name
}

###########################################
# Connection Information
###########################################

output "connection_string" {
  description = "MongoDB connection string (stored in Secrets Manager)"
  value       = local.connection_string
  sensitive   = true
}

output "connection_details" {
  description = "MongoDB connection details"
  value = {
    cluster_name   = local.cluster_name
    database_name  = var.database_name
    username       = var.database_user_username
    environment    = var.environment
    privatelink    = var.enable_privatelink
    backup_enabled = var.enable_continuous_backup
    mongo_version  = var.mongodb_version
    cluster_tier   = var.cluster_tier
  }
}

###########################################
# Backup Configuration Outputs
###########################################

output "backup_enabled" {
  description = "Whether continuous backup is enabled"
  value       = var.enable_continuous_backup
}

output "backup_retention_days" {
  description = "Backup retention period in days"
  value       = var.backup_retention_days
}

###########################################
# Collections and Indexes Documentation
###########################################

output "collections" {
  description = "Database collections (for documentation)"
  value       = local.collections
}

output "database_initialization_script" {
  description = "MongoDB commands to initialize database, collections, and indexes"
  value       = <<-EOT
    # Connect to MongoDB using the connection string from Secrets Manager
    # aws secretsmanager get-secret-value --secret-id ${aws_secretsmanager_secret.mongodb_uri.id} --query SecretString --output text | jq -r '.connection_string'

    # Create collections (if not auto-created)
    use ${var.database_name}
    db.createCollection("calls")
    db.createCollection("contacts")
    db.createCollection("insights_aggregated")
    db.createCollection("processing_metrics")

    # Create indexes on calls collection
    db.calls.createIndex({ "call_id": 1 }, { unique: true })
    db.calls.createIndex({ "status": 1 })
    db.calls.createIndex({ "metadata.company_name": 1 })
    db.calls.createIndex({ "created_at": 1 })

    # Verify indexes
    db.calls.getIndexes()
  EOT
}

###########################################
# Combined Outputs for Convenience
###########################################

output "mongodb_config" {
  description = "Complete MongoDB configuration for application use"
  value = {
    secrets_manager_arn = aws_secretsmanager_secret.mongodb_uri.arn
    database_name       = var.database_name
    cluster_name        = local.cluster_name
    collections         = local.collections
    region              = var.region
    environment         = var.environment
  }
}
