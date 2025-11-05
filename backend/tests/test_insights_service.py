"""
Unit tests for insights service.

Tests daily insights aggregation, trend calculation, and statistics.
"""

import pytest
from unittest.mock import Mock, MagicMock, patch
from datetime import date, datetime, timedelta
from services.insights_service import InsightsService
from models.insights import (
    DailyInsights,
    SentimentTrend,
    TopPainPoint,
    TopObjection,
    TopTopic,
    CallVolumeStats
)


@pytest.fixture
def sample_analyzed_calls():
    """Sample analyzed calls for testing."""
    base_date = datetime(2025, 11, 4, 10, 0, 0)

    return [
        {
            'call_id': 'call-1',
            'status': 'analyzed',
            'processing': {
                'analyzed_at': base_date
            },
            'transcript': {
                'duration_seconds': 300
            },
            'analysis': {
                'call_type': 'sales',
                'call_outcome': 'positive',
                'engagement_level': 'high',
                'sentiment': {
                    'overall': 'positive',
                    'score': 0.8
                },
                'pain_points': [
                    {
                        'description': 'Slow CRM system',
                        'severity': 'high',
                        'category': 'technical'
                    }
                ],
                'objections': [
                    {
                        'objection': 'Price too high',
                        'type': 'pricing',
                        'resolution_status': 'resolved'
                    }
                ],
                'key_topics': [
                    {
                        'topic': 'CRM Migration',
                        'importance': 'high'
                    }
                ],
                'quality_validation': {
                    'quality_score': 85
                }
            },
            'processing_metadata': {
                'transcription': {'cost_usd': 0.02},
                'analysis': {'cost_usd': 0.15}
            },
            'entity_resolution': {
                'entity_mappings': [
                    {
                        'canonical_id': 'entity-1',
                        'canonical_name': 'Acme Corp',
                        'entity_type': 'company'
                    }
                ]
            }
        },
        {
            'call_id': 'call-2',
            'status': 'analyzed',
            'processing': {
                'analyzed_at': base_date
            },
            'transcript': {
                'duration_seconds': 450
            },
            'analysis': {
                'call_type': 'support',
                'call_outcome': 'neutral',
                'engagement_level': 'medium',
                'sentiment': {
                    'overall': 'neutral',
                    'score': 0.0
                },
                'pain_points': [
                    {
                        'description': 'slow crm system',  # Duplicate (lowercase)
                        'severity': 'medium',
                        'category': 'technical'
                    }
                ],
                'objections': [],
                'key_topics': [
                    {
                        'topic': 'Technical Support',
                        'importance': 'medium'
                    }
                ],
                'quality_validation': {
                    'quality_score': 75
                }
            },
            'processing_metadata': {
                'transcription': {'cost_usd': 0.03},
                'analysis': {'cost_usd': 0.14}
            },
            'entity_resolution': {
                'entity_mappings': []
            }
        }
    ]


@pytest.fixture
def sample_previous_calls():
    """Sample previous day calls for trend comparison."""
    prev_date = datetime(2025, 11, 3, 10, 0, 0)

    return [
        {
            'call_id': 'call-prev-1',
            'status': 'analyzed',
            'processing': {
                'analyzed_at': prev_date
            },
            'analysis': {
                'pain_points': [
                    {
                        'description': 'Slow CRM system',
                        'severity': 'high',
                        'category': 'technical'
                    }
                ],
                'objections': [],
                'key_topics': []
            }
        }
    ]


class TestInsightsService:
    """Test suite for InsightsService."""

    def test_service_initialization(self):
        """Test service can be initialized."""
        service = InsightsService()
        assert service.mongo_uri is not None
        assert service.database_name is not None

    def test_aggregate_call_volume(self, sample_analyzed_calls):
        """Test call volume aggregation."""
        service = InsightsService()
        target_date = date(2025, 11, 4)

        volume = service._aggregate_call_volume(sample_analyzed_calls, target_date)

        assert volume.date == target_date
        assert volume.total_calls == 2
        assert volume.by_type['sales'] == 1
        assert volume.by_type['support'] == 1
        assert volume.by_outcome['positive'] == 1
        assert volume.by_outcome['neutral'] == 1
        assert volume.average_duration_seconds == 375.0  # (300 + 450) / 2

    def test_aggregate_engagement(self, sample_analyzed_calls):
        """Test engagement aggregation."""
        service = InsightsService()
        target_date = date(2025, 11, 4)

        engagement = service._aggregate_engagement(sample_analyzed_calls, target_date)

        assert engagement.date == target_date
        assert engagement.high_engagement == 1
        assert engagement.medium_engagement == 1
        assert engagement.low_engagement == 0
        assert engagement.average_engagement_score == 75.0  # (100 + 50) / 2

    def test_aggregate_quality(self, sample_analyzed_calls):
        """Test quality aggregation."""
        service = InsightsService()
        target_date = date(2025, 11, 4)

        quality = service._aggregate_quality(sample_analyzed_calls, target_date)

        assert quality.date == target_date
        assert quality.average_quality_score == 80.0  # (85 + 75) / 2
        assert quality.high_quality == 1  # ≥80
        assert quality.medium_quality == 1  # 60-79
        assert quality.low_quality == 0  # <60

    def test_aggregate_costs(self, sample_analyzed_calls):
        """Test cost aggregation."""
        service = InsightsService()
        target_date = date(2025, 11, 4)

        costs = service._aggregate_costs(sample_analyzed_calls, target_date)

        assert costs.date == target_date
        assert costs.transcription_cost_usd == 0.05  # 0.02 + 0.03
        assert costs.analysis_cost_usd == 0.29  # 0.15 + 0.14
        assert costs.total_cost_usd == 0.34  # 0.05 + 0.29
        assert costs.average_cost_per_call == 0.17  # 0.34 / 2

    def test_aggregate_sentiment(self, sample_analyzed_calls):
        """Test sentiment aggregation."""
        service = InsightsService()
        target_date = date(2025, 11, 4)

        sentiment = service._aggregate_sentiment(sample_analyzed_calls, target_date)

        assert sentiment.date == target_date
        assert sentiment.positive_count == 1
        assert sentiment.neutral_count == 1
        assert sentiment.negative_count == 0
        assert sentiment.average_score == 0.4  # (0.8 + 0.0) / 2

    def test_aggregate_pain_points(self, sample_analyzed_calls, sample_previous_calls):
        """Test pain points aggregation with trend."""
        service = InsightsService()

        pain_points = service._aggregate_pain_points(
            sample_analyzed_calls,
            sample_previous_calls
        )

        assert len(pain_points) > 0

        # Check first pain point
        top_pain = pain_points[0]
        assert top_pain.description.lower() == 'slow crm system'
        assert top_pain.frequency == 2  # Mentioned in both calls
        assert top_pain.percentage == 100.0  # 2/2 * 100
        assert top_pain.category == 'technical'
        assert top_pain.trend in ['stable', 'increasing']  # Compared to previous day

    def test_aggregate_objections(self, sample_analyzed_calls, sample_previous_calls):
        """Test objections aggregation."""
        service = InsightsService()

        objections = service._aggregate_objections(
            sample_analyzed_calls,
            sample_previous_calls
        )

        assert len(objections) > 0

        # Check objection details
        top_objection = objections[0]
        assert 'price' in top_objection.objection.lower()
        assert top_objection.frequency == 1
        assert top_objection.type == 'pricing'
        assert top_objection.resolution_rate == 100.0  # 1/1 resolved

    def test_aggregate_topics(self, sample_analyzed_calls, sample_previous_calls):
        """Test topics aggregation."""
        service = InsightsService()

        topics = service._aggregate_topics(
            sample_analyzed_calls,
            sample_previous_calls
        )

        assert len(topics) == 2

        # Check topics are counted
        topic_names = [t.topic.lower() for t in topics]
        assert 'crm migration' in topic_names
        assert 'technical support' in topic_names

    def test_aggregate_entities(self, sample_analyzed_calls, sample_previous_calls):
        """Test entity aggregation."""
        service = InsightsService()

        entities = service._aggregate_entities(
            sample_analyzed_calls,
            sample_previous_calls
        )

        assert len(entities) == 1

        top_entity = entities[0]
        assert top_entity.entity_id == 'entity-1'
        assert top_entity.canonical_name == 'Acme Corp'
        assert top_entity.entity_type == 'company'
        assert top_entity.mentions == 1
        assert top_entity.calls == 1

    def test_calculate_trend_increasing(self):
        """Test trend calculation for increasing values."""
        service = InsightsService()

        # Increase >10%
        trend = service._calculate_trend(current=15, previous=10)
        assert trend == 'increasing'

    def test_calculate_trend_decreasing(self):
        """Test trend calculation for decreasing values."""
        service = InsightsService()

        # Decrease >10%
        trend = service._calculate_trend(current=8, previous=10)
        assert trend == 'decreasing'

    def test_calculate_trend_stable(self):
        """Test trend calculation for stable values."""
        service = InsightsService()

        # Change <10%
        trend = service._calculate_trend(current=10, previous=10)
        assert trend == 'stable'

        trend = service._calculate_trend(current=11, previous=10)
        assert trend == 'stable'

    def test_calculate_trend_new(self):
        """Test trend calculation for new items."""
        service = InsightsService()

        # No previous value
        trend = service._calculate_trend(current=5, previous=0)
        assert trend == 'new'

    def test_create_empty_insights(self):
        """Test creating empty insights for day with no calls."""
        service = InsightsService()
        target_date = date(2025, 11, 4)

        insights = service._create_empty_insights(target_date)

        assert insights.date == target_date
        assert insights.total_calls_analyzed == 0
        assert insights.call_volume.total_calls == 0
        assert insights.sentiment_trend.average_score == 0
        assert len(insights.top_pain_points) == 0
        assert len(insights.top_objections) == 0

    @patch('services.insights_service.MongoClient')
    def test_generate_daily_insights_no_calls(self, mock_mongo_client):
        """Test generating insights when no calls exist."""
        # Setup mocks
        mock_client = MagicMock()
        mock_mongo_client.return_value = mock_client
        mock_db = MagicMock()
        mock_client.__getitem__.return_value = mock_db

        mock_calls_collection = MagicMock()
        mock_calls_collection.find.return_value = []
        mock_db.calls = mock_calls_collection

        mock_insights_collection = MagicMock()
        mock_db.insights = mock_insights_collection

        service = InsightsService()
        target_date = date(2025, 11, 4)

        insights = service.generate_daily_insights(target_date)

        assert insights.date == target_date
        assert insights.total_calls_analyzed == 0

        # Verify insights were saved
        mock_insights_collection.replace_one.assert_called_once()

    @patch('services.insights_service.MongoClient')
    def test_generate_daily_insights_with_calls(
        self,
        mock_mongo_client,
        sample_analyzed_calls,
        sample_previous_calls
    ):
        """Test generating insights with sample calls."""
        # Setup mocks
        mock_client = MagicMock()
        mock_mongo_client.return_value = mock_client
        mock_db = MagicMock()
        mock_client.__getitem__.return_value = mock_db

        mock_calls_collection = MagicMock()

        def mock_find(query):
            # Return appropriate calls based on date range
            if 'processing.analyzed_at' in query:
                date_filter = query['processing.analyzed_at']
                if '$lte' in date_filter:
                    # Current day query
                    return sample_analyzed_calls
                else:
                    # Previous day query
                    return sample_previous_calls
            return []

        mock_calls_collection.find.side_effect = mock_find
        mock_db.calls = mock_calls_collection

        mock_insights_collection = MagicMock()
        mock_db.insights = mock_insights_collection

        service = InsightsService()
        target_date = date(2025, 11, 4)

        insights = service.generate_daily_insights(target_date)

        assert insights.date == target_date
        assert insights.total_calls_analyzed == 2
        assert insights.call_volume.total_calls == 2
        assert insights.sentiment_trend.positive_count == 1
        assert len(insights.top_pain_points) > 0

        # Verify insights were saved
        mock_insights_collection.replace_one.assert_called_once()


class TestInsightsModels:
    """Test insights data models."""

    def test_sentiment_trend_model(self):
        """Test SentimentTrend model validation."""
        trend = SentimentTrend(
            date=date(2025, 11, 4),
            positive_count=10,
            negative_count=2,
            neutral_count=5,
            mixed_count=1,
            average_score=0.5
        )

        assert trend.positive_count == 10
        assert trend.average_score == 0.5

    def test_top_pain_point_model(self):
        """Test TopPainPoint model validation."""
        pain_point = TopPainPoint(
            description="Slow performance",
            category="technical",
            severity="high",
            frequency=15,
            percentage=75.0,
            trend="increasing",
            example_calls=["call-1", "call-2"]
        )

        assert pain_point.frequency == 15
        assert pain_point.trend == "increasing"

    def test_call_volume_stats_model(self):
        """Test CallVolumeStats model validation."""
        stats = CallVolumeStats(
            date=date(2025, 11, 4),
            total_calls=100,
            by_type={"sales": 60, "support": 40},
            by_outcome={"positive": 70, "neutral": 20, "negative": 10},
            average_duration_seconds=450.5
        )

        assert stats.total_calls == 100
        assert stats.by_type["sales"] == 60
