"""
Celery application configuration for async task processing.

This module sets up Celery with SQS broker and Redis result backend
for distributed task processing (Epic 2, Story 2.4).
"""

import logging
from celery import Celery
from kombu.utils.url import safequote
from core.config import settings

logger = logging.getLogger(__name__)

# Create Celery app instance
celery_app = Celery('audio_pipeline')

# Configure Celery with SQS and Redis
celery_app.conf.update(
    # Broker: AWS SQS
    broker_url=settings.sqs_queue_url,
    broker_transport_options={
        'region': settings.aws_region,
        'queue_name_prefix': 'audio-pipeline-',
        'visibility_timeout': 3600,  # 1 hour for long-running tasks
        'polling_interval': 1,  # Poll SQS every 1 second
    },

    # Result Backend: Redis
    result_backend=settings.redis_url,
    result_backend_transport_options={
        'master_name': 'mymaster',
    },

    # Task settings
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,

    # Task execution
    task_acks_late=True,  # Acknowledge after task completion
    task_reject_on_worker_lost=True,  # Requeue if worker dies
    worker_prefetch_multiplier=1,  # Process one task at a time
    worker_max_tasks_per_child=1000,  # Restart worker after 1000 tasks

    # Result expiration
    result_expires=86400,  # 24 hours

    # Task routing
    task_routes={
        'tasks.transcription.*': {'queue': 'transcription'},
        'tasks.analysis.*': {'queue': 'analysis'},
        'tasks.embedding.*': {'queue': 'embedding'},
        'tasks.insights.*': {'queue': 'analysis'},  # Insights on analysis queue
    },

    # Task time limits
    task_soft_time_limit=1800,  # 30 minutes soft limit
    task_time_limit=3600,  # 1 hour hard limit

    # Worker settings
    worker_send_task_events=True,
    task_send_sent_event=True,

    # Celery Beat schedule for periodic tasks (Story 3.4)
    beat_schedule={
        'generate-daily-insights': {
            'task': 'tasks.insights.generate_daily_insights',
            'schedule': 3600.0,  # Run every hour (will generate for yesterday)
            'options': {
                'expires': 3000,  # Expire task if not run within 50 minutes
            }
        },
    },
)

# Auto-discover tasks from task modules
celery_app.autodiscover_tasks([
    'tasks.transcription',
    'tasks.analysis',
    'tasks.embedding',
    'tasks.insights',
])

logger.info(
    "Celery app configured",
    extra={
        'broker': 'SQS',
        'result_backend': 'Redis',
        'region': settings.aws_region
    }
)


@celery_app.task(bind=True, name='celery.ping')
def ping(self):
    """
    Simple ping task for health checks.

    Returns:
        str: Pong message
    """
    return 'pong'


if __name__ == '__main__':
    celery_app.start()
