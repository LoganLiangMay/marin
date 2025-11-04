# Marin Audio Call Data Ingestion Pipeline - Deployment Guide

**Last Updated:** 2025-11-04
**Version:** 1.0
**Target Infrastructure:** AWS + MongoDB Atlas

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Deployment Phases](#deployment-phases)
4. [Quick Start (Development Environment)](#quick-start-development-environment)
5. [Production Deployment](#production-deployment)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Rollback Procedures](#rollback-procedures)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This guide walks you through deploying the complete Marin audio call data ingestion pipeline infrastructure. The deployment creates a multi-environment, production-ready system for processing audio calls with AI-powered transcription and analysis.

### What Gets Deployed

**Infrastructure (Epic 1):**
- VPC with public/private subnets across 2 availability zones
- S3 buckets for audio recordings and transcripts
- MongoDB Atlas cluster for metadata storage
- ElastiCache Redis for caching and Celery result backend
- SQS queues for async processing
- IAM roles and policies with least-privilege access
- ECR repositories for Docker images
- GitHub Actions CI/CD pipelines

**Application (Epics 2-3):**
- FastAPI application for audio upload and retrieval
- Celery workers for transcription (OpenAI Whisper)
- Celery workers for AI analysis (AWS Bedrock/Claude)
- Entity resolution and contact deduplication
- Daily insights aggregation
- Quality monitoring and alerting

**Semantic Search (Epic 4 - Partial):**
- AWS OpenSearch Serverless collection for vector search

**Authentication (Epic 5 - Partial):**
- AWS Cognito user pools for API authentication

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud (us-east-1)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐         ┌──────────────┐                      │
│  │   Cognito    │────────▶│   FastAPI    │                      │
│  │  User Pool   │         │  (ECS Task)  │                      │
│  └──────────────┘         └───────┬──────┘                      │
│                                    │                              │
│                                    ▼                              │
│  ┌──────────────┐         ┌──────────────┐                      │
│  │  S3 Buckets  │◀───────▶│     SQS      │                      │
│  │  - Recordings│         │    Queue     │                      │
│  │  - Transcripts│        └───────┬──────┘                      │
│  └──────────────┘                 │                              │
│                                    ▼                              │
│  ┌──────────────┐         ┌──────────────┐                      │
│  │  Redis       │◀───────▶│Celery Workers│                      │
│  │  (ElastiCache)│        │  (ECS Tasks) │                      │
│  └──────────────┘         └───────┬──────┘                      │
│                                    │                              │
│  ┌──────────────┐                 │                              │
│  │  OpenSearch  │◀────────────────┘                              │
│  │  Serverless  │                                                 │
│  └──────────────┘                                                 │
│                                                                   │
└───────────────────────────────────┬───────────────────────────────┘
                                    │
                                    ▼
                          ┌──────────────────┐
                          │  MongoDB Atlas   │
                          │  (M2/M10/M20)    │
                          └──────────────────┘
```

### Cost Estimates

| Environment | Monthly Cost | Breakdown |
|-------------|-------------|-----------|
| **Development** | ~$378 | M0 MongoDB (free), t4g.micro Redis ($12), minimal ECS usage |
| **Staging** | ~$617 | M10 MongoDB ($57), t4g.small Redis ($47), moderate ECS usage |
| **Production** | ~$970 | M20 MongoDB ($150), t4g.medium Redis ($95), full HA configuration |

*Note: Costs are estimates. Actual costs depend on usage patterns, data transfer, and API calls.*

---

## Prerequisites

### Required Accounts

1. **AWS Account** with administrative access
   - Ability to create IAM roles, EC2 instances, S3 buckets, etc.
   - Credit card on file for billing
   - Recommended: Use AWS Organizations for multi-environment setup

2. **MongoDB Atlas Account**
   - Free tier available (sufficient for development)
   - Organization and Project Creator permissions
   - API keys with appropriate scopes

3. **GitHub Account** (for CI/CD)
   - Repository access to `LoganLiangMay/marin`
   - Ability to configure GitHub Secrets
   - GitHub Actions enabled

### Required Software

Install the following on your local machine:

1. **Terraform** >= 1.5.0
   ```bash
   # macOS
   brew tap hashicorp/tap
   brew install hashicorp/tap/terraform

   # Linux
   wget https://releases.hashicorp.com/terraform/1.5.0/terraform_1.5.0_linux_amd64.zip
   unzip terraform_1.5.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/

   # Verify
   terraform --version
   ```

2. **AWS CLI** >= 2.0
   ```bash
   # macOS
   brew install awscli

   # Linux
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install

   # Verify
   aws --version
   ```

3. **Git**
   ```bash
   # macOS
   brew install git

   # Linux
   sudo apt-get install git  # Debian/Ubuntu
   sudo yum install git       # RHEL/CentOS

   # Verify
   git --version
   ```

4. **Docker** (for building container images)
   ```bash
   # macOS
   brew install --cask docker

   # Linux
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh

   # Verify
   docker --version
   ```

5. **Python** 3.11+ (for backend application)
   ```bash
   # macOS
   brew install python@3.11

   # Linux
   sudo apt-get install python3.11  # Debian/Ubuntu

   # Verify
   python3 --version
   ```

### Required Knowledge

- Basic understanding of Terraform and Infrastructure as Code
- Familiarity with AWS services (VPC, EC2, S3, IAM)
- Understanding of Docker and containerization
- Basic Linux/bash command line skills
- (Optional) Understanding of FastAPI and Celery

---

## Deployment Phases

The deployment is organized into sequential phases to minimize errors and allow for incremental validation.

### Phase 1: AWS Account Setup (30 minutes)
- Configure AWS credentials
- Create IAM user for Terraform
- Set up billing alerts
- Create S3 bucket for Terraform state
- Create DynamoDB table for state locking

### Phase 2: MongoDB Atlas Setup (20 minutes)
- Create MongoDB Atlas organization and project
- Generate API keys
- Configure IP access list
- Set environment variables

### Phase 3: Terraform Backend Configuration (10 minutes)
- Enable S3 backend in backend.tf
- Initialize Terraform with remote state
- Verify backend configuration

### Phase 4: Development Environment Deployment (45 minutes)
- Create terraform workspace for dev
- Plan infrastructure changes
- Apply infrastructure (VPC, S3, MongoDB, Redis, SQS, IAM)
- Verify resource creation
- Test connectivity

### Phase 5: Application Deployment (60 minutes)
- Build Docker images
- Push to ECR
- Configure GitHub Actions secrets
- Deploy FastAPI and Celery workers to ECS
- Verify application health

### Phase 6: Staging Environment Deployment (Optional, 60 minutes)
- Repeat Phase 4-5 for staging workspace
- Configure staging-specific settings
- Deploy and test

### Phase 7: Production Environment Deployment (90 minutes)
- Repeat Phase 4-5 for prod workspace
- Enable additional security features
- Configure monitoring and alerting
- Deploy with approval gates
- Comprehensive verification

**Total Time Estimate:**
- Development only: ~2.5 hours
- Development + Staging + Production: ~6 hours

---

## Quick Start (Development Environment)

This quick start guide will get you a working development environment in ~2 hours.

### Step 1: Clone Repository

```bash
git clone https://github.com/LoganLiangMay/marin.git
cd marin
```

### Step 2: AWS Account Setup

#### 2.1 Create IAM User for Terraform

```bash
# Create IAM user
aws iam create-user --user-name terraform-marin

# Attach AdministratorAccess policy (for development - use restricted policies for production)
aws iam attach-user-policy \
  --user-name terraform-marin \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# Create access key
aws iam create-access-key --user-name terraform-marin
```

**Save the output:** You'll receive AccessKeyId and SecretAccessKey. Save these securely.

#### 2.2 Configure AWS CLI

```bash
aws configure

# Enter when prompted:
# AWS Access Key ID: <AccessKeyId from step 2.1>
# AWS Secret Access Key: <SecretAccessKey from step 2.1>
# Default region name: us-east-1
# Default output format: json

# Verify configuration
aws sts get-caller-identity
```

**Expected output:**
```json
{
    "UserId": "AIDACKCEVSQ6C2EXAMPLE",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/terraform-marin"
}
```

#### 2.3 Create S3 Backend

```bash
# Create S3 bucket for Terraform state
aws s3api create-bucket \
  --bucket marin-terraform-state \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket marin-terraform-state \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket marin-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Block public access
aws s3api put-public-access-block \
  --bucket marin-terraform-state \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

#### 2.4 Enable Terraform Backend

Edit `terraform/backend.tf` and uncomment the backend configuration:

```hcl
terraform {
  backend "s3" {
    bucket         = "marin-terraform-state"
    key            = "marin/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}
```

### Step 3: MongoDB Atlas Setup

#### 3.1 Create Account and Organization

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up (free tier available)
3. Create an organization (e.g., "Marin Audio Pipeline")
4. Note your **Organization ID** (found in Organization Settings)

#### 3.2 Generate API Keys

1. Navigate to: Organization Settings → Access Manager → API Keys
2. Click "Create API Key"
3. Name: "Terraform Marin"
4. Organization Permissions: "Organization Project Creator"
5. Click "Next"
6. **Save the Public Key and Private Key** (you won't see the private key again!)
7. Add your IP address to the API Access List (or use 0.0.0.0/0 for development)
8. Click "Done"

#### 3.3 Set Environment Variables

```bash
# Add to ~/.bashrc or ~/.zshrc (or set temporarily for current session)
export TF_VAR_mongodb_atlas_public_key="your-public-key-here"
export TF_VAR_mongodb_atlas_private_key="your-private-key-here"
export TF_VAR_atlas_org_id="your-org-id-here"

# Reload shell configuration
source ~/.bashrc  # or source ~/.zshrc
```

**Alternative: Create terraform.tfvars**

```bash
cat > terraform/terraform.tfvars << 'EOF'
# MongoDB Atlas Configuration
mongodb_atlas_public_key  = "your-public-key-here"
mongodb_atlas_private_key = "your-private-key-here"
atlas_org_id              = "your-org-id-here"
EOF

# IMPORTANT: Never commit terraform.tfvars to version control!
# It's already in .gitignore, but verify:
grep terraform.tfvars .gitignore
```

### Step 4: Deploy Development Infrastructure

#### 4.1 Initialize Terraform

```bash
cd terraform

# Initialize Terraform (downloads providers, configures backend)
terraform init

# Create dev workspace
terraform workspace new dev

# Format code
terraform fmt -recursive

# Validate configuration
terraform validate
```

**Expected output for validate:**
```
Success! The configuration is valid.
```

#### 4.2 Plan Infrastructure

```bash
# Plan with dev configuration
terraform plan -var-file=environments/dev.tfvars -out=dev.tfplan

# Review the plan
terraform show dev.tfplan
```

**You should see resources to be created:**
- VPC and networking resources (~15 resources)
- S3 buckets (2)
- MongoDB Atlas project and cluster
- ElastiCache Redis cluster
- SQS queues (2 - main + DLQ)
- IAM roles and policies (3 roles)
- ECR repositories (2)
- Security groups, subnets, route tables, etc.

**Total resources:** ~50-60 resources

#### 4.3 Apply Infrastructure

```bash
# Apply the plan (creates real resources)
terraform apply dev.tfplan

# This will take approximately 15-20 minutes
# MongoDB Atlas cluster creation takes the longest (~10 minutes)
```

**Watch for:**
- ✅ Green "Creation complete" messages
- ⚠️ Any warnings (usually safe to ignore)
- ❌ Red errors (stop and troubleshoot)

#### 4.4 Verify Infrastructure

```bash
# Check Terraform outputs
terraform output

# Verify AWS resources
aws ec2 describe-vpcs --filters "Name=tag:Project,Values=marin"
aws s3 ls | grep marin-dev
aws iam list-roles | grep marin-dev
aws elasticache describe-cache-clusters --cache-cluster-id marin-dev-redis
aws sqs list-queues | grep marin-dev

# Check MongoDB Atlas (requires mongosh or MongoDB Compass)
# Connection string is in AWS Secrets Manager:
aws secretsmanager get-secret-value --secret-id dev/audio-pipeline/mongodb-uri
```

### Step 5: Deploy Application

#### 5.1 Build Docker Images

```bash
cd ../backend

# Build API image
docker build -f Dockerfile -t marin-api:dev .

# Build Worker image
docker build -f Dockerfile.worker -t marin-worker:dev .
```

#### 5.2 Push to ECR

```bash
# Get ECR repository URIs from Terraform outputs
cd ../terraform
export API_REPO=$(terraform output -raw ecr_api_repository_url)
export WORKER_REPO=$(terraform output -raw ecr_worker_repository_url)

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $API_REPO

# Tag images
docker tag marin-api:dev $API_REPO:dev
docker tag marin-worker:dev $WORKER_REPO:dev

# Push images
docker push $API_REPO:dev
docker push $WORKER_REPO:dev
```

#### 5.3 Configure GitHub Actions Secrets

If deploying via GitHub Actions:

1. Go to GitHub repository: Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add the following secrets:

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key | From Step 2.1 |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key | From Step 2.1 |
| `AWS_REGION` | `us-east-1` | Fixed value |
| `MONGODB_ATLAS_PUBLIC_KEY` | MongoDB Atlas public key | From Step 3.2 |
| `MONGODB_ATLAS_PRIVATE_KEY` | MongoDB Atlas private key | From Step 3.2 |
| `ATLAS_ORG_ID` | MongoDB Atlas org ID | From Step 3.1 |

#### 5.4 Deploy via GitHub Actions (Recommended)

```bash
# Commit and push any local changes
git add .
git commit -m "chore: Deploy development environment"
git push origin main

# GitHub Actions will automatically:
# 1. Run linting and tests
# 2. Build Docker images
# 3. Push to ECR
# 4. Deploy to ECS (if configured)
```

**OR Deploy Manually (Alternative):**

See detailed ECS deployment instructions in `GITHUB-ACTIONS-SETUP.md`.

### Step 6: Verify Deployment

#### 6.1 Check ECS Services

```bash
# List ECS clusters
aws ecs list-clusters

# Describe API service
aws ecs describe-services \
  --cluster marin-dev-cluster \
  --services marin-dev-api

# Check task status
aws ecs list-tasks --cluster marin-dev-cluster
```

#### 6.2 Test API

```bash
# Get API endpoint (from ALB or ECS task)
export API_URL=$(terraform output -raw api_endpoint)

# Health check
curl $API_URL/health

# Expected response:
# {"status": "healthy", "version": "1.0.0"}
```

#### 6.3 Test Audio Upload

```bash
# Upload test audio file
curl -X POST $API_URL/api/v1/calls/upload \
  -F "file=@test-audio.mp3" \
  -F "metadata={\"company_name\":\"Test Corp\"}"

# Check call status
curl $API_URL/api/v1/calls/{call_id}/status
```

#### 6.4 Monitor Worker Tasks

```bash
# Check Celery worker logs
aws logs tail /ecs/marin-dev-worker --follow

# Check SQS queue depth
aws sqs get-queue-attributes \
  --queue-url $(terraform output -raw processing_queue_url) \
  --attribute-names ApproximateNumberOfMessages
```

---

## Production Deployment

Production deployment requires additional security, monitoring, and approval processes.

### Production Checklist

Before deploying to production, complete the following:

- [ ] Security review of IAM policies
- [ ] Enable MFA on AWS root account
- [ ] Configure CloudWatch alarms for all critical resources
- [ ] Set up CloudTrail for audit logging
- [ ] Enable AWS Config for compliance monitoring
- [ ] Configure VPC Flow Logs
- [ ] Set up automated backups for MongoDB and Redis
- [ ] Configure disaster recovery procedures
- [ ] Set up monitoring dashboards (CloudWatch, Grafana)
- [ ] Configure alerting (PagerDuty, Slack, email)
- [ ] Load testing completed
- [ ] Security scanning (SAST, DAST) completed
- [ ] Penetration testing completed
- [ ] Data retention policies configured
- [ ] GDPR/compliance requirements reviewed
- [ ] Incident response plan documented
- [ ] Runbook for common operations created

### Production Deployment Steps

```bash
# Switch to prod workspace
cd terraform
terraform workspace select prod || terraform workspace new prod

# Plan with production configuration
terraform plan -var-file=environments/prod.tfvars -out=prod.tfplan

# IMPORTANT: Review plan carefully!
# - Check resource names include "prod"
# - Verify instance sizes (should be larger than dev)
# - Check Multi-AZ configuration enabled
# - Verify deletion protection enabled

# Apply with explicit approval
terraform apply prod.tfplan

# Deployment time: ~30-40 minutes (includes HA setup)
```

### Production-Specific Configuration

Production environment includes:

1. **Enhanced Security:**
   - WAF (Web Application Firewall)
   - Deletion protection on critical resources
   - Encrypted backups
   - Private subnets only (no public IPs)
   - Secrets rotation enabled

2. **High Availability:**
   - Multi-AZ deployment
   - Auto-scaling enabled
   - 3 ECS tasks minimum
   - MongoDB 3-node replica set
   - Redis with automatic failover

3. **Monitoring:**
   - Detailed CloudWatch metrics
   - Custom application metrics
   - Log aggregation
   - Performance monitoring
   - Cost alerts

4. **Backup and Recovery:**
   - Continuous backups (MongoDB)
   - Point-in-time recovery
   - Cross-region replication
   - 30-day retention

---

## Post-Deployment Verification

After deployment, verify all components are working:

### Infrastructure Verification

```bash
# Run verification script
./scripts/verify-deployment.sh dev

# Or manually verify each component:

# 1. VPC
aws ec2 describe-vpcs --filters "Name=tag:Project,Values=marin"

# 2. S3 Buckets
aws s3 ls | grep marin-dev

# 3. MongoDB (check Secrets Manager)
aws secretsmanager get-secret-value --secret-id dev/audio-pipeline/mongodb-uri

# 4. Redis
aws elasticache describe-cache-clusters

# 5. SQS Queues
aws sqs list-queues

# 6. IAM Roles
aws iam list-roles | grep marin-dev

# 7. ECR Repositories
aws ecr describe-repositories
```

### Application Verification

```bash
# 1. API Health
curl $API_URL/health

# 2. Upload Test Audio
curl -X POST $API_URL/api/v1/calls/upload -F "file=@test.mp3"

# 3. Check Transcription Worker
aws logs tail /ecs/marin-dev-worker --follow

# 4. Verify MongoDB Data
mongosh "mongodb+srv://cluster.mongodb.net/audio_pipeline" --eval "db.calls.count()"

# 5. Check Redis Cache
redis-cli -h $REDIS_ENDPOINT ping
```

### Performance Testing

```bash
# Load test API (using hey or ab)
hey -n 1000 -c 10 $API_URL/health

# Monitor resources during load
watch -n 5 'aws ecs list-tasks --cluster marin-dev-cluster'
```

---

## Rollback Procedures

If deployment fails or issues are discovered:

### Rollback Infrastructure

```bash
# Destroy specific resources
terraform destroy -target=module.ecs
terraform destroy -target=module.database

# Or destroy entire environment
terraform destroy -var-file=environments/dev.tfvars

# Confirm with 'yes' when prompted
```

### Rollback Application

```bash
# Revert to previous Docker image tag
aws ecs update-service \
  --cluster marin-dev-cluster \
  --service marin-dev-api \
  --task-definition marin-dev-api:previous

# Force new deployment
aws ecs update-service \
  --cluster marin-dev-cluster \
  --service marin-dev-api \
  --force-new-deployment
```

### Restore from Backup

```bash
# Restore MongoDB from snapshot
# (Instructions depend on MongoDB Atlas backup method)

# Restore S3 data from versioned bucket
aws s3 cp s3://marin-dev-call-recordings --recursive \
  --source-version-id <version-id> \
  s3://marin-dev-call-recordings-restored
```

---

## Troubleshooting

### Common Issues

#### Issue: Terraform state locked

**Symptom:**
```
Error: Error locking state: Error acquiring the state lock
```

**Solution:**
```bash
# Get lock ID from error message, then:
terraform force-unlock <LOCK_ID>

# If force-unlock fails, manually delete from DynamoDB:
aws dynamodb delete-item \
  --table-name terraform-state-lock \
  --key '{"LockID":{"S":"marin-terraform-state/marin/terraform.tfstate"}}'
```

#### Issue: AWS credentials not found

**Symptom:**
```
Error: No valid credential sources found for AWS Provider
```

**Solution:**
```bash
# Verify AWS CLI configuration
aws configure list
aws sts get-caller-identity

# Re-configure if needed
aws configure

# Or set environment variables
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_DEFAULT_REGION="us-east-1"
```

#### Issue: MongoDB Atlas API key invalid

**Symptom:**
```
Error: error creating MongoDB Atlas Project: 401 (Unauthorized)
```

**Solution:**
```bash
# Verify environment variables are set
echo $TF_VAR_mongodb_atlas_public_key
echo $TF_VAR_mongodb_atlas_private_key
echo $TF_VAR_atlas_org_id

# Test API keys manually
curl -u "$TF_VAR_mongodb_atlas_public_key:$TF_VAR_mongodb_atlas_private_key" \
  https://cloud.mongodb.com/api/atlas/v1.0/orgs/$TF_VAR_atlas_org_id

# Regenerate keys if needed (MongoDB Atlas console)
```

#### Issue: ECS tasks failing to start

**Symptom:**
```
ECS service unable to place tasks
```

**Solutions:**
1. **Check IAM roles:**
   ```bash
   aws iam get-role --role-name marin-dev-ecs-task-execution
   ```

2. **Check security groups:**
   ```bash
   aws ec2 describe-security-groups --filters "Name=tag:Project,Values=marin"
   ```

3. **Check task definition:**
   ```bash
   aws ecs describe-task-definition --task-definition marin-dev-api
   ```

4. **Check CloudWatch logs:**
   ```bash
   aws logs tail /ecs/marin-dev-api --follow
   ```

#### Issue: Docker image push fails

**Symptom:**
```
denied: Your authorization token has expired
```

**Solution:**
```bash
# Re-authenticate with ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Try push again
docker push $API_REPO:dev
```

#### Issue: High costs

**Solutions:**
1. **Check unexpected resources:**
   ```bash
   aws ce get-cost-and-usage \
     --time-period Start=2025-11-01,End=2025-11-04 \
     --granularity DAILY \
     --metrics BlendedCost \
     --group-by Type=DIMENSION,Key=SERVICE
   ```

2. **Shut down dev environment when not in use:**
   ```bash
   # Stop ECS services
   aws ecs update-service --cluster marin-dev-cluster --service marin-dev-api --desired-count 0
   aws ecs update-service --cluster marin-dev-cluster --service marin-dev-worker --desired-count 0

   # Or destroy entire environment
   terraform destroy -var-file=environments/dev.tfvars
   ```

3. **Use auto-stop for dev:**
   - Configure Lambda to stop ECS tasks after business hours
   - Use MongoDB Atlas auto-pause (M0 free tier)

---

## Next Steps

After successful deployment:

1. **Configure Monitoring:**
   - Set up CloudWatch dashboards
   - Configure alerts for critical metrics
   - Enable X-Ray tracing

2. **Enable CI/CD:**
   - Configure GitHub Actions workflows
   - Set up automated testing
   - Implement deployment pipelines

3. **Security Hardening:**
   - Enable AWS GuardDuty
   - Configure AWS Security Hub
   - Implement WAF rules
   - Enable CloudTrail

4. **Documentation:**
   - Document custom configurations
   - Create runbooks for common operations
   - Document incident response procedures

5. **Training:**
   - Train team on infrastructure components
   - Review monitoring and alerting
   - Practice rollback procedures

---

## Support and Resources

### Documentation
- [Terraform README](../terraform/README.md)
- [Manual Setup Guide](./MANUAL-SETUP-REQUIRED.md)
- [GitHub Actions Setup](./GITHUB-ACTIONS-SETUP.md)
- [MongoDB Atlas Setup](./MONGODB-ATLAS-SETUP.md) (to be created)
- [AWS Setup Guide](./AWS-SETUP-GUIDE.md) (to be created)

### External Resources
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [MongoDB Atlas Provider](https://registry.terraform.io/providers/mongodb/mongodbatlas/latest/docs)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Celery Documentation](https://docs.celeryq.dev/)

### Getting Help
- **Issues:** Create GitHub issue in repository
- **Questions:** Contact development team
- **Emergencies:** Follow incident response procedures

---

**Document Version:** 1.0
**Last Updated:** 2025-11-04
**Maintained By:** Marin Development Team
