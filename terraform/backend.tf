# Terraform Backend Configuration
# Stores state in S3 with DynamoDB locking for team collaboration

# NOTE: S3 backend temporarily disabled for validation
# Uncomment after creating S3 bucket and DynamoDB table
# terraform {
#   backend "s3" {
#     bucket         = "marin-terraform-state"
#     key            = "marin/terraform.tfstate"
#     region         = "us-east-1"
#     dynamodb_table = "terraform-state-lock"
#     encrypt        = true
#   }
# }

# Prerequisites:
# 1. Create S3 bucket: marin-terraform-state
# 2. Create DynamoDB table: terraform-state-lock with partition key "LockID" (String)
# 3. These can be created manually or via a separate bootstrap script
# 4. After resources exist, uncomment terraform block above and run `terraform init -reconfigure`
