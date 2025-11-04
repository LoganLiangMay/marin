# Storage Module Outputs
# Exposes S3 bucket ARNs, names, and IDs for use by IAM and application modules

###########################################
# Call Recordings Bucket Outputs
###########################################

output "recordings_bucket_id" {
  description = "ID of the call recordings S3 bucket"
  value       = aws_s3_bucket.recordings.id
}

output "recordings_bucket_arn" {
  description = "ARN of the call recordings S3 bucket"
  value       = aws_s3_bucket.recordings.arn
}

output "recordings_bucket_name" {
  description = "Name of the call recordings S3 bucket"
  value       = aws_s3_bucket.recordings.bucket
}

output "recordings_bucket_domain_name" {
  description = "Domain name of the call recordings S3 bucket"
  value       = aws_s3_bucket.recordings.bucket_domain_name
}

output "recordings_bucket_regional_domain_name" {
  description = "Regional domain name of the call recordings S3 bucket"
  value       = aws_s3_bucket.recordings.bucket_regional_domain_name
}

###########################################
# Call Transcripts Bucket Outputs
###########################################

output "transcripts_bucket_id" {
  description = "ID of the call transcripts S3 bucket"
  value       = aws_s3_bucket.transcripts.id
}

output "transcripts_bucket_arn" {
  description = "ARN of the call transcripts S3 bucket"
  value       = aws_s3_bucket.transcripts.arn
}

output "transcripts_bucket_name" {
  description = "Name of the call transcripts S3 bucket"
  value       = aws_s3_bucket.transcripts.bucket
}

output "transcripts_bucket_domain_name" {
  description = "Domain name of the call transcripts S3 bucket"
  value       = aws_s3_bucket.transcripts.bucket_domain_name
}

output "transcripts_bucket_regional_domain_name" {
  description = "Regional domain name of the call transcripts S3 bucket"
  value       = aws_s3_bucket.transcripts.bucket_regional_domain_name
}

###########################################
# Lifecycle Policy Outputs
###########################################

output "recordings_glacier_transition_days" {
  description = "Number of days before recordings transition to Glacier"
  value       = var.recordings_glacier_transition_days
}

output "recordings_expiration_days" {
  description = "Number of days before recordings are deleted"
  value       = var.recordings_expiration_days
}

output "transcripts_expiration_days" {
  description = "Number of days before transcripts are deleted"
  value       = var.transcripts_expiration_days
}

###########################################
# Configuration Outputs
###########################################

output "folder_structure_pattern" {
  description = "Folder structure pattern enforced by application layer"
  value       = local.folder_structure_pattern
}

output "versioning_enabled" {
  description = "Whether versioning is enabled on the buckets"
  value       = var.enable_versioning
}

output "encryption_algorithm" {
  description = "Server-side encryption algorithm used"
  value       = var.encryption_algorithm
}

###########################################
# CloudTrail Outputs (Optional)
###########################################

output "cloudtrail_trail_id" {
  description = "ID of the CloudTrail trail for S3 data events (null if not enabled)"
  value       = var.enable_cloudtrail ? aws_cloudtrail.s3_data_events[0].id : null
}

output "cloudtrail_trail_arn" {
  description = "ARN of the CloudTrail trail for S3 data events (null if not enabled)"
  value       = var.enable_cloudtrail ? aws_cloudtrail.s3_data_events[0].arn : null
}

###########################################
# Combined Outputs for Convenience
###########################################

output "bucket_arns" {
  description = "Map of all S3 bucket ARNs"
  value = {
    recordings  = aws_s3_bucket.recordings.arn
    transcripts = aws_s3_bucket.transcripts.arn
  }
}

output "bucket_names" {
  description = "Map of all S3 bucket names"
  value = {
    recordings  = aws_s3_bucket.recordings.bucket
    transcripts = aws_s3_bucket.transcripts.bucket
  }
}

output "bucket_ids" {
  description = "Map of all S3 bucket IDs"
  value = {
    recordings  = aws_s3_bucket.recordings.id
    transcripts = aws_s3_bucket.transcripts.id
  }
}
