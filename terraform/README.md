# Audio Call Data Ingestion Pipeline - Infrastructure as Code

This directory contains Terraform configurations for deploying the Audio Call Data Ingestion Pipeline infrastructure on AWS.

## Overview

The infrastructure is organized into modular components following the single responsibility principle:

```
terraform/
├── main.tf                 # Root configuration with provider and module declarations
├── variables.tf            # Global variable definitions
├── outputs.tf              # Infrastructure outputs
├── backend.tf              # Remote state configuration (S3 + DynamoDB)
├── terraform.tfvars.example  # Variable template
├── .gitignore              # Git exclusions
├── README.md               # This file
└── modules/
    ├── networking/         # VPC, subnets, security groups, routing
    ├── storage/            # S3 buckets for audio files and transcripts
    ├── database/           # MongoDB Atlas cluster configuration
    ├── ecs/                # ECS clusters, task definitions, services
    ├── monitoring/         # CloudWatch logs, metrics, alarms
    ├── iam/                # IAM roles, policies, service-to-service access
    └── queue/              # SQS queues for async processing
```

## Prerequisites

### Required Software

- **Terraform**: Version 1.5 or higher ([Download](https://www.terraform.io/downloads))
- **AWS CLI**: Configured with appropriate credentials ([Setup Guide](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html))
- **Git**: For version control

### AWS Account Setup

1. **AWS Account**: Active AWS account with appropriate permissions
2. **AWS Credentials**: Configure AWS CLI with access keys:
   ```bash
   aws configure
   ```

### Backend State Setup (First-Time Only)

Before running `terraform init`, you must create the S3 bucket and DynamoDB table for remote state:

```bash
# Create S3 bucket for state storage
aws s3 mb s3://marin-terraform-state --region us-east-1

# Enable versioning on the bucket
aws s3api put-bucket-versioning \
  --bucket marin-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### MongoDB Atlas Setup

1. Create a MongoDB Atlas organization and project
2. Generate API keys from Organization Settings > API Keys
3. Save public and private keys for use in terraform.tfvars

## Configuration

1. **Copy the variable template**:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. **Edit terraform.tfvars** with your values:
   - Set `environment` (dev, staging, production)
   - Add MongoDB Atlas API keys
   - Adjust any other variables as needed

3. **Review backend.tf** and ensure S3 bucket and DynamoDB table exist

## Usage

### Initialize Terraform

```bash
terraform init
```

This command:
- Downloads required provider plugins (AWS, MongoDB Atlas)
- Configures the S3 backend for remote state
- Prepares the working directory for other commands

### Validate Configuration

```bash
terraform validate
```

Checks configuration syntax and structure.

### Format Code

```bash
terraform fmt
```

Formats all .tf files to canonical style.

### Plan Infrastructure Changes

```bash
terraform plan
```

Shows what changes Terraform will make without actually applying them.

### Apply Infrastructure Changes

```bash
terraform apply
```

Creates or updates infrastructure according to the configuration. Review the plan and type `yes` to confirm.

### Destroy Infrastructure

```bash
terraform destroy
```

**Warning**: This will delete all managed infrastructure. Use with caution.

## Module Development

Each module will be populated in subsequent development stories:

- **Story 1.2**: Networking module (VPC, subnets, security groups)
- **Story 1.3**: Storage module (S3 buckets)
- **Story 1.4**: Database module (MongoDB Atlas)
- **Story 1.5**: Additional components
- **Story 1.6**: IAM module (roles and policies)
- **Story 1.7-1.8**: Remaining modules and configurations

## Architecture

This infrastructure supports the following architecture:

- **Region**: us-east-1 (all resources)
- **Compute**: AWS ECS Fargate for serverless containers
- **Storage**: S3 for audio files and transcripts
- **Database**: MongoDB Atlas for metadata storage
- **Queue**: AWS SQS for async processing
- **Search**: AWS OpenSearch Serverless for vector search
- **Cache**: AWS ElastiCache Redis for caching
- **Monitoring**: AWS CloudWatch for logs and metrics

## Security

- All sensitive variables are marked as `sensitive = true`
- Never commit `terraform.tfvars` to version control
- State files are encrypted at rest in S3
- DynamoDB locking prevents concurrent modifications
- Follow principle of least privilege for IAM roles

## Troubleshooting

### Backend initialization fails

Ensure the S3 bucket and DynamoDB table exist and you have permissions to access them.

### Provider download fails

Check your internet connection and Terraform version. You may need to update Terraform.

### Variables not found

Ensure you've created `terraform.tfvars` from the example template and filled in all required values.

## Additional Resources

- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [MongoDB Atlas Provider Documentation](https://registry.terraform.io/providers/mongodb/mongodbatlas/latest/docs)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

## Support

For questions or issues, refer to the project documentation or contact the development team.
