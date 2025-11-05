"""
Pydantic models for analysis quality monitoring.

This module defines data structures for quality validation, alerts,
and monitoring metrics (Story 3.5).
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class QualityLevel(str, Enum):
    """Quality level classification."""
    HIGH = "high"      # ≥80
    MEDIUM = "medium"  # 60-79
    LOW = "low"        # <60


class AlertSeverity(str, Enum):
    """Alert severity levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class AlertStatus(str, Enum):
    """Alert status."""
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    IGNORED = "ignored"


class QualityThresholds(BaseModel):
    """Configurable quality thresholds."""
    high_quality_min: float = Field(default=80.0, description="Minimum score for high quality")
    medium_quality_min: float = Field(default=60.0, description="Minimum score for medium quality")
    critical_alert_threshold: float = Field(default=50.0, description="Score below this triggers critical alert")
    low_quality_percentage_alert: float = Field(default=20.0, description="% of low quality calls to trigger alert")
    min_entities_expected: int = Field(default=1, description="Minimum entities expected per call")
    min_pain_points_expected: int = Field(default=0, description="Minimum pain points for sales calls")


class QualityIssue(BaseModel):
    """Individual quality issue detected."""
    issue_type: str = Field(..., description="Type of issue (e.g., 'missing_entities', 'low_confidence')")
    severity: AlertSeverity = Field(..., description="Issue severity")
    description: str = Field(..., description="Human-readable description")
    field_path: Optional[str] = Field(None, description="JSON path to problematic field")
    expected_value: Optional[Any] = Field(None, description="Expected value or range")
    actual_value: Optional[Any] = Field(None, description="Actual value found")


class CallQualityValidation(BaseModel):
    """Quality validation result for a single call."""
    call_id: str = Field(..., description="Call identifier")
    quality_score: float = Field(..., description="Overall quality score (0-100)")
    quality_level: QualityLevel = Field(..., description="Quality level classification")

    # Detailed scores
    completeness_score: float = Field(..., description="Completeness of analysis (0-100)")
    consistency_score: float = Field(..., description="Internal consistency (0-100)")
    confidence_score: float = Field(..., description="AI confidence levels (0-100)")

    # Issues found
    issues: List[QualityIssue] = Field(default_factory=list, description="Quality issues detected")
    recommendations: List[str] = Field(default_factory=list, description="Improvement recommendations")

    # Flags
    requires_review: bool = Field(default=False, description="Manual review recommended")
    alert_triggered: bool = Field(default=False, description="Alert was triggered")

    validated_at: datetime = Field(default_factory=datetime.utcnow, description="Validation timestamp")


class QualityAlert(BaseModel):
    """Quality alert for monitoring."""
    alert_id: str = Field(..., description="Unique alert ID")
    alert_type: str = Field(..., description="Type of alert")
    severity: AlertSeverity = Field(..., description="Alert severity")
    status: AlertStatus = Field(default=AlertStatus.OPEN, description="Alert status")

    # Context
    title: str = Field(..., description="Alert title")
    message: str = Field(..., description="Detailed message")
    call_id: Optional[str] = Field(None, description="Related call ID")
    call_ids: List[str] = Field(default_factory=list, description="Multiple related calls")

    # Metrics
    metric_name: Optional[str] = Field(None, description="Metric that triggered alert")
    metric_value: Optional[float] = Field(None, description="Current metric value")
    threshold_value: Optional[float] = Field(None, description="Threshold that was breached")

    # Timestamps
    triggered_at: datetime = Field(default_factory=datetime.utcnow, description="When alert was triggered")
    acknowledged_at: Optional[datetime] = Field(None, description="When alert was acknowledged")
    resolved_at: Optional[datetime] = Field(None, description="When alert was resolved")

    # Acknowledgment
    acknowledged_by: Optional[str] = Field(None, description="User who acknowledged")
    resolution_notes: Optional[str] = Field(None, description="Resolution notes")


class QualityMetrics(BaseModel):
    """Aggregated quality metrics over time."""
    period_start: datetime = Field(..., description="Start of measurement period")
    period_end: datetime = Field(..., description="End of measurement period")

    # Volume metrics
    total_calls_analyzed: int = Field(..., description="Total calls in period")
    high_quality_count: int = Field(default=0, description="High quality calls")
    medium_quality_count: int = Field(default=0, description="Medium quality calls")
    low_quality_count: int = Field(default=0, description="Low quality calls")

    # Score metrics
    average_quality_score: float = Field(..., description="Average quality score")
    median_quality_score: float = Field(..., description="Median quality score")
    min_quality_score: float = Field(..., description="Minimum quality score")
    max_quality_score: float = Field(..., description="Maximum quality score")

    # Component scores
    average_completeness: float = Field(..., description="Average completeness score")
    average_consistency: float = Field(..., description="Average consistency score")
    average_confidence: float = Field(..., description="Average confidence score")

    # Issue tracking
    total_issues_found: int = Field(default=0, description="Total issues detected")
    issues_by_type: Dict[str, int] = Field(default_factory=dict, description="Issue count by type")
    calls_requiring_review: int = Field(default=0, description="Calls flagged for review")

    # Alerts
    alerts_triggered: int = Field(default=0, description="Alerts triggered in period")
    critical_alerts: int = Field(default=0, description="Critical alerts")

    calculated_at: datetime = Field(default_factory=datetime.utcnow, description="When metrics were calculated")


class QualityTrend(BaseModel):
    """Quality trend over time."""
    date: datetime = Field(..., description="Date")
    average_score: float = Field(..., description="Average quality score")
    high_quality_percentage: float = Field(..., description="% of high quality calls")
    low_quality_percentage: float = Field(..., description="% of low quality calls")
    total_calls: int = Field(..., description="Total calls analyzed")


class QualityDashboard(BaseModel):
    """Quality monitoring dashboard data."""
    current_metrics: QualityMetrics = Field(..., description="Current period metrics")
    previous_metrics: Optional[QualityMetrics] = Field(None, description="Previous period for comparison")
    trends: List[QualityTrend] = Field(default_factory=list, description="Quality trends over time")
    open_alerts: List[QualityAlert] = Field(default_factory=list, description="Currently open alerts")
    recent_low_quality_calls: List[str] = Field(default_factory=list, description="Recent low quality call IDs")

    # Quick stats
    quality_improving: bool = Field(..., description="Quality trend is improving")
    percentage_change: float = Field(..., description="% change from previous period")

    generated_at: datetime = Field(default_factory=datetime.utcnow)


class QualityReport(BaseModel):
    """Comprehensive quality report."""
    report_id: str = Field(..., description="Report ID")
    report_type: str = Field(..., description="Report type: daily, weekly, monthly")
    period_start: datetime = Field(..., description="Report period start")
    period_end: datetime = Field(..., description="Report period end")

    # Summary
    executive_summary: str = Field(..., description="High-level summary")
    key_findings: List[str] = Field(default_factory=list, description="Key findings")
    recommendations: List[str] = Field(default_factory=list, description="Recommendations")

    # Metrics
    metrics: QualityMetrics = Field(..., description="Detailed metrics")
    trends: List[QualityTrend] = Field(default_factory=list, description="Trends")

    # Issues and alerts
    top_issues: List[Dict[str, Any]] = Field(default_factory=list, description="Most common issues")
    alerts_summary: Dict[str, int] = Field(default_factory=dict, description="Alerts by severity")

    generated_at: datetime = Field(default_factory=datetime.utcnow)
    generated_by: str = Field(default="system", description="Report generator")
