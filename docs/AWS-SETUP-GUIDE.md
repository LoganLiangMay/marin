# AWS Account Setup Guide for Marin Project

**Last Updated:** 2025-11-04
**Version:** 1.0

---

## Table of Contents

1. [Overview](#overview)
2. [AWS Account Creation](#aws-account-creation)
3. [IAM User Setup for Terraform](#iam-user-setup-for-terraform)
4. [AWS CLI Configuration](#aws-cli-configuration)
5. [Billing Alerts and Cost Management](#billing-alerts-and-cost-management)
6. [S3 Backend Setup](#s3-backend-setup)
7. [Service Quotas and Limits](#service-quotas-and-limits)
8. [Multi-Account Setup (Optional)](#multi-account-setup-optional)
9. [Verification](#verification)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This guide walks through setting up an AWS account and configuring it for the Marin audio call data ingestion pipeline deployment. The setup includes:

- AWS account creation and configuration
- IAM user creation for Terraform
- AWS CLI installation and configuration
- S3 backend for Terraform state
- Billing alerts to prevent unexpected costs
- Security best practices

### AWS Services Used

The Marin project uses the following AWS services:

| Service | Purpose | Estimated Cost |
|---------|---------|----------------|
| **VPC** | Network isolation | Free |
| **EC2 (ECS Fargate)** | Container hosting | $50-200/month |
| **S3** | Audio/transcript storage | $5-20/month |
| **ElastiCache (Redis)** | Caching | $12-95/month |
| **SQS** | Message queue | $1-5/month |
| **ECR** | Docker registry | $1-5/month |
| **Secrets Manager** | Credential storage | $1-2/month |
| **CloudWatch** | Logging and monitoring | $5-15/month |
| **Cognito** | Authentication | Free tier + $0.0055/MAU |
| **OpenSearch Serverless** | Semantic search | $50-150/month |
| **Bedrock** | AI/ML (Claude, Titan) | Pay-per-use |

**Total Estimated Cost:** $378-970/month depending on environment and usage

---

## AWS Account Creation

### Step 1: Sign Up

1. Navigate to [AWS Console](https://aws.amazon.com/)
2. Click "Create an AWS Account"
3. Enter email address (use company email for production)
4. Account name: `Marin Audio Pipeline` (or your choice)
5. Click "Verify email address"

### Step 2: Email Verification

1. Check your email for AWS verification code
2. Enter the code on AWS signup page
3. Click "Verify"

### Step 3: Create Root User Password

1. Create a strong password (12+ characters, mixed case, numbers, symbols)
2. Store securely in password manager
3. Click "Continue"

### Step 4: Contact Information

1. Account type: Choose "Personal" or "Business"
2. Enter contact details:
   - Full name
   - Phone number
   - Address
   - Country/region
3. Read and accept AWS Customer Agreement
4. Click "Continue"

### Step 5: Payment Information

1. Enter credit/debit card information
2. Billing address
3. Click "Verify and Continue"

**Note:** AWS may charge $1 for verification (refunded)

### Step 6: Identity Verification

1. Choose verification method: "Text message (SMS)" or "Voice call"
2. Enter phone number
3. Enter verification code
4. Click "Continue"

### Step 7: Select Support Plan

1. For development: Choose "Basic Support" (Free)
2. For production: Consider "Developer" ($29/month) or higher
3. Click "Complete sign up"

### Step 8: Wait for Account Activation

- Account activation takes 5-10 minutes
- Check email for confirmation

### Step 9: Secure Root Account

**CRITICAL:** Never use root account for day-to-day operations!

1. Sign in to AWS Console as root user
2. Navigate to: My Account → Security Credentials
3. Enable MFA (Multi-Factor Authentication):
   - Choose "Virtual MFA device"
   - Use authenticator app (Google Authenticator, Authy, 1Password)
   - Scan QR code
   - Enter two consecutive codes
   - Click "Assign MFA"

4. Create account alias (optional):
   - Navigate to: IAM → Dashboard
   - Click "Create" next to "Account Alias"
   - Enter: `marin-audio-pipeline`
   - Now you can sign in with: `https://marin-audio-pipeline.signin.aws.amazon.com/console`

---

## IAM User Setup for Terraform

Create a dedicated IAM user for Terraform instead of using root credentials.

### Option 1: Administrator Access (Development)

**For development/testing environments:**

```bash
# Using AWS CLI as root user or admin user:

# Create IAM user
aws iam create-user --user-name terraform-marin

# Attach AdministratorAccess policy
aws iam attach-user-policy \
  --user-name terraform-marin \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# Create access key
aws iam create-access-key --user-name terraform-marin > terraform-keys.json

# View the keys
cat terraform-keys.json
```

**Save the output:**
```json
{
    "AccessKey": {
        "UserName": "terraform-marin",
        "AccessKeyId": "AKIAIOSFODNN7EXAMPLE",
        "Status": "Active",
        "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        "CreateDate": "2025-11-04T10:00:00Z"
    }
}
```

**CRITICAL:**
- Store `AccessKeyId` and `SecretAccessKey` securely
- Delete `terraform-keys.json` after saving credentials
- Never commit these to version control!

### Option 2: Least-Privilege Policy (Production)

**For production environments, create custom policy:**

1. Create IAM policy file `terraform-marin-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "vpc:*",
        "elasticloadbalancing:*",
        "autoscaling:*",
        "cloudwatch:*",
        "s3:*",
        "iam:*",
        "route53:*",
        "acm:*",
        "secretsmanager:*",
        "ecs:*",
        "ecr:*",
        "logs:*",
        "elasticache:*",
        "sqs:*",
        "sns:*",
        "cognito-identity:*",
        "cognito-idp:*",
        "aoss:*",
        "bedrock:*",
        "kms:*",
        "dynamodb:CreateTable",
        "dynamodb:DeleteTable",
        "dynamodb:DescribeTable",
        "dynamodb:ListTables",
        "dynamodb:UpdateTable",
        "dynamodb:TagResource",
        "dynamodb:UntagResource",
        "dynamodb:PutItem",
        "dynamodb:DeleteItem",
        "dynamodb:GetItem"
      ],
      "Resource": "*"
    }
  ]
}
```

2. Create the policy:
```bash
aws iam create-policy \
  --policy-name TerraformMarinPolicy \
  --policy-document file://terraform-marin-policy.json
```

3. Attach to user:
```bash
aws iam attach-user-policy \
  --user-name terraform-marin \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/TerraformMarinPolicy
```

### Enable MFA for Terraform User (Recommended)

```bash
# Create virtual MFA device
aws iam create-virtual-mfa-device \
  --virtual-mfa-device-name terraform-marin-mfa \
  --outfile terraform-mfa-qr.png \
  --bootstrap-method QRCodePNG

# Scan QR code with authenticator app
# Then enable MFA (replace with codes from authenticator):
aws iam enable-mfa-device \
  --user-name terraform-marin \
  --serial-number arn:aws:iam::YOUR_ACCOUNT_ID:mfa/terraform-marin-mfa \
  --authentication-code-1 123456 \
  --authentication-code-2 654321
```

---

## AWS CLI Configuration

### Installation

**macOS:**
```bash
brew install awscli

# Or using official installer:
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /
```

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**Windows:**
```powershell
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
```

**Verify installation:**
```bash
aws --version
# Should output: aws-cli/2.x.x Python/3.x.x ...
```

### Configuration

```bash
aws configure

# Enter when prompted:
# AWS Access Key ID: <from Step IAM User Setup>
# AWS Secret Access Key: <from Step IAM User Setup>
# Default region name: us-east-1
# Default output format: json
```

**This creates two files:**
- `~/.aws/credentials` - Contains access keys
- `~/.aws/config` - Contains configuration

### Verify Configuration

```bash
# Test authentication
aws sts get-caller-identity

# Expected output:
{
    "UserId": "AIDACKCEVSQ6C2EXAMPLE",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/terraform-marin"
}
```

### Configure Named Profiles (Optional)

For multiple AWS accounts:

```bash
# Configure additional profiles
aws configure --profile marin-dev
aws configure --profile marin-prod

# Use specific profile
aws s3 ls --profile marin-dev

# Or set environment variable
export AWS_PROFILE=marin-dev
```

---

## Billing Alerts and Cost Management

Prevent unexpected AWS bills by setting up alerts.

### Step 1: Enable Billing Alerts

1. Sign in as root user
2. Navigate to: Billing Dashboard → Billing Preferences
3. Check "Receive Free Tier Usage Alerts"
4. Enter email address
5. Check "Receive Billing Alerts"
6. Click "Save preferences"

### Step 2: Create Billing Alarm

```bash
# Create SNS topic for billing alerts
aws sns create-topic --name billing-alerts

# Subscribe your email to the topic
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:billing-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com

# Confirm subscription from email

# Create CloudWatch alarm for $100 threshold
aws cloudwatch put-metric-alarm \
  --alarm-name billing-alert-100 \
  --alarm-description "Billing alarm when charges exceed $100" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --evaluation-periods 1 \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:billing-alerts \
  --dimensions Name=Currency,Value=USD
```

### Step 3: Create Budget

More advanced cost tracking:

```bash
# Create budget for $500/month
aws budgets create-budget \
  --account-id YOUR_ACCOUNT_ID \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

`budget.json`:
```json
{
  "BudgetName": "Marin-Monthly-Budget",
  "BudgetLimit": {
    "Amount": "500",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
```

`notifications.json`:
```json
[
  {
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 80,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [
      {
        "SubscriptionType": "EMAIL",
        "Address": "your-email@example.com"
      }
    ]
  }
]
```

### Step 4: Enable Cost Explorer

1. Billing Dashboard → Cost Explorer
2. Click "Enable Cost Explorer"
3. Explore costs by service, region, tag

---

## S3 Backend Setup

Terraform uses S3 to store infrastructure state and DynamoDB for locking.

### Create S3 Bucket

```bash
# Create S3 bucket for Terraform state
aws s3api create-bucket \
  --bucket marin-terraform-state \
  --region us-east-1

# Enable versioning (allows rollback)
aws s3api put-bucket-versioning \
  --bucket marin-terraform-state \
  --versioning-configuration Status=Enabled

# Enable encryption at rest
aws s3api put-bucket-encryption \
  --bucket marin-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Block all public access
aws s3api put-public-access-block \
  --bucket marin-terraform-state \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Add lifecycle policy (optional - cleanup old versions)
aws s3api put-bucket-lifecycle-configuration \
  --bucket marin-terraform-state \
  --lifecycle-configuration file://lifecycle.json
```

`lifecycle.json`:
```json
{
  "Rules": [
    {
      "Id": "DeleteOldVersions",
      "Status": "Enabled",
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 90
      }
    }
  ]
}
```

### Create DynamoDB Table for State Locking

```bash
# Create DynamoDB table
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1 \
  --tags Key=Project,Value=marin Key=ManagedBy,Value=terraform

# Verify table created
aws dynamodb describe-table --table-name terraform-state-lock
```

### Verify Backend Configuration

```bash
# List S3 buckets
aws s3 ls | grep marin-terraform-state

# List DynamoDB tables
aws dynamodb list-tables | grep terraform-state-lock

# Test access
aws s3 cp test.txt s3://marin-terraform-state/test.txt
aws s3 rm s3://marin-terraform-state/test.txt
```

---

## Service Quotas and Limits

Check and request increases for service limits if needed.

### Check Current Quotas

```bash
# List service quotas for EC2
aws service-quotas list-service-quotas \
  --service-code ec2 \
  --query 'Quotas[?QuotaName==`Running On-Demand Standard (A, C, D, H, I, M, R, T, Z) instances`]'

# Check VPC quotas
aws service-quotas list-service-quotas \
  --service-code vpc

# Check ECS Fargate quotas
aws service-quotas list-service-quotas \
  --service-code ecs
```

### Common Quotas to Check

| Service | Quota | Default Limit | Recommended for Marin |
|---------|-------|---------------|----------------------|
| EC2 | Running On-Demand Standard instances | 5-20 vCPUs | 10+ vCPUs |
| VPC | VPCs per region | 5 | 3 (dev/staging/prod) |
| S3 | Buckets | 100 | 10 |
| ElastiCache | Nodes per region | 300 | 10 |
| SQS | Queues | Unlimited | N/A |
| ECS Fargate | Tasks | 1000 | 50 |

### Request Quota Increase

```bash
# Request increase (example: EC2 vCPUs)
aws service-quotas request-service-quota-increase \
  --service-code ec2 \
  --quota-code L-1216C47A \
  --desired-value 50
```

Or use AWS Console:
1. Service Quotas → AWS services → EC2
2. Find quota → Request quota increase
3. Enter new value → Request

---

## Multi-Account Setup (Optional)

For production environments, consider using AWS Organizations for account isolation.

### Benefits

- Separate billing per environment
- Isolated security boundaries
- Independent resource limits
- Granular access control

### Setup

1. **Create AWS Organization:**
   ```bash
   aws organizations create-organization
   ```

2. **Create member accounts:**
   - Development account
   - Staging account
   - Production account

3. **Configure cross-account access:**
   - Use AWS STS AssumeRole
   - Configure in Terraform with `assume_role` block

4. **Consolidated billing:**
   - All accounts bill to master account
   - Volume discounts apply across accounts

---

## Verification

### Verify AWS CLI Access

```bash
# Check identity
aws sts get-caller-identity

# List S3 buckets
aws s3 ls

# List EC2 regions
aws ec2 describe-regions

# List IAM users (should see terraform-marin)
aws iam list-users
```

### Verify Terraform Prerequisites

```bash
# Check S3 backend
aws s3 ls s3://marin-terraform-state

# Check DynamoDB table
aws dynamodb describe-table --table-name terraform-state-lock

# Test Terraform configuration
cd terraform
terraform init
terraform validate
```

### Verify Billing Alerts

```bash
# List SNS topics
aws sns list-topics | grep billing

# List CloudWatch alarms
aws cloudwatch describe-alarms --alarm-names billing-alert-100

# Check budget
aws budgets describe-budgets --account-id YOUR_ACCOUNT_ID
```

---

## Troubleshooting

### Issue: Access Denied Errors

**Error:**
```
An error occurred (UnauthorizedOperation) when calling the DescribeInstances operation
```

**Solutions:**
1. Check IAM permissions:
   ```bash
   aws iam list-attached-user-policies --user-name terraform-marin
   ```

2. Verify credentials:
   ```bash
   aws sts get-caller-identity
   ```

3. Check you're using correct profile:
   ```bash
   echo $AWS_PROFILE
   aws configure list
   ```

### Issue: Region Mismatch

**Error:**
```
Error: Error describing VPCs: InvalidGroup.NotFound
```

**Solution:**
```bash
# Check configured region
aws configure get region

# Or explicitly specify region
aws ec2 describe-vpcs --region us-east-1

# Update default region
aws configure set region us-east-1
```

### Issue: MFA Required

**Error:**
```
Error: MFA authentication required
```

**Solution:**
```bash
# Generate session token with MFA
aws sts get-session-token \
  --serial-number arn:aws:iam::ACCOUNT_ID:mfa/terraform-marin-mfa \
  --token-code 123456

# Use temporary credentials
export AWS_ACCESS_KEY_ID=<temporary-access-key>
export AWS_SECRET_ACCESS_KEY=<temporary-secret-key>
export AWS_SESSION_TOKEN=<session-token>
```

### Issue: S3 Bucket Name Already Exists

**Error:**
```
Error: BucketAlreadyExists: The requested bucket name is not available
```

**Solution:**
S3 bucket names must be globally unique. Choose a different name:
```bash
aws s3api create-bucket \
  --bucket marin-terraform-state-YOUR_ACCOUNT_ID \
  --region us-east-1
```

### Issue: Rate Limiting

**Error:**
```
Error: Throttling: Rate exceeded
```

**Solution:**
AWS API has rate limits. Wait and retry, or use exponential backoff. Terraform handles this automatically in most cases.

---

## Security Best Practices

1. **Never use root account** for day-to-day operations
2. **Enable MFA** on all accounts (root and IAM users)
3. **Use IAM roles** instead of access keys where possible (EC2, Lambda, ECS)
4. **Rotate access keys** regularly (every 90 days)
5. **Use least-privilege** policies (don't use AdministratorAccess in production)
6. **Enable CloudTrail** for audit logging
7. **Review IAM Access Advisor** to identify unused permissions
8. **Use AWS Secrets Manager** for application credentials
9. **Enable GuardDuty** for threat detection
10. **Regular security audits** using AWS Security Hub

---

## Cost Optimization Tips

1. **Use Free Tier** services where available
2. **Right-size resources** - don't over-provision
3. **Use Reserved Instances** for predictable workloads (save up to 75%)
4. **Delete unused resources** - dev environments, old snapshots
5. **Use S3 lifecycle policies** to transition to cheaper storage classes
6. **Enable auto-scaling** to match capacity to demand
7. **Use Spot Instances** for non-critical workloads (save up to 90%)
8. **Set up Cost Anomaly Detection** in AWS Cost Explorer
9. **Tag all resources** for cost allocation and tracking
10. **Review AWS Cost Explorer** monthly

---

## Additional Resources

- [AWS Account Setup](https://aws.amazon.com/premiumsupport/knowledge-center/create-and-activate-aws-account/)
- [AWS CLI Documentation](https://docs.aws.amazon.com/cli/)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS Security Best Practices](https://aws.amazon.com/security/security-resources/)

---

## Support

For AWS account issues:
- [AWS Support Center](https://console.aws.amazon.com/support/home)
- [AWS Forums](https://forums.aws.amazon.com/)
- [AWS re:Post](https://repost.aws/)

For Marin project AWS issues:
- Check CloudWatch Logs
- Review IAM permissions
- Create GitHub issue

---

**Document Version:** 1.0
**Last Updated:** 2025-11-04
**Maintained By:** Marin Development Team
