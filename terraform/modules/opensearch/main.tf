# OpenSearch Serverless Module - Main Configuration

# Local variables for naming and tagging
locals {
  collection_name = "${var.project_name}-${var.environment}-vectors"

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      Module      = "opensearch"
    }
  )
}

# ============================================================================
# Encryption Policy
# ============================================================================

resource "aws_opensearchserverless_security_policy" "encryption" {
  name        = "${local.collection_name}-encryption"
  type        = "encryption"
  description = "Encryption policy for ${local.collection_name}"

  policy = jsonencode({
    Rules = [
      {
        ResourceType = "collection"
        Resource     = ["collection/${local.collection_name}"]
      }
    ]
    AWSOwnedKey = true
  })
}

# ============================================================================
# Network Policy
# ============================================================================

resource "aws_opensearchserverless_security_policy" "network" {
  name        = "${local.collection_name}-network"
  type        = "network"
  description = "Network policy for ${local.collection_name}"

  policy = jsonencode([
    {
      Rules = [
        {
          ResourceType = "collection"
          Resource     = ["collection/${local.collection_name}"]
        },
        {
          ResourceType = "dashboard"
          Resource     = ["collection/${local.collection_name}"]
        }
      ]
      AllowFromPublic = false
      SourceVPCEs     = [aws_opensearchserverless_vpc_endpoint.collection.id]
    }
  ])

  depends_on = [aws_opensearchserverless_vpc_endpoint.collection]
}

# ============================================================================
# VPC Endpoint
# ============================================================================

resource "aws_opensearchserverless_vpc_endpoint" "collection" {
  name       = "${local.collection_name}-vpce"
  vpc_id     = var.vpc_id
  subnet_ids = var.subnet_ids

  security_group_ids = [aws_security_group.opensearch_vpce.id]
}

resource "aws_security_group" "opensearch_vpce" {
  name        = "${local.collection_name}-vpce-sg"
  description = "Security group for OpenSearch Serverless VPC endpoint"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"] # VPC CIDR
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.collection_name}-vpce-sg"
    }
  )
}

# ============================================================================
# OpenSearch Serverless Collection
# ============================================================================

resource "aws_opensearchserverless_collection" "vector_search" {
  name        = local.collection_name
  type        = "VECTORSEARCH"
  description = "Vector search collection for call transcript semantic search"

  standby_replicas = "ENABLED"

  tags = merge(
    local.common_tags,
    {
      Name    = local.collection_name
      Purpose = "Semantic search for call transcripts"
    }
  )

  depends_on = [
    aws_opensearchserverless_security_policy.encryption,
    aws_opensearchserverless_security_policy.network
  ]
}

# ============================================================================
# Data Access Policy
# ============================================================================

resource "aws_opensearchserverless_access_policy" "data" {
  name        = "${local.collection_name}-data-access"
  type        = "data"
  description = "Data access policy for ${local.collection_name}"

  policy = jsonencode([
    {
      Rules = [
        {
          ResourceType = "collection"
          Resource     = ["collection/${local.collection_name}"]
          Permission = [
            "aoss:CreateCollectionItems",
            "aoss:UpdateCollectionItems",
            "aoss:DescribeCollectionItems"
          ]
        },
        {
          ResourceType = "index"
          Resource     = ["index/${local.collection_name}/*"]
          Permission = [
            "aoss:CreateIndex",
            "aoss:UpdateIndex",
            "aoss:DescribeIndex",
            "aoss:ReadDocument",
            "aoss:WriteDocument",
            "aoss:DeleteDocument"
          ]
        }
      ]
      Principal = [
        var.worker_task_role_arn,
        var.api_task_role_arn
      ]
    }
  ])

  depends_on = [aws_opensearchserverless_collection.vector_search]
}

# ============================================================================
# Index Configuration (for manual creation or automation)
# ============================================================================

# Note: Index creation is typically done via API after collection is ready
# This can be automated with a null_resource + local-exec or handled by application code
# For now, we output the configuration and collection endpoint
