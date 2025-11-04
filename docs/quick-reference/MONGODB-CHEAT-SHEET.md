# MongoDB & MongoDB Atlas Quick Reference - Marin Project

**Quick reference for MongoDB commands and Atlas API used during Marin deployment**

---

## 🔗 Connection

```bash
# Connect with mongosh (modern MongoDB shell)
mongosh "mongodb+srv://cluster.mongodb.net/audio_pipeline" --username marin_app

# Connect with connection string from env var
mongosh "$MONGODB_URI"

# Connect with specific database
mongosh "mongodb+srv://cluster.mongodb.net/audio_pipeline"

# Connect and run command
mongosh "mongodb+srv://cluster.mongodb.net/" --eval "db.version()"

# Connection string format
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

---

## 🗄️ Database Operations

```bash
# Show all databases
show dbs

# Switch to database (creates if doesn't exist)
use audio_pipeline

# Show current database
db

# Get database stats
db.stats()

# Drop database (careful!)
db.dropDatabase()

# List collections
show collections

# Get collection stats
db.calls.stats()
```

---

## 📚 Collection Operations (Marin Schema)

### Create Collections

```javascript
// Create 'calls' collection with validation
db.createCollection("calls", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["call_id", "status", "created_at"],
      properties: {
        call_id: { bsonType: "string" },
        status: {
          bsonType: "string",
          enum: ["uploaded", "transcribing", "analyzing", "complete", "failed"]
        },
        created_at: { bsonType: "date" },
        metadata: { bsonType: "object" },
        transcript: { bsonType: "string" },
        analysis: { bsonType: "object" }
      }
    }
  }
})

// Create other collections
db.createCollection("contacts")
db.createCollection("insights_aggregated")
db.createCollection("processing_metrics")
db.createCollection("quality_metrics")

// Drop collection (careful!)
db.calls.drop()
```

---

## 🔍 Indexes (Marin Schema)

```javascript
// === calls collection indexes ===
// Unique index on call_id
db.calls.createIndex({ call_id: 1 }, { unique: true })

// Index on status for filtering
db.calls.createIndex({ status: 1 })

// Compound index for company queries
db.calls.createIndex({ "metadata.company_name": 1, created_at: -1 })

// Index on created_at for time-based queries
db.calls.createIndex({ created_at: -1 })

// === contacts collection indexes ===
db.contacts.createIndex({ contact_id: 1 }, { unique: true })
db.contacts.createIndex({ company: 1 })
db.contacts.createIndex({ email: 1 }, { sparse: true })

// === insights_aggregated collection indexes ===
db.insights_aggregated.createIndex({ date: -1, company_name: 1 })

// === List all indexes ===
db.calls.getIndexes()

// === Drop index ===
db.calls.dropIndex("status_1")

// === Rebuild indexes ===
db.calls.reIndex()
```

---

## ➕ Insert Operations

```javascript
// Insert single document
db.calls.insertOne({
  call_id: "call_20251104_001",
  status: "uploaded",
  created_at: new Date(),
  metadata: {
    company_name: "Acme Corp",
    duration_seconds: 1200,
    call_date: new Date("2025-11-04")
  }
})

// Insert multiple documents
db.calls.insertMany([
  { call_id: "call_001", status: "complete", created_at: new Date() },
  { call_id: "call_002", status: "analyzing", created_at: new Date() }
])

// Insert with timestamp
db.contacts.insertOne({
  contact_id: "cnt_001",
  name: "John Doe",
  company: "Acme Corp",
  created_at: new Date(),
  _id: ObjectId()  // Auto-generated if not provided
})
```

---

## 🔎 Query Operations

```javascript
// Find all documents
db.calls.find()

// Find with filter
db.calls.find({ status: "complete" })

// Find one document
db.calls.findOne({ call_id: "call_001" })

// Find with multiple conditions
db.calls.find({
  status: "complete",
  "metadata.company_name": "Acme Corp"
})

// Find with comparison operators
db.calls.find({
  created_at: { $gte: ISODate("2025-11-01"), $lt: ISODate("2025-11-04") }
})

// Find with OR
db.calls.find({
  $or: [
    { status: "complete" },
    { status: "failed" }
  ]
})

// Projection (select specific fields)
db.calls.find(
  { status: "complete" },
  { call_id: 1, created_at: 1, _id: 0 }
)

// Limit and skip (pagination)
db.calls.find().limit(10).skip(20)

// Sort
db.calls.find().sort({ created_at: -1 })  // Descending

// Count
db.calls.countDocuments({ status: "complete" })
db.calls.estimatedDocumentCount()  // Faster, less accurate

// Distinct values
db.calls.distinct("status")
db.calls.distinct("metadata.company_name")
```

---

## 🔄 Update Operations

```javascript
// Update one document
db.calls.updateOne(
  { call_id: "call_001" },
  { $set: { status: "complete", updated_at: new Date() } }
)

// Update multiple documents
db.calls.updateMany(
  { status: "uploaded" },
  { $set: { status: "transcribing" } }
)

// Update with increment
db.processing_metrics.updateOne(
  { metric_name: "calls_processed" },
  { $inc: { value: 1 } }
)

// Update with push (array)
db.contacts.updateOne(
  { contact_id: "cnt_001" },
  { $push: { extracted_from_calls: "call_001" } }
)

// Update with upsert (insert if not exists)
db.calls.updateOne(
  { call_id: "call_999" },
  { $set: { status: "uploaded", created_at: new Date() } },
  { upsert: true }
)

// Replace document
db.calls.replaceOne(
  { call_id: "call_001" },
  { call_id: "call_001", status: "complete", created_at: new Date() }
)

// Find and modify (atomic)
db.calls.findOneAndUpdate(
  { call_id: "call_001" },
  { $set: { status: "analyzing" } },
  { returnDocument: "after" }
)
```

---

## 🗑️ Delete Operations

```javascript
// Delete one document
db.calls.deleteOne({ call_id: "call_001" })

// Delete multiple documents
db.calls.deleteMany({ status: "failed" })

// Delete all documents in collection (careful!)
db.calls.deleteMany({})

// Find and delete (atomic)
db.calls.findOneAndDelete({ call_id: "call_001" })
```

---

## 📊 Aggregation (Analytics)

```javascript
// Count by status
db.calls.aggregate([
  { $group: {
      _id: "$status",
      count: { $sum: 1 }
  }}
])

// Average duration by company
db.calls.aggregate([
  { $group: {
      _id: "$metadata.company_name",
      avg_duration: { $avg: "$metadata.duration_seconds" },
      count: { $sum: 1 }
  }},
  { $sort: { count: -1 } }
])

// Daily call counts
db.calls.aggregate([
  { $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
      count: { $sum: 1 }
  }},
  { $sort: { _id: -1 } }
])

// Complex aggregation with multiple stages
db.calls.aggregate([
  // Filter
  { $match: { status: "complete" } },

  // Project fields
  { $project: {
      call_id: 1,
      company: "$metadata.company_name",
      duration: "$metadata.duration_seconds",
      date: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } }
  }},

  // Group by company and date
  { $group: {
      _id: { company: "$company", date: "$date" },
      total_calls: { $sum: 1 },
      total_duration: { $sum: "$duration" }
  }},

  // Sort
  { $sort: { "_id.date": -1, total_calls: -1 } },

  // Limit
  { $limit: 100 }
])

// Lookup (join) - Get call details with contact info
db.calls.aggregate([
  { $lookup: {
      from: "contacts",
      localField: "metadata.contact_id",
      foreignField: "contact_id",
      as: "contact_details"
  }},
  { $unwind: "$contact_details" }
])
```

---

## 🧪 Development & Testing

```javascript
// Explain query plan
db.calls.find({ status: "complete" }).explain("executionStats")

// Check if index is used
db.calls.find({ status: "complete" }).explain("executionStats").executionStats.totalDocsExamined

// Get collection size
db.calls.stats().size
db.calls.stats().storageSize

// Validate collection
db.calls.validate({ full: true })

// Sample random documents
db.calls.aggregate([{ $sample: { size: 5 } }])

// Pretty print
db.calls.find().pretty()

// Get first document
db.calls.findOne()

// Count documents efficiently
db.calls.estimatedDocumentCount()
```

---

## 🔐 User Management (MongoDB Atlas)

```javascript
// List users
db.getUsers()

// Create user (run on admin database)
use admin
db.createUser({
  user: "marin_app",
  pwd: "secure_password",
  roles: [
    { role: "readWrite", db: "audio_pipeline" }
  ]
})

// Grant role
db.grantRolesToUser("marin_app", [
  { role: "readWrite", db: "audio_pipeline" }
])

// Revoke role
db.revokeRolesFromUser("marin_app", [
  { role: "readWrite", db: "audio_pipeline" }
])

// Drop user
db.dropUser("marin_app")

// Change password
db.changeUserPassword("marin_app", "new_password")
```

---

## 🌐 MongoDB Atlas API (curl)

### Setup

```bash
# Set environment variables
export ATLAS_PUBLIC_KEY="your-public-key"
export ATLAS_PRIVATE_KEY="your-private-key"
export ATLAS_ORG_ID="your-org-id"
export ATLAS_PROJECT_ID="your-project-id"
```

### Common API Calls

```bash
# List all projects in organization
curl -u "$ATLAS_PUBLIC_KEY:$ATLAS_PRIVATE_KEY" \
  https://cloud.mongodb.com/api/atlas/v1.0/orgs/$ATLAS_ORG_ID/groups

# Get project details
curl -u "$ATLAS_PUBLIC_KEY:$ATLAS_PRIVATE_KEY" \
  https://cloud.mongodb.com/api/atlas/v1.0/groups/$ATLAS_PROJECT_ID

# List clusters in project
curl -u "$ATLAS_PUBLIC_KEY:$ATLAS_PRIVATE_KEY" \
  https://cloud.mongodb.com/api/atlas/v1.0/groups/$ATLAS_PROJECT_ID/clusters

# Get cluster details
curl -u "$ATLAS_PUBLIC_KEY:$ATLAS_PRIVATE_KEY" \
  https://cloud.mongodb.com/api/atlas/v1.0/groups/$ATLAS_PROJECT_ID/clusters/marin-dev-cluster

# Get connection strings
curl -u "$ATLAS_PUBLIC_KEY:$ATLAS_PRIVATE_KEY" \
  https://cloud.mongodb.com/api/atlas/v1.0/groups/$ATLAS_PROJECT_ID/clusters/marin-dev-cluster/connectionStrings

# List database users
curl -u "$ATLAS_PUBLIC_KEY:$ATLAS_PRIVATE_KEY" \
  https://cloud.mongodb.com/api/atlas/v1.0/groups/$ATLAS_PROJECT_ID/databaseUsers

# Get cluster metrics
curl -u "$ATLAS_PUBLIC_KEY:$ATLAS_PRIVATE_KEY" \
  "https://cloud.mongodb.com/api/atlas/v1.0/groups/$ATLAS_PROJECT_ID/processes/mongodb.marin-dev-cluster.mongodb.net:27017/measurements?granularity=PT1M&period=PT1H&m=CONNECTIONS"
```

---

## 📈 Monitoring & Performance

```javascript
// Current operations
db.currentOp()

// Kill operation
db.killOp(OPID)

// Server status
db.serverStatus()

// Profiling level
db.getProfilingLevel()
db.setProfilingLevel(1, { slowms: 100 })  // Log slow queries >100ms

// Get slow queries
db.system.profile.find().sort({ ts: -1 }).limit(5)

// Database statistics
db.stats()

// Collection statistics
db.calls.stats()

// Index statistics
db.calls.aggregate([{ $indexStats: {} }])
```

---

## 🧹 Maintenance

```javascript
// Compact collection (reclaim disk space)
db.runCommand({ compact: "calls" })

// Repair database (offline operation)
db.repairDatabase()

// Get replication status
rs.status()

// Get replication config
rs.conf()

// Force sync from primary
rs.syncFrom("primary-host:27017")
```

---

## 🔄 Data Migration

```bash
# Export collection to JSON
mongoexport \
  --uri="mongodb+srv://cluster.mongodb.net/audio_pipeline" \
  --collection=calls \
  --out=calls.json

# Export to CSV
mongoexport \
  --uri="mongodb+srv://cluster.mongodb.net/audio_pipeline" \
  --collection=calls \
  --type=csv \
  --fields=call_id,status,created_at \
  --out=calls.csv

# Import from JSON
mongoimport \
  --uri="mongodb+srv://cluster.mongodb.net/audio_pipeline" \
  --collection=calls \
  --file=calls.json

# Import from CSV
mongoimport \
  --uri="mongodb+srv://cluster.mongodb.net/audio_pipeline" \
  --collection=calls \
  --type=csv \
  --headerline \
  --file=calls.csv

# Backup database
mongodump \
  --uri="mongodb+srv://cluster.mongodb.net/audio_pipeline" \
  --out=/backup/

# Restore database
mongorestore \
  --uri="mongodb+srv://cluster.mongodb.net/" \
  --db=audio_pipeline \
  /backup/audio_pipeline/
```

---

## 💡 Marin-Specific Queries

```javascript
// === Common Operations for Marin Project ===

// Get all calls for a company
db.calls.find({ "metadata.company_name": "Acme Corp" })
  .sort({ created_at: -1 })

// Get calls by status
db.calls.find({ status: "complete" })
  .limit(10)
  .sort({ created_at: -1 })

// Get failed calls for debugging
db.calls.find({ status: "failed" })
  .sort({ created_at: -1 })

// Get today's calls
db.calls.find({
  created_at: {
    $gte: new Date(new Date().setHours(0,0,0,0))
  }
})

// Get calls needing processing
db.calls.find({ status: "uploaded" })
  .sort({ created_at: 1 })

// Update call status
db.calls.updateOne(
  { call_id: "call_001" },
  {
    $set: {
      status: "complete",
      updated_at: new Date()
    }
  }
)

// Get contacts for a company
db.contacts.find({ company: "Acme Corp" })

// Daily insights for company
db.insights_aggregated.find({
  company_name: "Acme Corp",
  date: { $gte: new Date("2025-11-01") }
}).sort({ date: -1 })

// Quality metrics
db.quality_metrics.find({
  created_at: { $gte: new Date(Date.now() - 24*60*60*1000) }
}).sort({ created_at: -1 })

// Processing metrics dashboard
db.processing_metrics.aggregate([
  { $match: {
      timestamp: { $gte: new Date(Date.now() - 3600*1000) }  // Last hour
  }},
  { $group: {
      _id: "$metric_name",
      avg_value: { $avg: "$value" },
      count: { $sum: 1 }
  }}
])
```

---

## 🚨 Troubleshooting

```javascript
// Check connection
db.adminCommand({ ping: 1 })

// Check database size
db.stats().dataSize / (1024*1024*1024)  // Size in GB

// Find large documents
db.calls.find().sort({ $natural: -1 }).limit(1).forEach(doc => {
  print(Object.bsonsize(doc))
})

// Check index usage
db.calls.aggregate([{ $indexStats: {} }])

// Get slow queries
db.system.profile.find({ millis: { $gt: 1000 } })
  .sort({ ts: -1 })
  .limit(10)

// Check locks
db.currentOp({ $or: [{ waitingForLock: true }, { locks: { $exists: true } }] })

// Check replication lag
db.printSlaveReplicationInfo()
```

---

## 💡 Pro Tips

```javascript
// Use explain to optimize queries
db.calls.find({ status: "complete" }).explain("executionStats")

// Create indexes for your queries
// Always index fields used in:
// - Where clauses
// - Sort operations
// - Joins ($lookup)

// Use projections to reduce data transfer
db.calls.find({}, { call_id: 1, status: 1, _id: 0 })

// Use limit() for testing queries
db.calls.find().limit(1)

// Check if query uses index (should see IXSCAN)
db.calls.find({ status: "complete" }).explain("executionStats").executionStats.executionStages.stage
```

---

## 📚 Additional Resources

- `mongosh --help` - Shell help
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [mongosh Documentation](https://docs.mongodb.com/mongodb-shell/)
- [Atlas API](https://docs.atlas.mongodb.com/api/)
- [Aggregation Pipeline](https://docs.mongodb.com/manual/aggregation/)

---

**Last Updated:** 2025-11-04
**Marin Project** | MongoDB 7.0 | mongosh 2.x
