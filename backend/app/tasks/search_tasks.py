import logging
from typing import Any, Dict
from app.core.celery_app import celery_app

logger = logging.getLogger("arustore.tasks.search")


@celery_app.task(name="arustore.sync_product_to_search")
def sync_product_to_search_task(product_payload: Dict[str, Any]) -> Dict[str, Any]:
    product_id = product_payload.get("id")
    logger.info("Scheduled search index sync for product_id=%s", product_id)
    return {
        "status": "indexed",
        "product_id": product_id,
    }


@celery_app.task(name="arustore.remove_product_from_search")
def remove_product_from_search_task(product_id: int) -> Dict[str, Any]:
    logger.info("Scheduled search index removal for product_id=%s", product_id)
    return {
        "status": "removed",
        "product_id": product_id,
    }
