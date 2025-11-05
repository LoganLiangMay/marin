"""
Insights aggregation tasks.

This module contains Celery tasks for generating daily/weekly insights
from call analysis data (Story 3.4).
"""

import logging
from datetime import date, datetime, timedelta
from celery_app import celery_app
from services.insights_service import get_insights_service

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name='tasks.insights.generate_daily_insights')
def generate_daily_insights(self, target_date_str: str = None):
    """
    Generate daily insights for a specific date.

    This task aggregates all call analysis data for a day into insights:
    - Sentiment trends
    - Top pain points, objections, topics
    - Entity mention statistics
    - Call volume, engagement, quality metrics
    - Cost statistics

    Args:
        target_date_str: Date string (YYYY-MM-DD). Defaults to yesterday.

    Returns:
        dict: Generated insights summary
    """
    logger.info(
        "Starting daily insights generation",
        extra={'task_id': self.request.id, 'target_date': target_date_str}
    )

    try:
        # Parse target date or use yesterday by default
        if target_date_str:
            target_date = datetime.strptime(target_date_str, '%Y-%m-%d').date()
        else:
            # Default to yesterday (since today's data may not be complete)
            target_date = date.today() - timedelta(days=1)

        logger.info(
            "Generating insights for date",
            extra={'target_date': target_date.isoformat()}
        )

        # Generate insights
        insights_service = get_insights_service()
        insights = insights_service.generate_daily_insights(target_date)

        logger.info(
            "Daily insights generated successfully",
            extra={
                'insights_id': insights.insights_id,
                'target_date': target_date.isoformat(),
                'calls_analyzed': insights.total_calls_analyzed,
                'top_pain_points': len(insights.top_pain_points),
                'top_objections': len(insights.top_objections),
                'average_quality': insights.quality.average_quality_score
            }
        )

        return {
            'status': 'success',
            'insights_id': insights.insights_id,
            'target_date': target_date.isoformat(),
            'calls_analyzed': insights.total_calls_analyzed,
            'average_sentiment': insights.sentiment_trend.average_score,
            'total_cost_usd': insights.costs.total_cost_usd,
            'summary': {
                'pain_points': len(insights.top_pain_points),
                'objections': len(insights.top_objections),
                'topics': len(insights.top_topics),
                'entities': len(insights.top_entities)
            }
        }

    except Exception as e:
        logger.error(
            "Error generating daily insights",
            extra={'target_date': target_date_str, 'error': str(e)},
            exc_info=True
        )

        return {
            'status': 'error',
            'target_date': target_date_str,
            'error': str(e)
        }


@celery_app.task(bind=True, name='tasks.insights.generate_weekly_insights')
def generate_weekly_insights(self, week_start_str: str = None):
    """
    Generate weekly insights.

    Aggregates daily insights for a week into a weekly summary.

    Args:
        week_start_str: Week start date (YYYY-MM-DD, Monday). Defaults to last week.

    Returns:
        dict: Weekly insights summary
    """
    logger.info(
        "Starting weekly insights generation",
        extra={'task_id': self.request.id, 'week_start': week_start_str}
    )

    try:
        # Parse week start or use last week by default
        if week_start_str:
            week_start = datetime.strptime(week_start_str, '%Y-%m-%d').date()
        else:
            # Default to start of last week (Monday)
            today = date.today()
            days_since_monday = today.weekday()
            last_monday = today - timedelta(days=days_since_monday + 7)
            week_start = last_monday

        week_end = week_start + timedelta(days=6)

        logger.info(
            "Generating weekly insights",
            extra={
                'week_start': week_start.isoformat(),
                'week_end': week_end.isoformat()
            }
        )

        # Generate daily insights for each day if not exists
        insights_service = get_insights_service()
        current_date = week_start

        while current_date <= week_end:
            # Trigger daily insights generation for each day
            generate_daily_insights.delay(current_date.isoformat())
            current_date += timedelta(days=1)

        logger.info(
            "Weekly insights generation triggered",
            extra={
                'week_start': week_start.isoformat(),
                'week_end': week_end.isoformat()
            }
        )

        return {
            'status': 'success',
            'week_start': week_start.isoformat(),
            'week_end': week_end.isoformat(),
            'message': 'Daily insights generation triggered for all days in week'
        }

    except Exception as e:
        logger.error(
            "Error generating weekly insights",
            extra={'week_start': week_start_str, 'error': str(e)},
            exc_info=True
        )

        return {
            'status': 'error',
            'week_start': week_start_str,
            'error': str(e)
        }


@celery_app.task(bind=True, name='tasks.insights.backfill_insights')
def backfill_insights(self, start_date_str: str, end_date_str: str):
    """
    Backfill insights for a date range.

    Useful for generating insights for historical data.

    Args:
        start_date_str: Start date (YYYY-MM-DD)
        end_date_str: End date (YYYY-MM-DD)

    Returns:
        dict: Backfill status
    """
    logger.info(
        "Starting insights backfill",
        extra={
            'task_id': self.request.id,
            'start_date': start_date_str,
            'end_date': end_date_str
        }
    )

    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()

        if start_date > end_date:
            return {
                'status': 'error',
                'message': 'Start date must be before end date'
            }

        # Generate insights for each day in range
        current_date = start_date
        generated_count = 0

        while current_date <= end_date:
            generate_daily_insights.delay(current_date.isoformat())
            generated_count += 1
            current_date += timedelta(days=1)

        logger.info(
            "Insights backfill triggered",
            extra={
                'start_date': start_date_str,
                'end_date': end_date_str,
                'days': generated_count
            }
        )

        return {
            'status': 'success',
            'start_date': start_date_str,
            'end_date': end_date_str,
            'days_triggered': generated_count
        }

    except Exception as e:
        logger.error(
            "Error backfilling insights",
            extra={
                'start_date': start_date_str,
                'end_date': end_date_str,
                'error': str(e)
            },
            exc_info=True
        )

        return {
            'status': 'error',
            'start_date': start_date_str,
            'end_date': end_date_str,
            'error': str(e)
        }
