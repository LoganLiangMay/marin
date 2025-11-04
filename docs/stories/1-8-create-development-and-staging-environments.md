# Story 1.8: Create Development and Staging Environments

**Status:** drafted

## Story

**As a** DevOps engineer,
**I want** separate development and staging environments with isolated resources,
**So that** I can test changes without affecting other environments and validate deployments before production.

## Acceptance Criteria

1. **Terraform Workspaces** created for environment isolation:
   - `dev` workspace configured
   - `staging` workspace configured
   - `prod` workspace configured (prepared but not deployed)

2. **Environment-specific variable files** created:
   - `terraform/environments/dev.tfvars` with dev-specific settings
   - `terraform/environments/staging.tfvars` with staging settings
   - `terraform/environments/prod.tfvars` with production settings

3. **Resource naming** includes environment suffix:
   - All resources named: `{project_name}-{environment}-{resource_type}`
   - Examples: `marin-dev-api-service`, `marin-staging-worker-task`

4. **Environment-specific sizing** configured:
   - Dev environment uses smaller, cost-effective instance sizes
   - Staging environment mirrors production configuration exactly
   - Prod environment uses production-grade sizing

5. **Secrets Manager** secrets created per environment:
   - Dev: `dev/audio-pipeline/*` secrets
   - Staging: `staging/audio-pipeline/*` secrets
   - Prod: `prod/audio-pipeline/*` secrets (prepared)

6. **CloudWatch Log Groups** created per environment:
   - `/ecs/dev/api`, `/ecs/dev/worker`
   - `/ecs/staging/api`, `/ecs/staging/worker`
   - Log retention: 7 days (dev), 14 days (staging), 30 days (prod)

7. **Documentation** added to README:
   - How to switch between environments (`terraform workspace select`)
   - How to deploy to each environment
   - Environment-specific configuration guide
   - Cost comparison table

8. **All environments** successfully deploy via Terraform:
   - `terraform workspace select dev && terraform apply` succeeds
   - `terraform workspace select staging && terraform apply` succeeds
   - No resource conflicts between environments

## Tasks / Subtasks

- [ ] **Task 1: Create Terraform workspace structure** (AC: #1)
  - [ ] Create dev workspace: `terraform workspace new dev`
  - [ ] Create staging workspace: `terraform workspace new staging`
  - [ ] Create prod workspace: `terraform workspace new prod`
  - [ ] Document workspace switching in README

- [ ] **Task 2: Create environment-specific tfvars files** (AC: #2)
  - [ ] Create `terraform/environments/` directory
  - [ ] Create `dev.tfvars` with dev settings (small instances)
  - [ ] Create `staging.tfvars` with staging settings (production-like)
  - [ ] Create `prod.tfvars` with production settings (optimized)
  - [ ] Add `.tfvars.example` template

- [ ] **Task 3: Update Terraform configuration for environment awareness** (AC: #3)
  - [ ] Add `environment` variable to all modules
  - [ ] Update resource naming to include `${var.environment}`
  - [ ] Ensure all resources use environment-aware naming
  - [ ] Update outputs to include environment context

- [ ] **Task 4: Configure environment-specific resource sizing** (AC: #4)
  - [ ] Dev: ECS tasks (256 CPU, 512 MB), MongoDB M0, cache.t4g.micro
  - [ ] Staging: ECS tasks (512 CPU, 1024 MB), MongoDB M10, cache.t4g.small
  - [ ] Prod: ECS tasks (1024 CPU, 2048 MB), MongoDB M20, cache.t4g.medium
  - [ ] Add sizing variables to tfvars files

- [ ] **Task 5: Create environment-specific Secrets Manager structure** (AC: #5)
  - [ ] Update secrets naming: `{environment}/audio-pipeline/mongodb-uri`
  - [ ] Create placeholder secrets for dev environment
  - [ ] Create placeholder secrets for staging environment
  - [ ] Document secret rotation policy per environment

- [ ] **Task 6: Configure CloudWatch Log Groups per environment** (AC: #6)
  - [ ] Create log groups with environment prefix: `/ecs/{env}/api`
  - [ ] Set retention: 7 days (dev), 14 days (staging), 30 days (prod)
  - [ ] Enable log insights for all environments
  - [ ] Add log group ARNs to outputs

- [ ] **Task 7: Document environment management** (AC: #7)
  - [ ] Add "Environment Management" section to README
  - [ ] Document workspace commands and deployment workflow
  - [ ] Create cost comparison table for all environments
  - [ ] Add troubleshooting guide for common environment issues

- [ ] **Task 8: Deploy and validate environments** (AC: #8)
  - [ ] Deploy dev environment: `terraform workspace select dev && terraform apply`
  - [ ] Deploy staging environment: `terraform workspace select staging && terraform apply`
  - [ ] Verify no resource name conflicts
  - [ ] Verify resources are properly isolated
  - [ ] Document deployment results

- [ ] **Task 9: Update CI/CD workflows for multi-environment support**
  - [ ] Update GitHub Actions to support environment selection
  - [ ] Add environment-specific deployment jobs
  - [ ] Configure GitHub Environments (dev, staging, prod)
  - [ ] Add manual approval for staging/prod deployments

## Technical Notes

### Terraform Workspace Strategy

Workspaces provide logical separation of state files while using the same configuration:

```bash
# Create and switch to dev workspace
terraform workspace new dev
terraform workspace select dev
terraform apply -var-file=environments/dev.tfvars

# Switch to staging
terraform workspace select staging
terraform apply -var-file=environments/staging.tfvars
```

### Environment Variable Pattern

```hcl
# In main.tf
module "storage" {
  source = "./modules/storage"

  project_name = var.project_name
  environment  = terraform.workspace  # Auto-detects current workspace

  # Environment-specific overrides from tfvars
  recordings_bucket_name = var.recordings_bucket_name
}
```

### Resource Naming Convention

All resources follow: `{project}-{environment}-{resource}`

Examples:
- VPC: `marin-dev-vpc`, `marin-staging-vpc`
- ECS Cluster: `marin-dev-ecs-cluster`, `marin-staging-ecs-cluster`
- S3 Bucket: `marin-dev-call-recordings`, `marin-staging-call-recordings`

### Cost Comparison

| Resource | Dev (Monthly) | Staging (Monthly) | Prod (Monthly) |
|----------|---------------|-------------------|----------------|
| ECS Fargate | $15 | $30 | $60 |
| MongoDB Atlas | Free (M0) | $57 (M10) | $140 (M20) |
| ElastiCache Redis | $12 | $25 | $50 |
| S3 Storage | $1 | $5 | $20 |
| OpenSearch | $350 | $500 | $700 |
| **Total** | **~$378** | **~$617** | **~$970** |

### Environment-Specific Settings

**Development:**
- Purpose: Feature development and testing
- Data: Synthetic/test data only
- Uptime: Business hours (can be stopped overnight)
- Backups: Not required
- Monitoring: Basic CloudWatch metrics

**Staging:**
- Purpose: Pre-production validation and QA
- Data: Anonymized production data
- Uptime: 24/7 (matches production)
- Backups: Daily
- Monitoring: Full monitoring (same as prod)

**Production:**
- Purpose: Live customer-facing system
- Data: Real production data
- Uptime: 24/7 with HA
- Backups: Continuous with point-in-time recovery
- Monitoring: Full monitoring with alerting

## Prerequisites

- Story 1.1: Terraform project structure (done)
- Story 1.2: VPC and networking (done)
- Story 1.3: S3 buckets (done)
- Story 1.4: MongoDB Atlas (done)
- Story 1.5: Redis ElastiCache (done)
- Story 1.6: IAM roles (ready-for-dev)
- Story 1.7: GitHub Actions (ready-for-dev)

## Dependencies

**Upstream:**
- All previous Epic 1 stories must be complete
- Terraform backend (S3 bucket) must exist

**Downstream:**
- Story 2.6: API endpoints will use environment-specific configs
- Story 7.1: Production hardening will build on prod workspace

## Testing Strategy

1. **Workspace Isolation Test:**
   - Create resources in dev workspace
   - Switch to staging workspace
   - Verify dev resources don't appear in staging plan
   - Verify no state conflicts

2. **Deployment Test:**
   - Deploy dev environment
   - Verify all resources created with `dev` suffix
   - Deploy staging environment
   - Verify all resources created with `staging` suffix
   - Verify no naming conflicts

3. **Configuration Test:**
   - Verify dev uses small instance sizes
   - Verify staging uses production-like sizes
   - Verify environment variables are correctly applied

4. **Secrets Management Test:**
   - Create test secret in dev: `dev/audio-pipeline/test`
   - Verify secret is accessible from dev ECS tasks
   - Verify staging tasks cannot access dev secrets

## Risks and Mitigations

**Risk:** Accidentally deploying to wrong environment
- **Mitigation:** Require explicit workspace selection in CI/CD, add confirmation prompts

**Risk:** Cross-environment resource conflicts (e.g., S3 bucket names)
- **Mitigation:** Use environment prefix in all global resource names

**Risk:** Configuration drift between staging and production
- **Mitigation:** Use identical tfvars for staging and prod, only diff sizing params

**Risk:** Cost overruns from multiple environments
- **Mitigation:** Implement auto-stop for dev environment during off-hours

## Definition of Done

- [ ] Three Terraform workspaces created (dev, staging, prod)
- [ ] Environment-specific tfvars files exist and are documented
- [ ] All resources include environment suffix in naming
- [ ] Dev environment successfully deployed with cost-optimized sizing
- [ ] Staging environment successfully deployed with prod-like config
- [ ] Secrets Manager has environment-specific secret hierarchies
- [ ] CloudWatch logs are organized by environment
- [ ] README updated with environment management documentation
- [ ] CI/CD workflows support environment selection
- [ ] No resource name conflicts between environments
- [ ] Team can easily switch and deploy to any environment

---

**Story Points:** 5
**Priority:** High (blocks production deployment)
**Epic:** 1 - Foundation & Infrastructure
**Created:** 2025-11-04
**Estimated Duration:** 1-2 days
