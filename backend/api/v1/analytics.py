"""
Analytics API endpoints.
Story 5.2: Build Analytics API Endpoints

Provides comprehensive analytics on:
- Call volume and trends
- Sentiment analysis over time
- Entity statistics and mentions
- Performance metrics
- Conversation outcomes
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Depends
from pymongo import MongoClient
from pydantic import BaseModel, Field

from backend.core.config import settings
from backend.core.dependencies import require_analyst
from backend.models.auth import AuthenticatedUser

logger = logging.getLogger(__name__)

router = APIRouter()


# Response Models
class CallVolumeStats(BaseModel):
    """Call volume statistics."""
    total_calls: int = Field(..., description="Total number of calls")
    analyzed_calls: int = Field(..., description="Successfully analyzed calls")
    failed_calls: int = Field(..., description="Failed calls")
    pending_calls: int = Field(..., description="Calls in processing")
    average_duration_seconds: float = Field(..., description="Average call duration")
    total_duration_hours: float = Field(..., description="Total call duration in hours")


class CallVolumeTimeSeries(BaseModel):
    """Call volume over time."""
    date: str = Field(..., description="Date (YYYY-MM-DD)")
    call_count: int = Field(..., description="Number of calls")
    analyzed_count: int = Field(..., description="Analyzed calls")
    average_duration: float = Field(..., description="Average duration in seconds")


class SentimentDistribution(BaseModel):
    """Sentiment distribution statistics."""
    positive_count: int = Field(default=0, description="Positive sentiment calls")
    neutral_count: int = Field(default=0, description="Neutral sentiment calls")
    negative_count: int = Field(default=0, description="Negative sentiment calls")
    positive_percentage: float = Field(..., description="Positive percentage")
    neutral_percentage: float = Field(..., description="Neutral percentage")
    negative_percentage: float = Field(..., description="Negative percentage")
    average_score: float = Field(..., description="Average sentiment score (-1 to 1)")


class SentimentTrendPoint(BaseModel):
    """Sentiment trend data point."""
    date: str = Field(..., description="Date")
    positive_count: int
    neutral_count: int
    negative_count: int
    average_score: float


class EntityStatistics(BaseModel):
    """Entity statistics."""
    entity_id: str = Field(..., description="Entity ID")
    canonical_name: str = Field(..., description="Canonical entity name")
    entity_type: str = Field(..., description="Entity type")
    total_mentions: int = Field(..., description="Total mentions across calls")
    call_count: int = Field(..., description="Number of calls mentioning entity")
    first_mentioned: datetime = Field(..., description="First mention timestamp")
    last_mentioned: datetime = Field(..., description="Last mention timestamp")


class TopicStatistics(BaseModel):
    """Topic statistics."""
    topic: str = Field(..., description="Topic name")
    call_count: int = Field(..., description="Number of calls")
    percentage: float = Field(..., description="Percentage of total calls")


class PainPointStatistics(BaseModel):
    """Pain point statistics."""
    pain_point: str = Field(..., description="Pain point description")
    count: int = Field(..., description="Number of occurrences")
    severity_avg: float = Field(..., description="Average severity (1-10)")
    calls: List[str] = Field(..., description="Call IDs mentioning this pain point")


class OutcomeStatistics(BaseModel):
    """Call outcome statistics."""
    outcome: str = Field(..., description="Outcome type")
    count: int = Field(..., description="Number of calls")
    percentage: float = Field(..., description="Percentage of total")


class PerformanceMetrics(BaseModel):
    """System performance metrics."""
    average_transcription_time: float = Field(..., description="Avg transcription time (seconds)")
    average_analysis_time: float = Field(..., description="Avg analysis time (seconds)")
    average_total_time: float = Field(..., description="Avg total processing time (seconds)")
    success_rate: float = Field(..., description="Success rate percentage")
    total_cost_usd: float = Field(..., description="Total API costs (USD)")
    average_cost_per_call: float = Field(..., description="Average cost per call (USD)")


class AnalyticsSummary(BaseModel):
    """Comprehensive analytics summary."""
    period_start: datetime
    period_end: datetime
    call_volume: CallVolumeStats
    sentiment: SentimentDistribution
    performance: PerformanceMetrics
    top_topics: List[TopicStatistics]
    top_entities: List[EntityStatistics]
    outcomes: List[OutcomeStatistics]


@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    days: int = Query(default=30, description="Number of days to analyze (if dates not provided)"),
    current_user: AuthenticatedUser = Depends(require_analyst)
):
    """
    Get comprehensive analytics summary.

    Requires analyst or admin role.

    Args:
        start_date: Optional start date
        end_date: Optional end date
        days: Number of days to look back if dates not specified
        current_user: Authenticated user

    Returns:
        AnalyticsSummary: Complete analytics data
    """
    # Parse dates
    if start_date and end_date:
        period_start = datetime.fromisoformat(start_date)
        period_end = datetime.fromisoformat(end_date)
    else:
        period_end = datetime.utcnow()
        period_start = period_end - timedelta(days=days)

    mongo_client = None
    try:
        mongo_client = MongoClient(settings.mongodb_uri)
        db = mongo_client[settings.mongodb_database]
        calls_collection = db.calls

        # Get all calls in period
        calls = list(calls_collection.find({
            'created_at': {
                '$gte': period_start,
                '$lte': period_end
            }
        }))

        # Calculate call volume stats
        total_calls = len(calls)
        analyzed_calls = sum(1 for c in calls if c.get('status') == 'analyzed')
        failed_calls = sum(1 for c in calls if c.get('status') == 'failed')
        pending_calls = total_calls - analyzed_calls - failed_calls

        durations = [c.get('duration_seconds', 0) for c in calls if c.get('duration_seconds')]
        avg_duration = sum(durations) / len(durations) if durations else 0
        total_duration_hours = sum(durations) / 3600 if durations else 0

        call_volume = CallVolumeStats(
            total_calls=total_calls,
            analyzed_calls=analyzed_calls,
            failed_calls=failed_calls,
            pending_calls=pending_calls,
            average_duration_seconds=round(avg_duration, 2),
            total_duration_hours=round(total_duration_hours, 2)
        )

        # Calculate sentiment distribution
        positive = 0
        neutral = 0
        negative = 0
        sentiment_scores = []

        for call in calls:
            if call.get('status') == 'analyzed':
                sentiment = call.get('analysis', {}).get('sentiment', {})
                overall = sentiment.get('overall', '').lower()
                score = sentiment.get('score', 0)

                if overall == 'positive':
                    positive += 1
                elif overall == 'negative':
                    negative += 1
                else:
                    neutral += 1

                sentiment_scores.append(score)

        total_with_sentiment = positive + neutral + negative
        sentiment_dist = SentimentDistribution(
            positive_count=positive,
            neutral_count=neutral,
            negative_count=negative,
            positive_percentage=round((positive / total_with_sentiment) * 100, 1) if total_with_sentiment > 0 else 0,
            neutral_percentage=round((neutral / total_with_sentiment) * 100, 1) if total_with_sentiment > 0 else 0,
            negative_percentage=round((negative / total_with_sentiment) * 100, 1) if total_with_sentiment > 0 else 0,
            average_score=round(sum(sentiment_scores) / len(sentiment_scores), 3) if sentiment_scores else 0
        )

        # Calculate performance metrics
        transcription_times = []
        analysis_times = []
        total_times = []
        total_cost = 0

        for call in calls:
            if call.get('status') == 'analyzed':
                processing = call.get('processing', {})
                metadata = call.get('processing_metadata', {})

                if processing.get('transcribed_at') and processing.get('uploaded_at'):
                    trans_time = (processing['transcribed_at'] - processing['uploaded_at']).total_seconds()
                    transcription_times.append(trans_time)

                if processing.get('analyzed_at') and processing.get('transcribed_at'):
                    analysis_time = (processing['analyzed_at'] - processing['transcribed_at']).total_seconds()
                    analysis_times.append(analysis_time)

                if processing.get('analyzed_at') and processing.get('uploaded_at'):
                    total_time = (processing['analyzed_at'] - processing['uploaded_at']).total_seconds()
                    total_times.append(total_time)

                # Sum costs
                trans_cost = metadata.get('transcription', {}).get('cost_usd', 0)
                analysis_cost = metadata.get('analysis', {}).get('cost_usd', 0)
                total_cost += trans_cost + analysis_cost

        performance = PerformanceMetrics(
            average_transcription_time=round(sum(transcription_times) / len(transcription_times), 2) if transcription_times else 0,
            average_analysis_time=round(sum(analysis_times) / len(analysis_times), 2) if analysis_times else 0,
            average_total_time=round(sum(total_times) / len(total_times), 2) if total_times else 0,
            success_rate=round((analyzed_calls / total_calls) * 100, 2) if total_calls > 0 else 0,
            total_cost_usd=round(total_cost, 2),
            average_cost_per_call=round(total_cost / analyzed_calls, 4) if analyzed_calls > 0 else 0
        )

        # Top topics
        topic_counts: Dict[str, int] = {}
        for call in calls:
            if call.get('status') == 'analyzed':
                topics = call.get('analysis', {}).get('key_topics', [])
                for topic in topics:
                    topic_counts[topic] = topic_counts.get(topic, 0) + 1

        top_topics = [
            TopicStatistics(
                topic=topic,
                call_count=count,
                percentage=round((count / analyzed_calls) * 100, 1) if analyzed_calls > 0 else 0
            )
            for topic, count in sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        ]

        # Top entities
        entities_collection = db.entities
        top_entities_data = list(entities_collection.find().sort('total_mentions', -1).limit(10))

        top_entities = [
            EntityStatistics(
                entity_id=e['entity_id'],
                canonical_name=e['canonical_name'],
                entity_type=e['entity_type'],
                total_mentions=e['total_mentions'],
                call_count=e['call_count'],
                first_mentioned=e['first_mentioned'],
                last_mentioned=e['last_mentioned']
            )
            for e in top_entities_data
        ]

        # Call outcomes
        outcome_counts: Dict[str, int] = {}
        for call in calls:
            if call.get('status') == 'analyzed':
                outcome = call.get('analysis', {}).get('call_outcome', 'unknown')
                outcome_counts[outcome] = outcome_counts.get(outcome, 0) + 1

        outcomes = [
            OutcomeStatistics(
                outcome=outcome,
                count=count,
                percentage=round((count / analyzed_calls) * 100, 1) if analyzed_calls > 0 else 0
            )
            for outcome, count in sorted(outcome_counts.items(), key=lambda x: x[1], reverse=True)
        ]

        return AnalyticsSummary(
            period_start=period_start,
            period_end=period_end,
            call_volume=call_volume,
            sentiment=sentiment_dist,
            performance=performance,
            top_topics=top_topics,
            top_entities=top_entities,
            outcomes=outcomes
        )

    finally:
        if mongo_client:
            mongo_client.close()


@router.get("/call-volume/timeseries", response_model=List[CallVolumeTimeSeries])
async def get_call_volume_timeseries(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    days: int = Query(default=30, description="Number of days"),
    current_user: AuthenticatedUser = Depends(require_analyst)
):
    """
    Get call volume time series data.

    Args:
        start_date: Optional start date
        end_date: Optional end date
        days: Number of days to look back
        current_user: Authenticated user

    Returns:
        List[CallVolumeTimeSeries]: Daily call volume data
    """
    if start_date and end_date:
        period_start = datetime.fromisoformat(start_date)
        period_end = datetime.fromisoformat(end_date)
    else:
        period_end = datetime.utcnow()
        period_start = period_end - timedelta(days=days)

    mongo_client = None
    try:
        mongo_client = MongoClient(settings.mongodb_uri)
        db = mongo_client[settings.mongodb_database]

        # Aggregate by day
        pipeline = [
            {
                '$match': {
                    'created_at': {
                        '$gte': period_start,
                        '$lte': period_end
                    }
                }
            },
            {
                '$group': {
                    '_id': {
                        '$dateToString': {
                            'format': '%Y-%m-%d',
                            'date': '$created_at'
                        }
                    },
                    'call_count': {'$sum': 1},
                    'analyzed_count': {
                        '$sum': {
                            '$cond': [{'$eq': ['$status', 'analyzed']}, 1, 0]
                        }
                    },
                    'average_duration': {
                        '$avg': '$duration_seconds'
                    }
                }
            },
            {
                '$sort': {'_id': 1}
            }
        ]

        results = list(db.calls.aggregate(pipeline))

        return [
            CallVolumeTimeSeries(
                date=r['_id'],
                call_count=r['call_count'],
                analyzed_count=r['analyzed_count'],
                average_duration=round(r.get('average_duration', 0), 2)
            )
            for r in results
        ]

    finally:
        if mongo_client:
            mongo_client.close()


@router.get("/sentiment/trends", response_model=List[SentimentTrendPoint])
async def get_sentiment_trends(
    days: int = Query(default=30, description="Number of days"),
    current_user: AuthenticatedUser = Depends(require_analyst)
):
    """
    Get sentiment trends over time.

    Args:
        days: Number of days to analyze
        current_user: Authenticated user

    Returns:
        List[SentimentTrendPoint]: Daily sentiment trends
    """
    period_end = datetime.utcnow()
    period_start = period_end - timedelta(days=days)

    mongo_client = None
    try:
        mongo_client = MongoClient(settings.mongodb_uri)
        db = mongo_client[settings.mongodb_database]

        pipeline = [
            {
                '$match': {
                    'status': 'analyzed',
                    'created_at': {
                        '$gte': period_start,
                        '$lte': period_end
                    }
                }
            },
            {
                '$group': {
                    '_id': {
                        '$dateToString': {
                            'format': '%Y-%m-%d',
                            'date': '$created_at'
                        }
                    },
                    'positive_count': {
                        '$sum': {
                            '$cond': [
                                {'$eq': [{'$toLower': '$analysis.sentiment.overall'}, 'positive']},
                                1,
                                0
                            ]
                        }
                    },
                    'neutral_count': {
                        '$sum': {
                            '$cond': [
                                {'$eq': [{'$toLower': '$analysis.sentiment.overall'}, 'neutral']},
                                1,
                                0
                            ]
                        }
                    },
                    'negative_count': {
                        '$sum': {
                            '$cond': [
                                {'$eq': [{'$toLower': '$analysis.sentiment.overall'}, 'negative']},
                                1,
                                0
                            ]
                        }
                    },
                    'average_score': {
                        '$avg': '$analysis.sentiment.score'
                    }
                }
            },
            {
                '$sort': {'_id': 1}
            }
        ]

        results = list(db.calls.aggregate(pipeline))

        return [
            SentimentTrendPoint(
                date=r['_id'],
                positive_count=r['positive_count'],
                neutral_count=r['neutral_count'],
                negative_count=r['negative_count'],
                average_score=round(r.get('average_score', 0), 3)
            )
            for r in results
        ]

    finally:
        if mongo_client:
            mongo_client.close()


@router.get("/pain-points", response_model=List[PainPointStatistics])
async def get_top_pain_points(
    days: int = Query(default=30, description="Number of days"),
    limit: int = Query(default=20, le=100, description="Maximum results"),
    current_user: AuthenticatedUser = Depends(require_analyst)
):
    """
    Get top pain points mentioned in calls.

    Args:
        days: Number of days to analyze
        limit: Maximum number of results
        current_user: Authenticated user

    Returns:
        List[PainPointStatistics]: Top pain points
    """
    period_end = datetime.utcnow()
    period_start = period_end - timedelta(days=days)

    mongo_client = None
    try:
        mongo_client = MongoClient(settings.mongodb_uri)
        db = mongo_client[settings.mongodb_database]

        calls = list(db.calls.find({
            'status': 'analyzed',
            'created_at': {
                '$gte': period_start,
                '$lte': period_end
            }
        }))

        # Aggregate pain points
        pain_point_data: Dict[str, Dict[str, Any]] = {}

        for call in calls:
            pain_points = call.get('analysis', {}).get('pain_points', [])
            for pp in pain_points:
                description = pp.get('pain_point', '')
                if not description:
                    continue

                if description not in pain_point_data:
                    pain_point_data[description] = {
                        'count': 0,
                        'severities': [],
                        'calls': []
                    }

                pain_point_data[description]['count'] += 1
                pain_point_data[description]['severities'].append(pp.get('severity', 5))
                pain_point_data[description]['calls'].append(call['call_id'])

        # Convert to response model
        results = [
            PainPointStatistics(
                pain_point=pp,
                count=data['count'],
                severity_avg=round(sum(data['severities']) / len(data['severities']), 1),
                calls=data['calls'][:5]  # Limit to first 5 calls
            )
            for pp, data in sorted(pain_point_data.items(), key=lambda x: x[1]['count'], reverse=True)[:limit]
        ]

        return results

    finally:
        if mongo_client:
            mongo_client.close()


@router.get("/entities/top", response_model=List[EntityStatistics])
async def get_top_entities(
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    limit: int = Query(default=20, le=100, description="Maximum results"),
    current_user: AuthenticatedUser = Depends(require_analyst)
):
    """
    Get top mentioned entities.

    Args:
        entity_type: Optional filter by entity type (person, company, product)
        limit: Maximum number of results
        current_user: Authenticated user

    Returns:
        List[EntityStatistics]: Top entities
    """
    mongo_client = None
    try:
        mongo_client = MongoClient(settings.mongodb_uri)
        db = mongo_client[settings.mongodb_database]

        query = {}
        if entity_type:
            query['entity_type'] = entity_type

        entities = list(
            db.entities.find(query)
            .sort('total_mentions', -1)
            .limit(limit)
        )

        return [
            EntityStatistics(
                entity_id=e['entity_id'],
                canonical_name=e['canonical_name'],
                entity_type=e['entity_type'],
                total_mentions=e['total_mentions'],
                call_count=e['call_count'],
                first_mentioned=e['first_mentioned'],
                last_mentioned=e['last_mentioned']
            )
            for e in entities
        ]

    finally:
        if mongo_client:
            mongo_client.close()
