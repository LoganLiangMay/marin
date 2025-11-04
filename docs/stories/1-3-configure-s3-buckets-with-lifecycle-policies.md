# Story 1.3: Configure S3 Buckets with Lifecycle Policies

Status: review

## Story

As a DevOps engineer,
I want S3 buckets for audio and transcripts with proper lifecycle policies,
So that files are stored cost-effectively with appropriate retention.

## Acceptance Criteria

1. S3 bucket created: `{company}-call-recordings` with versioning enabled
2. S3 bucket created: `{company}-call-transcripts` with versioning enabled
3. Folder structure enforced via application: `/{year}/{month}/{day}/{call_id}.{ext}`
4. Server-side encryption enabled (AES-256, AWS-managed keys)
5. Block all public access policies applied
6. Lifecycle policy on recordings: transition to Glacier after 365 days, delete after 1,095 days
7. Lifecycle policy on transcripts: retain in Standard class, delete after 1,095 days
8. CORS configuration allows dashboard origin for presigned URL playback
9. CloudTrail enabled for S3 data events (optional, for audit)
10. Terraform outputs: bucket ARNs and names

## Tasks / Subtasks

- [x] **Task 1: Create S3 bucket for call recordings** (AC: #1, #4, #5)
  - [x] Create S3 bucket resource with globally unique name
  - [x] Enable versioning on recordings bucket
  - [x] Enable server-side encryption (AES-256, AWS-managed keys)
  - [x] Apply block all public access policies
  - [x] Add resource tags (Project, Environment, ManagedBy)

- [x] **Task 2: Create S3 bucket for transcripts** (AC: #2, #4, #5)
  - [x] Create S3 bucket resource with globally unique name
  - [x] Enable versioning on transcripts bucket
  - [x] Enable server-side encryption (AES-256, AWS-managed keys)
  - [x] Apply block all public access policies
  - [x] Add resource tags (Project, Environment, ManagedBy)

- [x] **Task 3: Configure lifecycle policies** (AC: #6, #7)
  - [x] Create lifecycle rule for recordings: Glacier transition after 365 days
  - [x] Create lifecycle rule for recordings: Expiration after 1,095 days (3 years)
  - [x] Create lifecycle rule for transcripts: Expiration after 1,095 days (3 years)
  - [x] Document folder structure pattern in README: `/{year}/{month}/{day}/{call_id}.{ext}`

- [x] **Task 4: Configure CORS for audio playback** (AC: #8)
  - [x] Define CORS configuration allowing dashboard origin
  - [x] Allow GET method for presigned URL access
  - [x] Configure allowed headers and expose headers
  - [x] Set max age for preflight requests

- [x] **Task 5: Configure CloudTrail for S3 data events** (AC: #9)
  - [x] Create CloudTrail trail for S3 data events (optional)
  - [x] Configure logging for both buckets
  - [x] Store CloudTrail logs in separate S3 bucket

- [x] **Task 6: Define module outputs** (AC: #10)
  - [x] Output recordings bucket ARN and name
  - [x] Output transcripts bucket ARN and name
  - [x] Output bucket IDs for cross-module references

- [x] **Task 7: Validate Terraform configuration**
  - [x] Run `terraform fmt` to format code
  - [x] Run `terraform validate` to check syntax
  - [x] Run `terraform plan` to preview changes (skipped - requires backend initialization)
  - [x] Document any validation warnings (none - validation successful)

## Dev Notes

### Architecture Context

**Storage Requirements**:
- Two separate S3 buckets for different data types (recordings vs transcripts)
- Cost optimization through lifecycle policies (Glacier after 1 year saves ~80% storage costs)
- Security through encryption at rest and blocking public access
- Versioning enables recovery from accidental deletions
- CORS configuration enables browser-based audio playback via presigned URLs

**Key Technical Requirements**:
- **Region**: us-east-1 (consistent with VPC from Story 1.2)
- **Encryption**: AES-256, AWS-managed keys (SSE-S3)
- **Public Access**: Completely blocked at bucket level
- **Lifecycle Management**: Automated cost optimization and data retention compliance
- **Versioning**: Enabled for data protection and compliance

**Storage Module Responsibilities**:
- S3 bucket creation and configuration
- Lifecycle policies for cost optimization
- Security controls (encryption, public access blocking)
- CORS configuration for web access
- CloudTrail integration for audit logging (optional)

**Folder Structure Pattern**:
The application layer will organize files using date-based partitioning:
```
/{year}/{month}/{day}/{call_id}.{ext}
/2025/11/04/uuid-123-456.mp3
/2025/11/04/uuid-123-456.json
```
This pattern:
- Enables efficient S3 prefix-based queries
- Simplifies lifecycle management by date ranges
- Provides logical organization for troubleshooting

**Cost Optimization Strategy**:
- Recordings transition to Glacier after 365 days (~80% cost reduction)
- Both bucket types: delete after 1,095 days (3 years retention)
- Lifecycle transitions are automatic based on object age
- Estimated storage cost: $0.023/GB/month (Standard) → $0.004/GB/month (Glacier)

**CORS Requirements**:
- Needed for browser-based audio playback using presigned URLs
- Dashboard origin must be allowed
- GET method required for playback
- Configured at bucket level

### Project Structure Notes

**Module Location**: `terraform/modules/storage/`

**Files to Populate**:
- `main.tf`: S3 bucket resources, lifecycle rules, CORS configuration
- `variables.tf`: Bucket name prefix, lifecycle days, CORS origins
- `outputs.tf`: Bucket ARNs, names, IDs

**Integration with Other Modules**:
- Uses VPC configuration from networking module (same region)
- Outputs will be consumed by:
  - IAM module (Story 1.6): Bucket access policies
  - Application layer (Epic 2): Upload/download operations

### Learnings from Previous Story

**From Story 1-2: VPC and Networking Infrastructure (Status: done)**

- **Network Foundation Established**: VPC with dual-AZ setup operational
- **Region Consistency**: All resources in us-east-1 (us-east-1a, us-east-1b)
- **Tagging Pattern**: Use Project, Environment, ManagedBy tags consistently
- **Terraform Module Pattern**: Populate main.tf, variables.tf, outputs.tf in module directory
- **Security Groups Created**: API-SG and Worker-SG will need S3 access via IAM policies (addressed in Story 1.6)

**Application to This Story**:
- Use same region (us-east-1) for S3 buckets
- Apply consistent tagging strategy
- Follow established module structure pattern
- S3 VPC endpoints can be added later if needed for cost optimization

[Source: docs/stories/1-2-create-vpc-and-networking-infrastructure.md]

### References

**Source Documents**:
- [Source: docs/epics.md#Story-1.3-Configure-S3-Buckets-with-Lifecycle-Policies]
- [Source: docs/epics.md#Epic-1-Foundation-&-Infrastructure]
- [Source: docs/stories/audio-ingestion-pipeline-architecture.md#Data-Architecture]
- [Source: docs/stories/audio-ingestion-pipeline-prd.md#Data-Storage-Requirements]

**Prerequisites**:
- Story 1.1: Terraform structure (COMPLETE)
- AWS account with S3 permissions
- Terraform 1.5+ installed

**Dependencies**:
- None - S3 buckets can be created independently

**Subsequent Stories**:
- Story 1.6: IAM module will create bucket access policies
- Story 2.2: Audio upload endpoint will use recordings bucket
- Story 2.5: Transcription worker will write to transcripts bucket

## Dev Agent Record

### Context Reference

- [Story Context XML](./1-3-configure-s3-buckets-with-lifecycle-policies.context.xml)

### Agent Model Used

- **Model**: Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)
- **Workflow**: BMAD BMM dev-story workflow
- **Implementation Date**: 2025-11-04

### Debug Log References

- No errors encountered during implementation
- Terraform validation: **PASSED** (Success! The configuration is valid.)
- Terraform formatting: **PASSED** (all files formatted correctly)

### Completion Notes List

1. **Storage Module Created**: Populated `terraform/modules/storage/` with complete S3 bucket configuration

2. **Buckets Configured**:
   - Created recordings bucket with GLACIER transition after 365 days
   - Created transcripts bucket with Standard storage class (no GLACIER transition)
   - Both buckets: versioning enabled, SSE-S3 encryption (AES-256), all public access blocked
   - Both buckets: expiration after 1,095 days (3 years)

3. **Lifecycle Policies**:
   - Recordings: Transition to GLACIER at 365 days, delete at 1,095 days
   - Transcripts: Delete at 1,095 days (no GLACIER transition for fast access)
   - Added cleanup rule for incomplete multipart uploads (7 days)

4. **CORS Configuration**:
   - Configured on recordings bucket for browser-based audio playback
   - Allows GET method for presigned URL access
   - Configurable origins, headers, and max-age via variables

5. **CloudTrail Integration**:
   - Optional CloudTrail trail for S3 data events
   - Logs all read/write operations on both buckets
   - Disabled by default (can be enabled via variables)

6. **Module Outputs**:
   - Exposed bucket ARNs, names, IDs, domain names
   - Lifecycle policy configuration values
   - Combined outputs for convenience (bucket_arns, bucket_names, bucket_ids)

7. **Root Configuration Updated**:
   - Updated `terraform/main.tf` to pass required variables to storage module
   - Added commented examples for optional configuration overrides
   - Also updated networking module call with required variables

8. **Folder Structure Pattern**:
   - Documented in code comments: `/{year}/{month}/{day}/{call_id}.{ext}`
   - Pattern enforced by application layer (not Terraform)
   - Enables efficient S3 prefix queries and lifecycle management

9. **Validation Results**:
   - `terraform init`: Successful (providers initialized)
   - `terraform fmt`: Successful (all files formatted)
   - `terraform validate`: **Success! The configuration is valid.**
   - `terraform plan`: Skipped (requires S3 backend initialization and AWS credentials)

10. **Best Practices Applied**:
    - Modular design with clear separation of concerns
    - Comprehensive variable validation and defaults
    - Consistent tagging strategy (Project, Environment, ManagedBy, Module)
    - Security-first approach (encryption, public access blocking)
    - Cost optimization through lifecycle policies
    - Detailed documentation in code comments

### File List

**Created/Modified Files**:

1. `terraform/modules/storage/main.tf` (257 lines)
   - S3 bucket resources for recordings and transcripts
   - Versioning, encryption, public access blocking
   - Lifecycle policies with GLACIER transition and expiration
   - CORS configuration for recordings bucket
   - Optional CloudTrail trail for audit logging
   - Comprehensive documentation comments

2. `terraform/modules/storage/variables.tf` (136 lines)
   - Required variables: project_name, environment
   - Optional bucket name overrides
   - Lifecycle policy configuration (transition/expiration days)
   - CORS configuration options
   - CloudTrail configuration (optional)
   - Input validation for encryption algorithm and CORS origins

3. `terraform/modules/storage/outputs.tf` (140 lines)
   - Recordings bucket: ID, ARN, name, domain names
   - Transcripts bucket: ID, ARN, name, domain names
   - Lifecycle policy values
   - Configuration outputs (versioning, encryption)
   - CloudTrail outputs (optional)
   - Combined convenience outputs (bucket_arns, bucket_names, bucket_ids)

4. `terraform/main.tf` (updated)
   - Added project_name and environment variables to networking module call
   - Added project_name and environment variables to storage module call
   - Added commented examples for optional storage configuration

5. `docs/stories/1-3-configure-s3-buckets-with-lifecycle-policies.md` (this file)
   - Updated status: ready-for-dev → review
   - Checked off all tasks and subtasks
   - Populated Dev Agent Record section

**Total Files Modified**: 5 files
**Total Lines Written**: ~533 lines of Terraform code + documentation

## Change Log

- **2025-11-04**: Story created from Epic 1, Story 1.3 (logan)
- **2025-11-04**: Story implementation completed - Storage module populated with S3 buckets, lifecycle policies, CORS, and CloudTrail configuration. Status: ready-for-dev → review (Claude Sonnet 4.5)
