"""
Insights Aggregation Service.

This service aggregates call analysis data to generate daily/weekly insights,
including trends, top pain points, objections, and topics (Story 3.4).
"""

import logging
import uuid
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, date, timedelta
from collections import Counter, defaultdict
from pymongo import MongoClient
from core.config import settings
from models.insights import (
    DailyInsights,
    WeeklyInsights,
    SentimentTrend,
    TopPainPoint,
    TopObjection,
    TopTopic,
    EntityMentionStats,
    CallVolumeStats,
    EngagementStats,
    QualityStats,
    CostStats,
    TrendComparison
)

logger = logging.getLogger(__name__)


class InsightsService:
    """
    Service for aggregating call analysis data into insights.

    Generates daily and weekly insights from analyzed calls.
    """

    def __init__(
        self,
        mongo_uri: Optional[str] = None,
        database_name: Optional[str] = None
    ):
        """
        Initialize insights service.

        Args:
            mongo_uri: MongoDB connection URI
            database_name: Database name
        """
        self.mongo_uri = mongo_uri or settings.mongodb_uri
        self.database_name = database_name or settings.mongodb_database

    def generate_daily_insights(self, target_date: date) -> DailyInsights:
        """
        Generate insights for a specific day.

        Args:
            target_date: Date to generate insights for

        Returns:
            DailyInsights object with aggregated data
        """
        mongo_client = None

        try:
            mongo_client = MongoClient(self.mongo_uri)
            db = mongo_client[self.database_name]
            calls_collection = db.calls
            insights_collection = db.insights

            logger.info(
                "Generating daily insights",
                extra={'date': target_date.isoformat()}
            )

            # Query calls for this date
            start_datetime = datetime.combine(target_date, datetime.min.time())
            end_datetime = datetime.combine(target_date, datetime.max.time())

            calls = list(calls_collection.find({
                'status': 'analyzed',
                'processing.analyzed_at': {
                    '$gte': start_datetime,
                    '$lte': end_datetime
                }
            }))

            if not calls:
                logger.info(
                    "No analyzed calls found for date",
                    extra={'date': target_date.isoformat()}
                )
                # Return empty insights
                return self._create_empty_insights(target_date)

            logger.info(
                "Retrieved calls for aggregation",
                extra={'date': target_date.isoformat(), 'call_count': len(calls)}
            )

            # Aggregate all metrics
            call_volume = self._aggregate_call_volume(calls, target_date)
            engagement = self._aggregate_engagement(calls, target_date)
            quality = self._aggregate_quality(calls, target_date)
            costs = self._aggregate_costs(calls, target_date)
            sentiment_trend = self._aggregate_sentiment(calls, target_date)

            # Get previous day's data for trend comparison
            previous_date = target_date - timedelta(days=1)
            previous_calls = list(calls_collection.find({
                'status': 'analyzed',
                'processing.analyzed_at': {
                    '$gte': datetime.combine(previous_date, datetime.min.time()),
                    '$lte': datetime.combine(previous_date, datetime.max.time())
                }
            }))

            top_pain_points = self._aggregate_pain_points(calls, previous_calls)
            top_objections = self._aggregate_objections(calls, previous_calls)
            top_topics = self._aggregate_topics(calls, previous_calls)
            top_entities = self._aggregate_entities(calls, previous_calls)

            # Create insights object
            insights = DailyInsights(
                insights_id=str(uuid.uuid4()),
                date=target_date,
                period_type='daily',
                call_volume=call_volume,
                engagement=engagement,
                quality=quality,
                costs=costs,
                sentiment_trend=sentiment_trend,
                top_pain_points=top_pain_points,
                top_objections=top_objections,
                top_topics=top_topics,
                top_entities=top_entities,
                total_calls_analyzed=len(calls),
                generated_at=datetime.utcnow(),
                next_update_at=datetime.combine(target_date + timedelta(days=1), datetime.min.time())
            )

            # Save to MongoDB
            insights_dict = insights.model_dump()
            insights_dict['_id'] = insights.insights_id

            # Upsert (replace if exists for this date)
            insights_collection.replace_one(
                {'date': target_date.isoformat(), 'period_type': 'daily'},
                insights_dict,
                upsert=True
            )

            logger.info(
                "Daily insights generated and saved",
                extra={
                    'date': target_date.isoformat(),
                    'insights_id': insights.insights_id,
                    'calls_analyzed': len(calls)
                }
            )

            return insights

        finally:
            if mongo_client:
                mongo_client.close()

    def _aggregate_call_volume(self, calls: List[Dict], target_date: date) -> CallVolumeStats:
        """Aggregate call volume statistics."""
        by_type = Counter()
        by_outcome = Counter()
        total_duration = 0
        duration_count = 0

        for call in calls:
            analysis = call.get('analysis', {})
            call_type = analysis.get('call_type', 'unknown')
            outcome = analysis.get('call_outcome', 'unknown')

            by_type[call_type] += 1
            by_outcome[outcome] += 1

            # Get duration if available
            transcript = call.get('transcript', {})
            if duration := transcript.get('duration_seconds'):
                total_duration += duration
                duration_count += 1

        avg_duration = total_duration / duration_count if duration_count > 0 else None

        return CallVolumeStats(
            date=target_date,
            total_calls=len(calls),
            by_type=dict(by_type),
            by_outcome=dict(by_outcome),
            average_duration_seconds=avg_duration
        )

    def _aggregate_engagement(self, calls: List[Dict], target_date: date) -> EngagementStats:
        """Aggregate engagement statistics."""
        engagement_counts = {'high': 0, 'medium': 0, 'low': 0}
        total_score = 0

        for call in calls:
            analysis = call.get('analysis', {})
            level = analysis.get('engagement_level', 'medium').lower()

            if level in engagement_counts:
                engagement_counts[level] += 1

            # Convert to score (high=100, medium=50, low=0)
            score = {'high': 100, 'medium': 50, 'low': 0}.get(level, 50)
            total_score += score

        avg_score = total_score / len(calls) if calls else 0

        return EngagementStats(
            date=target_date,
            high_engagement=engagement_counts['high'],
            medium_engagement=engagement_counts['medium'],
            low_engagement=engagement_counts['low'],
            average_engagement_score=avg_score
        )

    def _aggregate_quality(self, calls: List[Dict], target_date: date) -> QualityStats:
        """Aggregate analysis quality statistics."""
        quality_counts = {'high': 0, 'medium': 0, 'low': 0}
        total_score = 0

        for call in calls:
            analysis = call.get('analysis', {})
            quality_data = analysis.get('quality_validation', {})
            score = quality_data.get('quality_score', 0)

            total_score += score

            if score >= 80:
                quality_counts['high'] += 1
            elif score >= 60:
                quality_counts['medium'] += 1
            else:
                quality_counts['low'] += 1

        avg_score = total_score / len(calls) if calls else 0

        return QualityStats(
            date=target_date,
            average_quality_score=avg_score,
            high_quality=quality_counts['high'],
            medium_quality=quality_counts['medium'],
            low_quality=quality_counts['low']
        )

    def _aggregate_costs(self, calls: List[Dict], target_date: date) -> CostStats:
        """Aggregate processing cost statistics."""
        total_cost = 0
        transcription_cost = 0
        analysis_cost = 0

        for call in calls:
            processing_metadata = call.get('processing_metadata', {})

            # Transcription cost
            if trans_meta := processing_metadata.get('transcription'):
                transcription_cost += trans_meta.get('cost_usd', 0)

            # Analysis cost
            if analysis_meta := processing_metadata.get('analysis'):
                analysis_cost += analysis_meta.get('cost_usd', 0)

        total_cost = transcription_cost + analysis_cost
        avg_cost = total_cost / len(calls) if calls else 0

        return CostStats(
            date=target_date,
            total_cost_usd=round(total_cost, 2),
            transcription_cost_usd=round(transcription_cost, 2),
            analysis_cost_usd=round(analysis_cost, 2),
            average_cost_per_call=round(avg_cost, 2)
        )

    def _aggregate_sentiment(self, calls: List[Dict], target_date: date) -> SentimentTrend:
        """Aggregate sentiment statistics."""
        sentiment_counts = defaultdict(int)
        total_score = 0

        for call in calls:
            analysis = call.get('analysis', {})
            sentiment = analysis.get('sentiment', {})

            overall = sentiment.get('overall', 'neutral')
            score = sentiment.get('score', 0)

            sentiment_counts[overall] += 1
            total_score += score

        avg_score = total_score / len(calls) if calls else 0

        return SentimentTrend(
            date=target_date,
            positive_count=sentiment_counts.get('positive', 0),
            negative_count=sentiment_counts.get('negative', 0),
            neutral_count=sentiment_counts.get('neutral', 0),
            mixed_count=sentiment_counts.get('mixed', 0),
            average_score=avg_score
        )

    def _aggregate_pain_points(
        self,
        calls: List[Dict],
        previous_calls: List[Dict]
    ) -> List[TopPainPoint]:
        """Aggregate top pain points with trends."""
        pain_points = []
        pain_point_map = defaultdict(lambda: {
            'count': 0,
            'category': '',
            'severity': '',
            'calls': []
        })

        # Aggregate current period
        for call in calls:
            analysis = call.get('analysis', {})
            for pain_point in analysis.get('pain_points', []):
                desc = pain_point.get('description', '')
                if not desc:
                    continue

                key = desc.lower()
                pain_point_map[key]['count'] += 1
                pain_point_map[key]['category'] = pain_point.get('category', 'other')
                pain_point_map[key]['severity'] = pain_point.get('severity', 'medium')
                if len(pain_point_map[key]['calls']) < 3:
                    pain_point_map[key]['calls'].append(call.get('call_id'))

        # Calculate trends
        prev_counts = self._count_pain_points(previous_calls)

        # Convert to TopPainPoint objects
        for desc, data in sorted(pain_point_map.items(), key=lambda x: x[1]['count'], reverse=True)[:10]:
            frequency = data['count']
            percentage = (frequency / len(calls)) * 100 if calls else 0

            # Determine trend
            prev_count = prev_counts.get(desc, 0)
            trend = self._calculate_trend(frequency, prev_count)

            pain_points.append(TopPainPoint(
                description=desc.capitalize(),
                category=data['category'],
                severity=data['severity'],
                frequency=frequency,
                percentage=round(percentage, 1),
                trend=trend,
                example_calls=data['calls']
            ))

        return pain_points

    def _aggregate_objections(
        self,
        calls: List[Dict],
        previous_calls: List[Dict]
    ) -> List[TopObjection]:
        """Aggregate top objections with resolution rates."""
        objections_data = defaultdict(lambda: {
            'count': 0,
            'type': '',
            'resolved': 0,
            'calls': []
        })

        # Aggregate current period
        for call in calls:
            analysis = call.get('analysis', {})
            for objection in analysis.get('objections', []):
                obj_text = objection.get('objection', '')
                if not obj_text:
                    continue

                key = obj_text.lower()
                objections_data[key]['count'] += 1
                objections_data[key]['type'] = objection.get('type', 'other')

                # Check resolution
                if objection.get('resolution_status') == 'resolved':
                    objections_data[key]['resolved'] += 1

                if len(objections_data[key]['calls']) < 3:
                    objections_data[key]['calls'].append(call.get('call_id'))

        # Calculate trends
        prev_counts = self._count_objections(previous_calls)

        # Convert to TopObjection objects
        objections = []
        for obj_text, data in sorted(objections_data.items(), key=lambda x: x[1]['count'], reverse=True)[:10]:
            frequency = data['count']
            percentage = (frequency / len(calls)) * 100 if calls else 0
            resolution_rate = (data['resolved'] / frequency) * 100 if frequency > 0 else 0

            # Determine trend
            prev_count = prev_counts.get(obj_text, 0)
            trend = self._calculate_trend(frequency, prev_count)

            objections.append(TopObjection(
                objection=obj_text.capitalize(),
                type=data['type'],
                frequency=frequency,
                percentage=round(percentage, 1),
                resolution_rate=round(resolution_rate, 1),
                trend=trend,
                example_calls=data['calls']
            ))

        return objections

    def _aggregate_topics(
        self,
        calls: List[Dict],
        previous_calls: List[Dict]
    ) -> List[TopTopic]:
        """Aggregate top topics."""
        topics_data = defaultdict(lambda: {
            'count': 0,
            'high': 0,
            'medium': 0,
            'low': 0
        })

        # Aggregate current period
        for call in calls:
            analysis = call.get('analysis', {})
            for topic in analysis.get('key_topics', []):
                topic_name = topic.get('topic', '')
                if not topic_name:
                    continue

                key = topic_name.lower()
                topics_data[key]['count'] += 1

                # Track importance levels
                importance = topic.get('importance', 'medium')
                topics_data[key][importance] += 1

        # Calculate trends
        prev_counts = self._count_topics(previous_calls)

        # Convert to TopTopic objects
        topics = []
        for topic_name, data in sorted(topics_data.items(), key=lambda x: x[1]['count'], reverse=True)[:10]:
            frequency = data['count']
            percentage = (frequency / len(calls)) * 100 if calls else 0

            # Determine trend
            prev_count = prev_counts.get(topic_name, 0)
            trend = self._calculate_trend(frequency, prev_count)

            topics.append(TopTopic(
                topic=topic_name.title(),
                frequency=frequency,
                percentage=round(percentage, 1),
                importance_high=data['high'],
                importance_medium=data['medium'],
                importance_low=data['low'],
                trend=trend
            ))

        return topics

    def _aggregate_entities(
        self,
        calls: List[Dict],
        previous_calls: List[Dict]
    ) -> List[EntityMentionStats]:
        """Aggregate entity mention statistics."""
        entity_stats = defaultdict(lambda: {
            'mentions': 0,
            'calls': set(),
            'type': '',
            'name': ''
        })

        # Aggregate current period
        for call in calls:
            entity_resolution = call.get('entity_resolution', {})
            for mapping in entity_resolution.get('entity_mappings', []):
                canonical_id = mapping.get('canonical_id')
                if not canonical_id:
                    continue

                entity_stats[canonical_id]['mentions'] += 1
                entity_stats[canonical_id]['calls'].add(call.get('call_id'))
                entity_stats[canonical_id]['name'] = mapping.get('canonical_name', '')
                entity_stats[canonical_id]['type'] = mapping.get('entity_type', 'other')

        # Calculate trends
        prev_entity_counts = self._count_entities(previous_calls)

        # Convert to EntityMentionStats objects
        entities = []
        for entity_id, data in sorted(entity_stats.items(), key=lambda x: x[1]['mentions'], reverse=True)[:20]:
            mentions = data['mentions']
            call_count = len(data['calls'])

            # Determine trend
            prev_count = prev_entity_counts.get(entity_id, 0)
            trend = self._calculate_trend(mentions, prev_count)

            entities.append(EntityMentionStats(
                entity_id=entity_id,
                canonical_name=data['name'],
                entity_type=data['type'],
                mentions=mentions,
                calls=call_count,
                trend=trend
            ))

        return entities

    def _count_pain_points(self, calls: List[Dict]) -> Dict[str, int]:
        """Count pain points in a set of calls."""
        counts = defaultdict(int)
        for call in calls:
            analysis = call.get('analysis', {})
            for pain_point in analysis.get('pain_points', []):
                desc = pain_point.get('description', '').lower()
                if desc:
                    counts[desc] += 1
        return dict(counts)

    def _count_objections(self, calls: List[Dict]) -> Dict[str, int]:
        """Count objections in a set of calls."""
        counts = defaultdict(int)
        for call in calls:
            analysis = call.get('analysis', {})
            for objection in analysis.get('objections', []):
                obj_text = objection.get('objection', '').lower()
                if obj_text:
                    counts[obj_text] += 1
        return dict(counts)

    def _count_topics(self, calls: List[Dict]) -> Dict[str, int]:
        """Count topics in a set of calls."""
        counts = defaultdict(int)
        for call in calls:
            analysis = call.get('analysis', {})
            for topic in analysis.get('key_topics', []):
                topic_name = topic.get('topic', '').lower()
                if topic_name:
                    counts[topic_name] += 1
        return dict(counts)

    def _count_entities(self, calls: List[Dict]) -> Dict[str, int]:
        """Count entity mentions in a set of calls."""
        counts = defaultdict(int)
        for call in calls:
            entity_resolution = call.get('entity_resolution', {})
            for mapping in entity_resolution.get('entity_mappings', []):
                if entity_id := mapping.get('canonical_id'):
                    counts[entity_id] += 1
        return dict(counts)

    def _calculate_trend(self, current: int, previous: int) -> str:
        """Calculate trend based on current vs previous count."""
        if previous == 0:
            return 'new' if current > 0 else 'stable'

        change = ((current - previous) / previous) * 100

        if change > 10:
            return 'increasing'
        elif change < -10:
            return 'decreasing'
        else:
            return 'stable'

    def _create_empty_insights(self, target_date: date) -> DailyInsights:
        """Create empty insights for a date with no calls."""
        return DailyInsights(
            insights_id=str(uuid.uuid4()),
            date=target_date,
            period_type='daily',
            call_volume=CallVolumeStats(date=target_date, total_calls=0),
            engagement=EngagementStats(date=target_date, average_engagement_score=0),
            quality=QualityStats(date=target_date, average_quality_score=0),
            costs=CostStats(date=target_date, total_cost_usd=0, transcription_cost_usd=0, analysis_cost_usd=0, average_cost_per_call=0),
            sentiment_trend=SentimentTrend(date=target_date, average_score=0),
            total_calls_analyzed=0
        )


# Singleton instance
_insights_service = None


def get_insights_service() -> InsightsService:
    """
    Get singleton insights service instance.

    Returns:
        InsightsService: Configured service instance
    """
    global _insights_service
    if _insights_service is None:
        _insights_service = InsightsService()
    return _insights_service
