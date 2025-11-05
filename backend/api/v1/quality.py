"""
Quality Monitoring API endpoints.

Provides access to quality metrics, alerts, and validation results (Story 3.5).
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Body
from pymongo import MongoClient
from core.config import settings
from models.quality import (
    QualityMetrics,
    QualityAlert,
    AlertStatus,
    QualityDashboard,
    CallQualityValidation
)
from services.quality_monitoring_service import get_quality_monitoring_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/quality", tags=["quality"])


@router.get("/metrics", response_model=QualityMetrics)
async def get_quality_metrics(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD HH:MM:SS)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD HH:MM:SS)"),
    period_hours: int = Query(default=24, description="Period in hours (default 24)")
):
    """
    Get quality metrics for a time period.

    Args:
        start_date: Optional start date
        end_date: Optional end date
        period_hours: Hours to look back if dates not specified

    Returns:
        QualityMetrics: Aggregated quality metrics
    """
    try:
        # Parse dates or use default period
        if start_date and end_date:
            period_start = datetime.fromisoformat(start_date)
            period_end = datetime.fromisoformat(end_date)
        else:
            period_end = datetime.utcnow()
            period_start = period_end - timedelta(hours=period_hours)

        quality_service = get_quality_monitoring_service()
        metrics = quality_service.calculate_quality_metrics(period_start, period_end)

        return metrics

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")


@router.get("/alerts", response_model=List[QualityAlert])
async def list_quality_alerts(
    status: Optional[AlertStatus] = Query(None, description="Filter by alert status"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    limit: int = Query(default=50, le=100, description="Maximum number of alerts")
):
    """
    List quality alerts.

    Args:
        status: Optional status filter
        severity: Optional severity filter
        limit: Maximum number of results

    Returns:
        List[QualityAlert]: List of alerts
    """
    mongo_client = None
    try:
        mongo_client = MongoClient(settings.mongodb_uri)
        db = mongo_client[settings.mongodb_database]
        alerts_collection = db.quality_alerts

        # Build query
        query = {}
        if status:
            query['status'] = status
        if severity:
            query['severity'] = severity

        # Get alerts
        alert_docs = list(
            alerts_collection.find(query)
            .sort('triggered_at', -1)
            .limit(limit)
        )

        # Convert to models
        alerts = []
        for doc in alert_docs:
            doc.pop('_id', None)
            try:
                alert = QualityAlert(**doc)
                alerts.append(alert)
            except Exception as e:
                logger.error(f"Failed to parse alert: {e}")
                continue

        return alerts

    finally:
        if mongo_client:
            mongo_client.close()


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    acknowledged_by: str = Body(..., embed=True, description="User acknowledging the alert")
):
    """
    Acknowledge a quality alert.

    Args:
        alert_id: Alert identifier
        acknowledged_by: User who is acknowledging

    Returns:
        dict: Updated alert status
    """
    mongo_client = None
    try:
        mongo_client = MongoClient(settings.mongodb_uri)
        db = mongo_client[settings.mongodb_database]
        alerts_collection = db.quality_alerts

        # Update alert
        result = alerts_collection.update_one(
            {'alert_id': alert_id},
            {
                '$set': {
                    'status': AlertStatus.ACKNOWLEDGED,
                    'acknowledged_at': datetime.utcnow(),
                    'acknowledged_by': acknowledged_by
                }
            }
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")

        logger.info(
            "Alert acknowledged",
            extra={'alert_id': alert_id, 'acknowledged_by': acknowledged_by}
        )

        return {
            'status': 'success',
            'alert_id': alert_id,
            'acknowledged_by': acknowledged_by,
            'acknowledged_at': datetime.utcnow().isoformat()
        }

    finally:
        if mongo_client:
            mongo_client.close()


@router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(
    alert_id: str,
    resolution_notes: Optional[str] = Body(None, embed=True, description="Resolution notes")
):
    """
    Resolve a quality alert.

    Args:
        alert_id: Alert identifier
        resolution_notes: Optional resolution notes

    Returns:
        dict: Updated alert status
    """
    mongo_client = None
    try:
        mongo_client = MongoClient(settings.mongodb_uri)
        db = mongo_client[settings.mongodb_database]
        alerts_collection = db.quality_alerts

        # Update alert
        result = alerts_collection.update_one(
            {'alert_id': alert_id},
            {
                '$set': {
                    'status': AlertStatus.RESOLVED,
                    'resolved_at': datetime.utcnow(),
                    'resolution_notes': resolution_notes
                }
            }
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")

        logger.info(
            "Alert resolved",
            extra={'alert_id': alert_id}
        )

        return {
            'status': 'success',
            'alert_id': alert_id,
            'resolved_at': datetime.utcnow().isoformat(),
            'resolution_notes': resolution_notes
        }

    finally:
        if mongo_client:
            mongo_client.close()


@router.get("/dashboard")
async def get_quality_dashboard():
    """
    Get quality monitoring dashboard data.

    Returns:
        dict: Dashboard data with metrics, alerts, and trends
    """
    quality_service = get_quality_monitoring_service()

    # Current period (last 24 hours)
    period_end = datetime.utcnow()
    period_start = period_end - timedelta(hours=24)

    # Previous period (24 hours before that)
    prev_period_end = period_start
    prev_period_start = prev_period_end - timedelta(hours=24)

    # Get metrics
    current_metrics = quality_service.calculate_quality_metrics(period_start, period_end)
    previous_metrics = quality_service.calculate_quality_metrics(prev_period_start, prev_period_end)

    # Calculate trend
    quality_improving = current_metrics.average_quality_score >= previous_metrics.average_quality_score
    percentage_change = 0
    if previous_metrics.average_quality_score > 0:
        percentage_change = (
            (current_metrics.average_quality_score - previous_metrics.average_quality_score) /
            previous_metrics.average_quality_score
        ) * 100

    # Get open alerts
    mongo_client = None
    try:
        mongo_client = MongoClient(settings.mongodb_uri)
        db = mongo_client[settings.mongodb_database]
        alerts_collection = db.quality_alerts

        open_alert_docs = list(
            alerts_collection.find({'status': AlertStatus.OPEN})
            .sort('triggered_at', -1)
            .limit(10)
        )

        open_alerts = []
        for doc in open_alert_docs:
            doc.pop('_id', None)
            try:
                alert = QualityAlert(**doc)
                open_alerts.append(alert)
            except:
                continue

        # Get recent low quality calls
        calls_collection = db.calls
        low_quality_calls = list(
            calls_collection.find({
                'status': 'analyzed',
                'analysis.quality_validation.quality_level': 'low'
            })
            .sort('processing.analyzed_at', -1)
            .limit(10)
        )

        recent_low_quality_call_ids = [call['call_id'] for call in low_quality_calls]

    finally:
        if mongo_client:
            mongo_client.close()

    return {
        'current_metrics': current_metrics,
        'previous_metrics': previous_metrics,
        'open_alerts': open_alerts,
        'recent_low_quality_calls': recent_low_quality_call_ids,
        'quality_improving': quality_improving,
        'percentage_change': round(percentage_change, 2),
        'generated_at': datetime.utcnow().isoformat()
    }


@router.get("/calls/{call_id}/validation", response_model=CallQualityValidation)
async def get_call_quality_validation(call_id: str):
    """
    Get quality validation details for a specific call.

    Args:
        call_id: Call identifier

    Returns:
        CallQualityValidation: Quality validation results
    """
    mongo_client = None
    try:
        mongo_client = MongoClient(settings.mongodb_uri)
        db = mongo_client[settings.mongodb_database]
        calls_collection = db.calls

        call = calls_collection.find_one({'call_id': call_id})

        if not call:
            raise HTTPException(status_code=404, detail=f"Call {call_id} not found")

        analysis = call.get('analysis', {})
        quality_data = analysis.get('quality_validation')

        if not quality_data:
            raise HTTPException(
                status_code=404,
                detail=f"Quality validation not found for call {call_id}"
            )

        return CallQualityValidation(**quality_data)

    finally:
        if mongo_client:
            mongo_client.close()


@router.get("/stats/summary")
async def get_quality_stats_summary():
    """
    Get summary statistics about quality monitoring.

    Returns:
        dict: Summary stats
    """
    mongo_client = None
    try:
        mongo_client = MongoClient(settings.mongodb_uri)
        db = mongo_client[settings.mongodb_database]
        alerts_collection = db.quality_alerts
        calls_collection = db.calls

        # Count alerts by status
        total_alerts = alerts_collection.count_documents({})
        open_alerts = alerts_collection.count_documents({'status': AlertStatus.OPEN})
        critical_alerts = alerts_collection.count_documents({
            'status': AlertStatus.OPEN,
            'severity': 'critical'
        })

        # Count calls by quality level (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_calls = calls_collection.count_documents({
            'status': 'analyzed',
            'processing.analyzed_at': {'$gte': seven_days_ago}
        })

        high_quality = calls_collection.count_documents({
            'status': 'analyzed',
            'processing.analyzed_at': {'$gte': seven_days_ago},
            'analysis.quality_validation.quality_level': 'high'
        })

        low_quality = calls_collection.count_documents({
            'status': 'analyzed',
            'processing.analyzed_at': {'$gte': seven_days_ago},
            'analysis.quality_validation.quality_level': 'low'
        })

        return {
            'total_alerts': total_alerts,
            'open_alerts': open_alerts,
            'critical_alerts': critical_alerts,
            'recent_calls_analyzed': recent_calls,
            'high_quality_calls': high_quality,
            'low_quality_calls': low_quality,
            'high_quality_percentage': round((high_quality / recent_calls) * 100, 1) if recent_calls > 0 else 0,
            'low_quality_percentage': round((low_quality / recent_calls) * 100, 1) if recent_calls > 0 else 0
        }

    finally:
        if mongo_client:
            mongo_client.close()
