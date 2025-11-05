# OpenSearch Serverless Module - Outputs

output "collection_id" {
  description = "ID of the OpenSearch Serverless collection"
  value       = aws_opensearchserverless_collection.vector_search.id
}

output "collection_arn" {
  description = "ARN of the OpenSearch Serverless collection"
  value       = aws_opensearchserverless_collection.vector_search.arn
}

output "collection_endpoint" {
  description = "Endpoint of the OpenSearch Serverless collection"
  value       = aws_opensearchserverless_collection.vector_search.collection_endpoint
}

output "collection_name" {
  description = "Name of the OpenSearch Serverless collection"
  value       = aws_opensearchserverless_collection.vector_search.name
}

output "vpc_endpoint_id" {
  description = "ID of the VPC endpoint for OpenSearch"
  value       = aws_opensearchserverless_vpc_endpoint.collection.id
}

output "security_group_id" {
  description = "Security group ID for OpenSearch VPC endpoint"
  value       = aws_security_group.opensearch_vpce.id
}

output "index_name" {
  description = "Configured index name for vector search"
  value       = var.index_name
}

# Index configuration for application use
output "index_config" {
  description = "Vector index configuration for application initialization"
  value = {
    index_name = var.index_name
    dimension  = 1536 # Bedrock Titan Text Embeddings v2
    engine     = "nmslib"
    space_type = "cosinesimil"
  }
}
