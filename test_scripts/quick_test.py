#!/usr/bin/env python3
"""
Quick Test Script - Marin Pipeline
Tests basic connectivity and data loading without running full analysis

Usage:
    python quick_test.py
"""

import os
from pathlib import Path
from datetime import datetime
from uuid import uuid4
import re

try:
    from pymongo import MongoClient
    from redis import Redis
except ImportError:
    print("❌ Missing dependencies. Install with:")
    print("   pip install pymongo redis")
    exit(1)


def test_connections():
    """Test MongoDB and Redis connections"""
    print("🔌 Testing connections...\n")

    # MongoDB
    mongo_uri = os.getenv('MONGODB_URI')
    if not mongo_uri:
        print("❌ MONGODB_URI environment variable not set")
        print("   Set it with: export MONGODB_URI='mongodb+srv://...'")
        return False

    try:
        print(f"  → MongoDB: {mongo_uri[:50]}...")
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        db = client.get_database()
        print(f"  ✅ MongoDB connected (database: {db.name})")

        # Check collections
        collections = db.list_collection_names()
        print(f"  📦 Collections: {', '.join(collections) if collections else 'none yet'}")

    except Exception as e:
        print(f"  ❌ MongoDB connection failed: {e}")
        return False

    # Redis
    redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    try:
        print(f"\n  → Redis: {redis_url}")
        redis_client = Redis.from_url(redis_url, socket_connect_timeout=5)
        redis_client.ping()
        print(f"  ✅ Redis connected")
    except Exception as e:
        print(f"  ⚠️  Redis connection failed (optional): {e}")

    return True


def load_conversations():
    """Load and validate conversation files"""
    print("\n📁 Loading conversations...\n")

    script_dir = Path(__file__).parent
    conversations = list(script_dir.glob("conversation_*.txt"))

    if not conversations:
        print("❌ No conversation files found")
        return []

    loaded = []
    for filepath in sorted(conversations):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            # Extract basic info
            lines = content.split('\n')
            title = lines[0].strip()
            word_count = len(content.split())

            # Extract company
            company_match = re.search(r'(?:company|brand|agency)[\s:]+([A-Za-z0-9\s&-]+)', content, re.IGNORECASE)
            company = company_match.group(1).strip() if company_match else "Unknown"

            loaded.append({
                'file': filepath.name,
                'title': title,
                'company': company,
                'words': word_count,
                'content': content
            })

            print(f"  ✅ {filepath.name:30} {word_count:5} words - {company}")

        except Exception as e:
            print(f"  ❌ Error loading {filepath.name}: {e}")

    print(f"\n📊 Total: {len(loaded)} conversations loaded")
    return loaded


def create_sample_call(conversations):
    """Create one sample call in MongoDB"""
    print("\n💾 Creating sample call in MongoDB...\n")

    if not conversations:
        print("❌ No conversations to use")
        return None

    mongo_uri = os.getenv('MONGODB_URI')
    if not mongo_uri:
        print("❌ MONGODB_URI not set")
        return None

    try:
        client = MongoClient(mongo_uri)
        db = client.get_database()

        # Use first conversation
        conv = conversations[0]
        call_id = str(uuid4())

        call_doc = {
            "call_id": call_id,
            "status": "transcribed",  # Ready for analysis
            "transcript": conv['content'],
            "audio_duration_seconds": int(conv['words'] / 150 * 60),  # ~150 words/min
            "metadata": {
                "company_name": conv['company'],
                "call_type": "discovery",
                "source": "quick_test",
                "source_file": conv['file'],
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        db.calls.insert_one(call_doc)

        print(f"  ✅ Created call: {call_id}")
        print(f"     Company: {conv['company']}")
        print(f"     Words: {conv['words']}")
        print(f"     File: {conv['file']}")

        # Verify
        check = db.calls.find_one({"call_id": call_id})
        if check:
            print(f"\n  ✅ Verified in database")
            print(f"     Status: {check['status']}")
            print(f"     Transcript length: {len(check['transcript'])} chars")
        else:
            print(f"\n  ❌ Could not verify in database")

        return call_id

    except Exception as e:
        print(f"  ❌ Error creating call: {e}")
        return None


def check_existing_calls():
    """Check existing calls in database"""
    print("\n📊 Checking existing calls...\n")

    mongo_uri = os.getenv('MONGODB_URI')
    if not mongo_uri:
        return

    try:
        client = MongoClient(mongo_uri)
        db = client.get_database()

        # Count by status
        total = db.calls.count_documents({})
        print(f"  📈 Total calls: {total}")

        if total > 0:
            # Status breakdown
            statuses = db.calls.aggregate([
                {"$group": {"_id": "$status", "count": {"$sum": 1}}}
            ])
            print(f"\n  Status breakdown:")
            for status in statuses:
                print(f"    {status['_id']:15} {status['count']}")

            # Recent calls
            recent = list(db.calls.find().sort("created_at", -1).limit(5))
            if recent:
                print(f"\n  Recent calls:")
                for call in recent:
                    company = call.get('metadata', {}).get('company_name', 'Unknown')
                    status = call.get('status', 'unknown')
                    created = call.get('created_at', datetime.utcnow())
                    print(f"    {call['call_id'][:8]}... {company:30} {status:15} {created.strftime('%Y-%m-%d %H:%M')}")

    except Exception as e:
        print(f"  ❌ Error checking calls: {e}")


def main():
    print("="*80)
    print("🚀 MARIN QUICK TEST")
    print("="*80)
    print()

    # Test connections
    if not test_connections():
        print("\n❌ Connection test failed. Fix issues above and try again.")
        return

    # Load conversations
    conversations = load_conversations()

    # Check existing calls
    check_existing_calls()

    # Ask to create sample
    if conversations:
        print("\n" + "="*80)
        response = input("\n💾 Create a sample call in MongoDB? (yes/no): ")
        if response.lower() == 'yes':
            create_sample_call(conversations)

    print("\n" + "="*80)
    print("✅ Quick test complete!")
    print("="*80)
    print()
    print("Next steps:")
    print("  1. Review the data above")
    print("  2. Run full test: python test_pipeline.py --skip-analysis")
    print("  3. Run with analysis: python test_pipeline.py")
    print()


if __name__ == "__main__":
    main()
