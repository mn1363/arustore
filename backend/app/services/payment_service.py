import hashlib
import hmac
import uuid
from typing import Dict
from app.core.config import settings


class PaymentService:
    """Sandbox payment adapter with HMAC verification; swap gateway transport for Shaparak/Zarinpal in production."""

    def initiate_transaction(
        self, order_number: str, amount_toman: int
    ) -> Dict[str, str | int]:
        authority = f"ARU-PAY-{uuid.uuid4().hex[:12].upper()}"
        signature = self._sign(order_number, amount_toman, authority)
        return {
            "gateway": "sandbox",
            "authority": authority,
            "signature": signature,
            "amount_toman": amount_toman,
            "status": "authorized",
        }

    def verify_transaction(
        self, order_number: str, amount_toman: int, authority: str, signature: str
    ) -> bool:
        expected = self._sign(order_number, amount_toman, authority)
        return hmac.compare_digest(expected, signature)

    def _sign(self, order_number: str, amount_toman: int, authority: str) -> str:
        msg = f"{order_number}:{amount_toman}:{authority}".encode("utf-8")
        return hmac.new(
            settings.PAYMENT_GATEWAY_SECRET.encode("utf-8"),
            msg,
            hashlib.sha256,
        ).hexdigest()
