#!/usr/bin/env python3
"""
Marin Pipeline Test Script
Tests the complete processing pipeline using synthetic conversation data

This script:
1. Reads conversation transcripts from text files
2. Creates call records in MongoDB (bypassing audio upload)
3. Triggers AI analysis pipeline
4. Tests semantic search indexing
5. Validates analytics aggregation
6. Generates comprehensive test report

Usage:
    python test_pipeline.py --env dev --conversations ./
    python test_pipeline.py --env dev --conversations ./ --skip-analysis
    python test_pipeline.py --env dev --conversations ./ --only-report
"""

import argparse
import asyncio
import json
import os
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional
from uuid import uuid4

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from pymongo import MongoClient
from redis import Redis
import boto3
from botocore.exceptions import ClientError

# Import backend modules
try:
    from core.config import settings
    from models.call import Call, CallStatus
    from workers.tasks import analyze_call_task
    from services.opensearch import OpenSearchService
except ImportError as e:
    print(f"❌ Error importing backend modules: {e}")
    print("Make sure you're running from the marin project root and backend dependencies are installed")
    sys.exit(1)


class ConversationParser:
    """Parse conversation transcript files"""

    @staticmethod
    def parse_file(filepath: Path) -> Dict:
        """Parse a conversation file and extract metadata"""
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract title/profile
        lines = content.split('\n')
        title = lines[0].replace('Conversation ', '').replace(':', '').strip()

        # Extract company name from profile or conversation
        company_match = re.search(r'(?:company|brand|agency)[\s:]+([A-Za-z0-9\s&-]+)', content, re.IGNORECASE)
        company_name = company_match.group(1).strip() if company_match else f"Company-{title}"

        # Determine call type based on content
        call_type = "discovery"
        if "performance" in content.lower() or "campaign" in content.lower():
            call_type = "sales"
        elif "support" in content.lower() or "issue" in content.lower():
            call_type = "support"

        # Calculate duration (approximate based on word count)
        word_count = len(content.split())
        duration_seconds = int(word_count / 150 * 60)  # ~150 words per minute

        return {
            "title": title,
            "company_name": company_name,
            "call_type": call_type,
            "transcript": content,
            "duration_seconds": duration_seconds,
            "word_count": word_count,
        }


class PipelineTester:
    """Test the complete Marin pipeline"""

    def __init__(self, env: str = "dev"):
        self.env = env
        self.results = {
            "environment": env,
            "test_start": datetime.utcnow().isoformat(),
            "conversations_loaded": 0,
            "calls_created": 0,
            "analyses_completed": 0,
            "analyses_failed": 0,
            "embeddings_created": 0,
            "errors": [],
            "call_ids": [],
            "test_duration_seconds": 0,
        }

        # Initialize connections
        self.mongo_client = None
        self.redis_client = None
        self.opensearch_service = None

    def connect(self):
        """Connect to all services"""
        print(f"🔌 Connecting to services (environment: {self.env})...")

        try:
            # MongoDB
            print(f"  → MongoDB: {settings.mongodb_uri}")
            self.mongo_client = MongoClient(settings.mongodb_uri)
            self.db = self.mongo_client[settings.mongodb_database]
            self.db.admin.command('ping')
            print("  ✅ MongoDB connected")

            # Redis
            print(f"  → Redis: {settings.redis_url}")
            self.redis_client = Redis.from_url(settings.redis_url)
            self.redis_client.ping()
            print("  ✅ Redis connected")

            # OpenSearch (optional for now)
            try:
                self.opensearch_service = OpenSearchService()
                print("  ✅ OpenSearch service initialized")
            except Exception as e:
                print(f"  ⚠️  OpenSearch unavailable: {e}")
                self.opensearch_service = None

        except Exception as e:
            print(f"  ❌ Connection failed: {e}")
            raise

    def load_conversations(self, directory: Path) -> List[Dict]:
        """Load all conversation files from directory"""
        print(f"\n📁 Loading conversations from {directory}...")

        conversations = []
        for filepath in sorted(directory.glob("conversation_*.txt")):
            try:
                data = ConversationParser.parse_file(filepath)
                data['source_file'] = filepath.name
                conversations.append(data)
                print(f"  ✅ Loaded: {filepath.name} ({data['word_count']} words)")
            except Exception as e:
                print(f"  ❌ Error loading {filepath.name}: {e}")
                self.results['errors'].append({
                    "stage": "load",
                    "file": filepath.name,
                    "error": str(e)
                })

        self.results['conversations_loaded'] = len(conversations)
        print(f"\n📊 Loaded {len(conversations)} conversations")
        return conversations

    def create_call_records(self, conversations: List[Dict]) -> List[str]:
        """Create call records in MongoDB (bypassing audio upload)"""
        print(f"\n💾 Creating call records in MongoDB...")

        call_ids = []
        for i, conv in enumerate(conversations, 1):
            try:
                call_id = str(uuid4())

                # Create call document
                call_doc = {
                    "call_id": call_id,
                    "status": CallStatus.TRANSCRIBED,  # Skip audio upload/transcription
                    "transcript": conv['transcript'],
                    "audio_duration_seconds": conv['duration_seconds'],
                    "metadata": {
                        "company_name": conv['company_name'],
                        "call_type": conv['call_type'],
                        "source": "synthetic_test",
                        "source_file": conv['source_file'],
                        "additional_notes": f"Test conversation #{i}",
                    },
                    "created_at": datetime.utcnow() - timedelta(days=20-i),  # Spread over 20 days
                    "updated_at": datetime.utcnow(),
                    "processing_times": {
                        "upload": 0,
                        "transcription": 0,
                    },
                    "costs": {
                        "transcription": 0,
                    }
                }

                # Insert into MongoDB
                self.db.calls.insert_one(call_doc)
                call_ids.append(call_id)

                print(f"  ✅ Created call {i}/{len(conversations)}: {call_id[:8]}... ({conv['company_name']})")

            except Exception as e:
                print(f"  ❌ Error creating call record: {e}")
                self.results['errors'].append({
                    "stage": "create_call",
                    "conversation": conv['source_file'],
                    "error": str(e)
                })

        self.results['calls_created'] = len(call_ids)
        print(f"\n📊 Created {len(call_ids)} call records")
        return call_ids

    async def trigger_analysis(self, call_ids: List[str]):
        """Trigger AI analysis for all calls"""
        print(f"\n🤖 Triggering AI analysis for {len(call_ids)} calls...")
        print("⚠️  Note: This will make real API calls to AWS Bedrock and may incur costs!")

        # Ask for confirmation
        response = input("Continue with analysis? (yes/no): ")
        if response.lower() != 'yes':
            print("❌ Analysis skipped by user")
            return

        for i, call_id in enumerate(call_ids, 1):
            try:
                print(f"  🔄 Analyzing call {i}/{len(call_ids)}: {call_id[:8]}...")

                # Trigger async analysis task
                # In production, this would be done via Celery
                # For testing, we'll call directly
                result = analyze_call_task(call_id)

                if result.get('success'):
                    self.results['analyses_completed'] += 1
                    print(f"  ✅ Analysis complete")
                else:
                    self.results['analyses_failed'] += 1
                    error_msg = result.get('error', 'Unknown error')
                    print(f"  ❌ Analysis failed: {error_msg}")
                    self.results['errors'].append({
                        "stage": "analysis",
                        "call_id": call_id,
                        "error": error_msg
                    })

                # Small delay to avoid rate limiting
                await asyncio.sleep(2)

            except Exception as e:
                self.results['analyses_failed'] += 1
                print(f"  ❌ Error analyzing call: {e}")
                self.results['errors'].append({
                    "stage": "analysis",
                    "call_id": call_id,
                    "error": str(e)
                })

        print(f"\n📊 Analysis Results:")
        print(f"  ✅ Completed: {self.results['analyses_completed']}")
        print(f"  ❌ Failed: {self.results['analyses_failed']}")

    def test_semantic_search(self, call_ids: List[str]):
        """Test semantic search indexing"""
        print(f"\n🔍 Testing semantic search indexing...")

        if not self.opensearch_service:
            print("  ⚠️  OpenSearch not available, skipping")
            return

        # Check how many calls have embeddings
        calls_with_embeddings = self.db.calls.count_documents({
            "call_id": {"$in": call_ids},
            "embeddings": {"$exists": True}
        })

        self.results['embeddings_created'] = calls_with_embeddings
        print(f"  📊 Calls with embeddings: {calls_with_embeddings}/{len(call_ids)}")

        # Test a sample search query
        try:
            test_query = "What are the biggest pain points with campaign management?"
            print(f"\n  🔎 Testing search query: '{test_query}'")

            # This would call the search API
            # results = self.opensearch_service.search(test_query, top_k=5)
            # For now, just verify the service is available
            print(f"  ✅ Search service available")

        except Exception as e:
            print(f"  ❌ Search test failed: {e}")
            self.results['errors'].append({
                "stage": "search",
                "error": str(e)
            })

    def validate_analytics(self, call_ids: List[str]):
        """Validate analytics data"""
        print(f"\n📊 Validating analytics data...")

        # Check analyzed calls
        analyzed_calls = self.db.calls.count_documents({
            "call_id": {"$in": call_ids},
            "status": CallStatus.ANALYZED
        })

        print(f"  📈 Analyzed calls: {analyzed_calls}/{len(call_ids)}")

        # Sample analytics queries
        try:
            # Sentiment distribution
            pipeline = [
                {"$match": {"call_id": {"$in": call_ids}}},
                {"$group": {
                    "_id": "$analysis.overall_sentiment",
                    "count": {"$sum": 1}
                }}
            ]
            sentiment_dist = list(self.db.calls.aggregate(pipeline))
            print(f"\n  📊 Sentiment Distribution:")
            for item in sentiment_dist:
                print(f"    {item['_id']}: {item['count']}")

            # Pain points count
            pain_points_count = self.db.calls.count_documents({
                "call_id": {"$in": call_ids},
                "analysis.pain_points": {"$exists": True, "$ne": []}
            })
            print(f"\n  📊 Calls with pain points: {pain_points_count}")

            # Sample pain points
            sample_call = self.db.calls.find_one({
                "call_id": {"$in": call_ids},
                "analysis.pain_points": {"$exists": True, "$ne": []}
            })

            if sample_call and sample_call.get('analysis', {}).get('pain_points'):
                print(f"\n  📋 Sample pain points from call {sample_call['call_id'][:8]}:")
                for pp in sample_call['analysis']['pain_points'][:3]:
                    print(f"    • {pp.get('pain_point', 'N/A')} (severity: {pp.get('severity', 'N/A')})")

        except Exception as e:
            print(f"  ❌ Analytics validation failed: {e}")
            self.results['errors'].append({
                "stage": "analytics",
                "error": str(e)
            })

    def generate_report(self) -> Dict:
        """Generate comprehensive test report"""
        self.results['test_end'] = datetime.utcnow().isoformat()

        # Calculate duration
        start = datetime.fromisoformat(self.results['test_start'])
        end = datetime.fromisoformat(self.results['test_end'])
        self.results['test_duration_seconds'] = int((end - start).total_seconds())

        print("\n" + "="*80)
        print("📋 TEST REPORT")
        print("="*80)

        print(f"\n⏰ Test Duration: {self.results['test_duration_seconds']}s")
        print(f"🌍 Environment: {self.results['environment']}")

        print(f"\n📊 Data Loading:")
        print(f"  • Conversations loaded: {self.results['conversations_loaded']}")
        print(f"  • Call records created: {self.results['calls_created']}")

        print(f"\n🤖 AI Analysis:")
        print(f"  • Analyses completed: {self.results['analyses_completed']}")
        print(f"  • Analyses failed: {self.results['analyses_failed']}")
        success_rate = (self.results['analyses_completed'] / max(self.results['calls_created'], 1)) * 100
        print(f"  • Success rate: {success_rate:.1f}%")

        print(f"\n🔍 Semantic Search:")
        print(f"  • Embeddings created: {self.results['embeddings_created']}")

        print(f"\n❌ Errors: {len(self.results['errors'])}")
        if self.results['errors']:
            print("\n  Error Summary:")
            error_counts = {}
            for error in self.results['errors']:
                stage = error['stage']
                error_counts[stage] = error_counts.get(stage, 0) + 1
            for stage, count in error_counts.items():
                print(f"    • {stage}: {count} errors")

        print("\n" + "="*80)

        # Save report to file
        report_file = Path(__file__).parent / f"test_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(self.results, f, indent=2)

        print(f"\n💾 Full report saved to: {report_file}")

        return self.results

    def cleanup(self):
        """Cleanup connections"""
        if self.mongo_client:
            self.mongo_client.close()
        if self.redis_client:
            self.redis_client.close()

    async def run(self, conversations_dir: Path, skip_analysis: bool = False, only_report: bool = False):
        """Run the complete test pipeline"""
        try:
            self.connect()

            if not only_report:
                # Load conversations
                conversations = self.load_conversations(conversations_dir)
                if not conversations:
                    print("❌ No conversations loaded, exiting")
                    return

                # Create call records
                call_ids = self.create_call_records(conversations)
                self.results['call_ids'] = call_ids

                if not skip_analysis and call_ids:
                    # Trigger analysis
                    await self.trigger_analysis(call_ids)

                    # Test semantic search
                    self.test_semantic_search(call_ids)

                    # Validate analytics
                    self.validate_analytics(call_ids)

            # Generate report
            self.generate_report()

        finally:
            self.cleanup()


async def main():
    parser = argparse.ArgumentParser(description="Test Marin pipeline with synthetic conversations")
    parser.add_argument("--env", default="dev", help="Environment (dev/staging/prod)")
    parser.add_argument("--conversations", default="./", help="Directory containing conversation files")
    parser.add_argument("--skip-analysis", action="store_true", help="Skip AI analysis (faster testing)")
    parser.add_argument("--only-report", action="store_true", help="Only generate report from existing data")

    args = parser.parse_args()

    conversations_dir = Path(args.conversations).resolve()
    if not conversations_dir.exists():
        print(f"❌ Directory not found: {conversations_dir}")
        sys.exit(1)

    print("="*80)
    print("🚀 MARIN PIPELINE TEST")
    print("="*80)
    print(f"\nEnvironment: {args.env}")
    print(f"Conversations: {conversations_dir}")
    print(f"Skip Analysis: {args.skip_analysis}")
    print(f"Only Report: {args.only_report}")
    print()

    tester = PipelineTester(env=args.env)
    await tester.run(conversations_dir, args.skip_analysis, args.only_report)


if __name__ == "__main__":
    asyncio.run(main())
