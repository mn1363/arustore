import logging
from typing import Any, Dict
from app.core.celery_app import celery_app

logger = logging.getLogger("arustore.tasks.email")


@celery_app.task(name="arustore.send_welcome_email")
def send_welcome_email_task(email: str, full_name: str) -> Dict[str, Any]:
    logger.info("Queued welcome email to %s (%s)", email, full_name)
    return {
        "status": "dispatched",
        "template": "welcome",
        "recipient": email,
        "full_name": full_name,
    }


@celery_app.task(name="arustore.send_order_confirmation_email")
def send_order_confirmation_email_task(
    email: str, order_number: str, total_toman: int
) -> Dict[str, Any]:
    logger.info(
        "Queued order confirmation email for %s to %s (total=%s Toman)",
        order_number,
        email,
        total_toman,
    )
    return {
        "status": "dispatched",
        "template": "order_confirmation",
        "recipient": email,
        "order_number": order_number,
        "total_toman": total_toman,
    }
