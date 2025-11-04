# Deployment Troubleshooting Cheat Sheet - Marin Project

**Quick reference for diagnosing and fixing common deployment issues**

---

## 🚨 Quick Diagnostics

Run these commands first to gather information:

```bash
# Check all prerequisites
echo "=== AWS ===" && aws sts get-caller-identity
echo "=== Terraform ===" && cd terraform && terraform workspace show
echo "=== Docker ===" && docker info | grep "Server Version"
echo "=== MongoDB Atlas ===" && curl -u "$TF_VAR_mongodb_atlas_public_key:$TF_VAR_mongodb_atlas_private_key" \
  https://cloud.mongodb.com/api/atlas/v1.0/orgs/$TF_VAR_atlas_org_id 2>&1 | head -5
```

---

## ⚙️ AWS Issues

### Issue: "No valid credential sources found"

**Symptom:**
```
Error: No valid credential sources found for AWS Provider
```

**Diagnosis:**
```bash
# Check if credentials are configured
aws configure list

# Check if credentials work
aws sts get-caller-identity
```

**Solutions:**
```bash
# Solution 1: Configure AWS CLI
aws configure
# Enter: Access Key ID, Secret Access Key, us-east-1, json

# Solution 2: Set environment variables
export AWS_ACCESS_KEY_ID="your-key-id"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"

# Solution 3: Use specific profile
export AWS_PROFILE=marin-dev
aws configure --profile marin-dev

# Verify
aws sts get-caller-identity
```

---

### Issue: "Access Denied" errors

**Symptom:**
```
Error: UnauthorizedOperation: You are not authorized to perform this operation
```

**Diagnosis:**
```bash
# Check current user
aws sts get-caller-identity

# List attached policies
aws iam list-attached-user-policies --user-name $(aws sts get-caller-identity --query Arn --output text | cut -d'/' -f2)
```

**Solutions:**
```bash
# Solution 1: Attach AdministratorAccess (dev only)
aws iam attach-user-policy \
  --user-name terraform-marin \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# Solution 2: Check if using correct profile
aws configure list
export AWS_PROFILE=marin-dev

# Solution 3: Verify IAM permissions in AWS Console
# Go to IAM → Users → terraform-marin → Permissions
```

---

### Issue: Region mismatch

**Symptom:**
```
Error: InvalidGroup.NotFound: The security group 'sg-xxxxx' does not exist
```

**Diagnosis:**
```bash
# Check configured region
aws configure get region

# Check where resources actually are
aws ec2 describe-vpcs --region us-east-1 --filters "Name=tag:Project,Values=marin"
aws ec2 describe-vpcs --region us-west-2 --filters "Name=tag:Project,Values=marin"
```

**Solutions:**
```bash
# Set default region
aws configure set region us-east-1

# Or use environment variable
export AWS_DEFAULT_REGION=us-east-1

# Always specify region in commands
aws ec2 describe-vpcs --region us-east-1
```

---

## 🏗️ Terraform Issues

### Issue: State locked

**Symptom:**
```
Error: Error locking state: Error acquiring the state lock
Lock ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Diagnosis:**
```bash
# Check DynamoDB for lock
aws dynamodb get-item \
  --table-name terraform-state-lock \
  --key '{"LockID":{"S":"marin-terraform-state/env:/dev/terraform.tfstate"}}'
```

**Solutions:**
```bash
# Solution 1: Wait for lock to release (if another terraform is running)
# Check if other terraform processes are running
ps aux | grep terraform

# Solution 2: Force unlock (use Lock ID from error)
terraform force-unlock a1b2c3d4-e5f6-7890-abcd-ef1234567890

# Solution 3: Manually delete from DynamoDB
aws dynamodb delete-item \
  --table-name terraform-state-lock \
  --key '{"LockID":{"S":"marin-terraform-state/env:/dev/terraform.tfstate"}}'

# Solution 4: Kill stuck terraform process
pkill -9 terraform
```

---

### Issue: Backend initialization failed

**Symptom:**
```
Error: Failed to get existing workspaces: S3 bucket does not exist
```

**Diagnosis:**
```bash
# Check if S3 bucket exists
aws s3 ls | grep marin-terraform-state

# Check if DynamoDB table exists
aws dynamodb describe-table --table-name terraform-state-lock
```

**Solutions:**
```bash
# Solution 1: Create S3 bucket
aws s3api create-bucket --bucket marin-terraform-state --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket marin-terraform-state \
  --versioning-configuration Status=Enabled

# Solution 2: Create DynamoDB table
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# Solution 3: Use local state temporarily
terraform init -backend=false
```

---

### Issue: Module errors

**Symptom:**
```
Error: Unreadable module directory
Error: Module not installed
```

**Diagnosis:**
```bash
# Check if .terraform directory exists
ls -la .terraform/

# Check modules
ls -la .terraform/modules/
```

**Solutions:**
```bash
# Re-initialize
terraform init

# Upgrade modules
terraform init -upgrade

# Clean and re-init
rm -rf .terraform
terraform init
```

---

### Issue: Variable not set

**Symptom:**
```
Error: No value for required variable
Variable "mongodb_atlas_public_key" not set
```

**Diagnosis:**
```bash
# Check if environment variables are set
echo $TF_VAR_mongodb_atlas_public_key
echo $TF_VAR_mongodb_atlas_private_key
echo $TF_VAR_atlas_org_id

# Check if tfvars file exists
ls -la terraform/terraform.tfvars
```

**Solutions:**
```bash
# Solution 1: Set environment variables
export TF_VAR_mongodb_atlas_public_key="your-key"
export TF_VAR_mongodb_atlas_private_key="your-secret"
export TF_VAR_atlas_org_id="your-org-id"

# Solution 2: Create terraform.tfvars
cat > terraform/terraform.tfvars << EOF
mongodb_atlas_public_key  = "your-key"
mongodb_atlas_private_key = "your-secret"
atlas_org_id              = "your-org-id"
EOF

# Solution 3: Pass via command line
terraform plan \
  -var="mongodb_atlas_public_key=your-key" \
  -var="mongodb_atlas_private_key=your-secret"

# Solution 4: Use var-file
terraform plan -var-file=environments/dev.tfvars
```

---

## 🗄️ MongoDB Atlas Issues

### Issue: Authentication failed

**Symptom:**
```
Error: 401 (Unauthorized): Invalid API key
```

**Diagnosis:**
```bash
# Test API keys
curl -u "$TF_VAR_mongodb_atlas_public_key:$TF_VAR_mongodb_atlas_private_key" \
  https://cloud.mongodb.com/api/atlas/v1.0/orgs/$TF_VAR_atlas_org_id

# Check if keys are set
echo "Public: $TF_VAR_mongodb_atlas_public_key"
echo "Private: ${TF_VAR_mongodb_atlas_private_key:0:10}..." # Show first 10 chars only
echo "Org ID: $TF_VAR_atlas_org_id"
```

**Solutions:**
```bash
# Solution 1: Regenerate API keys
# Go to MongoDB Atlas → Organization → Access Manager → API Keys
# Create new API key with "Organization Project Creator" permissions

# Solution 2: Verify keys are correct
# No quotes in environment variables
export TF_VAR_mongodb_atlas_public_key=abcd1234  # No quotes!
export TF_VAR_mongodb_atlas_private_key=a1b2c3d4-e5f6-7890  # No quotes!

# Solution 3: Check IP access list
# MongoDB Atlas → Network Access → Add your current IP
```

---

### Issue: IP not whitelisted

**Symptom:**
```
Error: MongoServerError: IP address XXX.XXX.XXX.XXX is not allowed to access this resource
```

**Diagnosis:**
```bash
# Get your current IP
curl ifconfig.me
```

**Solutions:**
```bash
# Solution 1: Add IP via MongoDB Atlas console
# Network Access → Add IP Address → Add Current IP Address

# Solution 2: Allow all IPs (development only)
# Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)

# Solution 3: Add via Atlas API
curl -X POST \
  -u "$TF_VAR_mongodb_atlas_public_key:$TF_VAR_mongodb_atlas_private_key" \
  -H "Content-Type: application/json" \
  -d '{
    "ipAddress": "YOUR_IP",
    "comment": "Development machine"
  }' \
  "https://cloud.mongodb.com/api/atlas/v1.0/groups/$TF_VAR_atlas_org_id/accessList"
```

---

### Issue: Connection timeout

**Symptom:**
```
MongoNetworkError: connection timeout
```

**Diagnosis:**
```bash
# Test DNS resolution
nslookup cluster.mongodb.net

# Test connectivity
nc -zv cluster.mongodb.net 27017

# Test with mongosh
mongosh "mongodb+srv://cluster.mongodb.net/" --eval "db.version()"
```

**Solutions:**
```bash
# Solution 1: Check connection string format
# Correct: mongodb+srv://username:password@cluster.mongodb.net/database
# Password must be URL-encoded if contains special characters

# Solution 2: Check firewall
# Allow outbound connections on port 27017

# Solution 3: Use PrivateLink (production)
# MongoDB Atlas → Network Access → PrivateLink → AWS
```

---

## 🐳 Docker Issues

### Issue: Docker daemon not running

**Symptom:**
```
Cannot connect to the Docker daemon
```

**Diagnosis:**
```bash
docker info
```

**Solutions:**
```bash
# macOS: Start Docker Desktop application

# Linux: Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Check status
sudo systemctl status docker

# Verify
docker info
```

---

### Issue: Permission denied

**Symptom:**
```
Got permission denied while trying to connect to the Docker daemon socket
```

**Diagnosis:**
```bash
# Check docker group membership
groups $USER | grep docker
```

**Solutions:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Apply group changes
newgrp docker

# Or logout and login again

# Verify
docker ps
```

---

### Issue: ECR login failed

**Symptom:**
```
Error: Cannot perform an interactive login from a non TTY device
denied: Your authorization token has expired
```

**Diagnosis:**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Check region
aws configure get region
```

**Solutions:**
```bash
# Solution 1: Re-login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com

# Solution 2: Use explicit account ID
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.us-east-1.amazonaws.com

# Solution 3: Check Docker daemon is running
docker info

# Verify login
docker info | grep ecr
```

---

### Issue: Image build fails

**Symptom:**
```
ERROR [internal] load metadata for...
```

**Diagnosis:**
```bash
# Check Dockerfile exists
ls -la backend/Dockerfile

# Check Docker daemon
docker info

# Check disk space
df -h
```

**Solutions:**
```bash
# Solution 1: Clean Docker cache
docker system prune -a

# Solution 2: Build without cache
docker build --no-cache -f Dockerfile -t marin-api:dev .

# Solution 3: Check Dockerfile syntax
docker build --dry-run -f Dockerfile .

# Solution 4: Check for large files in context
du -sh backend/*

# Use .dockerignore
cat > backend/.dockerignore << EOF
*.pyc
__pycache__
.venv
node_modules
.git
EOF
```

---

## 🚀 ECS Deployment Issues

### Issue: Tasks failing to start

**Symptom:**
```
ECS tasks go from PENDING → STOPPED immediately
```

**Diagnosis:**
```bash
# Check task failures
aws ecs list-tasks --cluster marin-dev-cluster --desired-status STOPPED

# Get task details
aws ecs describe-tasks \
  --cluster marin-dev-cluster \
  --tasks TASK_ARN

# Check service events
aws ecs describe-services \
  --cluster marin-dev-cluster \
  --services marin-dev-api | jq '.services[0].events[:5]'
```

**Solutions:**
```bash
# Common issues and fixes:

# 1. IAM role issues
aws iam get-role --role-name marin-dev-ecs-task-execution

# 2. Image not found
aws ecr describe-images --repository-name marin-dev-api

# 3. Check CloudWatch logs
aws logs tail /ecs/marin-dev-api --follow

# 4. Check task definition
aws ecs describe-task-definition --task-definition marin-dev-api

# 5. Update service with new task definition
aws ecs update-service \
  --cluster marin-dev-cluster \
  --service marin-dev-api \
  --force-new-deployment
```

---

### Issue: Container health checks failing

**Symptom:**
```
Task failed container health checks
```

**Diagnosis:**
```bash
# Check CloudWatch logs
aws logs tail /ecs/marin-dev-api --follow

# Check task details
aws ecs describe-tasks \
  --cluster marin-dev-cluster \
  --tasks TASK_ARN | jq '.tasks[0].containers[0].healthStatus'
```

**Solutions:**
```bash
# Solution 1: Verify health endpoint works
docker run -d -p 8000:8000 marin-api:dev
curl http://localhost:8000/health

# Solution 2: Increase health check interval
# Update task definition health check:
# - Interval: 30s → 60s
# - Retries: 3 → 5

# Solution 3: Check security groups
aws ec2 describe-security-groups --group-ids sg-xxxxx

# Solution 4: Check application logs
aws logs tail /ecs/marin-dev-api --follow
```

---

## 💰 Cost Issues

### Issue: Unexpected high costs

**Diagnosis:**
```bash
# Get cost breakdown
aws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2025-11-04 \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE | jq

# Check running resources
aws ec2 describe-instances --filters "Name=instance-state-name,Values=running"
aws ecs list-tasks --cluster marin-dev-cluster
aws rds describe-db-instances
```

**Solutions:**
```bash
# Stop ECS services when not needed
aws ecs update-service \
  --cluster marin-dev-cluster \
  --service marin-dev-api \
  --desired-count 0

# Delete unused resources
terraform destroy -target=module.ecs

# Check for zombie resources
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Project,Values=marin

# Set up billing alerts
aws cloudwatch put-metric-alarm \
  --alarm-name billing-alert-100 \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing
```

---

## 🔍 General Debugging

### Collect all relevant information

```bash
#!/bin/bash
# debug-info.sh - Collect debugging information

echo "=== System Info ==="
uname -a
date

echo -e "\n=== AWS Configuration ==="
aws configure list
aws sts get-caller-identity

echo -e "\n=== Terraform Status ==="
cd terraform
terraform version
terraform workspace show
terraform state list | head -20

echo -e "\n=== Docker Status ==="
docker --version
docker images | grep marin
docker ps -a | grep marin

echo -e "\n=== ECR Repositories ==="
aws ecr describe-repositories | jq '.repositories[] | .repositoryName'

echo -e "\n=== ECS Clusters ==="
aws ecs list-clusters

echo -e "\n=== Recent ECS Tasks ==="
aws ecs list-tasks --cluster marin-dev-cluster --max-results 5

echo -e "\n=== MongoDB Atlas (basic test) ==="
curl -s -u "$TF_VAR_mongodb_atlas_public_key:$TF_VAR_mongodb_atlas_private_key" \
  https://cloud.mongodb.com/api/atlas/v1.0/orgs/$TF_VAR_atlas_org_id 2>&1 | head -3

echo -e "\n=== Recent CloudWatch Logs ==="
aws logs tail /ecs/marin-dev-api --since 10m | head -20

echo -e "\n=== Disk Space ==="
df -h

echo "=== Debug info collected ==="
```

---

## 📞 Getting Help

### Before asking for help, gather this info:

```bash
# 1. Error message (exact text)
# Copy full error from terminal

# 2. Command that failed
# Copy exact command you ran

# 3. Environment info
terraform workspace show
aws configure get region
docker info | grep "Server Version"

# 4. Recent logs
aws logs tail /ecs/marin-dev-api --since 30m > logs.txt

# 5. Resource state
terraform state list > state.txt
aws ecs describe-services --cluster marin-dev-cluster --services marin-dev-api > service.json

# 6. Versions
terraform version
aws --version
docker --version
python --version
```

---

## 💡 Pro Tips

1. **Enable Debug Logging**
   ```bash
   export TF_LOG=DEBUG
   export TF_LOG_PATH=terraform-debug.log
   terraform plan
   ```

2. **Use Terraform Console for Testing**
   ```bash
   terraform console
   > var.project_name
   > module.networking.vpc_id
   ```

3. **Test Locally First**
   ```bash
   docker-compose up
   curl http://localhost:8000/health
   ```

4. **Check AWS Service Health**
   ```bash
   curl https://status.aws.amazon.com/
   ```

5. **Use AWS CloudShell** (if local issues persist)
   - AWS Console → CloudShell icon (top right)
   - Pre-configured AWS CLI and credentials

---

**Last Updated:** 2025-11-04
**Marin Project** | Troubleshooting Guide v1.0
