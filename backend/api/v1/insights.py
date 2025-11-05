"""
Insights API endpoints.

Provides access to aggregated daily/weekly insights from call analysis (Story 3.4).
"""

import logging
from datetime import date, datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from pymongo import MongoClient
from core.config import settings
from models.insights import DailyInsights, InsightsSummary
from tasks.insights import generate_daily_insights

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("/daily/{target_date}", response_model=DailyInsights)
async def get_daily_insights(target_date: str):
    """
    Get daily insights for a specific date.

    Args:
        target_date: Date in YYYY-MM-DD format

    Returns:
        DailyInsights: Complete daily insights

    Raises:
        HTTPException: If date is invalid or insights not found
    """
    try:
        # Parse date
        parsed_date = datetime.strptime(target_date, '%Y-%m-%d').date()
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Use YYYY-MM-DD"
        )

    # Query insights from MongoDB
    mongo_client = None
    try:
        mongo_client = MongoClient(settings.mongodb_uri)
        db = mongo_client[settings.mongodb_database]
        insights_collection = db.insights

        insights_doc = insights_collection.find_one({
            'date': parsed_date.isoformat(),
            'period_type': 'daily'
        })

        if not insights_doc:
            # Insights don't exist yet - trigger generation
            logger.info(
                "Insights not found, triggering generation",
                extra={'date': target_date}
            )

            # Trigger async generation
            generate_daily_insights.delay(target_date)

            raise HTTPException(
                status_code=404,
                detail=f"Insights not yet generated for {target_date}. Generation triggered - try again in a few minutes."
            )

        # Remove MongoDB _id field
        insights_doc.pop('_id', None)

        # Convert date strings back to date objects
        if 'date' in insights_doc:
            insights_doc['date'] = datetime.fromisoformat(insights_doc['date']).date()

        # Convert nested date fields
        for field in ['call_volume', 'engagement', 'quality', 'costs', 'sentiment_trend']:
            if field in insights_doc and 'date' in insights_doc[field]:
                insights_doc[field]['date'] = datetime.fromisoformat(insights_doc[field]['date']).date()

        return DailyInsights(**insights_doc)

    finally:
        if mongo_client:
            mongo_client.close()


@router.get("/daily", response_model=List[InsightsSummary])
async def list_daily_insights(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    limit: int = Query(default=7, le=30, description="Maximum number of results")
):
    """
    List daily insights summaries.

    Args:
        start_date: Optional start date filter
        end_date: Optional end date filter
        limit: Maximum number of results (default 7, max 30)

    Returns:
        list[InsightsSummary]: List of insights summaries
    """
    mongo_client = None
    try:
        mongo_client = MongoClient(settings.mongodb_uri)
        db = mongo_client[settings.mongodb_database]
        insights_collection = db.insights

        # Build query
        query = {'period_type': 'daily'}

        if start_date or end_date:
            date_filter = {}
            if start_date:
                parsed_start = datetime.strptime(start_date, '%Y-%m-%d').date()
                date_filter['$gte'] = parsed_start.isoformat()
            if end_date:
                parsed_end = datetime.strptime(end_date, '%Y-%m-%d').date()
                date_filter['$lte'] = parsed_end.isoformat()
            query['date'] = date_filter

        # Query insights
        insights_docs = list(insights_collection.find(query).sort('date', -1).limit(limit))

        # Convert to summaries
        summaries = []
        for doc in insights_docs:
            # Extract key fields for summary
            parsed_date = datetime.fromisoformat(doc['date']).date()

            summary = InsightsSummary(
                date=parsed_date,
                total_calls=doc.get('total_calls_analyzed', 0),
                average_sentiment=doc.get('sentiment_trend', {}).get('average_score', 0),
                top_pain_point=doc.get('top_pain_points', [{}])[0].get('description') if doc.get('top_pain_points') else None,
                top_objection=doc.get('top_objections', [{}])[0].get('objection') if doc.get('top_objections') else None,
                quality_score=doc.get('quality', {}).get('average_quality_score', 0)
            )
            summaries.append(summary)

        return summaries

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")

    finally:
        if mongo_client:
            mongo_client.close()


@router.get("/latest", response_model=DailyInsights)
async def get_latest_insights():
    """
    Get the most recent daily insights.

    Returns:
        DailyInsights: Most recent insights

    Raises:
        HTTPException: If no insights found
    """
    mongo_client = None
    try:
        mongo_client = MongoClient(settings.mongodb_uri)
        db = mongo_client[settings.mongodb_database]
        insights_collection = db.insights

        # Get most recent insights
        insights_doc = insights_collection.find_one(
            {'period_type': 'daily'},
            sort=[('date', -1)]
        )

        if not insights_doc:
            # Try to generate for yesterday
            yesterday = date.today() - timedelta(days=1)
            generate_daily_insights.delay(yesterday.isoformat())

            raise HTTPException(
                status_code=404,
                detail="No insights available yet. Generation triggered - try again in a few minutes."
            )

        # Remove MongoDB _id field
        insights_doc.pop('_id', None)

        # Convert date strings back to date objects
        if 'date' in insights_doc:
            insights_doc['date'] = datetime.fromisoformat(insights_doc['date']).date()

        # Convert nested date fields
        for field in ['call_volume', 'engagement', 'quality', 'costs', 'sentiment_trend']:
            if field in insights_doc and 'date' in insights_doc[field]:
                insights_doc[field]['date'] = datetime.fromisoformat(insights_doc[field]['date']).date()

        return DailyInsights(**insights_doc)

    finally:
        if mongo_client:
            mongo_client.close()


@router.post("/generate/{target_date}")
async def trigger_insights_generation(target_date: str):
    """
    Manually trigger insights generation for a specific date.

    Args:
        target_date: Date in YYYY-MM-DD format

    Returns:
        dict: Task submission status
    """
    try:
        # Validate date format
        datetime.strptime(target_date, '%Y-%m-%d')
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Use YYYY-MM-DD"
        )

    # Trigger generation task
    task = generate_daily_insights.delay(target_date)

    logger.info(
        "Insights generation triggered",
        extra={'date': target_date, 'task_id': task.id}
    )

    return {
        'status': 'triggered',
        'target_date': target_date,
        'task_id': task.id,
        'message': 'Insights generation has been queued'
    }


@router.get("/stats/overview")
async def get_insights_overview():
    """
    Get overview statistics about available insights.

    Returns:
        dict: Overview statistics
    """
    mongo_client = None
    try:
        mongo_client = MongoClient(settings.mongodb_uri)
        db = mongo_client[settings.mongodb_database]
        insights_collection = db.insights

        # Count total insights
        total_insights = insights_collection.count_documents({'period_type': 'daily'})

        # Get date range
        oldest = insights_collection.find_one({'period_type': 'daily'}, sort=[('date', 1)])
        newest = insights_collection.find_one({'period_type': 'daily'}, sort=[('date', -1)])

        oldest_date = oldest['date'] if oldest else None
        newest_date = newest['date'] if newest else None

        # Aggregate total calls analyzed
        pipeline = [
            {'$match': {'period_type': 'daily'}},
            {'$group': {'_id': None, 'total': {'$sum': '$total_calls_analyzed'}}}
        ]
        total_calls_result = list(insights_collection.aggregate(pipeline))
        total_calls = total_calls_result[0]['total'] if total_calls_result else 0

        return {
            'total_daily_insights': total_insights,
            'oldest_date': oldest_date,
            'newest_date': newest_date,
            'total_calls_analyzed': total_calls,
            'insights_available': total_insights > 0
        }

    finally:
        if mongo_client:
            mongo_client.close()
