# Manual Setup Required - Marin Project

## Overview
This document outlines manual setup steps required before terraform can be fully validated and deployed. These are one-time setup tasks that cannot be automated.

---

## 1. AWS Account Prerequisites

### 1.1 AWS Credentials Configuration
**Required for:** All AWS operations

```bash
# Configure AWS CLI with your credentials
aws configure

# You'll need:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: us-east-1
# - Default output format: json
```

**Verify setup:**
```bash
aws sts get-caller-identity
```

---

## 2. Terraform Remote State Backend

### 2.1 Create S3 Bucket for Terraform State
**Location:** Manual AWS Console or CLI
**Required before:** `terraform init`

```bash
# Create S3 bucket for terraform state
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
```

### 2.2 Create DynamoDB Table for State Locking
**Location:** Manual AWS Console or CLI
**Required before:** `terraform init`

```bash
# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 2.3 Enable Terraform S3 Backend
**File:** `terraform/backend.tf`

**Action:** Uncomment the terraform backend block (lines 6-13)

```hcl
# Change FROM (commented):
# terraform {
#   backend "s3" {
#     bucket         = "marin-terraform-state"
#     key            = "marin/terraform.tfstate"
#     region         = "us-east-1"
#     dynamodb_table = "terraform-state-lock"
#     encrypt        = true
#   }
# }

# Change TO (uncommented):
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

**Then run:**
```bash
cd terraform
terraform init -reconfigure
```

---

## 3. Restore IAM Module Implementation

### 3.1 IAM Module Files Need Restoration
**Issue:** Files were reset by linter/sync process
**Location:** `terraform/modules/iam/`

**Files to restore:**

#### A. `terraform/modules/iam/variables.tf`
Need to restore the full variable definitions (~87 lines):
- project_name, environment, aws_region
- recordings_bucket_arn, recordings_bucket_name
- transcripts_bucket_arn, transcripts_bucket_name
- processing_queue_arn, processing_queue_url
- opensearch_collection_arn (optional, default "")
- tags

#### B. `terraform/modules/iam/main.tf`
Need to restore the full implementation (~431 lines):
- Data sources for aws_caller_identity and aws_region
- Local variables for name_prefix, account_id, region, common_tags
- Three IAM roles:
  1. `aws_iam_role.ecs_task_execution` with trust policy
  2. `aws_iam_role.api_task` with trust policy
  3. `aws_iam_role.worker_task` with trust policy
- Managed policy attachment for ECS task execution role
- Inline policies for each role (S3, SQS, OpenSearch, Bedrock, CloudWatch, Secrets Manager)

#### C. `terraform/modules/iam/outputs.tf`
Need to restore the output definitions (~91 lines):
- ecs_task_execution_role_arn, ecs_task_execution_role_name, ecs_task_execution_role_id
- api_task_role_arn, api_task_role_name, api_task_role_id
- worker_task_role_arn, worker_task_role_name, worker_task_role_id
- Combined outputs: role_arns, role_names, role_ids (maps)

#### D. `terraform/modules/iam/versions.tf`
Need to create (~12 lines):
```hcl
# IAM Module - Terraform Version and Provider Requirements

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
```

**Action:** Re-run the implementation or restore from version control if these files exist in git history.

---

## 4. Restore Root Terraform Configuration

### 4.1 Verify IAM Module Wiring
**File:** `terraform/main.tf`

**Check that IAM module is configured** (should be around lines 145-200):

```hcl
# Queue Module should come BEFORE IAM module (to avoid circular dependency)
module "queue" {
  source = "./modules/queue"

  project_name = var.project_name
  environment  = var.environment

  # Note: Queue doesn't need IAM role ARNs
}

# IAM Module
module "iam" {
  source = "./modules/iam"

  project_name = var.project_name
  environment  = var.environment

  # S3 Bucket References (from Storage Module)
  recordings_bucket_arn   = module.storage.recordings_bucket_arn
  recordings_bucket_name  = module.storage.recordings_bucket_name
  transcripts_bucket_arn  = module.storage.transcripts_bucket_arn
  transcripts_bucket_name = module.storage.transcripts_bucket_name

  # SQS Queue References (from Queue Module)
  processing_queue_arn = module.queue.processing_queue_arn
  processing_queue_url = module.queue.processing_queue_url

  # OpenSearch Collection Reference (Optional - Epic 4)
  # opensearch_collection_arn = module.opensearch.collection_arn
}
```

**If missing:** Restore from the implementation or git history.

---

## 5. MongoDB Atlas Setup

### 5.1 Create MongoDB Atlas Account
**Website:** https://www.mongodb.com/cloud/atlas/register

1. Sign up for MongoDB Atlas (free tier available)
2. Create an organization
3. Note your Organization ID (needed for `atlas_org_id` variable)

### 5.2 Generate API Keys
**Location:** MongoDB Atlas Console → Organization Settings → API Keys

1. Create API Key with "Organization Project Creator" role
2. Note the **Public Key** and **Private Key**
3. Add your IP address to API access list

### 5.3 Set Environment Variables
**Required before:** `terraform plan` or `terraform apply`

```bash
# Add to ~/.bashrc or ~/.zshrc
export TF_VAR_mongodb_atlas_public_key="your-public-key-here"
export TF_VAR_mongodb_atlas_private_key="your-private-key-here"
export TF_VAR_atlas_org_id="your-org-id-here"

# Or create terraform.tfvars file
cat > terraform/terraform.tfvars << EOF
mongodb_atlas_public_key  = "your-public-key-here"
mongodb_atlas_private_key = "your-private-key-here"
atlas_org_id              = "your-org-id-here"
project_name              = "marin"
environment               = "dev"
aws_region                = "us-east-1"
EOF
```

---

## 6. Terraform Validation Workflow

### 6.1 Initial Validation
```bash
cd terraform

# Format all terraform files
terraform fmt -recursive

# Initialize terraform (downloads providers, sets up modules)
terraform init

# Validate configuration syntax and logic
terraform validate

# Preview what will be created (requires AWS credentials)
terraform plan
```

### 6.2 Expected Output
- `terraform fmt`: Should run without output (files already formatted)
- `terraform init`: Should download AWS and MongoDB providers successfully
- `terraform validate`: Should output "Success! The configuration is valid."
- `terraform plan`: Should show resources to be created (IAM roles, policies, etc.)

### 6.3 If Validation Fails
**Common issues:**

1. **"Module not installed"**: Run `terraform init` first
2. **"Backend initialization failed"**: Complete Step 2 (S3 bucket + DynamoDB table)
3. **"No valid credential sources"**: Run `aws configure` (Step 1.1)
4. **"mongodb_atlas_public_key not set"**: Complete Step 5.3 (MongoDB env vars)
5. **Module files empty**: Complete Step 3 (Restore IAM module files)

---

## 7. Deployment (When Ready)

### 7.1 Apply Infrastructure
**WARNING:** This will create real AWS resources and incur costs.

```bash
cd terraform

# Create a plan file for review
terraform plan -out=tfplan

# Review the plan carefully
terraform show tfplan

# Apply the plan (creates real resources)
terraform apply tfplan
```

### 7.2 Verify Deployment
```bash
# Check IAM roles were created
aws iam list-roles | grep marin-dev

# Check specific role
aws iam get-role --role-name marin-dev-ecs-task-execution
aws iam get-role --role-name marin-dev-api-task
aws iam get-role --role-name marin-dev-worker-task
```

---

## 8. Story Completion Checklist

### Story 1.6: Create IAM Roles and Policies
- [ ] Step 3: Restore IAM module files (variables.tf, main.tf, outputs.tf, versions.tf)
- [ ] Step 4: Verify root terraform/main.tf IAM module configuration
- [ ] Step 2: Create S3 bucket for terraform state
- [ ] Step 2: Create DynamoDB table for state locking
- [ ] Step 2: Uncomment backend configuration in backend.tf
- [ ] Step 1: Configure AWS credentials
- [ ] Step 5: Set up MongoDB Atlas account and API keys
- [ ] Step 6: Run `terraform fmt`, `terraform init`, `terraform validate`
- [ ] Step 6: Run `terraform plan` (review output)
- [ ] Step 7: Run `terraform apply` (creates resources)
- [ ] Step 7: Verify IAM roles exist in AWS Console

---

## 9. Cost Estimate

**IAM Roles:** Free (no cost for IAM resources)
**S3 State Bucket:** ~$0.023/month for 1GB storage
**DynamoDB State Lock:** ~$0.25/month (pay per request)
**MongoDB Atlas:** Free tier M0 available (512MB storage)

**Total estimated cost for Story 1.6:** < $1/month

---

## 10. Troubleshooting

### Issue: Terraform state locked
```bash
# Force unlock (use lock ID from error message)
terraform force-unlock <LOCK_ID>
```

### Issue: AWS credentials expired
```bash
# Refresh credentials
aws configure
aws sts get-caller-identity
```

### Issue: Module dependency error
```bash
# Re-initialize modules
terraform init -upgrade
```

### Issue: Need to start over
```bash
# Destroy all resources
terraform destroy

# Clean local state
rm -rf .terraform terraform.tfstate*

# Re-initialize
terraform init
```

---

## 11. Next Steps After Completion

Once Story 1.6 is complete:
1. Update sprint-status.yaml: Change status to "done"
2. Proceed to Story 1.7: Set up GitHub Actions CI/CD Pipeline
3. Document any deviations or lessons learned

---

## Support Resources

- **Terraform AWS Provider Docs:** https://registry.terraform.io/providers/hashicorp/aws/latest/docs
- **AWS IAM Best Practices:** https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html
- **MongoDB Atlas Terraform:** https://registry.terraform.io/providers/mongodb/mongodbatlas/latest/docs
- **Project Context:** See `docs/stories/1-6-create-iam-roles-and-policies.context.xml`

---

**Generated:** 2025-11-04
**Story:** 1.6 - Create IAM Roles and Policies
**Status:** Implementation complete, awaiting manual setup and validation
