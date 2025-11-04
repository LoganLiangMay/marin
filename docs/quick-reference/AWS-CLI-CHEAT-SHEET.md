# AWS CLI Quick Reference - Marin Project

**Quick reference for common AWS CLI commands used during Marin deployment**

---

## 🔧 Configuration

```bash
# Configure AWS CLI
aws configure
# Prompts for: Access Key ID, Secret Access Key, Region (us-east-1), Output (json)

# Verify configuration
aws sts get-caller-identity

# Configure named profile
aws configure --profile marin-dev

# Use specific profile
export AWS_PROFILE=marin-dev
# OR
aws s3 ls --profile marin-dev

# List configured profiles
cat ~/.aws/credentials
```

---

## 👤 IAM (Identity & Access Management)

```bash
# Create IAM user
aws iam create-user --user-name terraform-marin

# Attach admin policy
aws iam attach-user-policy \
  --user-name terraform-marin \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# Create access key
aws iam create-access-key --user-name terraform-marin

# List users
aws iam list-users

# List roles (check Terraform-created roles)
aws iam list-roles | grep marin

# Get specific role
aws iam get-role --role-name marin-dev-ecs-task-execution

# List attached policies
aws iam list-attached-user-policies --user-name terraform-marin
```

---

## 🪣 S3 (Terraform State Backend)

```bash
# Create bucket
aws s3api create-bucket --bucket marin-terraform-state --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket marin-terraform-state \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket marin-terraform-state \
  --server-side-encryption-configuration \
    '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

# Block public access
aws s3api put-public-access-block \
  --bucket marin-terraform-state \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# List buckets
aws s3 ls | grep marin

# List objects in bucket
aws s3 ls s3://marin-terraform-state/

# Download state file (for inspection)
aws s3 cp s3://marin-terraform-state/marin/terraform.tfstate ./state-backup.tfstate
```

---

## 🗄️ DynamoDB (State Locking)

```bash
# Create table for state locking
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# List tables
aws dynamodb list-tables

# Describe table
aws dynamodb describe-table --table-name terraform-state-lock

# Delete lock (if stuck)
aws dynamodb delete-item \
  --table-name terraform-state-lock \
  --key '{"LockID":{"S":"marin-terraform-state/marin/terraform.tfstate"}}'
```

---

## 🌐 VPC & Networking

```bash
# List VPCs
aws ec2 describe-vpcs --filters "Name=tag:Project,Values=marin"

# Describe specific VPC
aws ec2 describe-vpcs --vpc-ids vpc-xxxxx

# List subnets
aws ec2 describe-subnets --filters "Name=tag:Project,Values=marin"

# List security groups
aws ec2 describe-security-groups --filters "Name=tag:Project,Values=marin"

# List internet gateways
aws ec2 describe-internet-gateways --filters "Name=tag:Project,Values=marin"
```

---

## 🐳 ECR (Docker Registry)

```bash
# List repositories
aws ecr describe-repositories

# Get login command for Docker
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# List images in repository
aws ecr list-images --repository-name marin-dev-api

# Describe image
aws ecr describe-images --repository-name marin-dev-api --image-ids imageTag=dev
```

---

## 🚀 ECS (Container Orchestration)

```bash
# List clusters
aws ecs list-clusters

# Describe cluster
aws ecs describe-clusters --clusters marin-dev-cluster

# List services
aws ecs list-services --cluster marin-dev-cluster

# Describe service
aws ecs describe-services \
  --cluster marin-dev-cluster \
  --services marin-dev-api

# List tasks
aws ecs list-tasks --cluster marin-dev-cluster

# Describe task
aws ecs describe-tasks --cluster marin-dev-cluster --tasks TASK_ARN

# Update service (force new deployment)
aws ecs update-service \
  --cluster marin-dev-cluster \
  --service marin-dev-api \
  --force-new-deployment

# Stop task (for debugging)
aws ecs stop-task --cluster marin-dev-cluster --task TASK_ARN

# Scale service
aws ecs update-service \
  --cluster marin-dev-cluster \
  --service marin-dev-api \
  --desired-count 2
```

---

## 🔴 ElastiCache (Redis)

```bash
# List cache clusters
aws elasticache describe-cache-clusters

# Describe specific cluster
aws elasticache describe-cache-clusters --cache-cluster-id marin-dev-redis

# Get endpoint
aws elasticache describe-cache-clusters \
  --cache-cluster-id marin-dev-redis \
  --show-cache-node-info

# Reboot cluster
aws elasticache reboot-cache-cluster --cache-cluster-id marin-dev-redis
```

---

## 📬 SQS (Message Queue)

```bash
# List queues
aws sqs list-queues

# Get queue URL
aws sqs get-queue-url --queue-name marin-dev-processing

# Get queue attributes
aws sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/ACCOUNT_ID/marin-dev-processing \
  --attribute-names All

# Check queue depth
aws sqs get-queue-attributes \
  --queue-url QUEUE_URL \
  --attribute-names ApproximateNumberOfMessages

# Purge queue (delete all messages)
aws sqs purge-queue --queue-url QUEUE_URL
```

---

## 🔐 Secrets Manager

```bash
# Create secret
aws secretsmanager create-secret \
  --name dev/audio-pipeline/mongodb-uri \
  --secret-string '{"uri":"mongodb+srv://..."}'

# Get secret value
aws secretsmanager get-secret-value \
  --secret-id dev/audio-pipeline/mongodb-uri

# List secrets
aws secretsmanager list-secrets

# Update secret
aws secretsmanager update-secret \
  --secret-id dev/audio-pipeline/mongodb-uri \
  --secret-string '{"uri":"new-connection-string"}'

# Delete secret (30-day recovery window)
aws secretsmanager delete-secret \
  --secret-id dev/audio-pipeline/mongodb-uri \
  --recovery-window-in-days 30
```

---

## 📊 CloudWatch (Logs & Monitoring)

```bash
# List log groups
aws logs describe-log-groups --log-group-name-prefix /ecs/marin

# Tail logs (follow)
aws logs tail /ecs/marin-dev-api --follow

# Tail logs with filter
aws logs tail /ecs/marin-dev-worker --follow --filter-pattern ERROR

# Get log events
aws logs get-log-events \
  --log-group-name /ecs/marin-dev-api \
  --log-stream-name STREAM_NAME

# List alarms
aws cloudwatch describe-alarms --alarm-names billing-alert-100

# Get metric statistics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=marin-dev-api \
  --start-time 2025-11-04T00:00:00Z \
  --end-time 2025-11-04T23:59:59Z \
  --period 3600 \
  --statistics Average
```

---

## 💰 Billing & Cost Management

```bash
# Create SNS topic for billing alerts
aws sns create-topic --name billing-alerts

# Subscribe email to topic
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:billing-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com

# Create billing alarm
aws cloudwatch put-metric-alarm \
  --alarm-name billing-alert-100 \
  --alarm-description "Alert when charges exceed $100" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --evaluation-periods 1 \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:billing-alerts \
  --dimensions Name=Currency,Value=USD

# Get cost and usage
aws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2025-11-04 \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

---

## 🔍 Troubleshooting

```bash
# Check current identity
aws sts get-caller-identity

# Test credentials
aws s3 ls

# Check region configuration
aws configure get region

# Verify service availability
aws ec2 describe-regions --region us-east-1

# Get account ID
aws sts get-caller-identity --query Account --output text

# List all resources with specific tag
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Project,Values=marin

# Check service quotas
aws service-quotas list-service-quotas --service-code ec2 | grep vCPU
```

---

## 🧹 Cleanup Commands

```bash
# Stop ECS services (save costs)
aws ecs update-service --cluster marin-dev-cluster --service marin-dev-api --desired-count 0
aws ecs update-service --cluster marin-dev-cluster --service marin-dev-worker --desired-count 0

# Delete ECR images
aws ecr batch-delete-image \
  --repository-name marin-dev-api \
  --image-ids imageTag=dev

# Empty S3 bucket
aws s3 rm s3://marin-dev-call-recordings --recursive

# Delete log streams older than 7 days (saves costs)
# (Use CloudWatch console or custom script)
```

---

## 💡 Pro Tips

- **Always specify region**: Use `--region us-east-1` to avoid surprises
- **Use output formats**: `--output json|text|table` for different needs
- **Use JMESPath queries**: `--query 'Items[0].Name'` to filter output
- **Profile for environments**: Use `--profile dev|staging|prod`
- **Dry run when available**: Many commands support `--dry-run`
- **Get help**: Use `aws <service> <command> help` for detailed docs

---

## 📱 Common Patterns

```bash
# Get Terraform outputs via AWS (when Terraform not available)
export VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=tag:Project,Values=marin" "Name=tag:Environment,Values=dev" \
  --query 'Vpcs[0].VpcId' --output text)

export API_REPO=$(aws ecr describe-repositories \
  --repository-names marin-dev-api \
  --query 'repositories[0].repositoryUri' --output text)

# Check if resource exists before creating
aws s3api head-bucket --bucket marin-terraform-state 2>/dev/null || echo "Bucket does not exist"

# Wait for resource to be ready
aws ecs wait services-stable --cluster marin-dev-cluster --services marin-dev-api
```

---

**Last Updated:** 2025-11-04
**Marin Project** | AWS CLI Version 2.x
