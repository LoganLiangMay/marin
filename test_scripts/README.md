# Marin Pipeline Testing Guide

This directory contains synthetic conversation data and scripts for testing the complete Marin processing pipeline.

## Contents

- **conversation_01.txt - conversation_20.txt**: 20 synthetic customer conversations
- **test_pipeline.py**: Comprehensive pipeline test script
- **test_report_*.json**: Generated test reports

## Quick Start

### 1. Prerequisites

```bash
# Ensure backend dependencies are installed
cd ../backend
pip install -r requirements.txt

# Verify environment variables are set
echo $MONGODB_URI
echo $REDIS_URL
echo $AWS_REGION
```

### 2. Run Tests (Skip Analysis)

Test data loading and MongoDB integration without AI analysis:

```bash
cd test_scripts
python test_pipeline.py --env dev --conversations ./ --skip-analysis
```

**Expected output:**
- ✅ 20 conversations loaded
- ✅ 20 call records created in MongoDB
- ✅ Analytics validation
- 📋 Test report generated

**Time:** ~30 seconds

### 3. Run Tests (With Analysis)

⚠️ **Warning:** This makes real API calls to AWS Bedrock and will incur costs (~$0.10-0.50)

```bash
python test_pipeline.py --env dev --conversations ./
```

**Expected output:**
- ✅ 20 conversations loaded
- ✅ 20 call records created
- 🤖 20 AI analyses completed
- 🔍 Embeddings created
- 📊 Analytics aggregated
- 📋 Comprehensive test report

**Time:** ~5-10 minutes (depends on API latency)

### 4. View Results

```bash
# Check MongoDB
mongosh $MONGODB_URI --eval "db.calls.countDocuments({status: 'analyzed'})"

# View test report
cat test_report_*.json | jq .

# Check specific call analysis
mongosh $MONGODB_URI --eval "db.calls.findOne({status: 'analyzed'}, {analysis: 1})" | jq .
```

## Test Scenarios

### Scenario 1: Data Loading Only

```bash
python test_pipeline.py --skip-analysis
```

**Tests:**
- ✅ Conversation file parsing
- ✅ MongoDB connection
- ✅ Call record creation
- ✅ Basic data validation

### Scenario 2: Full Pipeline (1 Conversation)

Manually test with a single conversation:

```bash
# Create one call
python << 'EOF'
import sys
sys.path.insert(0, '../backend')
from pymongo import MongoClient
from core.config import settings
from uuid import uuid4

client = MongoClient(settings.mongodb_uri)
db = client[settings.mongodb_database]

# Read conversation
with open('conversation_01.txt', 'r') as f:
    transcript = f.read()

# Create call
call_id = str(uuid4())
db.calls.insert_one({
    "call_id": call_id,
    "status": "transcribed",
    "transcript": transcript,
    "metadata": {"company_name": "Test Corp", "call_type": "sales"},
})

print(f"Created call: {call_id}")
EOF

# Trigger analysis manually
python << 'EOF'
import sys
sys.path.insert(0, '../backend')
from workers.tasks import analyze_call_task

call_id = "<YOUR_CALL_ID_HERE>"
result = analyze_call_task(call_id)
print(result)
EOF
```

### Scenario 3: Analytics Validation

After running tests, validate analytics:

```bash
# Check sentiment distribution
mongosh $MONGODB_URI --eval "
  use audio_pipeline;
  db.calls.aggregate([
    {$match: {status: 'analyzed'}},
    {$group: {_id: '\$analysis.overall_sentiment', count: {\$sum: 1}}}
  ])
"

# Check pain points
mongosh $MONGODB_URI --eval "
  use audio_pipeline;
  db.calls.aggregate([
    {$match: {status: 'analyzed'}},
    {$unwind: '\$analysis.pain_points'},
    {$group: {_id: '\$analysis.pain_points.pain_point', count: {\$sum: 1}}},
    {$sort: {count: -1}},
    {$limit: 10}
  ])
"

# Check entities
mongosh $MONGODB_URI --eval "
  use audio_pipeline;
  db.calls.aggregate([
    {$match: {status: 'analyzed'}},
    {$unwind: '\$analysis.entities'},
    {$group: {_id: '\$analysis.entities.text', type: {\$first: '\$analysis.entities.type'}, count: {\$sum: 1}}},
    {$sort: {count: -1}},
    {$limit: 20}
  ])
"
```

## Expected Results

### Successful Test Run

```
================================================================================
🚀 MARIN PIPELINE TEST
================================================================================

Environment: dev
Conversations: /Applications/Gauntlet/marin/test_scripts
Skip Analysis: False
Only Report: False

🔌 Connecting to services (environment: dev)...
  → MongoDB: mongodb+srv://...
  ✅ MongoDB connected
  → Redis: redis://...
  ✅ Redis connected
  ✅ OpenSearch service initialized

📁 Loading conversations from /Applications/Gauntlet/marin/test_scripts...
  ✅ Loaded: conversation_01.txt (2847 words)
  ✅ Loaded: conversation_02.txt (2634 words)
  ...
  ✅ Loaded: conversation_20.txt (2891 words)

📊 Loaded 20 conversations

💾 Creating call records in MongoDB...
  ✅ Created call 1/20: a1b2c3d4... (Performance Marketing Agency)
  ✅ Created call 2/20: e5f6g7h8... (SaaS Product Manager)
  ...
  ✅ Created call 20/20: x9y0z1a2... (E-commerce Director)

📊 Created 20 call records

🤖 Triggering AI analysis for 20 calls...
⚠️  Note: This will make real API calls to AWS Bedrock and may incur costs!
Continue with analysis? (yes/no): yes
  🔄 Analyzing call 1/20: a1b2c3d4...
  ✅ Analysis complete
  ...
  🔄 Analyzing call 20/20: x9y0z1a2...
  ✅ Analysis complete

📊 Analysis Results:
  ✅ Completed: 20
  ❌ Failed: 0

🔍 Testing semantic search indexing...
  📊 Calls with embeddings: 20/20
  🔎 Testing search query: 'What are the biggest pain points with campaign management?'
  ✅ Search service available

📊 Validating analytics data...
  📈 Analyzed calls: 20/20

  📊 Sentiment Distribution:
    positive: 5
    neutral: 10
    negative: 5

  📊 Calls with pain points: 20

  📋 Sample pain points from call a1b2c3d4:
    • Attribution and measurement complexity (severity: high)
    • Manual platform hopping and data entry (severity: high)
    • Creative testing at scale (severity: medium)

================================================================================
📋 TEST REPORT
================================================================================

⏰ Test Duration: 387s
🌍 Environment: dev

📊 Data Loading:
  • Conversations loaded: 20
  • Call records created: 20

🤖 AI Analysis:
  • Analyses completed: 20
  • Analyses failed: 0
  • Success rate: 100.0%

🔍 Semantic Search:
  • Embeddings created: 20

❌ Errors: 0

================================================================================

💾 Full report saved to: test_report_20251104_120530.json
```

### Common Issues

#### Issue: MongoDB Connection Failed

```
❌ Connection failed: ServerSelectionTimeoutError
```

**Solution:**
```bash
# Check MongoDB URI
echo $MONGODB_URI

# Test connection
mongosh $MONGODB_URI --eval "db.adminCommand('ping')"

# Update environment variable if needed
export MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/audio_pipeline"
```

#### Issue: Redis Connection Failed

```
❌ Connection failed: ConnectionError
```

**Solution:**
```bash
# Check Redis URL
echo $REDIS_URL

# Test connection (if Redis is local)
redis-cli ping

# Update environment variable if needed
export REDIS_URL="redis://localhost:6379/0"
```

#### Issue: AWS Bedrock Access Denied

```
❌ Analysis failed: AccessDeniedException
```

**Solution:**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Verify Bedrock model access
aws bedrock list-foundation-models --region us-east-1

# Request model access in AWS Console if needed
# https://console.aws.amazon.com/bedrock/home#/modelaccess
```

#### Issue: Import Error

```
❌ Error importing backend modules: ModuleNotFoundError
```

**Solution:**
```bash
# Install backend dependencies
cd ../backend
pip install -r requirements.txt

# Or use virtual environment
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Conversation Data Format

Each conversation file follows this structure:

```
Conversation N: [Title/Role]
Profile:
* Role: ...
* Experience: ...
* Manages: ...

[Section]: Rep: "[Question]"
Customer: "[Response]"
...
```

**Key Characteristics:**
- Realistic customer discovery call transcripts
- 2,500-3,000 words per conversation
- Rich pain points and objections
- Company/role context
- Multiple conversation sections (warm-up, deep dive, vision, etc.)

## Performance Benchmarks

| Metric | Target | Typical |
|--------|--------|---------|
| Conversation parsing | < 0.1s | 0.05s |
| Call record creation | < 0.5s | 0.2s |
| AI analysis (per call) | < 30s | 15-20s |
| Embedding generation | < 5s | 2-3s |
| Total test time (20 calls) | < 15min | 8-10min |

## Cost Estimates

| Operation | Bedrock Model | Cost per Call | Total (20 calls) |
|-----------|---------------|---------------|------------------|
| AI Analysis | Claude 3 Sonnet | $0.015-0.025 | $0.30-0.50 |
| Embeddings | Titan Embed | $0.0001-0.0002 | $0.002-0.004 |
| **Total** | | | **~$0.30-0.50** |

## Next Steps

After successful testing:

1. **Review Analytics**: Check the generated insights and aggregations
2. **Test Frontend**: Connect the dashboard to view results
3. **Epic 7**: Begin production readiness hardening

## Support

For issues or questions:
- Check backend logs: `tail -f ../backend/logs/app.log`
- Review test report: `cat test_report_*.json | jq .`
- Check MongoDB data: `mongosh $MONGODB_URI`
- Create GitHub issue with test report attached
