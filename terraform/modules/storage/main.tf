# Storage Module
# Manages S3 buckets for audio files and transcripts with lifecycle policies, encryption, and CORS

# Local variables for resource naming and tagging
locals {
  name_prefix = "${var.project_name}-${var.environment}"

  # Default bucket names if not provided
  recordings_bucket_name  = var.recordings_bucket_name != null ? var.recordings_bucket_name : "${var.project_name}-${var.environment}-call-recordings"
  transcripts_bucket_name = var.transcripts_bucket_name != null ? var.transcripts_bucket_name : "${var.project_name}-${var.environment}-call-transcripts"

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Module      = "storage"
    }
  )

  # Folder structure pattern for documentation
  folder_structure_pattern = "/{year}/{month}/{day}/{call_id}.{ext}"
}

###########################################
# S3 Bucket - Call Recordings
###########################################

resource "aws_s3_bucket" "recordings" {
  bucket = local.recordings_bucket_name

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.name_prefix}-call-recordings"
      Purpose     = "audio-recordings"
      DataType    = "audio"
      Sensitivity = "confidential"
    }
  )
}

# Versioning configuration for recordings bucket
resource "aws_s3_bucket_versioning" "recordings" {
  bucket = aws_s3_bucket.recordings.id

  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Suspended"
  }
}

# Server-side encryption for recordings bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "recordings" {
  bucket = aws_s3_bucket.recordings.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = var.encryption_algorithm
    }
    bucket_key_enabled = true
  }
}

# Block all public access for recordings bucket
resource "aws_s3_bucket_public_access_block" "recordings" {
  bucket = aws_s3_bucket.recordings.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle policy for recordings bucket
resource "aws_s3_bucket_lifecycle_configuration" "recordings" {
  bucket = aws_s3_bucket.recordings.id

  rule {
    id     = "recordings-lifecycle-policy"
    status = "Enabled"

    # Transition to Glacier after specified days for cost optimization
    transition {
      days          = var.recordings_glacier_transition_days
      storage_class = "GLACIER"
    }

    # Expire (delete) after specified days for compliance
    expiration {
      days = var.recordings_expiration_days
    }

    # Apply to all objects in the bucket
    filter {}
  }

  # Cleanup incomplete multipart uploads after 7 days
  rule {
    id     = "cleanup-incomplete-uploads"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }

    filter {}
  }
}

# CORS configuration for recordings bucket (for browser-based audio playback)
resource "aws_s3_bucket_cors_configuration" "recordings" {
  bucket = aws_s3_bucket.recordings.id

  cors_rule {
    allowed_headers = var.cors_allowed_headers
    allowed_methods = var.cors_allowed_methods
    allowed_origins = var.cors_allowed_origins
    expose_headers  = var.cors_expose_headers
    max_age_seconds = var.cors_max_age_seconds
  }
}

###########################################
# S3 Bucket - Call Transcripts
###########################################

resource "aws_s3_bucket" "transcripts" {
  bucket = local.transcripts_bucket_name

  tags = merge(
    local.common_tags,
    {
      Name        = "${local.name_prefix}-call-transcripts"
      Purpose     = "call-transcripts"
      DataType    = "json"
      Sensitivity = "confidential"
    }
  )
}

# Versioning configuration for transcripts bucket
resource "aws_s3_bucket_versioning" "transcripts" {
  bucket = aws_s3_bucket.transcripts.id

  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Suspended"
  }
}

# Server-side encryption for transcripts bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "transcripts" {
  bucket = aws_s3_bucket.transcripts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = var.encryption_algorithm
    }
    bucket_key_enabled = true
  }
}

# Block all public access for transcripts bucket
resource "aws_s3_bucket_public_access_block" "transcripts" {
  bucket = aws_s3_bucket.transcripts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle policy for transcripts bucket
resource "aws_s3_bucket_lifecycle_configuration" "transcripts" {
  bucket = aws_s3_bucket.transcripts.id

  rule {
    id     = "transcripts-lifecycle-policy"
    status = "Enabled"

    # No Glacier transition for transcripts - keep in Standard class for fast access
    # Expire (delete) after specified days for compliance
    expiration {
      days = var.transcripts_expiration_days
    }

    # Apply to all objects in the bucket
    filter {}
  }

  # Cleanup incomplete multipart uploads after 7 days
  rule {
    id     = "cleanup-incomplete-uploads"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }

    filter {}
  }
}

###########################################
# CloudTrail for S3 Data Events (Optional)
###########################################

# CloudTrail trail for S3 data events (optional - for audit logging)
resource "aws_cloudtrail" "s3_data_events" {
  count = var.enable_cloudtrail ? 1 : 0

  name           = "${local.name_prefix}-s3-data-events"
  s3_bucket_name = var.cloudtrail_log_bucket_name

  enable_logging                = true
  include_global_service_events = false
  is_multi_region_trail         = false

  event_selector {
    read_write_type           = "All"
    include_management_events = false

    data_resource {
      type = "AWS::S3::Object"

      # Log data events for both buckets
      values = [
        "${aws_s3_bucket.recordings.arn}/*",
        "${aws_s3_bucket.transcripts.arn}/*"
      ]
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-s3-data-events-trail"
    }
  )
}

###########################################
# Documentation Comment
###########################################

# Folder Structure Pattern (enforced by application layer):
# ${local.folder_structure_pattern}
#
# Example:
# /2025/11/04/uuid-123-456.mp3  (recordings)
# /2025/11/04/uuid-123-456.json (transcripts)
#
# This pattern enables:
# - Efficient S3 prefix-based queries
# - Simplified lifecycle management by date ranges
# - Logical organization for troubleshooting
