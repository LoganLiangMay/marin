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

## Environment Management

### Multi-Environment Strategy

The infrastructure supports three isolated environments using Terraform workspaces and environment-specific configuration files:

| Environment | Purpose | Sizing | Uptime | Cost/Month |
|-------------|---------|--------|--------|------------|
| **dev** | Feature development and testing | Cost-optimized | Business hours | ~$378 |
| **staging** | Pre-production validation & QA | Production-like | 24/7 | ~$617 |
| **prod** | Live customer-facing system | Production-optimized | 24/7 HA | ~$970 |

### Environment Configuration Files

Environment-specific settings are stored in `environments/` directory:

```
terraform/environments/
├── .tfvars.example    # Template for creating new environment configs
├── dev.tfvars         # Development environment configuration
├── staging.tfvars     # Staging environment configuration
└── prod.tfvars        # Production environment configuration
```

### Deploying to Different Environments

#### 1. Deploy to Development

```bash
# Initialize (first time only)
terraform init

# Select or create dev workspace
terraform workspace select dev || terraform workspace new dev

# Plan with dev configuration
terraform plan -var-file=environments/dev.tfvars

# Apply changes
terraform apply -var-file=environments/dev.tfvars
```

#### 2. Deploy to Staging

```bash
# Switch to staging workspace
terraform workspace select staging || terraform workspace new staging

# Plan with staging configuration
terraform plan -var-file=environments/staging.tfvars

# Apply changes (review carefully!)
terraform apply -var-file=environments/staging.tfvars
```

#### 3. Deploy to Production

```bash
# Switch to prod workspace
terraform workspace select prod || terraform workspace new prod

# Plan with production configuration
terraform plan -var-file=environments/prod.tfvars -out=prod.tfplan

# Review the plan carefully!
terraform show prod.tfplan

# Apply with explicit plan file
terraform apply prod.tfplan
```

### Workspace Management

#### List all workspaces
```bash
terraform workspace list
```

#### Check current workspace
```bash
terraform workspace show
```

#### Switch workspaces
```bash
terraform workspace select dev
```

#### Create new workspace
```bash
terraform workspace new staging
```

### Environment-Specific Resource Naming

All resources automatically include the environment in their names:

```
{project_name}-{environment}-{resource_type}

Examples:
- marin-dev-vpc
- marin-staging-ecs-cluster
- marin-prod-call-recordings
```

This ensures no naming conflicts between environments.

### Environment Configuration Differences

#### Development (dev)
- **MongoDB**: M0 (free tier, 512 MB)
- **Redis**: cache.t4g.micro (0.5 GB)
- **ECS**: 256 CPU / 512 MB memory
- **Instances**: Single instance (no HA)
- **Logs**: 7 days retention
- **Auto-stop**: Can be stopped overnight to save costs

#### Staging (staging)
- **MongoDB**: M10 (2 GB RAM, 10 GB storage)
- **Redis**: cache.t4g.small (1.5 GB, HA enabled)
- **ECS**: 512 CPU / 1024 MB memory
- **Instances**: 2 instances (HA)
- **Logs**: 14 days retention
- **Data**: Anonymized production data

#### Production (prod)
- **MongoDB**: M20 (4 GB RAM, 20 GB storage)
- **Redis**: cache.t4g.medium (3.1 GB, HA enabled)
- **ECS**: 1024 CPU / 2048 MB memory
- **Instances**: 3 instances (HA + load balancing)
- **Logs**: 30 days retention
- **Backups**: Continuous with 30-day retention
- **Security**: Enhanced monitoring, WAF, deletion protection

### Best Practices

1. **Always specify environment file explicitly**:
   ```bash
   terraform apply -var-file=environments/dev.tfvars
   ```

2. **Check your workspace before applying**:
   ```bash
   terraform workspace show  # Should match intended environment
   ```

3. **Use different AWS accounts for production** (optional but recommended):
   - Dev/Staging: Shared AWS account
   - Production: Separate AWS account for isolation

4. **Never modify production directly**:
   - Always test changes in dev first
   - Validate in staging before promoting to production
   - Use explicit plan files for production deployments

5. **Environment variable precedence**:
   - tfvars file settings override defaults
   - Environment variables (TF_VAR_*) override tfvars
   - Command-line `-var` flags override everything

### Secrets Management by Environment

Secrets are namespaced by environment in AWS Secrets Manager:

```
dev/audio-pipeline/mongodb-uri
dev/audio-pipeline/redis-endpoint
staging/audio-pipeline/mongodb-uri
staging/audio-pipeline/redis-endpoint
prod/audio-pipeline/mongodb-uri
prod/audio-pipeline/redis-endpoint
```

### Troubleshooting Multi-Environment Issues

#### Wrong workspace selected
```bash
# Check current workspace
terraform workspace show

# Switch to correct workspace
terraform workspace select dev
```

#### Resource name conflicts
Ensure all resources use `${var.environment}` in their names. Check module code for hard-coded names.

#### State file confusion
Each workspace has its own state file. To see where state is stored:
```bash
terraform state list
```

#### Variables not being applied
Make sure you're using the correct tfvars file:
```bash
terraform plan -var-file=environments/dev.tfvars
```

### Cost Optimization Tips

**Development Environment:**
- Stop ECS services overnight (manual process or scheduled)
- Use MongoDB M0 free tier
- Delete unused snapshots
- Set short log retention (7 days)

**Staging Environment:**
- Can be stopped on weekends if not needed
- Use smaller instance sizes than production
- Share with multiple feature branches

**Production Environment:**
- Use Reserved Instances or Savings Plans for ECS
- Enable MongoDB auto-scaling
- Set up cost alerts in AWS Billing
- Review and optimize monthly

## Support

For questions or issues, refer to the project documentation or contact the development team.
