"""
AI Analysis tasks using GPT-4o.

This module contains tasks for AI-powered call analysis (Epic 3):
- Consolidated GPT-4o analysis (sentiment, entities, pain points, etc.)
- Entity resolution and contact deduplication
- Daily insights aggregation
- Analysis quality validation

Story 3.1: GPT-4o consolidated analysis implementation
"""

import logging
import time
from datetime import datetime
from typing import Dict, Any
from pymongo import MongoClient
from celery_app import celery_app
from core.config import settings
from services.ai_service import get_ai_service

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name='tasks.analysis.analyze_call', max_retries=3)
def analyze_call(self, call_id: str):
    """
    Analyze call transcript using GPT-4o for consolidated insights extraction.

    This task:
    1. Retrieves transcript from MongoDB
    2. Calls GPT-4o for consolidated analysis (Story 3.1)
    3. Validates analysis quality
    4. Saves analysis results to MongoDB
    5. Updates call status to 'analyzed'

    Args:
        call_id: Unique identifier for the call

    Returns:
        dict: Analysis results with metadata

    Raises:
        Exception: On unrecoverable errors (will trigger retry)
    """
    start_time = time.time()
    mongo_client = None

    logger.info(
        "Starting analysis task",
        extra={'call_id': call_id, 'task_id': self.request.id}
    )

    try:
        # Step 1: Connect to MongoDB and retrieve call
        mongo_client = MongoClient(settings.mongodb_uri)
        db = mongo_client[settings.mongodb_database]
        calls_collection = db.calls

        call_doc = calls_collection.find_one({'call_id': call_id})

        if not call_doc:
            logger.error(
                "Call not found in database",
                extra={'call_id': call_id}
            )
            return {
                'status': 'error',
                'call_id': call_id,
                'message': 'Call not found'
            }

        # Step 2: Check if already analyzed (idempotency)
        if call_doc.get('status') == 'analyzed':
            logger.info(
                "Call already analyzed, skipping",
                extra={'call_id': call_id}
            )
            return {
                'status': 'already_analyzed',
                'call_id': call_id,
                'message': 'Analysis already exists'
            }

        # Step 3: Check if transcript exists
        transcript_data = call_doc.get('transcript', {})
        transcript_text = transcript_data.get('full_text')

        if not transcript_text:
            logger.error(
                "No transcript found for call",
                extra={'call_id': call_id, 'call_status': call_doc.get('status')}
            )
            return {
                'status': 'error',
                'call_id': call_id,
                'message': 'No transcript available for analysis'
            }

        # Update status to 'analyzing'
        calls_collection.update_one(
            {'call_id': call_id},
            {
                '$set': {
                    'status': 'analyzing',
                    'updated_at': datetime.utcnow()
                }
            }
        )

        logger.info(
            "Retrieved transcript for analysis",
            extra={
                'call_id': call_id,
                'transcript_length': len(transcript_text),
                'word_count': transcript_data.get('word_count', 0)
            }
        )

        # Step 4: Perform consolidated GPT-4o analysis
        ai_service = get_ai_service()

        # Extract metadata for context
        call_metadata = {
            'company_name': call_doc.get('metadata', {}).get('company_name'),
            'call_type': call_doc.get('metadata', {}).get('call_type'),
        }

        logger.info(
            "Calling GPT-4o for consolidated analysis",
            extra={'call_id': call_id, 'model': 'gpt-4o'}
        )

        analysis_result = ai_service.analyze_call_transcript(
            transcript=transcript_text,
            call_metadata=call_metadata
        )

        # Step 5: Validate analysis quality (basic validation from AI service)
        basic_quality_validation = ai_service.validate_analysis_quality(analysis_result)

        # Step 5b: Enhanced quality monitoring (Story 3.5)
        from services.quality_monitoring_service import get_quality_monitoring_service
        quality_service = get_quality_monitoring_service()

        # Perform comprehensive quality validation
        analysis_data = analysis_result['analysis']
        enhanced_validation = quality_service.validate_call_quality(call_id, analysis_data)

        logger.info(
            "Enhanced quality validation completed",
            extra={
                'call_id': call_id,
                'quality_score': enhanced_validation.quality_score,
                'quality_level': enhanced_validation.quality_level,
                'completeness': enhanced_validation.completeness_score,
                'consistency': enhanced_validation.consistency_score,
                'issues_count': len(enhanced_validation.issues)
            }
        )

        # Create alert if quality is critically low
        if enhanced_validation.alert_triggered:
            from models.quality import AlertSeverity
            quality_service.create_quality_alert(
                alert_type='low_quality_analysis',
                severity=AlertSeverity.CRITICAL,
                title=f'Critically low quality analysis for call {call_id}',
                message=f'Quality score: {enhanced_validation.quality_score}. Issues: {len(enhanced_validation.issues)}',
                call_id=call_id,
                metric_name='quality_score',
                metric_value=enhanced_validation.quality_score,
                threshold_value=quality_service.thresholds.critical_alert_threshold
            )
            logger.warning(
                "Critical quality alert triggered",
                extra={'call_id': call_id, 'quality_score': enhanced_validation.quality_score}
            )

        # Step 6: Prepare analysis data for storage
        metadata = analysis_result['metadata']

        # Add both quality validations to analysis
        analysis_data['quality_validation'] = enhanced_validation.model_dump()

        # Step 7: Update MongoDB with analysis results
        update_data = {
            'status': 'analyzed',
            'analysis': analysis_data,
            'processing.analyzed_at': datetime.utcnow(),
            'processing_metadata.analysis': metadata,
            'updated_at': datetime.utcnow()
        }

        result = calls_collection.update_one(
            {'call_id': call_id},
            {'$set': update_data}
        )

        if result.modified_count == 0:
            logger.warning(
                "MongoDB update did not modify document",
                extra={'call_id': call_id}
            )

        logger.info(
            "Analysis saved to MongoDB",
            extra={'call_id': call_id, 'modified_count': result.modified_count}
        )

        # Step 8: Log summary statistics
        total_time = time.time() - start_time

        logger.info(
            "Analysis task completed",
            extra={
                'call_id': call_id,
                'processing_time_seconds': round(total_time, 2),
                'cost_usd': metadata['cost_usd'],
                'entities_count': len(analysis_data.get('entities', [])),
                'pain_points_count': len(analysis_data.get('pain_points', [])),
                'objections_count': len(analysis_data.get('objections', [])),
                'quality_score': quality_validation['quality_score']
            }
        )

        # Step 9: Trigger entity resolution task (Story 3.3)
        # Chain to entity resolution if entities were extracted
        if len(analysis_data.get('entities', [])) > 0:
            try:
                resolve_entities.delay(call_id)
                logger.info(
                    "Triggered entity resolution task",
                    extra={'call_id': call_id, 'next_task': 'resolve_entities'}
                )
            except Exception as e:
                # Don't fail analysis if entity resolution trigger fails
                logger.error(
                    "Failed to trigger entity resolution task",
                    extra={'call_id': call_id, 'error': str(e)},
                    exc_info=True
                )
        else:
            logger.info(
                "Skipping entity resolution (no entities extracted)",
                extra={'call_id': call_id}
            )

        return {
            'status': 'success',
            'call_id': call_id,
            'processing_time_seconds': round(total_time, 2),
            'cost_usd': metadata['cost_usd'],
            'quality_score': quality_validation['quality_score'],
            'summary': analysis_data.get('summary')
        }

    except Exception as e:
        # Error handling with retry logic
        logger.error(
            "Error during analysis",
            extra={'call_id': call_id, 'error': str(e)},
            exc_info=True
        )

        # Update status to failed if max retries exceeded
        if self.request.retries >= self.max_retries:
            _update_call_status_to_failed(call_id, str(e))

        # Retry with exponential backoff
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))

    finally:
        # Close MongoDB connection
        if mongo_client:
            try:
                mongo_client.close()
            except:
                pass


def _update_call_status_to_failed(call_id: str, error_message: str):
    """
    Update call status to failed in MongoDB.

    Args:
        call_id: Call identifier
        error_message: Error message to store
    """
    try:
        mongo_client = MongoClient(settings.mongodb_uri)
        db = mongo_client[settings.mongodb_database]
        db.calls.update_one(
            {'call_id': call_id},
            {
                '$set': {
                    'status': 'failed',
                    'error': error_message,
                    'updated_at': datetime.utcnow()
                }
            }
        )
        mongo_client.close()
        logger.info("Updated call status to failed", extra={'call_id': call_id})
    except Exception as db_error:
        logger.error(
            "Failed to update status to failed",
            extra={'call_id': call_id, 'error': str(db_error)}
        )


@celery_app.task(bind=True, name='tasks.analysis.resolve_entities', max_retries=3)
def resolve_entities(self, call_id: str):
    """
    Resolve and deduplicate entities extracted from call analysis.

    This task (Story 3.3):
    1. Retrieves analysis results from MongoDB
    2. Performs fuzzy matching on extracted entities
    3. Links entities to canonical records
    4. Creates new canonical entities as needed
    5. Updates call document with resolved entity IDs

    Args:
        call_id: Unique identifier for the call

    Returns:
        dict: Resolved entity mappings and statistics
    """
    import time
    from services.entity_resolution_service import get_entity_resolution_service

    start_time = time.time()
    mongo_client = None

    logger.info(
        "Starting entity resolution task",
        extra={'call_id': call_id, 'task_id': self.request.id}
    )

    try:
        # Step 1: Connect to MongoDB and retrieve call with analysis
        mongo_client = MongoClient(settings.mongodb_uri)
        db = mongo_client[settings.mongodb_database]
        calls_collection = db.calls

        call_doc = calls_collection.find_one({'call_id': call_id})

        if not call_doc:
            logger.error(
                "Call not found in database",
                extra={'call_id': call_id}
            )
            return {
                'status': 'error',
                'call_id': call_id,
                'message': 'Call not found'
            }

        # Step 2: Check if analysis exists
        analysis_data = call_doc.get('analysis')
        if not analysis_data:
            logger.warning(
                "No analysis found for call",
                extra={'call_id': call_id, 'call_status': call_doc.get('status')}
            )
            return {
                'status': 'error',
                'call_id': call_id,
                'message': 'No analysis available for entity resolution'
            }

        # Step 3: Extract entities from analysis
        extracted_entities = analysis_data.get('entities', [])

        if not extracted_entities:
            logger.info(
                "No entities to resolve",
                extra={'call_id': call_id}
            )
            return {
                'status': 'success',
                'call_id': call_id,
                'message': 'No entities extracted',
                'resolved_count': 0
            }

        logger.info(
            "Retrieved entities for resolution",
            extra={'call_id': call_id, 'entity_count': len(extracted_entities)}
        )

        # Step 4: Perform entity resolution
        entity_service = get_entity_resolution_service()

        resolution_result = entity_service.resolve_entities_for_call(
            call_id=call_id,
            extracted_entities=extracted_entities
        )

        logger.info(
            "Entity resolution completed",
            extra={
                'call_id': call_id,
                'raw_entities': resolution_result.raw_entities_count,
                'resolved': resolution_result.resolved_entities_count,
                'new': resolution_result.new_entities_created,
                'processing_time': resolution_result.processing_time_seconds
            }
        )

        # Step 5: Update call document with resolution results
        update_data = {
            'entity_resolution': resolution_result.model_dump(),
            'processing.entities_resolved_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        result = calls_collection.update_one(
            {'call_id': call_id},
            {'$set': update_data}
        )

        if result.modified_count == 0:
            logger.warning(
                "MongoDB update did not modify document",
                extra={'call_id': call_id}
            )

        logger.info(
            "Entity resolution saved to MongoDB",
            extra={'call_id': call_id, 'modified_count': result.modified_count}
        )

        total_time = time.time() - start_time

        return {
            'status': 'success',
            'call_id': call_id,
            'raw_entities_count': resolution_result.raw_entities_count,
            'resolved_entities_count': resolution_result.resolved_entities_count,
            'new_entities_created': resolution_result.new_entities_created,
            'processing_time_seconds': round(total_time, 2),
            'entity_mappings': resolution_result.entity_mappings
        }

    except Exception as e:
        # Error handling with retry logic
        logger.error(
            "Error during entity resolution",
            extra={'call_id': call_id, 'error': str(e)},
            exc_info=True
        )

        # Retry with exponential backoff
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
        else:
            # Max retries exceeded, log error but don't fail the call
            return {
                'status': 'error',
                'call_id': call_id,
                'message': f'Entity resolution failed after retries: {str(e)}'
            }

    finally:
        # Close MongoDB connection
        if mongo_client:
            try:
                mongo_client.close()
            except:
                pass
