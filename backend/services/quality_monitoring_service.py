"""
Quality Monitoring Service.

This service validates analysis quality, generates alerts for low-quality results,
and tracks quality metrics over time (Story 3.5).
"""

import logging
import uuid
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from pymongo import MongoClient
from core.config import settings
from models.quality import (
    QualityThresholds,
    CallQualityValidation,
    QualityIssue,
    QualityAlert,
    QualityMetrics,
    QualityTrend,
    QualityLevel,
    AlertSeverity,
    AlertStatus
)

logger = logging.getLogger(__name__)


class QualityMonitoringService:
    """
    Service for monitoring and validating analysis quality.

    Performs quality checks, generates alerts, and tracks metrics.
    """

    def __init__(
        self,
        thresholds: Optional[QualityThresholds] = None,
        mongo_uri: Optional[str] = None,
        database_name: Optional[str] = None
    ):
        """
        Initialize quality monitoring service.

        Args:
            thresholds: Quality thresholds configuration
            mongo_uri: MongoDB connection URI
            database_name: Database name
        """
        self.thresholds = thresholds or QualityThresholds()
        self.mongo_uri = mongo_uri or settings.mongodb_uri
        self.database_name = database_name or settings.mongodb_database

    def validate_call_quality(self, call_id: str, analysis: Dict[str, Any]) -> CallQualityValidation:
        """
        Validate quality of a single call's analysis.

        Args:
            call_id: Call identifier
            analysis: Analysis results to validate

        Returns:
            CallQualityValidation: Validation results with issues and scores
        """
        issues = []
        recommendations = []

        # Calculate component scores
        completeness_score = self._calculate_completeness_score(analysis, issues, recommendations)
        consistency_score = self._calculate_consistency_score(analysis, issues, recommendations)
        confidence_score = self._calculate_confidence_score(analysis, issues, recommendations)

        # Calculate overall quality score (weighted average)
        quality_score = (
            completeness_score * 0.5 +  # Completeness is most important
            consistency_score * 0.3 +
            confidence_score * 0.2
        )

        # Determine quality level
        quality_level = self._classify_quality_level(quality_score)

        # Check if requires review or alert
        requires_review = quality_score < self.thresholds.medium_quality_min
        alert_triggered = quality_score < self.thresholds.critical_alert_threshold

        validation = CallQualityValidation(
            call_id=call_id,
            quality_score=round(quality_score, 2),
            quality_level=quality_level,
            completeness_score=round(completeness_score, 2),
            consistency_score=round(consistency_score, 2),
            confidence_score=round(confidence_score, 2),
            issues=issues,
            recommendations=recommendations,
            requires_review=requires_review,
            alert_triggered=alert_triggered
        )

        logger.info(
            "Quality validation completed",
            extra={
                'call_id': call_id,
                'quality_score': quality_score,
                'quality_level': quality_level,
                'issues_count': len(issues)
            }
        )

        return validation

    def _calculate_completeness_score(
        self,
        analysis: Dict[str, Any],
        issues: List[QualityIssue],
        recommendations: List[str]
    ) -> float:
        """Calculate completeness score based on expected fields."""
        score = 100.0

        # Check for missing or empty summary
        summary = analysis.get('summary', '')
        if not summary or len(summary) < 20:
            score -= 15
            issues.append(QualityIssue(
                issue_type='missing_summary',
                severity=AlertSeverity.HIGH,
                description='Summary is missing or too short',
                field_path='analysis.summary',
                expected_value='At least 20 characters',
                actual_value=len(summary)
            ))
            recommendations.append('Ensure transcript has sufficient content for summarization')

        # Check for entities
        entities = analysis.get('entities', [])
        if len(entities) < self.thresholds.min_entities_expected:
            score -= 10
            issues.append(QualityIssue(
                issue_type='insufficient_entities',
                severity=AlertSeverity.MEDIUM,
                description='Few or no entities extracted',
                field_path='analysis.entities',
                expected_value=f'>= {self.thresholds.min_entities_expected}',
                actual_value=len(entities)
            ))
            recommendations.append('Review transcript for entity mentions')

        # Check for key topics
        topics = analysis.get('key_topics', [])
        if len(topics) == 0:
            score -= 10
            issues.append(QualityIssue(
                issue_type='missing_topics',
                severity=AlertSeverity.MEDIUM,
                description='No key topics identified',
                field_path='analysis.key_topics',
                expected_value='>= 1',
                actual_value=0
            ))
            recommendations.append('Ensure call has substantive content')

        # Check for sentiment
        sentiment = analysis.get('sentiment', {})
        if not sentiment or not sentiment.get('reasoning'):
            score -= 10
            issues.append(QualityIssue(
                issue_type='missing_sentiment_reasoning',
                severity=AlertSeverity.LOW,
                description='Sentiment lacks reasoning',
                field_path='analysis.sentiment.reasoning',
                expected_value='Non-empty string',
                actual_value=None
            ))

        # Check for pain points in sales/support calls
        call_type = analysis.get('call_type', '').lower()
        pain_points = analysis.get('pain_points', [])
        if call_type in ['sales', 'support', 'discovery'] and len(pain_points) < self.thresholds.min_pain_points_expected:
            score -= 5
            issues.append(QualityIssue(
                issue_type='missing_pain_points',
                severity=AlertSeverity.LOW,
                description=f'No pain points identified for {call_type} call',
                field_path='analysis.pain_points',
                expected_value=f'>= {self.thresholds.min_pain_points_expected}',
                actual_value=len(pain_points)
            ))

        return max(0, score)

    def _calculate_consistency_score(
        self,
        analysis: Dict[str, Any],
        issues: List[QualityIssue],
        recommendations: List[str]
    ) -> float:
        """Calculate internal consistency score."""
        score = 100.0

        # Check sentiment consistency
        sentiment = analysis.get('sentiment', {})
        sentiment_overall = sentiment.get('overall', '').lower()
        sentiment_score = sentiment.get('score', 0)

        # Positive sentiment should have positive score
        if sentiment_overall == 'positive' and sentiment_score < 0:
            score -= 15
            issues.append(QualityIssue(
                issue_type='sentiment_inconsistency',
                severity=AlertSeverity.MEDIUM,
                description='Sentiment label and score are inconsistent',
                field_path='analysis.sentiment',
                expected_value='Positive score for positive sentiment',
                actual_value=f'overall={sentiment_overall}, score={sentiment_score}'
            ))

        # Negative sentiment should have negative score
        if sentiment_overall == 'negative' and sentiment_score > 0:
            score -= 15
            issues.append(QualityIssue(
                issue_type='sentiment_inconsistency',
                severity=AlertSeverity.MEDIUM,
                description='Sentiment label and score are inconsistent',
                field_path='analysis.sentiment',
                expected_value='Negative score for negative sentiment',
                actual_value=f'overall={sentiment_overall}, score={sentiment_score}'
            ))

        # Check call outcome consistency with sentiment
        call_outcome = analysis.get('call_outcome', '').lower()
        if call_outcome == 'positive' and sentiment_overall == 'negative':
            score -= 10
            issues.append(QualityIssue(
                issue_type='outcome_sentiment_mismatch',
                severity=AlertSeverity.LOW,
                description='Positive outcome with negative sentiment is unusual',
                field_path='analysis.call_outcome',
                expected_value='Consistent sentiment',
                actual_value=f'outcome={call_outcome}, sentiment={sentiment_overall}'
            ))

        return max(0, score)

    def _calculate_confidence_score(
        self,
        analysis: Dict[str, Any],
        issues: List[QualityIssue],
        recommendations: List[str]
    ) -> float:
        """Calculate confidence score based on AI confidence levels."""
        score = 100.0

        # Check sentiment confidence
        sentiment = analysis.get('sentiment', {})
        sentiment_confidence = sentiment.get('confidence', 1.0)

        if sentiment_confidence < 0.5:
            score -= 20
            issues.append(QualityIssue(
                issue_type='low_confidence',
                severity=AlertSeverity.MEDIUM,
                description='Low AI confidence in sentiment analysis',
                field_path='analysis.sentiment.confidence',
                expected_value='>= 0.5',
                actual_value=sentiment_confidence
            ))
            recommendations.append('Review transcript clarity and quality')

        return max(0, score)

    def _classify_quality_level(self, score: float) -> QualityLevel:
        """Classify quality level based on score."""
        if score >= self.thresholds.high_quality_min:
            return QualityLevel.HIGH
        elif score >= self.thresholds.medium_quality_min:
            return QualityLevel.MEDIUM
        else:
            return QualityLevel.LOW

    def create_quality_alert(
        self,
        alert_type: str,
        severity: AlertSeverity,
        title: str,
        message: str,
        call_id: Optional[str] = None,
        call_ids: Optional[List[str]] = None,
        metric_name: Optional[str] = None,
        metric_value: Optional[float] = None,
        threshold_value: Optional[float] = None
    ) -> QualityAlert:
        """
        Create a quality alert.

        Args:
            alert_type: Type of alert
            severity: Alert severity
            title: Alert title
            message: Alert message
            call_id: Single related call ID
            call_ids: Multiple related call IDs
            metric_name: Metric that triggered alert
            metric_value: Current metric value
            threshold_value: Threshold that was breached

        Returns:
            QualityAlert: Created alert
        """
        alert = QualityAlert(
            alert_id=str(uuid.uuid4()),
            alert_type=alert_type,
            severity=severity,
            title=title,
            message=message,
            call_id=call_id,
            call_ids=call_ids or [],
            metric_name=metric_name,
            metric_value=metric_value,
            threshold_value=threshold_value
        )

        # Save to MongoDB
        mongo_client = None
        try:
            mongo_client = MongoClient(self.mongo_uri)
            db = mongo_client[self.database_name]
            alerts_collection = db.quality_alerts

            alerts_collection.insert_one(alert.model_dump())

            logger.warning(
                "Quality alert created",
                extra={
                    'alert_id': alert.alert_id,
                    'alert_type': alert_type,
                    'severity': severity,
                    'call_id': call_id
                }
            )

        finally:
            if mongo_client:
                mongo_client.close()

        return alert

    def calculate_quality_metrics(
        self,
        period_start: datetime,
        period_end: datetime
    ) -> QualityMetrics:
        """
        Calculate quality metrics for a time period.

        Args:
            period_start: Start of period
            period_end: End of period

        Returns:
            QualityMetrics: Aggregated metrics
        """
        mongo_client = None

        try:
            mongo_client = MongoClient(self.mongo_uri)
            db = mongo_client[self.database_name]
            calls_collection = db.calls

            # Query calls in period
            calls = list(calls_collection.find({
                'status': 'analyzed',
                'processing.analyzed_at': {
                    '$gte': period_start,
                    '$lte': period_end
                }
            }))

            if not calls:
                # Return empty metrics
                return QualityMetrics(
                    period_start=period_start,
                    period_end=period_end,
                    total_calls_analyzed=0,
                    average_quality_score=0,
                    median_quality_score=0,
                    min_quality_score=0,
                    max_quality_score=0,
                    average_completeness=0,
                    average_consistency=0,
                    average_confidence=0
                )

            # Extract quality scores
            quality_scores = []
            high_count = 0
            medium_count = 0
            low_count = 0
            total_issues = 0
            issues_by_type = {}
            calls_requiring_review = 0
            alerts_triggered = 0
            critical_alerts = 0

            for call in calls:
                analysis = call.get('analysis', {})
                quality_data = analysis.get('quality_validation', {})

                if score := quality_data.get('quality_score'):
                    quality_scores.append(score)

                    # Count by level
                    if score >= self.thresholds.high_quality_min:
                        high_count += 1
                    elif score >= self.thresholds.medium_quality_min:
                        medium_count += 1
                    else:
                        low_count += 1

                # Count issues
                for issue in quality_data.get('issues', []):
                    total_issues += 1
                    issue_type = issue.get('issue_type', 'unknown')
                    issues_by_type[issue_type] = issues_by_type.get(issue_type, 0) + 1

                if quality_data.get('requires_review'):
                    calls_requiring_review += 1

                if quality_data.get('alert_triggered'):
                    alerts_triggered += 1
                    if score < self.thresholds.critical_alert_threshold:
                        critical_alerts += 1

            # Calculate statistics
            quality_scores.sort()
            avg_score = sum(quality_scores) / len(quality_scores) if quality_scores else 0
            median_score = quality_scores[len(quality_scores) // 2] if quality_scores else 0
            min_score = min(quality_scores) if quality_scores else 0
            max_score = max(quality_scores) if quality_scores else 0

            metrics = QualityMetrics(
                period_start=period_start,
                period_end=period_end,
                total_calls_analyzed=len(calls),
                high_quality_count=high_count,
                medium_quality_count=medium_count,
                low_quality_count=low_count,
                average_quality_score=round(avg_score, 2),
                median_quality_score=round(median_score, 2),
                min_quality_score=round(min_score, 2),
                max_quality_score=round(max_score, 2),
                average_completeness=round(avg_score, 2),  # Simplified
                average_consistency=round(avg_score, 2),  # Simplified
                average_confidence=round(avg_score, 2),  # Simplified
                total_issues_found=total_issues,
                issues_by_type=issues_by_type,
                calls_requiring_review=calls_requiring_review,
                alerts_triggered=alerts_triggered,
                critical_alerts=critical_alerts
            )

            logger.info(
                "Quality metrics calculated",
                extra={
                    'period_start': period_start.isoformat(),
                    'period_end': period_end.isoformat(),
                    'total_calls': len(calls),
                    'average_score': avg_score
                }
            )

            return metrics

        finally:
            if mongo_client:
                mongo_client.close()

    def check_quality_thresholds_and_alert(self, metrics: QualityMetrics):
        """
        Check quality metrics against thresholds and create alerts if needed.

        Args:
            metrics: Quality metrics to check
        """
        # Check if low quality percentage exceeds threshold
        if metrics.total_calls_analyzed > 0:
            low_quality_pct = (metrics.low_quality_count / metrics.total_calls_analyzed) * 100

            if low_quality_pct > self.thresholds.low_quality_percentage_alert:
                self.create_quality_alert(
                    alert_type='high_low_quality_percentage',
                    severity=AlertSeverity.HIGH,
                    title='High percentage of low-quality analyses',
                    message=f'{low_quality_pct:.1f}% of analyses are low quality (threshold: {self.thresholds.low_quality_percentage_alert}%)',
                    metric_name='low_quality_percentage',
                    metric_value=low_quality_pct,
                    threshold_value=self.thresholds.low_quality_percentage_alert
                )

        # Check for critical quality issues
        if metrics.critical_alerts > 0:
            self.create_quality_alert(
                alert_type='critical_quality_issues',
                severity=AlertSeverity.CRITICAL,
                title=f'{metrics.critical_alerts} critical quality issues detected',
                message=f'Found {metrics.critical_alerts} analyses with critically low quality scores',
                metric_name='critical_alerts',
                metric_value=float(metrics.critical_alerts),
                threshold_value=0.0
            )


# Singleton instance
_quality_monitoring_service = None


def get_quality_monitoring_service() -> QualityMonitoringService:
    """
    Get singleton quality monitoring service instance.

    Returns:
        QualityMonitoringService: Configured service instance
    """
    global _quality_monitoring_service
    if _quality_monitoring_service is None:
        _quality_monitoring_service = QualityMonitoringService()
    return _quality_monitoring_service
