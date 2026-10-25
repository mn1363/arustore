import logging
from typing import Any, Dict
from app.core.celery_app import celery_app

logger = logging.getLogger("arustore.tasks.analytics")


@celery_app.task(name="arustore.record_analytics_snapshot")
def record_analytics_snapshot_task(event_type: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
    logger.info("Processed background analytics event: %s", event_type)
    return {
        "status": "recorded",
        "event_type": event_type,
        "metadata": metadata,
    }
