import asyncio
from datetime import datetime, timedelta, timezone
import secrets
from typing import Callable, Dict, List, Optional, Tuple
import uuid

from sqlalchemy import case, func, or_, select, text, update
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import Settings, settings
from app.models.discount import Discount, DiscountUsage
from app.models.order import Order, OrderStatusHistory
from app.models.payment import (
    DiscountReservation,
    InventoryReservation,
    PaymentAttempt,
)
from app.models.product import Product
from app.models.user import User
from app.schemas.payment import (
    DiscountReservationResponse,
    InventoryReservationResponse,
    PaymentAttemptResponse,
    PaymentNextActionResponse,
    SandboxResolveRequest,
)
from app.services.payment_gateway import (
    GatewaySessionInitResult,
    GatewaySessionRequest,
    GatewayVerificationRequest,
    GatewayVerificationResult,
    PaymentGatewayPort,
    derive_sandbox_token,
    verify_sandbox_token,
)


def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


class PaymentContractError(Exception):
    """Structured domain/contract error mapped to deterministic HTTP responses."""

    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(f"{code}: {message}")
        self.status_code = status_code
        self.code = code
        self.message = message


class PaymentLifecycleService:
    """
    Provider-neutral payment attempt lifecycle, atomic inventory/discount reservation,
    and single-settlement orchestration.
    """

    MAX_LOCK_RETRIES = 8

    def __init__(
        self,
        db: AsyncSession,
        app_settings: Settings = settings,
        adapter: Optional[PaymentGatewayPort] = None,
        now_fn: Optional[Callable[[], datetime]] = None,
    ) -> None:
        self.db = db
        self.settings = app_settings
        self.adapter = adapter
        self._now_fn = now_fn or (lambda: datetime.now(timezone.utc))

    def _now(self) -> datetime:
        return ensure_utc(self._now_fn())  # type: ignore[return-value]

    def _is_sqlite(self) -> bool:
        bind = self.db.get_bind()
        return bind.dialect.name == "sqlite"

    async def _begin_write_critical_section(self) -> None:
        """
        On SQLite, acquire the RESERVED write lock at the start of the transaction
        before any SELECT executes, without mutating any existing table timestamps.
        On PostgreSQL, row-level FOR UPDATE locks are acquired in canonical order.
        """
        if self._is_sqlite():
            await self.db.execute(text("DELETE FROM payment_attempts WHERE id = -1"))

    def _with_for_update_if_supported(self, stmt):
        if self._is_sqlite():
            return stmt
        return stmt.with_for_update()

    def _attempt_query(self):
        return select(PaymentAttempt).options(
            selectinload(PaymentAttempt.inventory_reservations),
            selectinload(PaymentAttempt.discount_reservation),
        )

    def _ensure_payment_provider_enabled(self) -> PaymentGatewayPort:
        if not self.settings.is_payment_enabled or self.adapter is None:
            raise PaymentContractError(
                503,
                "payment_provider_unavailable",
                "Online payment gateway is currently disabled or unconfigured.",
            )
        return self.adapter

    @staticmethod
    def _validate_idempotency_key(raw_key: Optional[str]) -> str:
        if raw_key is None:
            raise PaymentContractError(
                400,
                "missing_idempotency_key",
                "Idempotency-Key header is required.",
            )
        cleaned = raw_key.strip()
        if not cleaned or len(cleaned) > 128:
            raise PaymentContractError(
                400,
                "invalid_idempotency_key",
                "Idempotency-Key must be between 1 and 128 non-whitespace characters.",
            )
        return cleaned

    @staticmethod
    def _summarize_reservation_status(attempt: PaymentAttempt) -> str:
        if attempt.status == "succeeded":
            return "consumed"
        if attempt.status == "expired":
            return "expired"
        if attempt.status in ("failed", "cancelled", "reconciliation_required"):
            inv = list(attempt.inventory_reservations or [])
            if inv and all(r.status == "expired" for r in inv):
                return "expired"
            return "released"
        inv = list(attempt.inventory_reservations or [])
        if inv:
            statuses = {r.status for r in inv}
            if len(statuses) == 1:
                return next(iter(statuses))
        return "active"

    def _serialize_attempt(
        self,
        attempt: PaymentAttempt,
        order: Order,
        *,
        include_sandbox_token: bool = False,
    ) -> PaymentAttemptResponse:
        next_action: Optional[PaymentNextActionResponse] = None
        if (
            attempt.status == "pending"
            and attempt.provider == "sandbox"
            and self.settings.is_sandbox_payment_active
        ):
            token_val: Optional[str] = None
            if include_sandbox_token and attempt.sandbox_nonce:
                token_val = derive_sandbox_token(
                    self.settings,
                    attempt_number=attempt.attempt_number,
                    order_id=attempt.order_id,
                    user_id=attempt.user_id,
                    amount_toman=attempt.amount_toman,
                    sandbox_nonce=attempt.sandbox_nonce,
                )
            next_action = PaymentNextActionResponse(
                type="sandbox_resolution",
                sandbox_token=token_val,
            )

        inv_out = [
            InventoryReservationResponse(
                product_id=r.product_id,
                quantity=r.quantity,
                status=r.status,
                expires_at=ensure_utc(r.expires_at),  # type: ignore[arg-type]
                consumed_at=ensure_utc(r.consumed_at),
                released_at=ensure_utc(r.released_at),
            )
            for r in sorted(
                attempt.inventory_reservations or [],
                key=lambda item: item.product_id,
            )
        ]

        disc_out: Optional[DiscountReservationResponse] = None
        if attempt.discount_reservation is not None:
            dr = attempt.discount_reservation
            disc_out = DiscountReservationResponse(
                discount_id=dr.discount_id,
                status=dr.status,
                expires_at=ensure_utc(dr.expires_at),  # type: ignore[arg-type]
                consumed_at=ensure_utc(dr.consumed_at),
                released_at=ensure_utc(dr.released_at),
            )

        now_fallback = self._now()
        return PaymentAttemptResponse(
            id=attempt.id,
            attempt_number=attempt.attempt_number,
            order_id=order.id,
            order_number=order.order_number,
            order_status=order.status,
            order_payment_status=order.payment_status,
            provider=attempt.provider,
            status=attempt.status,
            amount_toman=attempt.amount_toman,
            currency_unit=attempt.currency_unit,
            provider_authority=attempt.provider_authority,
            provider_transaction_id=attempt.provider_transaction_id,
            failure_code=attempt.failure_code,
            failure_reason=attempt.failure_reason,
            reservation_status=self._summarize_reservation_status(attempt),
            inventory_reservations=inv_out,
            discount_reservation=disc_out,
            next_action=next_action,
            expires_at=ensure_utc(attempt.expires_at) or now_fallback,
            verified_at=ensure_utc(attempt.verified_at),
            completed_at=ensure_utc(attempt.completed_at),
            created_at=ensure_utc(attempt.created_at) or now_fallback,
            updated_at=ensure_utc(attempt.updated_at) or now_fallback,
        )

    async def _reload_and_serialize(
        self,
        attempt_id: int,
        order_id: int,
        *,
        include_sandbox_token: bool = False,
    ) -> PaymentAttemptResponse:
        refreshed_attempt = (
            await self.db.execute(
                self._attempt_query()
                .where(PaymentAttempt.id == attempt_id)
                .execution_options(populate_existing=True)
            )
        ).scalar_one()
        refreshed_order = (
            await self.db.execute(
                select(Order)
                .where(Order.id == order_id)
                .execution_options(populate_existing=True)
            )
        ).scalar_one()
        resp = self._serialize_attempt(
            refreshed_attempt,
            refreshed_order,
            include_sandbox_token=include_sandbox_token,
        )
        if self.db.in_transaction():
            await self.db.rollback()
        return resp

    async def compute_sellable_stock(
        self, product_id: int, now_utc: Optional[datetime] = None
    ) -> int:
        """
        Sellable stock = physical stock_quantity minus active reservations whose expires_at > now_utc.
        Expired reservations stop affecting availability immediately without any background worker.
        """
        effective_now = ensure_utc(now_utc) or self._now()
        prod_stock = (
            await self.db.execute(
                select(Product.stock_quantity, Product.is_active, Product.in_stock).where(
                    Product.id == product_id
                )
            )
        ).one_or_none()
        if prod_stock is None or not prod_stock[1] or not prod_stock[2]:
            return 0

        reserved_qty = int(
            (
                await self.db.execute(
                    select(func.coalesce(func.sum(InventoryReservation.quantity), 0)).where(
                        InventoryReservation.product_id == product_id,
                        InventoryReservation.status == "active",
                        InventoryReservation.expires_at > effective_now,
                    )
                )
            ).scalar_one()
            or 0
        )
        return max(0, int(prod_stock[0]) - reserved_qty)

    async def compute_available_discount_capacity(
        self, discount_id: int, now_utc: Optional[datetime] = None
    ) -> Optional[int]:
        """
        Available discount capacity = usage_limit - used_count - active unexpired reservations.
        Returns None if the discount has no usage_limit (unlimited capacity while active/unexpired),
        or 0 if inactive/expired/exhausted.
        """
        effective_now = ensure_utc(now_utc) or self._now()
        discount = (
            await self.db.execute(select(Discount).where(Discount.id == discount_id))
        ).scalar_one_or_none()
        if discount is None or not discount.is_active:
            return 0
        if discount.expires_at is not None and ensure_utc(discount.expires_at) <= effective_now:  # type: ignore[operator]
            return 0
        if discount.usage_limit is None:
            return None

        active_res = int(
            (
                await self.db.execute(
                    select(func.count(DiscountReservation.id)).where(
                        DiscountReservation.discount_id == discount_id,
                        DiscountReservation.status == "active",
                        DiscountReservation.expires_at > effective_now,
                    )
                )
            ).scalar_one()
            or 0
        )
        return max(0, int(discount.usage_limit) - int(discount.used_count) - active_res)

    def _expire_attempt_in_tx(
        self,
        attempt: PaymentAttempt,
        now_utc: datetime,
        *,
        failure_code: str = "attempt_expired",
        failure_reason: str = "Payment reservation window expired.",
    ) -> None:
        for inv_res in attempt.inventory_reservations or []:
            if inv_res.status == "active":
                inv_res.status = "expired"
                inv_res.released_at = now_utc

        if (
            attempt.discount_reservation is not None
            and attempt.discount_reservation.status == "active"
        ):
            attempt.discount_reservation.status = "expired"
            attempt.discount_reservation.active_order_key = None
            attempt.discount_reservation.released_at = now_utc

        attempt.status = "expired"
        attempt.active_order_key = None
        attempt.settled_order_key = None
        attempt.failure_code = failure_code
        attempt.failure_reason = failure_reason
        attempt.completed_at = attempt.completed_at or now_utc

    def _release_attempt_reservations_in_tx(
        self,
        attempt: PaymentAttempt,
        now_utc: datetime,
    ) -> None:
        for inv_res in attempt.inventory_reservations or []:
            if inv_res.status == "active":
                inv_res.status = "released"
                inv_res.released_at = now_utc

        if (
            attempt.discount_reservation is not None
            and attempt.discount_reservation.status == "active"
        ):
            attempt.discount_reservation.status = "released"
            attempt.discount_reservation.active_order_key = None
            attempt.discount_reservation.released_at = now_utc

    async def _lock_attempt_resources_in_canonical_order(
        self,
        attempt: PaymentAttempt,
        promo_code: Optional[str],
    ) -> Tuple[Dict[int, Product], Optional[Discount]]:
        """
        Locks Product rows in ascending product_id order followed by the Discount row
        when running on PostgreSQL, matching initiation's exact lock order.
        """
        sorted_pids = sorted(
            {r.product_id for r in (attempt.inventory_reservations or [])}
        )
        locked_products: Dict[int, Product] = {}
        if sorted_pids:
            prod_stmt = self._with_for_update_if_supported(
                select(Product)
                .where(Product.id.in_(sorted_pids))
                .order_by(Product.id.asc())
            )
            rows = (await self.db.execute(prod_stmt)).scalars().all()
            locked_products = {p.id: p for p in rows}

        locked_discount: Optional[Discount] = None
        discount_id: Optional[int] = (
            attempt.discount_reservation.discount_id
            if attempt.discount_reservation is not None
            else None
        )
        if discount_id is not None:
            disc_stmt = self._with_for_update_if_supported(
                select(Discount).where(Discount.id == discount_id)
            )
            locked_discount = (await self.db.execute(disc_stmt)).scalar_one_or_none()
        elif promo_code and promo_code.strip():
            cleaned = promo_code.strip().upper()
            disc_stmt = self._with_for_update_if_supported(
                select(Discount).where(Discount.code == cleaned)
            )
            locked_discount = (await self.db.execute(disc_stmt)).scalar_one_or_none()

        return locked_products, locked_discount

    async def release_active_attempt_in_order_cancel_tx(
        self, order_id: int, promo_code: Optional[str], now_utc: Optional[datetime] = None
    ) -> None:
        """
        Called inside OrderService.update_order_status within the SAME transaction (no commit here)
        when an unpaid order transitions to 'cancelled'.
        """
        effective_now = ensure_utc(now_utc) or self._now()
        att_stmt = self._with_for_update_if_supported(
            self._attempt_query().where(
                PaymentAttempt.order_id == order_id,
                PaymentAttempt.status.in_(("initiated", "pending")),
            )
        )
        active_attempts = (await self.db.execute(att_stmt)).scalars().all()
        for attempt in active_attempts:
            await self._lock_attempt_resources_in_canonical_order(attempt, promo_code)
            self._release_attempt_reservations_in_tx(attempt, effective_now)
            attempt.status = "cancelled"
            attempt.active_order_key = None
            attempt.settled_order_key = None
            attempt.failure_code = "order_cancelled"
            attempt.failure_reason = "Parent order was cancelled."
            attempt.completed_at = effective_now
        if active_attempts:
            await self.db.flush()

    async def initiate_attempt(
        self,
        current_user: User,
        order_id: int,
        idempotency_key: Optional[str],
    ) -> Tuple[PaymentAttemptResponse, bool]:
        """
        Returns (PaymentAttemptResponse, created_new_attempt).
        Phase 1: Atomic DB reservation & 'initiated' attempt commit.
        Phase 2: Adapter session creation outside any DB transaction.
        Phase 3: Atomic DB update to 'pending' (or immediate reservation release on failure).
        """
        adapter = self._ensure_payment_provider_enabled()
        cleaned_key = self._validate_idempotency_key(idempotency_key)
        user_id = int(current_user.id)

        # Phase 1: Short atomic reservation transaction
        session_req: Optional[GatewaySessionRequest] = None
        created_new = False

        for retry_idx in range(self.MAX_LOCK_RETRIES):
            try:
                if self.db.in_transaction():
                    await self.db.rollback()
                await self._begin_write_critical_section()
                now_utc = self._now()

                order_stmt = self._with_for_update_if_supported(
                    select(Order)
                    .options(selectinload(Order.items))
                    .where(Order.id == order_id)
                )
                order = (await self.db.execute(order_stmt)).scalar_one_or_none()
                if order is None:
                    await self.db.rollback()
                    raise PaymentContractError(
                        404, "order_not_found", "Order not found."
                    )
                if order.user_id != user_id:
                    await self.db.rollback()
                    raise PaymentContractError(
                        403, "order_access_denied", "Access denied for this order."
                    )

                # Check idempotency record scoped to (user_id, idempotency_key)
                idem_stmt = self._with_for_update_if_supported(
                    self._attempt_query().where(
                        PaymentAttempt.user_id == user_id,
                        PaymentAttempt.idempotency_key == cleaned_key,
                    )
                )
                existing_idem = (await self.db.execute(idem_stmt)).scalar_one_or_none()
                if existing_idem is not None:
                    if existing_idem.order_id != order_id:
                        await self.db.rollback()
                        raise PaymentContractError(
                            409,
                            "idempotency_key_order_mismatch",
                            "Idempotency-Key has already been used for a different order.",
                        )
                    if (
                        existing_idem.status in ("initiated", "pending")
                        and ensure_utc(existing_idem.expires_at) <= now_utc  # type: ignore[operator]
                    ):
                        idem_id = int(existing_idem.id)
                        await self._lock_attempt_resources_in_canonical_order(
                            existing_idem, order.promo_code
                        )
                        self._expire_attempt_in_tx(existing_idem, now_utc)
                        await self.db.commit()
                        return (
                            await self._reload_and_serialize(
                                idem_id, order_id, include_sandbox_token=True
                            ),
                            False,
                        )
                    if existing_idem.status != "initiated":
                        idem_id = int(existing_idem.id)
                        await self.db.commit()
                        return (
                            await self._reload_and_serialize(
                                idem_id, order_id, include_sandbox_token=True
                            ),
                            False,
                        )
                    # Recover an interrupted 'initiated' attempt without creating a second reservation
                    session_req = GatewaySessionRequest(
                        attempt_id=existing_idem.id,
                        attempt_number=existing_idem.attempt_number,
                        order_id=order.id,
                        order_number=order.order_number,
                        user_id=user_id,
                        amount_toman=existing_idem.amount_toman,
                        currency_unit=existing_idem.currency_unit,
                    )
                    created_new = False
                    await self.db.commit()
                    break

                # Validate order state for a fresh payment attempt
                if order.payment_status == "paid":
                    await self.db.rollback()
                    raise PaymentContractError(
                        409, "order_already_paid", "Order has already been paid."
                    )
                if order.status == "cancelled":
                    await self.db.rollback()
                    raise PaymentContractError(
                        409,
                        "order_cancelled",
                        "Cancelled orders cannot initiate payment.",
                    )
                if order.status != "pending_payment" or order.payment_status != "pending":
                    ord_st = str(order.status)
                    pay_st = str(order.payment_status)
                    await self.db.rollback()
                    raise PaymentContractError(
                        409,
                        "order_not_payable",
                        f"Order in status '{ord_st}' (payment '{pay_st}') cannot initiate payment.",
                    )

                # Inspect any existing active attempt on this order
                active_stmt = self._with_for_update_if_supported(
                    self._attempt_query().where(
                        PaymentAttempt.order_id == order_id,
                        PaymentAttempt.status.in_(("initiated", "pending")),
                    )
                )
                active_attempts = (await self.db.execute(active_stmt)).scalars().all()
                for act in active_attempts:
                    if ensure_utc(act.expires_at) <= now_utc:  # type: ignore[operator]
                        await self._lock_attempt_resources_in_canonical_order(
                            act, order.promo_code
                        )
                        self._expire_attempt_in_tx(act, now_utc)
                        await self.db.flush()
                    else:
                        await self.db.rollback()
                        raise PaymentContractError(
                            409,
                            "active_payment_attempt_exists",
                            "An active payment attempt already exists for this order.",
                        )

                # Group and sort order items by product_id ASC (all-or-nothing)
                if not order.items:
                    await self.db.rollback()
                    raise PaymentContractError(
                        409,
                        "order_not_payable",
                        "Order contains no items.",
                    )

                qty_by_product: Dict[int, int] = {}
                for item in order.items:
                    if item.product_id is None or item.quantity < 1:
                        await self.db.rollback()
                        raise PaymentContractError(
                            409,
                            "insufficient_available_stock",
                            "One or more order items are no longer available.",
                        )
                    pid = int(item.product_id)
                    qty_by_product[pid] = qty_by_product.get(pid, 0) + int(item.quantity)

                sorted_pids = sorted(qty_by_product.keys())

                # Step 1 of locking: Lock Product rows in strict ascending ID order
                prod_stmt = self._with_for_update_if_supported(
                    select(Product)
                    .where(Product.id.in_(sorted_pids))
                    .order_by(Product.id.asc())
                )
                locked_products = {
                    p.id: p for p in (await self.db.execute(prod_stmt)).scalars().all()
                }
                for pid in sorted_pids:
                    prod = locked_products.get(pid)
                    if prod is None or not prod.is_active or not prod.in_stock:
                        await self.db.rollback()
                        raise PaymentContractError(
                            409,
                            "insufficient_available_stock",
                            "One or more products in this order are unavailable or out of stock.",
                        )

                # Step 2 of locking: Lock Discount row if order has a promo_code
                locked_discount: Optional[Discount] = None
                if order.promo_code and order.promo_code.strip():
                    cleaned_code = order.promo_code.strip().upper()
                    disc_stmt = self._with_for_update_if_supported(
                        select(Discount).where(Discount.code == cleaned_code)
                    )
                    locked_discount = (
                        await self.db.execute(disc_stmt)
                    ).scalar_one_or_none()
                    if locked_discount is None or not locked_discount.is_active:
                        await self.db.rollback()
                        raise PaymentContractError(
                            409,
                            "promo_invalid_or_inactive",
                            "Promo code on this order is no longer active.",
                        )
                    if (
                        locked_discount.expires_at is not None
                        and ensure_utc(locked_discount.expires_at) <= now_utc  # type: ignore[operator]
                    ):
                        await self.db.rollback()
                        raise PaymentContractError(
                            409,
                            "promo_expired",
                            "Promo code on this order has expired.",
                        )

                # Step 3: In subsequent statements inside the same locked transaction,
                # compute active unexpired inventory reservations and discount reservations.
                active_inv_rows = (
                    await self.db.execute(
                        select(
                            InventoryReservation.product_id,
                            func.coalesce(func.sum(InventoryReservation.quantity), 0),
                        )
                        .where(
                            InventoryReservation.product_id.in_(sorted_pids),
                            InventoryReservation.status == "active",
                            InventoryReservation.expires_at > now_utc,
                        )
                        .group_by(InventoryReservation.product_id)
                    )
                ).all()
                reserved_by_pid = {int(pid): int(total_q) for pid, total_q in active_inv_rows}

                for pid in sorted_pids:
                    prod = locked_products[pid]
                    available = int(prod.stock_quantity) - reserved_by_pid.get(pid, 0)
                    if available < qty_by_product[pid]:
                        prod_name = str(prod.name)
                        await self.db.rollback()
                        raise PaymentContractError(
                            409,
                            "insufficient_available_stock",
                            f"Insufficient available stock for '{prod_name}'.",
                        )

                if locked_discount is not None and locked_discount.usage_limit is not None:
                    active_disc_count = int(
                        (
                            await self.db.execute(
                                select(func.count(DiscountReservation.id)).where(
                                    DiscountReservation.discount_id == locked_discount.id,
                                    DiscountReservation.status == "active",
                                    DiscountReservation.expires_at > now_utc,
                                )
                            )
                        ).scalar_one()
                        or 0
                    )
                    remaining_capacity = (
                        int(locked_discount.usage_limit)
                        - int(locked_discount.used_count)
                        - active_disc_count
                    )
                    if remaining_capacity < 1:
                        await self.db.rollback()
                        raise PaymentContractError(
                            409,
                            "promo_capacity_exhausted",
                            "Promo code usage capacity is currently exhausted.",
                        )

                # Step 4: Create PaymentAttempt and Reservations atomically
                ttl_seconds = int(self.settings.PAYMENT_RESERVATION_TTL_SECONDS)
                expires_at = now_utc + timedelta(seconds=ttl_seconds)
                attempt_number = (
                    f"PAY-{now_utc.year}-{uuid.uuid4().hex[:12].upper()}"
                )
                amount_toman = int(order.total_toman)
                sandbox_nonce = (
                    secrets.token_hex(16)
                    if adapter.provider_name == "sandbox"
                    else None
                )

                attempt = PaymentAttempt(
                    attempt_number=attempt_number,
                    order_id=order.id,
                    user_id=user_id,
                    idempotency_key=cleaned_key,
                    provider=adapter.provider_name,
                    status="initiated",
                    amount_toman=amount_toman,
                    currency_unit="toman",
                    active_order_key=order.id,
                    settled_order_key=None,
                    sandbox_nonce=sandbox_nonce,
                    expires_at=expires_at,
                )
                self.db.add(attempt)
                await self.db.flush()

                for pid in sorted_pids:
                    self.db.add(
                        InventoryReservation(
                            payment_attempt_id=attempt.id,
                            order_id=order.id,
                            product_id=pid,
                            quantity=qty_by_product[pid],
                            status="active",
                            expires_at=expires_at,
                        )
                    )

                if locked_discount is not None:
                    self.db.add(
                        DiscountReservation(
                            payment_attempt_id=attempt.id,
                            order_id=order.id,
                            discount_id=locked_discount.id,
                            status="active",
                            active_order_key=order.id,
                            settled_order_key=None,
                            expires_at=expires_at,
                        )
                    )

                await self.db.flush()
                session_req = GatewaySessionRequest(
                    attempt_id=int(attempt.id),
                    attempt_number=attempt_number,
                    order_id=int(order.id),
                    order_number=str(order.order_number),
                    user_id=user_id,
                    amount_toman=amount_toman,
                    currency_unit="toman",
                )
                created_new = True
                await self.db.commit()
                break

            except PaymentContractError:
                raise
            except IntegrityError:
                await self.db.rollback()
                # Check if same (user_id, idempotency_key) won concurrently
                idem_winner = (
                    await self.db.execute(
                        self._attempt_query().where(
                            PaymentAttempt.user_id == user_id,
                            PaymentAttempt.idempotency_key == cleaned_key,
                        )
                    )
                ).scalar_one_or_none()
                if idem_winner is not None:
                    if idem_winner.order_id != order_id:
                        await self.db.rollback()
                        raise PaymentContractError(
                            409,
                            "idempotency_key_order_mismatch",
                            "Idempotency-Key has already been used for a different order.",
                        )
                    winner_id = int(idem_winner.id)
                    return (
                        await self._reload_and_serialize(
                            winner_id, order_id, include_sandbox_token=True
                        ),
                        False,
                    )
                if self.db.in_transaction():
                    await self.db.rollback()
                raise PaymentContractError(
                    409,
                    "active_payment_attempt_exists",
                    "An active payment attempt already exists for this order.",
                )
            except OperationalError as op_err:
                await self.db.rollback()
                if (
                    "database is locked" in str(op_err).lower()
                    and retry_idx < self.MAX_LOCK_RETRIES - 1
                ):
                    await asyncio.sleep(0.02 * (retry_idx + 1))
                    continue
                raise
            except Exception:
                await self.db.rollback()
                raise
        else:
            raise PaymentContractError(
                503,
                "payment_Initiation_busy",
                "Payment initiation is temporarily busy; please retry.",
            )

        assert session_req is not None

        # Phase 2: Call payment gateway adapter OUTSIDE any database transaction
        try:
            init_result = await adapter.create_session(session_req)
        except Exception:
            init_result = GatewaySessionInitResult(
                outcome="indeterminate_error",
                provider=adapter.provider_name,
                failure_code="session_init_indeterminate",
                failure_reason="Gateway session initialization encountered an indeterminate error.",
            )

        # Phase 3: Finalize attempt session state atomically
        for retry_idx in range(self.MAX_LOCK_RETRIES):
            try:
                if self.db.in_transaction():
                    await self.db.rollback()
                await self._begin_write_critical_section()
                finish_now = self._now()

                order_stmt = self._with_for_update_if_supported(
                    select(Order).where(Order.id == session_req.order_id)
                )
                order = (await self.db.execute(order_stmt)).scalar_one()

                att_stmt = self._with_for_update_if_supported(
                    self._attempt_query().where(
                        PaymentAttempt.id == session_req.attempt_id
                    )
                )
                attempt = (await self.db.execute(att_stmt)).scalar_one()

                if attempt.status != "initiated":
                    att_id_val = int(attempt.id)
                    await self.db.commit()
                    return (
                        await self._reload_and_serialize(
                            att_id_val,
                            session_req.order_id,
                            include_sandbox_token=True,
                        ),
                        created_new,
                    )

                if init_result.outcome == "definitive_failure":
                    await self._lock_attempt_resources_in_canonical_order(
                        attempt, order.promo_code
                    )
                    self._release_attempt_reservations_in_tx(attempt, finish_now)
                    attempt.status = "failed"
                    attempt.active_order_key = None
                    attempt.settled_order_key = None
                    attempt.failure_code = (
                        init_result.failure_code or "session_init_failed"
                    )
                    attempt.failure_reason = (
                        init_result.failure_reason
                        or "Payment session could not be initialized."
                    )
                    attempt.completed_at = finish_now
                    await self.db.commit()
                    raise PaymentContractError(
                        502,
                        "payment_session_init_failed",
                        "Payment session initialization failed and reservations were released.",
                    )

                if init_result.outcome == "indeterminate_error":
                    # Recoverable until TTL expiry without releasing reservations prematurely
                    att_id_val = int(attempt.id)
                    attempt.status = "pending"
                    attempt.provider_authority = init_result.authority
                    attempt.failure_code = (
                        init_result.failure_code or "session_init_indeterminate"
                    )
                    attempt.failure_reason = init_result.failure_reason
                    await self.db.commit()
                    return (
                        await self._reload_and_serialize(
                            att_id_val,
                            session_req.order_id,
                            include_sandbox_token=True,
                        ),
                        created_new,
                    )

                att_id_val = int(attempt.id)
                attempt.status = "pending"
                attempt.provider_authority = init_result.authority
                attempt.failure_code = None
                attempt.failure_reason = None
                await self.db.commit()

                return (
                    await self._reload_and_serialize(
                        att_id_val,
                        session_req.order_id,
                        include_sandbox_token=True,
                    ),
                    created_new,
                )

            except PaymentContractError:
                raise
            except OperationalError as op_err:
                await self.db.rollback()
                if (
                    "database is locked" in str(op_err).lower()
                    and retry_idx < self.MAX_LOCK_RETRIES - 1
                ):
                    await asyncio.sleep(0.02 * (retry_idx + 1))
                    continue
                raise
            except Exception:
                await self.db.rollback()
                raise

        raise PaymentContractError(
            503,
            "payment_initiation_busy",
            "Payment session update temporarily busy; please retry.",
        )

    async def get_attempt(
        self,
        current_user: User,
        order_id: int,
        attempt_id: int,
    ) -> PaymentAttemptResponse:
        return await self._get_attempt_internal(
            current_user=current_user,
            order_id=order_id,
            attempt_id=attempt_id,
        )

    async def get_latest_attempt(
        self,
        current_user: User,
        order_id: int,
    ) -> PaymentAttemptResponse:
        return await self._get_attempt_internal(
            current_user=current_user,
            order_id=order_id,
            attempt_id=None,
        )

    async def _get_attempt_internal(
        self,
        *,
        current_user: User,
        order_id: int,
        attempt_id: Optional[int],
    ) -> PaymentAttemptResponse:
        user_id = int(current_user.id)
        is_admin = bool(current_user.is_admin)

        order = (
            await self.db.execute(select(Order).where(Order.id == order_id))
        ).scalar_one_or_none()
        if order is None:
            raise PaymentContractError(404, "order_not_found", "Order not found.")
        if not is_admin and order.user_id != user_id:
            raise PaymentContractError(
                403, "order_access_denied", "Access denied for this order."
            )

        if attempt_id is not None:
            stmt = self._attempt_query().where(
                PaymentAttempt.id == attempt_id,
                PaymentAttempt.order_id == order_id,
            )
        else:
            stmt = (
                self._attempt_query()
                .where(PaymentAttempt.order_id == order_id)
                .order_by(PaymentAttempt.created_at.desc(), PaymentAttempt.id.desc())
                .limit(1)
            )

        attempt = (await self.db.execute(stmt)).scalar_one_or_none()
        if attempt is None:
            raise PaymentContractError(
                404,
                "payment_attempt_not_found",
                "Payment attempt not found for this order.",
            )

        now_utc = self._now()
        if (
            attempt.status in ("initiated", "pending")
            and ensure_utc(attempt.expires_at) <= now_utc  # type: ignore[operator]
        ):
            target_attempt_id = int(attempt.id)
            await self.db.rollback()
            return await self._lazy_reap_expired_attempt(target_attempt_id, order_id)

        resp = self._serialize_attempt(attempt, order, include_sandbox_token=False)
        if self.db.in_transaction():
            await self.db.rollback()
        return resp

    async def _lazy_reap_expired_attempt(
        self, attempt_id: int, order_id: int
    ) -> PaymentAttemptResponse:
        for retry_idx in range(self.MAX_LOCK_RETRIES):
            try:
                if self.db.in_transaction():
                    await self.db.rollback()
                await self._begin_write_critical_section()
                now_utc = self._now()

                order_stmt = self._with_for_update_if_supported(
                    select(Order).where(Order.id == order_id)
                )
                order = (await self.db.execute(order_stmt)).scalar_one()

                att_stmt = self._with_for_update_if_supported(
                    self._attempt_query().where(
                        PaymentAttempt.id == attempt_id,
                        PaymentAttempt.order_id == order_id,
                    )
                )
                attempt = (await self.db.execute(att_stmt)).scalar_one()

                if (
                    attempt.status in ("initiated", "pending")
                    and ensure_utc(attempt.expires_at) <= now_utc  # type: ignore[operator]
                ):
                    await self._lock_attempt_resources_in_canonical_order(
                        attempt, order.promo_code
                    )
                    self._expire_attempt_in_tx(attempt, now_utc)
                    await self.db.commit()
                else:
                    await self.db.commit()

                return await self._reload_and_serialize(
                    attempt_id, order_id, include_sandbox_token=False
                )
            except OperationalError as op_err:
                await self.db.rollback()
                if (
                    "database is locked" in str(op_err).lower()
                    and retry_idx < self.MAX_LOCK_RETRIES - 1
                ):
                    await asyncio.sleep(0.02 * (retry_idx + 1))
                    continue
                raise
            except Exception:
                await self.db.rollback()
                raise

        raise PaymentContractError(
            503, "payment_busy", "Unable to refresh expired payment attempt."
        )

    async def cancel_attempt(
        self,
        current_user: User,
        order_id: int,
        attempt_id: int,
        reason: Optional[str] = None,
    ) -> PaymentAttemptResponse:
        user_id = int(current_user.id)
        is_admin = bool(current_user.is_admin)

        for retry_idx in range(self.MAX_LOCK_RETRIES):
            try:
                if self.db.in_transaction():
                    await self.db.rollback()
                await self._begin_write_critical_section()
                now_utc = self._now()

                order_stmt = self._with_for_update_if_supported(
                    select(Order).where(Order.id == order_id)
                )
                order = (await self.db.execute(order_stmt)).scalar_one_or_none()
                if order is None:
                    await self.db.rollback()
                    raise PaymentContractError(
                        404, "order_not_found", "Order not found."
                    )
                if not is_admin and order.user_id != user_id:
                    await self.db.rollback()
                    raise PaymentContractError(
                        403, "order_access_denied", "Access denied for this order."
                    )

                att_stmt = self._with_for_update_if_supported(
                    self._attempt_query().where(
                        PaymentAttempt.id == attempt_id,
                        PaymentAttempt.order_id == order_id,
                    )
                )
                attempt = (await self.db.execute(att_stmt)).scalar_one_or_none()
                if attempt is None:
                    await self.db.rollback()
                    raise PaymentContractError(
                        404,
                        "payment_attempt_not_found",
                        "Payment attempt not found for this order.",
                    )

                if attempt.status == "succeeded":
                    await self.db.rollback()
                    raise PaymentContractError(
                        409,
                        "cannot_cancel_succeeded_attempt",
                        "Succeeded payment attempts cannot be cancelled.",
                    )

                if attempt.status in (
                    "cancelled",
                    "expired",
                    "failed",
                    "reconciliation_required",
                ):
                    await self.db.commit()
                    return await self._reload_and_serialize(
                        attempt_id, order_id, include_sandbox_token=False
                    )

                await self._lock_attempt_resources_in_canonical_order(
                    attempt, order.promo_code
                )
                if ensure_utc(attempt.expires_at) <= now_utc:  # type: ignore[operator]
                    self._expire_attempt_in_tx(attempt, now_utc)
                else:
                    self._release_attempt_reservations_in_tx(attempt, now_utc)
                    attempt.status = "cancelled"
                    attempt.active_order_key = None
                    attempt.settled_order_key = None
                    attempt.failure_code = "attempt_cancelled"
                    attempt.failure_reason = (
                        reason or "Payment attempt cancelled by user."
                    )
                    attempt.completed_at = now_utc

                await self.db.commit()
                return await self._reload_and_serialize(
                    attempt_id, order_id, include_sandbox_token=False
                )

            except PaymentContractError:
                raise
            except OperationalError as op_err:
                await self.db.rollback()
                if (
                    "database is locked" in str(op_err).lower()
                    and retry_idx < self.MAX_LOCK_RETRIES - 1
                ):
                    await asyncio.sleep(0.02 * (retry_idx + 1))
                    continue
                raise
            except Exception:
                await self.db.rollback()
                raise

        raise PaymentContractError(
            503, "payment_cancel_busy", "Unable to cancel payment attempt; please retry."
        )

    async def resolve_sandbox_attempt(
        self,
        current_user: User,
        order_id: int,
        attempt_id: int,
        payload: SandboxResolveRequest,
    ) -> PaymentAttemptResponse:
        if not self.settings.is_sandbox_payment_active or self.adapter is None:
            raise PaymentContractError(
                503,
                "payment_provider_unavailable",
                "Sandbox payment resolution is disabled.",
            )

        user_id = int(current_user.id)

        # Short pre-verification read & token validation (never holding DB tx across adapter call)
        order = (
            await self.db.execute(select(Order).where(Order.id == order_id))
        ).scalar_one_or_none()
        if order is None:
            await self.db.rollback()
            raise PaymentContractError(404, "order_not_found", "Order not found.")
        if order.user_id != user_id:
            await self.db.rollback()
            raise PaymentContractError(
                403, "order_access_denied", "Access denied for this order."
            )

        attempt = (
            await self.db.execute(
                select(PaymentAttempt).where(
                    PaymentAttempt.id == attempt_id,
                    PaymentAttempt.order_id == order_id,
                )
            )
        ).scalar_one_or_none()
        if attempt is None:
            await self.db.rollback()
            raise PaymentContractError(
                404,
                "payment_attempt_not_found",
                "Payment attempt not found for this order.",
            )

        if attempt.provider != "sandbox":
            await self.db.rollback()
            raise PaymentContractError(
                409,
                "invalid_attempt_provider",
                "Payment attempt does not belong to the sandbox provider.",
            )

        if not verify_sandbox_token(
            self.settings,
            provided_token=payload.sandbox_token,
            attempt_number=str(attempt.attempt_number),
            order_id=int(attempt.order_id),
            user_id=int(attempt.user_id),
            amount_toman=int(attempt.amount_toman),
            sandbox_nonce=attempt.sandbox_nonce,
        ):
            await self.db.rollback()
            raise PaymentContractError(
                403,
                "invalid_sandbox_token",
                "Invalid sandbox verification token.",
            )

        ver_req = GatewayVerificationRequest(
            attempt_id=int(attempt.id),
            attempt_number=str(attempt.attempt_number),
            order_id=int(order.id),
            order_number=str(order.order_number),
            user_id=user_id,
            expected_amount_toman=int(attempt.amount_toman),
            currency_unit=str(attempt.currency_unit),
            provider_authority=attempt.provider_authority,
            requested_outcome=payload.outcome,
            requested_failure_code=payload.failure_code,
        )
        # Close read transaction before calling adapter
        await self.db.rollback()

        ver_result = await self.adapter.verify_attempt(ver_req)
        return await self.apply_verification_result(
            order_id=order_id,
            attempt_id=attempt_id,
            verification=ver_result,
        )

    async def apply_verification_result(
        self,
        *,
        order_id: int,
        attempt_id: int,
        verification: GatewayVerificationResult,
    ) -> PaymentAttemptResponse:
        """
        Single authoritative server-side settlement/finalization transaction.
        Enforces canonical lock ordering, strict amount/order/TTL validation,
        one-time inventory & discount consumption, and idempotent replay safety.
        """
        for retry_idx in range(self.MAX_LOCK_RETRIES):
            try:
                if self.db.in_transaction():
                    await self.db.rollback()
                await self._begin_write_critical_section()
                now_utc = self._now()

                order_stmt = self._with_for_update_if_supported(
                    select(Order).where(Order.id == order_id)
                )
                order = (await self.db.execute(order_stmt)).scalar_one_or_none()
                if order is None:
                    await self.db.rollback()
                    raise PaymentContractError(
                        404, "order_not_found", "Order not found."
                    )

                att_stmt = self._with_for_update_if_supported(
                    self._attempt_query().where(
                        PaymentAttempt.id == attempt_id,
                        PaymentAttempt.order_id == order_id,
                    )
                )
                attempt = (await self.db.execute(att_stmt)).scalar_one_or_none()
                if attempt is None:
                    await self.db.rollback()
                    raise PaymentContractError(
                        404,
                        "payment_attempt_not_found",
                        "Payment attempt not found for this order.",
                    )

                # 1. Terminal attempt handling (idempotent replay vs contradictory outcome vs late capture)
                if attempt.status == "succeeded":
                    if verification.outcome == "succeeded":
                        if (
                            verification.provider_transaction_id
                            and attempt.provider_transaction_id
                            and verification.provider_transaction_id
                            != attempt.provider_transaction_id
                        ):
                            await self.db.rollback()
                            raise PaymentContractError(
                                409,
                                "attempt_already_terminal",
                                "Payment attempt already settled with a different transaction reference.",
                            )
                        await self.db.commit()
                        return await self._reload_and_serialize(
                            attempt_id, order_id, include_sandbox_token=False
                        )
                    await self.db.rollback()
                    raise PaymentContractError(
                        409,
                        "attempt_already_terminal",
                        "Payment attempt has already succeeded and cannot change outcome.",
                    )

                if attempt.status in (
                    "failed",
                    "expired",
                    "cancelled",
                    "reconciliation_required",
                ):
                    if (
                        verification.outcome == "succeeded"
                        and verification.funds_captured_hint
                    ):
                        prev_status = attempt.status
                        attempt.status = "reconciliation_required"
                        attempt.active_order_key = None
                        attempt.settled_order_key = None
                        if (
                            verification.provider_transaction_id
                            and not attempt.provider_transaction_id
                        ):
                            attempt.provider_transaction_id = (
                                verification.provider_transaction_id
                            )
                        attempt.failure_code = f"late_capture_after_{prev_status}"
                        attempt.failure_reason = (
                            f"Capture reported after attempt was '{prev_status}'; "
                            "manual financial reconciliation is required."
                        )
                        attempt.completed_at = attempt.completed_at or now_utc
                        await self.db.commit()
                        raise PaymentContractError(
                            409,
                            "reconciliation_required",
                            "Capture reported on a terminated attempt; marked for financial reconciliation.",
                        )
                    term_st = str(attempt.status)
                    await self.db.rollback()
                    raise PaymentContractError(
                        409,
                        "attempt_already_terminal",
                        f"Payment attempt is already terminal ('{term_st}').",
                    )

                # Lock Product and Discount rows in canonical order
                locked_products, locked_discount = (
                    await self._lock_attempt_resources_in_canonical_order(
                        attempt, order.promo_code
                    )
                )

                # 2. Check if parent order was cancelled or already paid before settling
                if (
                    order.status != "pending_payment"
                    or order.payment_status != "pending"
                ):
                    self._release_attempt_reservations_in_tx(attempt, now_utc)
                    attempt.active_order_key = None
                    attempt.settled_order_key = None
                    attempt.completed_at = now_utc
                    if (
                        verification.outcome == "succeeded"
                        and verification.funds_captured_hint
                    ):
                        attempt.status = "reconciliation_required"
                        attempt.provider_transaction_id = (
                            verification.provider_transaction_id
                        )
                        attempt.failure_code = "order_not_payable_reconciliation"
                        attempt.failure_reason = (
                            "Capture reported after order left pending_payment; "
                            "manual reconciliation required."
                        )
                        await self.db.commit()
                        raise PaymentContractError(
                            409,
                            "reconciliation_required",
                            "Order is no longer payable; payment marked for reconciliation.",
                        )

                    attempt.status = (
                        "cancelled" if order.status == "cancelled" else "failed"
                    )
                    attempt.failure_code = "late_result_order_not_payable"
                    attempt.failure_reason = (
                        f"Order status is '{order.status}' (payment '{order.payment_status}')."
                    )
                    await self.db.commit()
                    raise PaymentContractError(
                        409,
                        "late_payment_rejected",
                        "Order is no longer payable; late payment result rejected.",
                    )

                # 3. Check reservation TTL expiry
                if ensure_utc(attempt.expires_at) <= now_utc:  # type: ignore[operator]
                    if (
                        verification.outcome == "succeeded"
                        and verification.funds_captured_hint
                    ):
                        self._expire_attempt_in_tx(attempt, now_utc)
                        attempt.status = "reconciliation_required"
                        attempt.provider_transaction_id = (
                            verification.provider_transaction_id
                        )
                        attempt.failure_code = "late_capture_after_expiry"
                        attempt.failure_reason = (
                            "Capture reported after reservation TTL expired; "
                            "manual reconciliation required."
                        )
                        await self.db.commit()
                        raise PaymentContractError(
                            409,
                            "reconciliation_required",
                            "Reservation expired before capture verification; marked for reconciliation.",
                        )

                    self._expire_attempt_in_tx(
                        attempt,
                        now_utc,
                        failure_code=(
                            "late_result_after_expiry"
                            if verification.outcome == "succeeded"
                            else "attempt_expired"
                        ),
                        failure_reason="Payment reservation window expired before completion.",
                    )
                    await self.db.commit()
                    raise PaymentContractError(
                        409,
                        "late_payment_rejected",
                        "Payment attempt expired before resolution.",
                    )

                # 4. Handle indeterminate timeout (keep reservation active until TTL, never mark paid)
                if verification.outcome == "indeterminate_timeout":
                    attempt.status = "pending"
                    attempt.failure_code = (
                        verification.failure_code or "verification_timeout"
                    )
                    attempt.failure_reason = (
                        verification.failure_reason
                        or "Verification timed out without confirmation."
                    )
                    await self.db.commit()
                    raise PaymentContractError(
                        504,
                        "gateway_verification_timeout",
                        "Payment verification timed out; reservation remains active until expiry.",
                    )

                # 5. Handle definitive failure (immediately release inventory & discount reservations)
                if verification.outcome == "failed":
                    self._release_attempt_reservations_in_tx(attempt, now_utc)
                    attempt.status = "failed"
                    attempt.active_order_key = None
                    attempt.settled_order_key = None
                    attempt.failure_code = (
                        verification.failure_code or "payment_failed"
                    )
                    attempt.failure_reason = (
                        verification.failure_reason or "Payment attempt failed."
                    )
                    attempt.completed_at = now_utc
                    await self.db.commit()
                    return await self._reload_and_serialize(
                        attempt_id, order_id, include_sandbox_token=False
                    )

                # 6. Verified succeeded outcome -> validate authoritative server amount, currency, & txn ref
                expected_amount = int(order.total_toman)
                if (
                    int(attempt.amount_toman) != expected_amount
                    or verification.verified_amount_toman != expected_amount
                    or verification.currency_unit != "toman"
                    or not verification.provider_transaction_id
                ):
                    self._release_attempt_reservations_in_tx(attempt, now_utc)
                    attempt.active_order_key = None
                    attempt.settled_order_key = None
                    attempt.completed_at = now_utc
                    if verification.funds_captured_hint:
                        attempt.status = "reconciliation_required"
                        attempt.provider_transaction_id = (
                            verification.provider_transaction_id
                        )
                        attempt.failure_code = "amount_mismatch_reconciliation"
                        attempt.failure_reason = (
                            "Verified payment metadata did not match authoritative order total."
                        )
                        await self.db.commit()
                        raise PaymentContractError(
                            409,
                            "reconciliation_required",
                            "Verified payment metadata mismatch; marked for reconciliation.",
                        )
                    attempt.status = "failed"
                    attempt.failure_code = "amount_mismatch"
                    attempt.failure_reason = (
                        "Verified payment amount or metadata did not match server order."
                    )
                    await self.db.commit()
                    raise PaymentContractError(
                        409,
                        "amount_mismatch",
                        "Verified payment amount did not match authoritative order total.",
                    )

                # 7. Consume active inventory reservations & conditionally deduct Product.stock_quantity
                inv_rows = sorted(
                    list(attempt.inventory_reservations or []),
                    key=lambda r: r.product_id,
                )
                if not inv_rows or any(
                    r.status != "active" or ensure_utc(r.expires_at) <= now_utc  # type: ignore[operator]
                    for r in inv_rows
                ):
                    await self.db.rollback()
                    raise PaymentContractError(
                        409,
                        "invalid_reservation_state",
                        "Inventory reservations are no longer active for settlement.",
                    )

                for res_row in inv_rows:
                    prod = locked_products.get(res_row.product_id)
                    if prod is None or int(prod.stock_quantity) < int(res_row.quantity):
                        await self.db.rollback()
                        raise PaymentContractError(
                            409,
                            "insufficient_available_stock",
                            "Physical stock is insufficient to settle reservation.",
                        )

                    dec_res = await self.db.execute(
                        update(Product)
                        .where(
                            Product.id == res_row.product_id,
                            Product.stock_quantity >= res_row.quantity,
                        )
                        .values(
                            stock_quantity=Product.stock_quantity - res_row.quantity,
                            in_stock=case(
                                (
                                    Product.stock_quantity - res_row.quantity > 0,
                                    True,
                                ),
                                else_=False,
                            ),
                        )
                    )
                    if dec_res.rowcount != 1:
                        await self.db.rollback()
                        raise PaymentContractError(
                            409,
                            "insufficient_available_stock",
                            "Concurrent physical stock conflict during settlement.",
                        )

                    res_row.status = "consumed"
                    res_row.consumed_at = now_utc

                # 8. Consume discount reservation & record single DiscountUsage if applicable
                if order.promo_code and order.promo_code.strip():
                    disc_res = attempt.discount_reservation
                    if (
                        disc_res is None
                        or disc_res.status != "active"
                        or ensure_utc(disc_res.expires_at) <= now_utc  # type: ignore[operator]
                        or locked_discount is None
                    ):
                        await self.db.rollback()
                        raise PaymentContractError(
                            409,
                            "promo_reservation_invalid",
                            "Discount reservation is no longer valid for settlement.",
                        )

                    existing_usage_id = (
                        await self.db.execute(
                            select(DiscountUsage.id)
                            .where(DiscountUsage.order_id == order.id)
                            .limit(1)
                        )
                    ).scalar_one_or_none()
                    if existing_usage_id is not None:
                        await self.db.rollback()
                        raise PaymentContractError(
                            409,
                            "promo_already_consumed",
                            "Discount has already been consumed for this order.",
                        )

                    inc_res = await self.db.execute(
                        update(Discount)
                        .where(
                            Discount.id == locked_discount.id,
                            Discount.is_active.is_(True),
                            or_(
                                Discount.usage_limit.is_(None),
                                Discount.used_count < Discount.usage_limit,
                            ),
                        )
                        .values(used_count=Discount.used_count + 1)
                    )
                    if inc_res.rowcount != 1:
                        await self.db.rollback()
                        raise PaymentContractError(
                            409,
                            "promo_capacity_exhausted",
                            "Discount usage limit reached prior to settlement.",
                        )

                    disc_res.status = "consumed"
                    disc_res.active_order_key = None
                    disc_res.settled_order_key = order.id
                    disc_res.consumed_at = now_utc

                    self.db.add(
                        DiscountUsage(
                            discount_id=locked_discount.id,
                            user_id=int(order.user_id),  # type: ignore[arg-type]
                            order_id=order.id,
                        )
                    )

                # 9. Finalize PaymentAttempt, Order, and single OrderStatusHistory atomically
                txn_ref = str(verification.provider_transaction_id)
                attempt.status = "succeeded"
                attempt.active_order_key = None
                attempt.settled_order_key = order.id
                attempt.provider_transaction_id = txn_ref
                attempt.failure_code = None
                attempt.failure_reason = None
                attempt.verified_at = now_utc
                attempt.completed_at = now_utc

                order.payment_status = "paid"
                order.payment_reference = txn_ref
                order.status = "processing"
                self.db.add(
                    OrderStatusHistory(
                        order_id=order.id,
                        status="processing",
                        note=f"Payment verified ({attempt.attempt_number})",
                    )
                )

                await self.db.commit()
                return await self._reload_and_serialize(
                    attempt_id, order_id, include_sandbox_token=False
                )

            except PaymentContractError:
                raise
            except IntegrityError:
                await self.db.rollback()
                # Check if an identical concurrent settlement just committed on this attempt
                settled_attempt = (
                    await self.db.execute(
                        self._attempt_query().where(
                            PaymentAttempt.id == attempt_id,
                            PaymentAttempt.order_id == order_id,
                        )
                    )
                ).scalar_one_or_none()
                if (
                    settled_attempt is not None
                    and settled_attempt.status == "succeeded"
                    and verification.outcome == "succeeded"
                ):
                    return await self._reload_and_serialize(
                        attempt_id, order_id, include_sandbox_token=False
                    )
                if self.db.in_transaction():
                    await self.db.rollback()
                raise PaymentContractError(
                    409,
                    "settlement_conflict",
                    "Concurrent payment settlement conflict.",
                )
            except OperationalError as op_err:
                await self.db.rollback()
                if (
                    "database is locked" in str(op_err).lower()
                    and retry_idx < self.MAX_LOCK_RETRIES - 1
                ):
                    await asyncio.sleep(0.02 * (retry_idx + 1))
                    continue
                raise
            except Exception:
                await self.db.rollback()
                raise

        raise PaymentContractError(
            503, "payment_settlement_busy", "Payment settlement is temporarily busy."
        )
