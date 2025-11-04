# GitHub Actions CI/CD Setup Guide

## Overview
This document provides step-by-step instructions for setting up GitHub Actions workflows for the Marin project, including backend CI/CD and Terraform automation.

---

## 1. Required GitHub Secrets

Navigate to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### 1.1 AWS Credentials
Required for: ECR push, ECS deployment, Terraform apply

| Secret Name | Description | How to obtain |
|------------|-------------|---------------|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key | Create IAM user with programmatic access in AWS Console |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key | Provided when creating IAM user |
| `AWS_ACCOUNT_ID` | 12-digit AWS account ID | Found in AWS Console → top-right menu → Account |
| `ENVIRONMENT` | Environment name (dev, staging, prod) | Set to `dev` for development |

**AWS IAM User Permissions Required:**
- `AmazonEC2ContainerRegistryPowerUser` (for ECR push)
- `AmazonECS_FullAccess` (for ECS deployments)
- `IAMReadOnlyAccess` (for Terraform)
- Custom policy for Terraform (see section 4)

### 1.2 MongoDB Atlas Credentials
Required for: Terraform apply (database module)

| Secret Name | Description | How to obtain |
|------------|-------------|---------------|
| `MONGODB_ATLAS_PUBLIC_KEY` | MongoDB Atlas API public key | MongoDB Atlas Console → Organization Settings → API Keys |
| `MONGODB_ATLAS_PRIVATE_KEY` | MongoDB Atlas API private key | Generated when creating API key |
| `MONGODB_ATLAS_ORG_ID` | MongoDB organization ID | MongoDB Atlas Console → Organization Settings |

### 1.3 Optional Secrets

| Secret Name | Description | When needed |
|------------|-------------|-------------|
| `CODECOV_TOKEN` | Codecov upload token | If using Codecov for coverage reports |

---

## 2. ECR Repositories Setup

### 2.1 Create ECR Repositories via Terraform

The ECR module is already configured in `terraform/modules/ecr/`. Apply Terraform to create repositories:

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

This creates two repositories:
- `marin-dev-api` (for FastAPI application)
- `marin-dev-worker` (for Celery workers)

### 2.2 Verify ECR Repositories

```bash
# List ECR repositories
aws ecr describe-repositories --region us-east-1

# Expected output includes:
# - marin-dev-api
# - marin-dev-worker
```

---

## 3. GitHub Workflows Overview

### 3.1 Backend CI/CD Workflow
**File:** `.github/workflows/backend-ci-cd.yml`

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Only when files in `backend/` directory change

**Jobs:**
1. **lint-and-test**: Run code quality checks
   - Black (code formatting)
   - isort (import sorting)
   - Flake8 (linting)
   - pytest (unit tests with coverage)

2. **build-and-push**: Build and push Docker images
   - Build API image → Push to ECR
   - Build Worker image → Push to ECR
   - Tag with git SHA and `latest`

3. **deploy-to-ecs**: Deploy to ECS (main branch only)
   - Update ECS services with new images
   - Wait for service stability
   - Run smoke tests

### 3.2 Terraform CI/CD Workflow
**File:** `.github/workflows/terraform-ci-cd.yml`

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Only when files in `terraform/` directory change

**Jobs:**
1. **terraform-validate**: Validate Terraform
   - Format check (`terraform fmt`)
   - Initialize (`terraform init`)
   - Validate syntax (`terraform validate`)
   - Post validation results as PR comment

2. **terraform-plan**: Plan changes (PR only)
   - Generate execution plan
   - Post plan output as PR comment

3. **terraform-apply**: Apply changes (main branch only)
   - Apply infrastructure changes
   - Upload Terraform outputs as artifacts

---

## 4. AWS IAM Policy for GitHub Actions

Create a custom IAM policy for GitHub Actions with the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECRAccess",
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:DescribeRepositories",
        "ecr:ListImages",
        "ecr:DescribeImages"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ECSAccess",
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices",
        "ecs:DescribeTasks",
        "ecs:ListTasks",
        "ecs:DescribeTaskDefinition",
        "ecs:RegisterTaskDefinition",
        "ecs:DeregisterTaskDefinition",
        "elbv2:DescribeTargetGroups",
        "elbv2:DescribeLoadBalancers",
        "elasticloadbalancing:DescribeTargetGroups",
        "elasticloadbalancing:DescribeLoadBalancers"
      ],
      "Resource": "*"
    },
    {
      "Sid": "TerraformStateAccess",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::marin-terraform-state",
        "arn:aws:s3:::marin-terraform-state/*"
      ]
    },
    {
      "Sid": "DynamoDBStatelock",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:DeleteItem",
        "dynamodb:DescribeTable"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:*:table/terraform-state-lock"
    },
    {
      "Sid": "TerraformResourceManagement",
      "Effect": "Allow",
      "Action": [
        "iam:*",
        "ec2:*",
        "ecs:*",
        "ecr:*",
        "s3:*",
        "sqs:*",
        "elasticache:*",
        "logs:*",
        "cloudwatch:*",
        "secretsmanager:*",
        "elasticloadbalancing:*"
      ],
      "Resource": "*"
    }
  ]
}
```

**Note:** This policy is permissive for development. For production, restrict resources to specific ARNs.

---

## 5. Setting Up Dockerfiles

### 5.1 Create API Dockerfile
**File:** `backend/Dockerfile.api`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run FastAPI with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 5.2 Create Worker Dockerfile
**File:** `backend/Dockerfile.worker`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Run Celery worker
CMD ["celery", "-A", "celery_app", "worker", "--loglevel=info"]
```

### 5.3 Create requirements-dev.txt
**File:** `backend/requirements-dev.txt`

```txt
black==23.12.0
flake8==7.0.0
isort==5.13.0
pytest==7.4.3
pytest-cov==4.1.0
pytest-asyncio==0.21.1
```

---

## 6. Workflow Execution Order

### On Pull Request:
1. **Backend lint-and-test** runs (if backend files changed)
2. **Terraform validate** runs (if terraform files changed)
3. **Terraform plan** generates execution plan (if terraform files changed)
4. Results posted as PR comments

### On Merge to Main:
1. **Backend lint-and-test** runs
2. **Backend build-and-push** builds Docker images and pushes to ECR
3. **Backend deploy-to-ecs** updates ECS services (requires manual approval for production)
4. **Terraform validate** runs
5. **Terraform apply** applies infrastructure changes (requires manual approval)

---

## 7. Testing the Workflows

### 7.1 Test Backend Workflow

```bash
# Make a change to backend code
cd backend
echo "# Test change" >> main.py

# Commit and push
git add .
git commit -m "test: trigger backend workflow"
git push origin develop

# Check workflow status
# GitHub → Actions → Backend CI/CD
```

### 7.2 Test Terraform Workflow

```bash
# Make a change to terraform code
cd terraform
echo "# Test comment" >> main.tf

# Commit and push
git add .
git commit -m "test: trigger terraform workflow"
git push origin develop

# Check workflow status
# GitHub → Actions → Terraform CI/CD
```

---

## 8. Monitoring and Debugging

### 8.1 View Workflow Logs
1. Go to **GitHub → Actions**
2. Click on workflow run
3. Click on specific job
4. View step-by-step logs

### 8.2 Common Issues

**Issue:** "Login to Amazon ECR failed"
- **Solution:** Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` secrets are set correctly

**Issue:** "terraform init failed - backend not found"
- **Solution:** Ensure S3 bucket `marin-terraform-state` and DynamoDB table `terraform-state-lock` exist

**Issue:** "ECS service not found"
- **Solution:** ECS services must be created first (Story 1.7 - ECS module). Disable deploy job until ECS is ready.

**Issue:** "Docker build failed"
- **Solution:** Ensure Dockerfile.api and Dockerfile.worker exist in `backend/` directory

---

## 9. Security Best Practices

### 9.1 Secrets Management
- ✅ Never commit secrets to git
- ✅ Use GitHub Secrets for sensitive data
- ✅ Rotate AWS credentials regularly (every 90 days)
- ✅ Use separate AWS accounts for dev/staging/prod

### 9.2 Docker Image Security
- ✅ Scan images on push (enabled in ECR module)
- ✅ Use official base images (python:3.11-slim)
- ✅ Keep base images updated
- ✅ Remove untagged images after 14 days (lifecycle policy)

### 9.3 Terraform State Security
- ✅ Store state in S3 with encryption
- ✅ Use DynamoDB for state locking
- ✅ Enable versioning on state bucket
- ✅ Restrict state bucket access

---

## 10. Deployment Workflow

### Development Workflow:
1. Create feature branch from `develop`
2. Make code changes
3. Push to feature branch
4. Create PR to `develop`
5. Workflows run validation (no deployment)
6. Review PR and merge
7. Merge to `develop` triggers deployment to dev environment

### Production Workflow:
1. Create release branch from `develop`
2. Test thoroughly in staging
3. Create PR to `main`
4. Workflows run validation
5. Review and approve
6. Merge to `main` triggers deployment to production (with manual approval)

---

## 11. Cost Considerations

**ECR Storage:**
- $0.10 per GB per month
- Lifecycle policies delete old images automatically
- **Estimated cost:** $1-5/month

**GitHub Actions Minutes:**
- Free tier: 2,000 minutes/month for private repos
- Each workflow run: ~5-10 minutes
- **Estimated cost:** $0 (within free tier)

**Data Transfer:**
- ECR to ECS: Free (same region)
- GitHub to ECR: $0.09/GB after 1GB
- **Estimated cost:** <$5/month

---

## 12. Next Steps After Setup

1. ✅ Create and configure all GitHub secrets
2. ✅ Apply Terraform to create ECR repositories
3. ✅ Create Dockerfiles for API and Worker
4. ✅ Push to `develop` branch to test workflows
5. ✅ Review workflow logs and fix any issues
6. ✅ Set up branch protection rules (require PR reviews, passing checks)
7. ✅ Configure GitHub environments for production (require manual approval)
8. ✅ Document deployment runbook for team

---

**Generated:** 2025-11-04
**Story:** 1.7 - Set up GitHub Actions CI/CD Pipeline
**Status:** Implementation complete, awaiting testing
