# Terraform Quick Reference - Marin Project

**Quick reference for Terraform commands used during Marin infrastructure deployment**

---

## 🚀 Initial Setup

```bash
# Navigate to terraform directory
cd terraform

# Initialize Terraform (downloads providers, sets up modules)
terraform init

# Initialize with backend reconfiguration
terraform init -reconfigure

# Initialize without backend (local state only)
terraform init -backend=false

# Upgrade providers to latest versions
terraform init -upgrade
```

---

## ✅ Validation & Formatting

```bash
# Format all .tf files to canonical style
terraform fmt

# Format recursively (including modules)
terraform fmt -recursive

# Check if files are formatted (CI/CD)
terraform fmt -check

# Validate configuration syntax and logic
terraform validate

# Validate and show detailed errors
terraform validate -json
```

---

## 🏢 Workspace Management (Multi-Environment)

```bash
# List all workspaces
terraform workspace list

# Show current workspace
terraform workspace show

# Create new workspace
terraform workspace new dev
terraform workspace new staging
terraform workspace new prod

# Switch workspace
terraform workspace select dev

# Delete workspace (must be empty)
terraform workspace delete dev
```

---

## 📋 Planning

```bash
# Show what changes will be made (dev environment)
terraform plan -var-file=environments/dev.tfvars

# Save plan to file for review
terraform plan -var-file=environments/dev.tfvars -out=dev.tfplan

# Plan with specific target (only plan specific module)
terraform plan -target=module.iam

# Plan with detailed logs
TF_LOG=DEBUG terraform plan -var-file=environments/dev.tfvars

# Plan for destroy
terraform plan -destroy -var-file=environments/dev.tfvars
```

---

## 🔨 Applying Changes

```bash
# Apply changes (prompts for confirmation)
terraform apply -var-file=environments/dev.tfvars

# Apply from saved plan file (no prompt)
terraform apply dev.tfplan

# Apply with auto-approve (dangerous - use carefully!)
terraform apply -var-file=environments/dev.tfvars -auto-approve

# Apply specific target only
terraform apply -target=module.iam -var-file=environments/dev.tfvars

# Apply with parallelism control (default 10)
terraform apply -parallelism=5 -var-file=environments/dev.tfvars
```

---

## 💥 Destroying Resources

```bash
# Destroy all resources (prompts for confirmation)
terraform destroy -var-file=environments/dev.tfvars

# Destroy with auto-approve
terraform destroy -var-file=environments/dev.tfvars -auto-approve

# Destroy specific resource
terraform destroy -target=module.ecs -var-file=environments/dev.tfvars

# Show destroy plan without destroying
terraform plan -destroy -var-file=environments/dev.tfvars
```

---

## 📊 Outputs

```bash
# Show all outputs
terraform output

# Show specific output
terraform output vpc_id

# Show output in JSON format
terraform output -json

# Show output in raw format (no quotes)
terraform output -raw ecr_api_repository_url

# Use outputs in scripts
export VPC_ID=$(terraform output -raw vpc_id)
export API_REPO=$(terraform output -raw ecr_api_repository_url)
```

---

## 🔍 State Management

```bash
# List resources in state
terraform state list

# Show details of specific resource
terraform state show module.iam.aws_iam_role.ecs_task_execution

# Remove resource from state (doesn't destroy resource)
terraform state rm module.database.mongodbatlas_cluster.main

# Move resource in state (rename)
terraform state mv module.old_name module.new_name

# Pull current state from backend
terraform state pull > state-backup.json

# Push state to backend (dangerous!)
terraform state push state-backup.json

# Refresh state from real infrastructure
terraform refresh -var-file=environments/dev.tfvars
```

---

## 🔒 State Locking

```bash
# Force unlock state (if stuck)
terraform force-unlock <LOCK_ID>

# Example:
terraform force-unlock a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

## 📥 Importing Existing Resources

```bash
# Import existing AWS VPC
terraform import module.networking.aws_vpc.main vpc-12345678

# Import existing S3 bucket
terraform import module.storage.aws_s3_bucket.recordings marin-dev-call-recordings

# Import MongoDB Atlas cluster
terraform import module.database.mongodbatlas_cluster.main project-id-cluster-name

# Import IAM role
terraform import module.iam.aws_iam_role.ecs_task_execution marin-dev-ecs-task-execution
```

---

## 🎯 Targeting Specific Resources

```bash
# Plan/Apply only specific module
terraform plan -target=module.networking
terraform apply -target=module.networking

# Plan/Apply multiple targets
terraform plan \
  -target=module.storage \
  -target=module.database

# Target specific resource in module
terraform apply -target=module.iam.aws_iam_role.api_task
```

---

## 🔬 Inspection & Debugging

```bash
# Show Terraform version
terraform version

# Show providers
terraform providers

# Show provider schema
terraform providers schema

# Validate providers
terraform providers lock

# Show plan in detail
terraform show dev.tfplan

# Show state in human-readable format
terraform show

# Graph dependencies (requires graphviz)
terraform graph | dot -Tpng > graph.png

# Enable debug logging
export TF_LOG=DEBUG
export TF_LOG_PATH=terraform-debug.log
terraform plan -var-file=environments/dev.tfvars

# Disable debug logging
unset TF_LOG
unset TF_LOG_PATH
```

---

## 🔧 Module Management

```bash
# Get/update modules
terraform get

# Update modules to latest versions
terraform get -update

# List installed modules
ls -la .terraform/modules/
```

---

## 🌍 Environment-Specific Deployments

```bash
# === DEVELOPMENT ===
terraform workspace select dev || terraform workspace new dev
terraform plan -var-file=environments/dev.tfvars
terraform apply -var-file=environments/dev.tfvars

# === STAGING ===
terraform workspace select staging || terraform workspace new staging
terraform plan -var-file=environments/staging.tfvars
terraform apply -var-file=environments/staging.tfvars

# === PRODUCTION ===
terraform workspace select prod || terraform workspace new prod
terraform plan -var-file=environments/prod.tfvars -out=prod.tfplan
terraform show prod.tfplan  # Review carefully!
terraform apply prod.tfplan
```

---

## 📝 Working with Variables

```bash
# Set via environment variable
export TF_VAR_project_name="marin"
export TF_VAR_environment="dev"
terraform plan

# Set via command line
terraform plan -var="project_name=marin" -var="environment=dev"

# Set via file
terraform plan -var-file=environments/dev.tfvars

# Set via multiple files
terraform plan \
  -var-file=environments/dev.tfvars \
  -var-file=secrets.tfvars

# Show variable values (from plan)
terraform console
> var.project_name
> var.environment
```

---

## 🧪 Testing & Validation

```bash
# Full validation workflow
terraform fmt -recursive
terraform init
terraform validate
terraform plan -var-file=environments/dev.tfvars

# Check formatting without changing files
terraform fmt -check -recursive

# Validate with detailed error output
terraform validate -json | jq .

# Dry run (plan without state file)
terraform plan -refresh=false
```

---

## 🛠️ Common Workflows

### Initial Deployment

```bash
cd terraform
terraform init
terraform workspace new dev
terraform fmt -recursive
terraform validate
terraform plan -var-file=environments/dev.tfvars -out=dev.tfplan
terraform apply dev.tfplan
```

### Update Existing Infrastructure

```bash
cd terraform
terraform workspace select dev
git pull origin main
terraform init -upgrade  # Update providers if needed
terraform plan -var-file=environments/dev.tfvars
terraform apply -var-file=environments/dev.tfvars
```

### Switch Between Environments

```bash
# Check current environment
terraform workspace show

# Switch to staging
terraform workspace select staging
terraform plan -var-file=environments/staging.tfvars

# Back to dev
terraform workspace select dev
```

### Disaster Recovery (Rebuild from State)

```bash
# Download state backup
aws s3 cp s3://marin-terraform-state/env:/dev/terraform.tfstate ./state-backup.json

# Rebuild infrastructure
terraform workspace select dev
terraform init
terraform plan -var-file=environments/dev.tfvars
# Review plan matches expected infrastructure
terraform apply -var-file=environments/dev.tfvars
```

---

## 🚨 Emergency Procedures

### Unlock Stuck State

```bash
# Get lock ID from error message, then:
terraform force-unlock a1b2c3d4-e5f6-7890-abcd-ef1234567890

# If Terraform unlock fails, delete from DynamoDB:
aws dynamodb delete-item \
  --table-name terraform-state-lock \
  --key '{"LockID":{"S":"marin-terraform-state/env:/dev/terraform.tfstate"}}'
```

### Recover from Bad Apply

```bash
# Option 1: Rollback to previous state
aws s3 ls s3://marin-terraform-state/env:/dev/ --recursive
aws s3 cp s3://marin-terraform-state/env:/dev/terraform.tfstate.1699045200.backup ./
terraform state push ./terraform.tfstate.1699045200.backup

# Option 2: Taint and recreate resource
terraform taint module.ecs.aws_ecs_service.api
terraform apply -var-file=environments/dev.tfvars

# Option 3: Destroy and recreate specific module
terraform destroy -target=module.ecs -var-file=environments/dev.tfvars
terraform apply -target=module.ecs -var-file=environments/dev.tfvars
```

### Fix State Drift

```bash
# Refresh state to match reality
terraform refresh -var-file=environments/dev.tfvars

# Or force recreation
terraform taint aws_instance.example
terraform apply -var-file=environments/dev.tfvars

# Import manually created resource
terraform import module.networking.aws_vpc.main vpc-12345678
```

---

## 💡 Pro Tips

**Aliases** (add to ~/.bashrc or ~/.zshrc):
```bash
alias tf='terraform'
alias tfi='terraform init'
alias tfp='terraform plan'
alias tfa='terraform apply'
alias tfd='terraform destroy'
alias tfo='terraform output'
alias tfw='terraform workspace'

# Environment-specific aliases
alias tfdev='terraform workspace select dev && terraform'
alias tfstg='terraform workspace select staging && terraform'
alias tfprd='terraform workspace select prod && terraform'
```

**Safety Checks**:
```bash
# Always verify workspace before apply
terraform workspace show

# Always review plan before apply
terraform plan -var-file=environments/prod.tfvars -out=prod.tfplan
terraform show prod.tfplan | less  # Review carefully!
terraform apply prod.tfplan

# Use explicit plan files for production
# Never use auto-approve in production!
```

**Performance**:
```bash
# Reduce parallelism if hitting rate limits
terraform apply -parallelism=2

# Skip refresh for faster planning (use carefully)
terraform plan -refresh=false

# Target specific modules to speed up
terraform apply -target=module.iam
```

---

## 🔗 Resource Addressing

```bash
# Format: module.MODULE_NAME.RESOURCE_TYPE.RESOURCE_NAME

# Examples:
module.networking.aws_vpc.main
module.storage.aws_s3_bucket.recordings
module.database.mongodbatlas_cluster.main
module.iam.aws_iam_role.ecs_task_execution[0]

# List all resources
terraform state list

# Show resource details
terraform state show module.iam.aws_iam_role.api_task
```

---

## 📚 Additional Commands

```bash
# Generate and show backend configuration
terraform output -json > outputs.json

# Test module individually
cd modules/iam
terraform init
terraform plan

# Convert HCL to JSON
terraform show -json > plan.json

# Pretty print JSON output
terraform output -json | jq .

# Count resources to be created
terraform plan -var-file=environments/dev.tfvars | grep "will be created"
```

---

## 🎓 Learning Resources

- `terraform -help` - General help
- `terraform COMMAND -help` - Command-specific help
- `terraform console` - Interactive console to test expressions
- [Terraform Registry](https://registry.terraform.io/) - Provider docs
- [Terraform Language](https://www.terraform.io/language) - HCL syntax

---

**Last Updated:** 2025-11-04
**Marin Project** | Terraform >= 1.5.0
