# Marin Pipeline Testing Plan

**Created:** 2025-11-04
**Status:** Ready for Testing
**Purpose:** Validate complete pipeline before Epic 7 (Production Readiness)

---

## 📋 Overview

You have 20 synthetic customer conversation transcripts ready to test the complete Marin processing pipeline. This testing validates:

1. ✅ **Data Loading**: MongoDB integration and call record creation
2. 🤖 **AI Analysis**: AWS Bedrock (Claude) analysis pipeline
3. 🔍 **Semantic Search**: OpenSearch embedding and RAG
4. 📊 **Analytics**: Aggregation and insights generation
5. 📈 **Dashboard**: Frontend data display

---

## 🎯 Testing Strategy

### Phase 1: Quick Validation (5 minutes)

**Goal:** Verify basic connectivity and data format

```bash
cd /Applications/Gauntlet/marin/test_scripts

# Set environment variables
export MONGODB_URI="your-mongodb-uri-here"
export REDIS_URL="redis://localhost:6379/0"  # or your Redis endpoint

# Run quick test
python quick_test.py
```

**Expected Results:**
- ✅ MongoDB connection successful
- ✅ Redis connection successful (optional)
- ✅ 20 conversations loaded
- ✅ Sample call created in MongoDB

**If this fails:** Fix connection issues before proceeding.

---

### Phase 2: Data Loading Test (1 minute)

**Goal:** Load all 20 conversations into MongoDB without AI analysis

```bash
# This is safe - no API costs
python test_pipeline.py --env dev --conversations ./ --skip-analysis
```

**Expected Results:**
- ✅ 20 conversations parsed
- ✅ 20 call records created in MongoDB
- ✅ Records spread over 20 days (for time-series testing)
- ✅ Test report generated

**Time:** ~30 seconds
**Cost:** $0

---

### Phase 3: Single Call Analysis (2 minutes)

**Goal:** Test AI analysis on ONE call to validate it works

```bash
# Get a call ID from Phase 2
mongosh $MONGODB_URI --eval "db.calls.findOne({status: 'transcribed'}, {call_id: 1})"

# Manually trigger analysis (in Python)
python << 'EOF'
import sys
sys.path.insert(0, '/Applications/Gauntlet/marin/backend')
from workers.tasks import analyze_call_task

call_id = "YOUR_CALL_ID_HERE"  # Replace with actual ID
result = analyze_call_task(call_id)

if result.get('success'):
    print("✅ Analysis successful!")
    print(f"Sentiment: {result.get('sentiment')}")
    print(f"Pain points: {len(result.get('pain_points', []))}")
else:
    print(f"❌ Analysis failed: {result.get('error')}")
EOF
```

**Expected Results:**
- ✅ Call status changed to "analyzed"
- ✅ Sentiment detected (positive/neutral/negative)
- ✅ Pain points extracted (5-10 typically)
- ✅ Entities identified (companies, people, products)
- ✅ Objections captured

**Time:** ~15-20 seconds
**Cost:** ~$0.015-0.025

**If this works:** Proceed to Phase 4
**If this fails:** Check AWS Bedrock access and credentials

---

### Phase 4: Full Pipeline Test (10 minutes)

**Goal:** Process all 20 conversations through complete pipeline

⚠️ **Warning:** This makes 20 API calls to AWS Bedrock
**Estimated Cost:** $0.30-0.50

```bash
# Run full pipeline
python test_pipeline.py --env dev --conversations ./

# It will ask for confirmation:
# Continue with analysis? (yes/no): yes
```

**Expected Results:**
- ✅ 20 analyses completed (100% success rate)
- ✅ 20 embeddings created for semantic search
- ✅ Analytics data populated
- ✅ Comprehensive test report generated

**Time:** ~8-10 minutes
**Cost:** ~$0.30-0.50

---

### Phase 5: Analytics Validation (2 minutes)

**Goal:** Verify aggregated data and insights

```bash
# Check sentiment distribution
mongosh $MONGODB_URI << 'EOF'
use audio_pipeline
db.calls.aggregate([
  {$match: {status: 'analyzed'}},
  {$group: {_id: '$analysis.overall_sentiment', count: {$sum: 1}}}
])
EOF

# Check top pain points
mongosh $MONGODB_URI << 'EOF'
use audio_pipeline
db.calls.aggregate([
  {$match: {status: 'analyzed'}},
  {$unwind: '$analysis.pain_points'},
  {$group: {
    _id: '$analysis.pain_points.pain_point',
    count: {$sum: 1},
    avg_severity: {$avg: {
      $switch: {
        branches: [
          {case: {$eq: ['$analysis.pain_points.severity', 'low']}, then: 1},
          {case: {$eq: ['$analysis.pain_points.severity', 'medium']}, then: 2},
          {case: {$eq: ['$analysis.pain_points.severity', 'high']}, then: 3}
        ],
        default: 0
      }
    }}
  }},
  {$sort: {count: -1}},
  {$limit: 10}
])
EOF

# Check entities
mongosh $MONGODB_URI << 'EOF'
use audio_pipeline
db.calls.aggregate([
  {$match: {status: 'analyzed'}},
  {$unwind: '$analysis.entities'},
  {$group: {
    _id: {text: '$analysis.entities.text', type: '$analysis.entities.type'},
    count: {$sum: 1}
  }},
  {$sort: {count: -1}},
  {$limit: 20}
])
EOF
```

**Expected Results:**
- ✅ Sentiment distribution (mix of positive/neutral/negative)
- ✅ Top pain points ranked by frequency
- ✅ Common entities identified (Meta, Google, TikTok, Shopify, etc.)
- ✅ Severity scoring working

---

### Phase 6: Frontend Testing (5 minutes)

**Goal:** Verify dashboard displays data correctly

```bash
# Start frontend (if not already running)
cd /Applications/Gauntlet/marin/frontend
npm run dev

# Open browser to http://localhost:3000
```

**Manual Tests:**
1. **Login** → Should use Cognito authentication
2. **Dashboard** → Should show call volume metrics
3. **Call Library** → Should list 20 calls
4. **Call Detail** → Click any call, should show:
   - ✅ Transcript
   - ✅ Sentiment analysis
   - ✅ Pain points
   - ✅ Entities
   - ✅ Objections (if any)
5. **Analytics** → Should show:
   - ✅ Call volume chart (last 20 days)
   - ✅ Sentiment distribution pie chart
   - ✅ Top pain points
   - ✅ Top entities bar chart
6. **Insights** → Should show daily insights
7. **Quality** → Should show quality metrics

---

## 📊 Success Criteria

Before proceeding to Epic 7, validate:

- [x] **Data Loading**: 100% success rate (20/20 conversations)
- [ ] **AI Analysis**: ≥95% success rate (19/20 minimum)
- [ ] **Embeddings**: ≥90% generated (18/20 minimum)
- [ ] **Analytics**: Data aggregates correctly
- [ ] **Frontend**: All pages render without errors
- [ ] **Performance**: Analysis completes in <30s per call
- [ ] **Cost**: Total test cost <$1.00

---

## 🚨 Common Issues & Solutions

### Issue 1: MongoDB Connection Timeout

```
❌ Connection failed: ServerSelectionTimeoutError
```

**Solutions:**
1. Verify MongoDB URI:
   ```bash
   echo $MONGODB_URI
   ```
2. Check IP whitelist in MongoDB Atlas
3. Test connection:
   ```bash
   mongosh $MONGODB_URI --eval "db.adminCommand('ping')"
   ```

### Issue 2: AWS Bedrock Access Denied

```
❌ Analysis failed: AccessDeniedException
```

**Solutions:**
1. Check AWS credentials:
   ```bash
   aws sts get-caller-identity
   ```
2. Verify model access in AWS Console:
   - Navigate to: https://console.aws.amazon.com/bedrock/home#/modelaccess
   - Enable: Anthropic Claude 3 Sonnet
   - Enable: Amazon Titan Embeddings G1 - Text
3. Check region is `us-east-1`

### Issue 3: Analysis Taking Too Long

```
⏰ Analysis taking >60s per call
```

**Possible Causes:**
- API throttling
- Large transcript size
- Network latency

**Solutions:**
1. Add delays between calls
2. Check AWS Bedrock quotas
3. Consider batch processing

### Issue 4: Embeddings Not Created

```
📊 Calls with embeddings: 0/20
```

**Solutions:**
1. Check OpenSearch Serverless is deployed
2. Verify IAM permissions for OpenSearch
3. Check worker is configured to generate embeddings
4. Review logs: `tail -f ../backend/logs/app.log`

---

## 📈 Performance Benchmarks

Based on typical runs:

| Metric | Expected | Acceptable | Poor |
|--------|----------|------------|------|
| **Conversation Loading** | <0.1s/file | <0.5s/file | >1s/file |
| **Call Record Creation** | <0.2s/record | <1s/record | >2s/record |
| **AI Analysis** | 15-20s/call | 20-30s/call | >30s/call |
| **Embedding Generation** | 2-3s/call | 3-5s/call | >5s/call |
| **Total Test Time** | 8-10min | 10-15min | >15min |
| **Success Rate** | 100% | ≥95% | <95% |

---

## 💰 Cost Tracking

Track costs during testing:

| Operation | Model | Cost/Call | Qty | Total |
|-----------|-------|-----------|-----|-------|
| AI Analysis | Claude 3 Sonnet | $0.015-0.025 | 20 | $0.30-0.50 |
| Embeddings | Titan Embed | $0.0001-0.0002 | 20 | $0.002-0.004 |
| OpenSearch | Serverless | $0.24/OCU-hour | 0.1hr | $0.024 |
| **Total** | | | | **$0.33-0.53** |

**AWS Cost Explorer:** Check actual costs 24 hours after testing

---

## 📝 Test Report Template

After completing all phases, document results:

```markdown
# Marin Pipeline Test Report

**Date:** 2025-11-04
**Tester:** [Your Name]
**Environment:** dev

## Summary
- ✅/❌ All phases completed
- Success Rate: X%
- Total Time: X minutes
- Total Cost: $X.XX

## Results by Phase

### Phase 1: Quick Validation
- Status: ✅/❌
- Notes: ...

### Phase 2: Data Loading
- Conversations Loaded: 20/20
- Calls Created: 20/20
- Status: ✅/❌

### Phase 3: Single Analysis
- Call ID: ...
- Status: ✅/❌
- Sentiment: positive/neutral/negative
- Pain Points: X
- Entities: X

### Phase 4: Full Pipeline
- Analyses Completed: X/20
- Success Rate: X%
- Time: X minutes
- Cost: $X.XX

### Phase 5: Analytics
- Sentiment Distribution: ...
- Top Pain Points: ...
- Top Entities: ...

### Phase 6: Frontend
- Dashboard: ✅/❌
- Call Library: ✅/❌
- Analytics: ✅/❌
- Insights: ✅/❌

## Issues Encountered
1. [Issue description]
   - Resolution: ...
   - Time Lost: X min

## Recommendations
- [ ] Ready for Epic 7
- [ ] Need fixes before Epic 7
- [ ] Additional testing needed

## Next Steps
1. ...
2. ...
```

---

## 🎬 Next Steps After Testing

### If All Tests Pass (✅ 95%+ success):

**You're ready for Epic 7!**

1. **Document findings** in test report
2. **Archive test data** for future reference
3. **Proceed to Story 7.1:** Production Environment Setup

### If Tests Partially Pass (⚠️ 80-95% success):

**Fix issues before Epic 7:**

1. **Analyze failures** in test report
2. **Fix critical bugs** (authentication, analysis, embeddings)
3. **Re-test failed components**
4. **Proceed when ≥95% pass rate**

### If Tests Mostly Fail (❌ <80% success):

**Stop and investigate:**

1. **Review architecture** - is something fundamentally broken?
2. **Check dependencies** - MongoDB, Redis, AWS Bedrock all working?
3. **Validate configuration** - environment variables, credentials
4. **Consider Epic 2-5 fixes** before Epic 7

---

## 🎯 Epic 7 Preview

Once testing is successful, Epic 7 will add:

- **Story 7.1**: Multi-AZ deployment, deletion protection
- **Story 7.2**: CloudWatch dashboards, PagerDuty alerts
- **Story 7.3**: Centralized logging, X-Ray tracing
- **Story 7.4**: Blue/green deployments, rollback procedures
- **Story 7.5**: Load testing, performance optimization
- **Story 7.6**: Security audit, WAF, compliance docs

**Goal:** Transform your working MVP into a production-grade system.

---

## 📞 Support

**Issues during testing?**

1. Check logs: `tail -f /Applications/Gauntlet/marin/backend/logs/app.log`
2. Review test report: `cat test_report_*.json | jq .`
3. Check MongoDB: `mongosh $MONGODB_URI`
4. Check Redis: `redis-cli -u $REDIS_URL ping`
5. AWS Bedrock logs: CloudWatch Logs console

**Still stuck?**
- Review error messages in test output
- Check `TESTING_PLAN.md` troubleshooting section
- Create GitHub issue with test report attached

---

**Ready to start? Run Phase 1!**

```bash
cd /Applications/Gauntlet/marin/test_scripts
python quick_test.py
```

Good luck! 🚀
