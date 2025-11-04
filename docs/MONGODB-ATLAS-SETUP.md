# MongoDB Atlas Setup Guide for Marin Project

**Last Updated:** 2025-11-04
**Version:** 1.0

---

## Table of Contents

1. [Overview](#overview)
2. [Account Creation](#account-creation)
3. [Organization Setup](#organization-setup)
4. [API Key Generation](#api-key-generation)
5. [IP Access List Configuration](#ip-access-list-configuration)
6. [Terraform Configuration](#terraform-configuration)
7. [Manual Cluster Creation (Alternative)](#manual-cluster-creation-alternative)
8. [Verification](#verification)
9. [Troubleshooting](#troubleshooting)

---

## Overview

MongoDB Atlas is a fully managed cloud database service that provides automated backups, monitoring, and scaling. The Marin project uses MongoDB Atlas for storing:

- Call metadata (call_id, status, timestamps)
- Transcription results
- AI analysis results
- Contact information (with deduplication)
- Daily insights aggregations
- Quality metrics and alerts

### Cluster Tiers by Environment

| Environment | Tier | RAM | Storage | Monthly Cost |
|-------------|------|-----|---------|--------------|
| **Development** | M0 (Free) | 512 MB | Shared | $0 |
| **Staging** | M10 | 2 GB | 10 GB | ~$57 |
| **Production** | M20 | 4 GB | 20 GB | ~$150 |

*Note: Costs are estimates for us-east-1 region. See [MongoDB Atlas Pricing](https://www.mongodb.com/pricing) for exact pricing.*

---

## Account Creation

### Step 1: Sign Up

1. Navigate to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Click "Try Free" or "Get started free"
3. Choose sign-up method:
   - Email + Password
   - Google account
   - GitHub account

### Step 2: Verify Email

1. Check your email for verification link
2. Click the link to verify your account
3. Log in to MongoDB Atlas

### Step 3: Complete Profile

1. Enter your details:
   - First Name
   - Last Name
   - Company Name (optional)
   - Job Role
2. Click "Continue"

### Step 4: Select Goal

1. Choose "Build a new application"
2. Select programming language: "Python"
3. Click "Finish"

---

## Organization Setup

MongoDB Atlas uses a hierarchy: **Organization → Projects → Clusters**

### Step 1: Create Organization

1. After login, click "Organizations" in the left sidebar
2. Click "Create New Organization"
3. Enter Organization Name: `Marin Audio Pipeline` (or your choice)
4. Choose Cloud Service: "MongoDB Atlas"
5. Click "Next"

### Step 2: Add Members (Optional)

1. Add team members by email (optional for solo projects)
2. Assign roles:
   - **Organization Owner**: Full control
   - **Organization Project Creator**: Can create projects
   - **Organization Read Only**: View-only access
3. Click "Create Organization"

### Step 3: Note Organization ID

This is critical for Terraform!

1. Click on your organization name
2. Go to "Settings" (or "Organization Settings")
3. Find "Organization ID" (format: `5f4a1b2c3d4e5f6a7b8c9d0e`)
4. **Copy and save this ID** - you'll need it for Terraform

---

## API Key Generation

API keys allow Terraform to programmatically manage MongoDB Atlas resources.

### Step 1: Navigate to API Keys

1. In your organization, click "Access Manager" in the left sidebar
2. Click the "API Keys" tab
3. Click "Create API Key"

### Step 2: Configure API Key

1. **Description:** `Terraform Marin` (or descriptive name)
2. **Organization Permissions:** Select "Organization Project Creator"
   - This allows Terraform to create projects and clusters
   - For production, consider more restrictive permissions

3. Click "Next"

### Step 3: Save Keys

**CRITICAL:** You'll only see the private key once!

1. **Public Key:** Displayed and can be viewed later
2. **Private Key:** Displayed once - copy immediately

```
Public Key:  abcd1234
Private Key: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Store these securely:**
- Password manager (1Password, LastPass, Bitwarden)
- Secure notes
- Environment variable file (NOT in version control!)

### Step 4: Add IP Access List

1. Add IP addresses allowed to use this API key
2. For development, you can use:
   - **Your current IP:** Click "Add Current IP Address"
   - **Any IP (less secure):** Enter `0.0.0.0/0`
   - **Specific CIDR:** Enter your office/VPN CIDR

3. Click "Done"

### Step 5: Verify API Key

Test your API key:

```bash
# Set environment variables
export ATLAS_PUBLIC_KEY="your-public-key"
export ATLAS_PRIVATE_KEY="your-private-key"
export ATLAS_ORG_ID="your-org-id"

# Test API call
curl -u "$ATLAS_PUBLIC_KEY:$ATLAS_PRIVATE_KEY" \
  https://cloud.mongodb.com/api/atlas/v1.0/orgs/$ATLAS_ORG_ID
```

**Expected response:** JSON with organization details

---

## IP Access List Configuration

MongoDB Atlas requires IP whitelisting for database connections.

### For Development (Permissive)

Allow connections from anywhere (less secure, convenient for development):

1. Navigate to: Network Access (under Security)
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere"
4. IP Address will be set to `0.0.0.0/0`
5. Click "Confirm"

### For Production (Restrictive)

Allow connections only from your VPC:

1. Navigate to: Network Access
2. Click "Add IP Address"
3. Enter your VPC CIDR: `10.0.0.0/16` (from Terraform)
4. Comment: "Marin VPC"
5. Click "Confirm"

**Note:** Terraform will create a PrivateLink connection, which is more secure than IP whitelisting.

---

## Terraform Configuration

### Method 1: Environment Variables (Recommended)

```bash
# Add to ~/.bashrc or ~/.zshrc
export TF_VAR_mongodb_atlas_public_key="your-public-key"
export TF_VAR_mongodb_atlas_private_key="your-private-key"
export TF_VAR_atlas_org_id="your-org-id"

# Reload shell
source ~/.bashrc  # or source ~/.zshrc

# Verify
echo $TF_VAR_mongodb_atlas_public_key
```

### Method 2: terraform.tfvars File

```bash
# Create terraform.tfvars in terraform/ directory
cat > terraform/terraform.tfvars << 'EOF'
# MongoDB Atlas Configuration
mongodb_atlas_public_key  = "your-public-key"
mongodb_atlas_private_key = "your-private-key"
atlas_org_id              = "your-org-id"

# Project Configuration
project_name = "marin"
environment  = "dev"
aws_region   = "us-east-1"
EOF

# IMPORTANT: Verify .gitignore excludes this file
grep terraform.tfvars .gitignore
```

### Method 3: Terraform Cloud/Enterprise

If using Terraform Cloud:

1. Navigate to your workspace
2. Go to Variables
3. Add as Terraform Variables (marked as sensitive):
   - `mongodb_atlas_public_key`
   - `mongodb_atlas_private_key`
   - `atlas_org_id`

---

## Manual Cluster Creation (Alternative)

If you prefer to create the cluster manually instead of using Terraform:

### Step 1: Create Project

1. In organization, click "New Project"
2. Project Name: `marin-dev` (or `marin-staging`, `marin-prod`)
3. Click "Next"
4. Add members (optional)
5. Click "Create Project"

### Step 2: Build Cluster

1. Click "Build a Database"
2. Choose deployment type:

**For Development:**
- Select "Shared" (M0 Free Tier)
- Provider: AWS
- Region: us-east-1 (N. Virginia)
- Cluster Name: `marin-dev-cluster`

**For Staging/Production:**
- Select "Dedicated"
- Provider: AWS
- Region: us-east-1
- Cluster Tier: M10 (staging) or M20 (production)
- Cluster Name: `marin-staging-cluster` or `marin-prod-cluster`

3. Additional Settings:
   - MongoDB Version: 7.0 (latest stable)
   - Backup: Enabled (for M10+)
   - Advanced Configuration: Default

4. Click "Create Deployment"

Wait 5-10 minutes for cluster creation.

### Step 3: Create Database User

1. Click "Database Access" under Security
2. Click "Add New Database User"
3. Authentication Method: "Password"
4. Username: `marin_app`
5. Password: Generate secure password (save it!)
6. Database User Privileges: "Atlas admin" (or custom role)
7. Click "Add User"

### Step 4: Get Connection String

1. Click "Database" in left sidebar
2. Click "Connect" on your cluster
3. Choose connection method: "Connect your application"
4. Driver: Python
5. Copy connection string:
   ```
   mongodb+srv://marin_app:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with the password from Step 3

### Step 5: Store in AWS Secrets Manager

```bash
# Create secret in AWS Secrets Manager
aws secretsmanager create-secret \
  --name dev/audio-pipeline/mongodb-uri \
  --secret-string '{"uri":"mongodb+srv://marin_app:password@cluster.mongodb.net/audio_pipeline?retryWrites=true&w=majority"}' \
  --region us-east-1
```

### Step 6: Create Database and Collections

Using MongoDB Compass or mongosh:

```javascript
// Connect to cluster
mongosh "mongodb+srv://cluster.mongodb.net/" --username marin_app

// Create database
use audio_pipeline

// Create collections with validation
db.createCollection("calls", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["call_id", "status", "created_at"],
      properties: {
        call_id: { bsonType: "string" },
        status: { bsonType: "string", enum: ["uploaded", "transcribing", "analyzing", "complete", "failed"] },
        created_at: { bsonType: "date" }
      }
    }
  }
})

db.createCollection("contacts")
db.createCollection("insights_aggregated")
db.createCollection("processing_metrics")

// Create indexes
db.calls.createIndex({ call_id: 1 }, { unique: true })
db.calls.createIndex({ status: 1 })
db.calls.createIndex({ "metadata.company_name": 1 })
db.calls.createIndex({ created_at: -1 })

db.contacts.createIndex({ contact_id: 1 }, { unique: true })
db.contacts.createIndex({ company: 1 })

db.insights_aggregated.createIndex({ date: -1, company_name: 1 })
```

---

## Verification

### Verify API Access

```bash
# Test API key permissions
curl -u "$TF_VAR_mongodb_atlas_public_key:$TF_VAR_mongodb_atlas_private_key" \
  https://cloud.mongodb.com/api/atlas/v1.0/orgs/$TF_VAR_atlas_org_id/projects

# Should return JSON array of projects
```

### Verify Database Connection

```bash
# Using mongosh
mongosh "your-connection-string"

# Or using Python
python3 << 'EOF'
from pymongo import MongoClient

uri = "your-connection-string"
client = MongoClient(uri)

# Test connection
client.admin.command('ping')
print("Successfully connected to MongoDB!")

# List databases
print(client.list_database_names())
EOF
```

### Verify Terraform Can Create Resources

```bash
cd terraform

# Initialize
terraform init

# Validate
terraform validate

# Plan (doesn't create anything, just shows what would be created)
terraform plan -var-file=environments/dev.tfvars
```

Expected output should show MongoDB Atlas project and cluster resources.

---

## Troubleshooting

### Issue: API Key Authentication Failed

**Error:**
```
401 (Unauthorized): Invalid API Key
```

**Solutions:**
1. Verify API key is correct:
   ```bash
   echo $TF_VAR_mongodb_atlas_public_key
   echo $TF_VAR_mongodb_atlas_private_key
   ```

2. Check API key hasn't expired or been deleted
3. Verify organization ID is correct
4. Check IP access list includes your current IP

### Issue: IP Not Whitelisted

**Error:**
```
Error: IP address XXX.XXX.XXX.XXX is not allowed to access this resource
```

**Solution:**
1. Get your current IP:
   ```bash
   curl ifconfig.me
   ```

2. Add to MongoDB Atlas:
   - Navigate to: Network Access
   - Click "Add IP Address"
   - Enter your IP or use "Add Current IP Address"

### Issue: Insufficient Permissions

**Error:**
```
Error: Insufficient permissions to create project
```

**Solution:**
1. Verify API key has "Organization Project Creator" role
2. In MongoDB Atlas:
   - Organization → Access Manager → API Keys
   - Find your key, check permissions
   - Edit if needed to add "Organization Project Creator"

### Issue: Connection Timeout

**Error:**
```
Error connecting to MongoDB: connection timeout
```

**Solutions:**
1. Check network access list (IP whitelist)
2. Verify VPC PrivateLink is configured (for production)
3. Check security groups allow outbound to MongoDB (port 27017)
4. Test connection from EC2 instance in VPC:
   ```bash
   mongosh "your-connection-string" --eval "db.adminCommand('ping')"
   ```

### Issue: Cluster Creation Fails in Terraform

**Error:**
```
Error creating MongoDB Atlas Cluster: Cluster name already exists
```

**Solution:**
1. Check if cluster already exists in MongoDB Atlas console
2. Either:
   - Delete existing cluster (if safe)
   - Import existing cluster into Terraform state:
     ```bash
     terraform import module.database.mongodbatlas_cluster.main project-id-cluster-name
     ```

### Issue: Database User Authentication Failed

**Error:**
```
MongoServerError: Authentication failed
```

**Solutions:**
1. Verify username/password are correct
2. Check database user exists:
   - MongoDB Atlas → Database Access
   - Verify user is listed
3. Check user has correct privileges
4. Try resetting password:
   - Edit user → New password → Update user

---

## Best Practices

### Security

1. **Never commit API keys** to version control
   - Use `.gitignore` for `terraform.tfvars`
   - Use environment variables
   - Use secret management systems

2. **Use restrictive IP access lists** for production
   - Whitelist VPC CIDR only
   - Use PrivateLink for enhanced security

3. **Rotate API keys regularly**
   - Create new key
   - Update Terraform configuration
   - Delete old key

4. **Use separate organizations** for different environments
   - Development: One organization
   - Production: Separate organization

### Performance

1. **Choose appropriate cluster tier**
   - M0: Development/testing only
   - M10+: Production workloads

2. **Create indexes** for common queries
   - `call_id` (unique)
   - `status`, `created_at`, `company_name`

3. **Monitor performance metrics**
   - MongoDB Atlas → Metrics
   - Check CPU, memory, disk usage
   - Set up alerts for threshold breaches

4. **Enable connection pooling** in application
   - FastAPI: Use single MongoDB client
   - Configure pool size: min=10, max=50

### Cost Optimization

1. **Use M0 free tier** for development
2. **Auto-pause clusters** when not in use (M10+ Atlas feature)
3. **Monitor data growth**
   - Set up storage alerts
   - Implement data retention policies
4. **Review and optimize queries**
   - Use Atlas Performance Advisor
   - Identify slow queries

---

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Atlas Terraform Provider](https://registry.terraform.io/providers/mongodb/mongodbatlas/latest/docs)
- [MongoDB University (Free Training)](https://university.mongodb.com/)
- [MongoDB Atlas Pricing](https://www.mongodb.com/pricing)
- [MongoDB Connection String Format](https://docs.mongodb.com/manual/reference/connection-string/)

---

## Support

For MongoDB Atlas issues:
- [MongoDB Community Forums](https://www.mongodb.com/community/forums/)
- [MongoDB Support Portal](https://support.mongodb.com/) (paid tiers)
- [Stack Overflow - mongodb-atlas tag](https://stackoverflow.com/questions/tagged/mongodb-atlas)

For Marin project MongoDB issues:
- Check MongoDB Atlas Metrics dashboard
- Review application logs
- Create GitHub issue

---

**Document Version:** 1.0
**Last Updated:** 2025-11-04
**Maintained By:** Marin Development Team
