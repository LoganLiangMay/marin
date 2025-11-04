# Story 2.3: Set Up SQS Queues for Async Processing

Status: done

## Story

As a DevOps engineer,
I want SQS queues configured for worker task distribution,
So that processing tasks are reliably queued and failures are captured.

## Acceptance Criteria

1. ✓ Terraform creates SQS queue: `audio-pipeline-processing`
   - Queue type: Standard
   - Visibility timeout: 600 seconds (10 minutes)
   - Message retention: 14 days
   - Receive wait time: 20 seconds (long polling enabled)
2. ✓ Terraform creates Dead Letter Queue: `audio-pipeline-dlq`
   - Message retention: 14 days
   - Attached to main queue with max receive count: 3
3. ✓ CloudWatch alarm created: DLQ message count >10 → Alert to SNS topic
4. ✓ Queue policy allows IAM roles (API, Worker) to send/receive messages
5. ✓ Queue ARN and URL output by Terraform for application config
6. ✓ Tags applied: Project, Environment, ManagedBy
7. Note: AWS CLI testing deferred until backend resources (S3/DynamoDB) are created

## Tasks / Subtasks

- [x] **Task 1: Create Terraform queue module** (AC: #1, #2, #6)
  - [x] Create terraform/modules/queue/ directory structure
  - [x] Define main.tf with SQS queue resources
  - [x] Define variables.tf for queue configuration
  - [x] Define outputs.tf for queue URLs and ARNs
  - [x] Create versions.tf with AWS provider requirements

- [x] **Task 2: Configure main processing queue** (AC: #1)
  - [x] Create SQS standard queue resource: audio-pipeline-processing
  - [x] Set visibility_timeout_seconds = 600
  - [x] Set message_retention_seconds = 1209600 (14 days)
  - [x] Set receive_wait_time_seconds = 20 (long polling)
  - [x] Enable server-side encryption (SSE-SQS)
  - [x] Apply tags (Project, Environment, ManagedBy, Module)

- [x] **Task 3: Configure Dead Letter Queue** (AC: #2)
  - [x] Create DLQ resource: audio-pipeline-dlq
  - [x] Set message_retention_seconds = 1209600 (14 days)
  - [x] Configure redrive_policy on main queue
  - [x] Set maxReceiveCount = 3
  - [x] Link DLQ ARN to main queue

- [x] **Task 4: Create queue access policy** (AC: #4)
  - [x] Define SQS queue policy document
  - [x] Allow SendMessage from API IAM role
  - [x] Allow ReceiveMessage, DeleteMessage from Worker IAM role
  - [x] Restrict to AWS account principal
  - [x] Attach policy to queue

- [x] **Task 5: Create CloudWatch alarm** (AC: #3)
  - [x] Create CloudWatch metric alarm for DLQ
  - [x] Monitor ApproximateNumberOfMessagesVisible metric
  - [x] Set threshold > 10 messages
  - [x] Configure evaluation periods (2 consecutive periods)
  - [x] Create SNS topic for alarm notifications (optional, disabled by default)
  - [x] Attach alarm actions to SNS topic (conditional)
  - [x] Create queue depth alarm for main processing queue

- [x] **Task 6: Define module outputs** (AC: #5)
  - [x] Output main queue URL
  - [x] Output main queue ARN
  - [x] Output DLQ URL
  - [x] Output DLQ ARN
  - [x] Output CloudWatch alarm ARNs
  - [x] Output SNS topic ARN (conditional)
  - [x] Output queue configuration summary

- [x] **Task 7: Wire module in root Terraform** (AC: #4, #5)
  - [x] Add queue module to terraform/main.tf
  - [x] Pass project_name and environment variables
  - [x] Pass IAM role ARNs (using placeholders until Story 1.6)
  - [x] Export queue URLs and ARNs in root outputs.tf
  - [x] Document optional configuration overrides

- [x] **Task 8: Validate Terraform configuration**
  - [x] Run `terraform fmt -recursive` to format code
  - [x] Run `terraform validate` to check syntax
  - [x] Run `terraform init` to initialize modules
  - [x] Document validation results

- [ ] **Task 9: Test queue functionality** (AC: #7)
  - Deferred: Requires backend S3 bucket and DynamoDB table (Story 1.1)
  - Deferred: Requires actual AWS deployment
  - Will be tested in Story 2.4 (Celery Workers) integration

## Dev Notes

### Architecture Context

**Queue Requirements**:
- **Queue Type**: Standard (not FIFO) for cost-effectiveness and high throughput
- **Region**: us-east-1 (same as all other AWS services)
- **Purpose**: Task distribution for Celery workers (transcription, analysis, embedding)
- **Capacity**: 5,000 calls/month at scale = ~167 calls/day average

**Queue Configuration**:
- **Visibility Timeout**: 600 seconds (10 minutes) - gives workers time to process transcription
- **Message Retention**: 14 days - long enough for debugging and recovery
- **Long Polling**: 20 seconds - reduces API calls and improves efficiency
- **Max Receive Count**: 3 attempts before moving to DLQ

**Dead Letter Queue Strategy**:
- Captures poison messages after 3 failed delivery attempts
- Prevents infinite retry loops
- Enables manual inspection of failed tasks
- CloudWatch alarm when DLQ grows (indicates systemic issues)

**Message Format** (from Story 2.2):
```json
{
  "task": "transcribe",
  "call_id": "550e8400-e29b-41d4-a716-446655440000",
  "s3_key": "2025/11/04/550e8400-e29b-41d4-a716-446655440000.mp3",
  "format": "mp3",
  "timestamp": "2025-11-04T10:30:00Z"
}
```

**Security Architecture**:
- **IAM Policies**: Least-privilege access (API sends, Workers receive/delete)
- **Encryption**: Server-side encryption (SSE-SQS) enabled by default
- **VPC**: No VPC endpoint needed (SQS accessed via internet gateway)
- **Monitoring**: CloudWatch metrics and alarms for queue depth

**Integration Points**:
- **Story 2.2 (Upload API)**: Currently publishes messages to queue
- **Story 2.4 (Celery Workers)**: Will consume messages from queue
- **Story 1.6 (IAM Roles)**: Queue policy references API and Worker IAM roles
- **CloudWatch**: Metrics and alarms for monitoring

**Cost Estimate**:
```
Standard Queue:
- First 1M requests/month: Free
- Additional requests: $0.40 per million
- Estimated: 5,000 messages/month × 2 (send + receive) = 10,000 requests
- Cost: ~$0 (well within free tier)

Data Transfer:
- Queue messages: ~1KB each
- Cost: Negligible (within AWS VPC)

Total: <$1/month
```

### Project Structure Notes

**Module Location**: `terraform/modules/queue/` (new module)

**Files to Create**:
- `main.tf`: SQS queue, DLQ, CloudWatch alarm, queue policy
- `variables.tf`: Queue configuration, IAM role ARNs, alarm thresholds
- `outputs.tf`: Queue URLs, ARNs, alarm ARN
- `versions.tf`: AWS provider version requirements
- `README.md`: Queue setup and testing instructions

**Integration with Other Modules**:
- **IAM Module (Story 1.6)**: Uses IAM role ARNs for queue policy (or data sources if not created yet)
- **Root Configuration**: Wires queue module with project variables
- **Application Config**: Queue URL exported for FastAPI and Celery workers

### Learnings from Previous Stories

**From Story 1.4 (MongoDB Atlas) and Story 1.5 (ElastiCache Redis)**:

**Terraform Module Patterns to Reuse**:
- Module structure: main.tf, variables.tf, outputs.tf, versions.tf, README.md
- Local variables for name_prefix and common_tags
- Comprehensive outputs with ARNs, URLs, and identifiers
- CloudWatch integration for monitoring and alarming
- Tagging strategy (Project, Environment, ManagedBy, Module)

**Key Implementation Decisions**:
1. **Module Organization**: Create dedicated queue module for reusability
2. **Resource Naming**: Use `${local.name_prefix}-processing` pattern
3. **CloudWatch Alarms**: Proactive monitoring with SNS notifications
4. **Validation Process**: Run fmt, validate, init before marking complete
5. **Documentation**: Inline code comments explaining configuration decisions

**Application to This Story**:
- Follow established module structure pattern
- Use consistent naming with name_prefix local variable
- Create comprehensive outputs for downstream consumption
- Configure CloudWatch alarms matching previous patterns
- Apply standard tagging across all resources
- Document queue testing procedures

**Technical Notes**:
- SQS supports automatic encryption at rest (SSE-SQS)
- Standard queues support up to 120,000 in-flight messages
- Long polling (20s) reduces costs and improves responsiveness
- Visibility timeout should be longer than max task processing time

### References

**Source Documents**:
- [Source: docs/epics.md#Story-2.3-Set-Up-SQS-Queues-for-Async-Processing]
- [Source: docs/epics.md#Epic-2-Audio-Upload-&-Transcription-Pipeline]
- [Source: docs/stories/audio-ingestion-pipeline-architecture.md#Queue-Architecture]
- [Source: docs/stories/2-2-implement-audio-upload-endpoint-with-s3.md#SQS-Message-Format]

**Prerequisites**:
- Story 1.1: Terraform structure (COMPLETE)
- Story 1.6: IAM roles (BACKLOG - can use data sources or create placeholder)

**Dependencies**:
- IAM role ARNs for queue policy (API role, Worker role)
- Project name and environment variables from root Terraform

**Subsequent Stories**:
- Story 2.2: Upload API already publishes to queue (uses placeholder queue URL)
- Story 2.4: Celery workers will consume messages
- Story 2.5: Whisper transcription worker processes messages
- Epic 3 & 4: Analysis and embedding workers use same queue

**AWS SQS Documentation**:
- Standard Queues: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues.html
- Dead Letter Queues: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html
- Long Polling: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-short-and-long-polling.html

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

### Completion Notes List

**Completed:** 2025-11-04

**Implementation Summary:**
Successfully created complete SQS queue infrastructure with Terraform module for async processing pipeline.

**Files Created:**
- `terraform/modules/queue/main.tf` (165 lines) - SQS resources, DLQ, CloudWatch alarms, SNS topic
- `terraform/modules/queue/variables.tf` (114 lines) - All configuration variables with validation
- `terraform/modules/queue/outputs.tf` (64 lines) - Queue URLs, ARNs, and alarm outputs
- `terraform/modules/queue/versions.tf` (13 lines) - Terraform and provider version requirements

**Files Modified:**
- `terraform/main.tf` - Added queue module configuration with placeholder IAM roles
- `terraform/outputs.tf` - Added queue outputs for application consumption

**Key Implementation Decisions:**
1. **Standard Queue Type**: Chose standard (not FIFO) for cost-effectiveness and high throughput
2. **IAM Placeholders**: Used "*" placeholders for api_role_arn and worker_role_arn until Story 1.6
3. **Server-Side Encryption**: Enabled SSE-SQS for security
4. **Dual CloudWatch Alarms**: Created alarms for both DLQ messages and queue depth
5. **Optional SNS Topic**: Made SNS topic creation optional (disabled by default for MVP)
6. **Long Polling**: Enabled 20-second long polling to reduce API calls
7. **Comprehensive Outputs**: Exported queue URLs, ARNs, alarm ARNs, and configuration summary

**Validation Results:**
- ✓ `terraform fmt -recursive`: Code formatted successfully
- ✓ `terraform validate`: Configuration is valid
- ✓ `terraform init -backend=false -upgrade`: Module initialized successfully
- Note: `terraform plan` deferred until backend S3 bucket is created

**Integration Points:**
- Story 2.2: Upload API will publish messages to this queue
- Story 2.4: Celery workers will consume messages from this queue
- Story 1.6: IAM roles will replace placeholder "*" values

**Definition of Done:**
- [x] All acceptance criteria met (AC 1-6, AC 7 deferred to integration testing)
- [x] All tasks completed (Tasks 1-8, Task 9 deferred)
- [x] Terraform module structure follows established patterns
- [x] Code formatted and validated
- [x] Module outputs exposed in root configuration
- [x] Documentation updated

### File List

**Module Files:**
- `/Applications/Gauntlet/marin/terraform/modules/queue/main.tf` (165 lines)
- `/Applications/Gauntlet/marin/terraform/modules/queue/variables.tf` (114 lines)
- `/Applications/Gauntlet/marin/terraform/modules/queue/outputs.tf` (64 lines)
- `/Applications/Gauntlet/marin/terraform/modules/queue/versions.tf` (13 lines)

**Root Configuration:**
- `/Applications/Gauntlet/marin/terraform/main.tf` (modified - added queue module)
- `/Applications/Gauntlet/marin/terraform/outputs.tf` (modified - added queue outputs)
