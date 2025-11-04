# Marin - Simple Setup Guide

**What you need to get from AWS and MongoDB, and where to put it**

---

## Prerequisites

- AWS Account ([create here](https://aws.amazon.com))
- MongoDB Atlas Account ([create here](https://www.mongodb.com/cloud/atlas/register))
- AWS CLI installed (`brew install awscli` or [download](https://aws.amazon.com/cli/))
- Terraform installed (`brew install terraform` or [download](https://www.terraform.io/downloads))

---

## Part 1: Get AWS Credentials

### Step 1: Create AWS Access Keys

1. **Log into AWS Console**: https://console.aws.amazon.com
2. **Go to IAM** → Users → Click "Create user"
3. **User name**: `terraform-marin`
4. **Click "Next"**, then **Attach policies directly**
5. **Select**: `AdministratorAccess` (for now - restrict later)
6. **Click "Next"**, then **"Create user"**
7. **Click on the user** → Security credentials tab
8. **Click "Create access key"** → Choose "Command Line Interface (CLI)"
9. **Check the box**, click "Next", then "Create access key"
10. **SAVE THESE** (you won't see them again):
    - Access key ID: `AKIA...`
    - Secret access key: `wJalrXUtn...`

### Step 2: Configure AWS CLI

```bash
# In your terminal, run:
aws configure

# Enter when prompted:
AWS Access Key ID: [paste your access key ID]
AWS Secret Access Key: [paste your secret access key]
Default region name: us-east-1
Default output format: json
```

### Step 3: Get Your AWS Account ID

```bash
# Run this command and save the output:
aws sts get-caller-identity --query Account --output text

# Example output: 123456789012
# Save this as: AWS_ACCOUNT_ID
```

**✅ AWS CREDENTIALS SAVED**
- Access keys stored in `~/.aws/credentials`
- Account ID saved for later

---

## Part 2: Get MongoDB Atlas Credentials

### Step 1: Create MongoDB Atlas Account

1. **Sign up**: https://www.mongodb.com/cloud/atlas/register
2. **Create organization** (free tier is fine)
3. **Organization name**: `Marin` (or your choice)

### Step 2: Get Organization ID

1. **Click "Organization"** in top left
2. **Click "Settings"** in left sidebar
3. **Copy "Organization ID"**: `5f8a9b...` (20+ character string)
4. **Save as**: `ATLAS_ORG_ID`

### Step 3: Create API Keys

1. **Still in Organization Settings** → Click "Access Manager" tab
2. **Click "Create API Key"**
3. **Description**: `Terraform Marin`
4. **Permissions**: Select `Organization Owner` (or `Project Creator` minimum)
5. **Click "Next"**
6. **SAVE THESE** (you won't see the private key again):
   - Public Key: `abcdefgh`
   - Private Key: `12345678-abcd-...`

### Step 4: Add Your IP to Access List

1. **Still on the API Key page** → "Add Access List Entry"
2. **Enter your IP** or use `0.0.0.0/0` (allow from anywhere - less secure)
3. **Click "Done"**

**✅ MONGODB CREDENTIALS SAVED**
- Public Key
- Private Key
- Organization ID

---

## Part 3: Create Terraform Variables File

Create a file called `terraform.tfvars` in the `terraform/` directory with your credentials:

```bash
cd terraform
touch terraform.tfvars
```

**Edit `terraform/terraform.tfvars`** and add:

```hcl
# Project Configuration
project_name = "marin"
environment  = "dev"
aws_region   = "us-east-1"

# MongoDB Atlas Credentials (from Part 2)
mongodb_atlas_public_key  = "YOUR_ATLAS_PUBLIC_KEY"      # Example: "abcdefgh"
mongodb_atlas_private_key = "YOUR_ATLAS_PRIVATE_KEY"     # Example: "12345678-abcd-1234-..."
atlas_org_id              = "YOUR_ATLAS_ORG_ID"          # Example: "5f8a9b1c2d3e4f5g6h7i8j9k"

# Tags (optional)
tags = {
  Owner = "YourName"
  Team  = "Engineering"
}
```

**⚠️ IMPORTANT**: Never commit `terraform.tfvars` to git (it's already in `.gitignore`)

---

## Part 4: Deploy Infrastructure

### Step 1: Initialize Terraform

```bash
cd terraform
terraform init
```

This downloads AWS and MongoDB providers (~30 seconds).

### Step 2: Create Development Workspace

```bash
terraform workspace new dev
```

Or if it exists:
```bash
terraform workspace select dev
```

### Step 3: Review What Will Be Created

```bash
terraform plan -var-file=terraform.tfvars
```

This shows you what AWS and MongoDB resources Terraform will create.

### Step 4: Deploy Everything

```bash
terraform apply -var-file=terraform.tfvars
```

Type `yes` when prompted.

**This will create:**
- VPC with public/private subnets
- S3 buckets for audio files
- MongoDB Atlas cluster
- Redis cluster (ElastiCache)
- SQS queues
- ECR repositories for Docker images
- IAM roles and policies
- Cognito User Pool
- OpenSearch Serverless collection

**Time**: 15-20 minutes

---

## Part 5: Get Configuration Values for Backend

After Terraform finishes, get the values your API needs:

```bash
# Get all the values you need:
terraform output -json > ../backend/infrastructure.json

# Or get them one by one:
terraform output mongodb_connection_string  # MongoDB connection
terraform output redis_endpoint             # Redis endpoint
terraform output processing_queue_url       # SQS queue URL
terraform output cognito_user_pool_id       # Cognito User Pool
terraform output cognito_app_client_id      # Cognito App Client
terraform output opensearch_collection_endpoint  # OpenSearch endpoint
terraform output ecr_api_repository_url     # Docker registry for API
terraform output ecr_worker_repository_url  # Docker registry for workers
```

---

## Part 6: Configure Backend Application

Create `backend/.env` file with the Terraform outputs:

```bash
cd backend
cp .env.example .env
```

**Edit `backend/.env`** and fill in from Terraform outputs:

```bash
# MongoDB (from: terraform output mongodb_connection_string)
MONGODB_URI=mongodb+srv://marin-admin:...@marin-dev-cluster...mongodb.net

# MongoDB Atlas API (same as terraform.tfvars)
MONGODB_ATLAS_PUBLIC_KEY=your-public-key
MONGODB_ATLAS_PRIVATE_KEY=your-private-key
MONGODB_ATLAS_PROJECT_ID=  # Leave empty, will be set by Terraform

# Redis (from: terraform output redis_endpoint)
REDIS_URL=redis://marin-dev-redis.abc123.ng.0001.use1.cache.amazonaws.com:6379

# SQS (from: terraform output processing_queue_url)
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789012/marin-dev-processing

# AWS Region
AWS_REGION=us-east-1

# Cognito (from: terraform output commands)
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=  # terraform output cognito_user_pool_id
COGNITO_APP_CLIENT_ID=  # terraform output cognito_app_client_id
COGNITO_ISSUER=  # terraform output cognito_issuer
COGNITO_JWKS_URI=  # terraform output cognito_jwks_uri

# OpenSearch (from: terraform output opensearch_collection_endpoint)
OPENSEARCH_ENDPOINT=  # Example: abc123.us-east-1.aoss.amazonaws.com

# OpenAI API Key (get from: https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-...  # You need to create this yourself

# Authentication (set to False for local development)
ENABLE_AUTH=False

# Application
DEBUG=True
HOST=0.0.0.0
PORT=8000
```

**⚠️ IMPORTANT**: Never commit `backend/.env` to git (it's already in `.gitignore`)

---

## Part 7: Get OpenAI API Key (Required for Transcription & Analysis)

1. **Go to**: https://platform.openai.com/api-keys
2. **Sign in or create account**
3. **Click "Create new secret key"**
4. **Name**: `Marin Audio Pipeline`
5. **Copy the key**: `sk-...`
6. **Add to `backend/.env`**:
   ```bash
   OPENAI_API_KEY=sk-...
   ```

**Cost**:
- Whisper (transcription): $0.006 per minute
- GPT-4o (analysis): ~$0.02 per call
- Total: ~$0.03-0.05 per call

---

## Part 8: Create Cognito Admin User (Optional, for API Auth)

If you want to enable authentication (`ENABLE_AUTH=True`):

```bash
# Get User Pool ID
USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)

# Create admin user
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username admin@example.com \
  --user-attributes Name=email,Value=admin@example.com Name=email_verified,Value=true \
  --message-action SUPPRESS

# Set password
aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username admin@example.com \
  --password "YourPassword123!" \
  --permanent

# Add to admin group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username admin@example.com \
  --group-name admins
```

---

## Part 9: Run the Application Locally

```bash
# Install Python dependencies
cd backend
pip install -r requirements.txt

# Run the API
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# In another terminal, run Celery worker
celery -A celery_app worker --loglevel=info
```

**API will be available at**: http://localhost:8000
**Interactive docs**: http://localhost:8000/docs

---

## Part 10: Build and Push Docker Images (For Deployment)

```bash
# Login to ECR
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com

# Get repository URLs
API_REPO=$(terraform output -raw ecr_api_repository_url)
WORKER_REPO=$(terraform output -raw ecr_worker_repository_url)

# Build and push API image
cd backend
docker build -f Dockerfile -t marin-api:dev .
docker tag marin-api:dev $API_REPO:dev
docker push $API_REPO:dev

# Build and push Worker image
docker build -f Dockerfile.worker -t marin-worker:dev .
docker tag marin-worker:dev $WORKER_REPO:dev
docker push $WORKER_REPO:dev
```

---

## Quick Reference: All Credentials You Need

### AWS Credentials
- ✅ AWS Access Key ID (from IAM console)
- ✅ AWS Secret Access Key (from IAM console)
- ✅ AWS Account ID (from `aws sts get-caller-identity`)

### MongoDB Atlas Credentials
- ✅ Atlas Organization ID (from Atlas console → Settings)
- ✅ Atlas API Public Key (from Atlas console → Access Manager)
- ✅ Atlas API Private Key (from Atlas console → Access Manager)

### OpenAI Credentials
- ✅ OpenAI API Key (from platform.openai.com/api-keys)

### Where They Go
- **AWS credentials**: `~/.aws/credentials` (via `aws configure`)
- **MongoDB credentials**: `terraform/terraform.tfvars` (create this file)
- **All credentials for backend**: `backend/.env` (copy from `.env.example`)

---

## Cost Estimate (Development)

### AWS (per month)
- VPC: Free (within free tier)
- S3: ~$5 (depends on storage)
- Redis: ~$15 (t4g.micro)
- SQS: Free (within 1M requests)
- Cognito: Free (within 50K MAU)
- OpenSearch Serverless: ~$400/month (⚠️ most expensive)
- **Total AWS**: ~$420/month

### MongoDB Atlas
- Free tier (M0): $0
- M10 (recommended): $0.08/hour = ~$60/month

### OpenAI
- Per call: $0.03-0.05
- 1000 calls/month: ~$40

**Total Monthly Cost**: ~$520/month for development

**💡 Tip**: Use `terraform destroy` when not using to avoid charges.

---

## Troubleshooting

### "Access Denied" errors
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Reconfigure if needed
aws configure
```

### "Invalid MongoDB credentials"
```bash
# Verify in Atlas console:
# Organization → Settings → Access Manager → API Keys
```

### Terraform errors
```bash
# Re-initialize
terraform init -upgrade

# Validate configuration
terraform validate
```

### Can't connect to MongoDB
```bash
# Check IP allowlist in Atlas console:
# Network Access → Add your current IP
```

---

## Files to Never Commit to Git

These files contain secrets and are already in `.gitignore`:

- ❌ `terraform/terraform.tfvars` (has MongoDB keys)
- ❌ `backend/.env` (has all API keys and credentials)
- ❌ `~/.aws/credentials` (has AWS keys)

**Safe to commit**:
- ✅ `terraform/.env.example` (template without values)
- ✅ `terraform/environments/dev.tfvars.example` (template)
- ✅ All `.tf` files (infrastructure code)

---

## Next Steps After Setup

1. **Test API health**: http://localhost:8000/health
2. **Upload a test audio file**: Use `/api/v1/calls/upload`
3. **Check processing**: Monitor logs for transcription and analysis
4. **View results**: Use `/api/v1/calls/{call_id}` to see analysis
5. **Try analytics**: Use `/api/v1/analytics/summary`

---

## Quick Commands Reference

```bash
# AWS
aws configure                    # Setup AWS credentials
aws sts get-caller-identity      # Verify AWS access
aws ecr get-login-password       # Login to ECR for Docker

# Terraform
terraform init                   # Initialize
terraform workspace select dev   # Select environment
terraform plan -var-file=terraform.tfvars   # Preview changes
terraform apply -var-file=terraform.tfvars  # Deploy
terraform output                 # Show all outputs
terraform destroy                # Delete everything (saves money)

# Backend
cd backend
uvicorn main:app --reload       # Run API
celery -A celery_app worker -l info  # Run worker

# Docker
docker build -t image-name .    # Build image
docker push repo-url:tag        # Push to ECR
```

---

## Support

- **AWS Issues**: Check AWS Console → CloudWatch Logs
- **MongoDB Issues**: Check Atlas Console → Metrics
- **Application Issues**: Check `backend/logs/` directory
- **Terraform Issues**: Run `terraform validate` and check error messages

---

**Last Updated**: 2025-11-04
**Marin Audio Pipeline** | Simple Setup Guide
