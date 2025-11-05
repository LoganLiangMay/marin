"""
Pydantic models for aggregated insights.

This module defines data structures for daily/weekly insights aggregations
from call analysis results (Story 3.4).
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, date


class SentimentTrend(BaseModel):
    """Sentiment trend over time."""
    date: date = Field(..., description="Date of measurement")
    positive_count: int = Field(default=0, description="Number of positive calls")
    negative_count: int = Field(default=0, description="Number of negative calls")
    neutral_count: int = Field(default=0, description="Number of neutral calls")
    mixed_count: int = Field(default=0, description="Number of mixed sentiment calls")
    average_score: float = Field(..., description="Average sentiment score (-1 to 1)")


class TopPainPoint(BaseModel):
    """Frequently mentioned pain point."""
    description: str = Field(..., description="Pain point description")
    category: str = Field(..., description="Category (technical, pricing, feature, etc.)")
    severity: str = Field(..., description="Severity level")
    frequency: int = Field(..., description="Number of times mentioned")
    percentage: float = Field(..., description="Percentage of total calls")
    trend: str = Field(..., description="Trend: increasing, decreasing, stable")
    example_calls: List[str] = Field(default_factory=list, description="Example call IDs")


class TopObjection(BaseModel):
    """Frequently raised objection."""
    objection: str = Field(..., description="Objection description")
    type: str = Field(..., description="Type (pricing, timing, competition, etc.)")
    frequency: int = Field(..., description="Number of times raised")
    percentage: float = Field(..., description="Percentage of total calls")
    resolution_rate: float = Field(..., description="Percentage successfully resolved")
    trend: str = Field(..., description="Trend: increasing, decreasing, stable")
    example_calls: List[str] = Field(default_factory=list, description="Example call IDs")


class TopTopic(BaseModel):
    """Most discussed topic."""
    topic: str = Field(..., description="Topic name")
    frequency: int = Field(..., description="Number of calls discussing this topic")
    percentage: float = Field(..., description="Percentage of total calls")
    importance_high: int = Field(default=0, description="Calls rating this as high importance")
    importance_medium: int = Field(default=0, description="Calls rating this as medium importance")
    importance_low: int = Field(default=0, description="Calls rating this as low importance")
    trend: str = Field(..., description="Trend: increasing, decreasing, stable")


class EntityMentionStats(BaseModel):
    """Statistics about entity mentions."""
    entity_id: str = Field(..., description="Canonical entity ID")
    canonical_name: str = Field(..., description="Entity name")
    entity_type: str = Field(..., description="Entity type")
    mentions: int = Field(..., description="Total mentions in period")
    calls: int = Field(..., description="Number of calls mentioning entity")
    trend: str = Field(..., description="Trend compared to previous period")


class CallVolumeStats(BaseModel):
    """Call volume statistics."""
    date: date = Field(..., description="Date")
    total_calls: int = Field(..., description="Total calls processed")
    by_type: Dict[str, int] = Field(default_factory=dict, description="Calls by type")
    by_outcome: Dict[str, int] = Field(default_factory=dict, description="Calls by outcome")
    average_duration_seconds: Optional[float] = Field(None, description="Average call duration")


class EngagementStats(BaseModel):
    """Call engagement statistics."""
    date: date = Field(..., description="Date")
    high_engagement: int = Field(default=0, description="High engagement calls")
    medium_engagement: int = Field(default=0, description="Medium engagement calls")
    low_engagement: int = Field(default=0, description="Low engagement calls")
    average_engagement_score: float = Field(..., description="Average engagement score (0-100)")


class QualityStats(BaseModel):
    """Analysis quality statistics."""
    date: date = Field(..., description="Date")
    average_quality_score: float = Field(..., description="Average quality score (0-100)")
    high_quality: int = Field(default=0, description="High quality analyses (≥80)")
    medium_quality: int = Field(default=0, description="Medium quality analyses (60-79)")
    low_quality: int = Field(default=0, description="Low quality analyses (<60)")


class CostStats(BaseModel):
    """Processing cost statistics."""
    date: date = Field(..., description="Date")
    total_cost_usd: float = Field(..., description="Total processing cost")
    transcription_cost_usd: float = Field(..., description="Transcription cost")
    analysis_cost_usd: float = Field(..., description="Analysis cost")
    average_cost_per_call: float = Field(..., description="Average cost per call")


class DailyInsights(BaseModel):
    """
    Complete daily insights aggregation.

    Aggregates all analysis data for a single day.
    """
    insights_id: str = Field(..., description="Unique insights ID")
    date: date = Field(..., description="Date of insights")
    period_type: str = Field(default="daily", description="Period type: daily, weekly, monthly")

    # Call statistics
    call_volume: CallVolumeStats = Field(..., description="Call volume stats")
    engagement: EngagementStats = Field(..., description="Engagement stats")
    quality: QualityStats = Field(..., description="Quality stats")
    costs: CostStats = Field(..., description="Cost stats")

    # Sentiment analysis
    sentiment_trend: SentimentTrend = Field(..., description="Sentiment distribution")

    # Top insights
    top_pain_points: List[TopPainPoint] = Field(
        default_factory=list,
        description="Top pain points (max 10)"
    )
    top_objections: List[TopObjection] = Field(
        default_factory=list,
        description="Top objections (max 10)"
    )
    top_topics: List[TopTopic] = Field(
        default_factory=list,
        description="Top topics (max 10)"
    )
    top_entities: List[EntityMentionStats] = Field(
        default_factory=list,
        description="Most mentioned entities (max 20)"
    )

    # Metadata
    total_calls_analyzed: int = Field(..., description="Total calls in this period")
    generated_at: datetime = Field(default_factory=datetime.utcnow, description="When insights were generated")
    next_update_at: Optional[datetime] = Field(None, description="Next scheduled update")


class WeeklyInsights(BaseModel):
    """
    Weekly insights aggregation.

    Aggregates all analysis data for a week.
    """
    insights_id: str = Field(..., description="Unique insights ID")
    week_start: date = Field(..., description="Start of week")
    week_end: date = Field(..., description="End of week")
    period_type: str = Field(default="weekly", description="Period type")

    # Daily breakdowns
    daily_call_volumes: List[CallVolumeStats] = Field(
        default_factory=list,
        description="Daily call volumes"
    )
    daily_sentiment: List[SentimentTrend] = Field(
        default_factory=list,
        description="Daily sentiment trends"
    )

    # Week totals
    total_calls: int = Field(..., description="Total calls in week")
    average_quality_score: float = Field(..., description="Average quality score")
    total_cost_usd: float = Field(..., description="Total cost for week")

    # Top insights for the week
    top_pain_points: List[TopPainPoint] = Field(default_factory=list)
    top_objections: List[TopObjection] = Field(default_factory=list)
    top_topics: List[TopTopic] = Field(default_factory=list)

    generated_at: datetime = Field(default_factory=datetime.utcnow)


class InsightsSummary(BaseModel):
    """Lightweight insights summary for API responses."""
    date: date = Field(..., description="Date of insights")
    total_calls: int = Field(..., description="Total calls")
    average_sentiment: float = Field(..., description="Average sentiment score")
    top_pain_point: Optional[str] = Field(None, description="Most common pain point")
    top_objection: Optional[str] = Field(None, description="Most common objection")
    quality_score: float = Field(..., description="Average quality score")


class TrendComparison(BaseModel):
    """Comparison between two time periods."""
    metric_name: str = Field(..., description="Name of metric being compared")
    current_period: float = Field(..., description="Current period value")
    previous_period: float = Field(..., description="Previous period value")
    change_percentage: float = Field(..., description="Percentage change")
    trend: str = Field(..., description="up, down, or stable")
