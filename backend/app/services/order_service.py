import asyncio
from datetime import datetime, timezone
import hashlib
import json
from typing import Dict, List, Optional, Sequence
import uuid

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.cart import CartItem
from app.models.order import (
    Order,
    OrderIdempotencyRecord,
    OrderItem,
    OrderStatusHistory,
)
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate
from app.services.cart_service import CartService


def _compute_payload_hash(payload: OrderCreate) -> str:
    canonical = {
        "customer_name": (payload.customer_name or "").strip(),
        "customer_phone": (payload.customer_phone or "").strip(),
        "shipping_address": (payload.shipping_address or "").strip(),
        "postal_code": (payload.postal_code or "").strip(),
        "notes": (payload.notes or "").strip(),
        "promo_code": (payload.promo_code or "").strip().upper(),
    }
    encoded = json.dumps(canonical, sort_keys=True, separators=(",", ":")).encode(
        "utf-8"
    )
    return hashlib.sha256(encoded).hexdigest()


def _compute_cart_hash(cart_rows: Sequence[CartItem]) -> str:
    entries = []
    for row in cart_rows:
        color_id = ""
        if isinstance(row.selected_color, dict):
            color_id = str(row.selected_color.get("id") or "").strip().lower()
        edition_id = str(row.selected_edition or "").strip()
        entries.append((int(row.product_id), int(row.quantity), color_id, edition_id))
    entries.sort()
    encoded = json.dumps(entries, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


class OrderService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def _order_query(self):
        return select(Order).options(
            selectinload(Order.items),
            selectinload(Order.status_history),
        )

    async def _load_user_cart_rows(self, user_id: int) -> List[CartItem]:
        stmt = (
            select(CartItem)
            .options(
                selectinload(CartItem.product).selectinload(Product.images),
            )
            .where(CartItem.user_id == user_id)
            .order_by(CartItem.id.asc())
        )
        return list((await self.db.execute(stmt)).scalars().all())

    async def _resolve_existing_idempotent_order(
        self,
        user_id: int,
        cleaned_key: str,
        payload_hash: str,
    ) -> Optional[OrderResponse]:
        rec = (
            await self.db.execute(
                select(OrderIdempotencyRecord).where(
                    OrderIdempotencyRecord.user_id == user_id,
                    OrderIdempotencyRecord.idempotency_key == cleaned_key,
                )
            )
        ).scalar_one_or_none()
        if not rec:
            return None

        if rec.payload_hash != payload_hash:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Idempotency-Key has already been used with different checkout details",
            )

        # If the user refilled their cart with different items after the original order
        # completed and attempted to reuse an old Idempotency-Key, reject with 409 Conflict.
        current_cart_rows = await self._load_user_cart_rows(user_id)
        if current_cart_rows:
            current_cart_hash = _compute_cart_hash(current_cart_rows)
            if current_cart_hash != rec.cart_hash:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Idempotency-Key has already been used for a different cart",
                )

        loaded = (
            await self.db.execute(
                self._order_query().where(Order.id == rec.order_id)
            )
        ).scalar_one_or_none()
        if not loaded:
            return None
        return OrderResponse.model_validate(loaded)

    async def create_order(
        self,
        user: User,
        payload: OrderCreate,
        idempotency_key: Optional[str] = None,
    ) -> OrderResponse:
        cleaned_key: Optional[str] = None
        if idempotency_key is not None:
            cleaned_key = idempotency_key.strip()
            if not cleaned_key or len(cleaned_key) > 128:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Idempotency-Key must be between 1 and 128 non-whitespace characters",
                )

        user_id = int(user.id)
        user_phone = user.phone
        payload_hash = _compute_payload_hash(payload)

        # Retry loop handles SQLite concurrent read-to-write lock upgrades cleanly
        max_attempts = 6
        for attempt in range(max_attempts):
            try:
                if cleaned_key:
                    existing = await self._resolve_existing_idempotent_order(
                        user_id, cleaned_key, payload_hash
                    )
                    if existing is not None:
                        return existing

                cart_rows = await self._load_user_cart_rows(user_id)
                if not cart_rows:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Cannot place an order with an empty cart",
                    )

                cart_service = CartService(self.db)
                cart_hash = _compute_cart_hash(cart_rows)

                # Accumulate cumulative product quantities across all cart rows
                cumulative_qty: Dict[int, int] = {}
                validated_lines: list[
                    tuple[Product, int, Optional[dict], Optional[str]]
                ] = []

                for row in cart_rows:
                    prod = row.product
                    if not prod or not prod.is_active:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="One or more cart items are no longer available",
                        )
                    if row.quantity < 1 or row.quantity > 50:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Invalid quantity for '{prod.name}'",
                        )

                    validated_color = cart_service._resolve_validated_color(
                        prod, row.selected_color
                    )
                    validated_edition = cart_service._resolve_validated_edition(
                        prod, row.selected_edition
                    )

                    cumulative_qty[prod.id] = (
                        cumulative_qty.get(prod.id, 0) + row.quantity
                    )
                    if (
                        not prod.in_stock
                        or prod.stock_quantity < cumulative_qty[prod.id]
                    ):
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Insufficient stock for '{prod.name}'",
                        )

                    validated_lines.append(
                        (prod, row.quantity, validated_color, validated_edition)
                    )

                subtotal_usd = 0.0
                subtotal_toman = 0
                built_items: list[OrderItem] = []

                for prod, qty, color_obj, validated_ed in validated_lines:
                    unit_usd, unit_toman = cart_service._compute_unit_prices(
                        prod, validated_ed
                    )
                    subtotal_usd += unit_usd * qty
                    subtotal_toman += unit_toman * qty

                    primary_img = prod.images[0].url if prod.images else None
                    built_items.append(
                        OrderItem(
                            product_id=prod.id,
                            product_name=prod.name,
                            product_name_fa=prod.name_fa,
                            product_image=primary_img,
                            color_name=(color_obj or {}).get("name"),
                            color_name_fa=(color_obj or {}).get("name_fa"),
                            edition=validated_ed,
                            quantity=qty,
                            unit_price=unit_usd,
                            unit_price_toman=unit_toman,
                        )
                    )

                subtotal_usd = round(subtotal_usd, 2)
                discount_usd = 0.0
                discount_toman = 0
                discount_model = None

                if payload.promo_code:
                    discount_model = await cart_service.validate_discount(
                        payload.promo_code, subtotal_usd
                    )
                    if discount_model:
                        raw_discount_usd = round(
                            subtotal_usd * (discount_model.discount_percent / 100.0),
                            2,
                        )
                        if (
                            discount_model.max_discount_amount is not None
                            and discount_model.max_discount_amount > 0
                            and raw_discount_usd > discount_model.max_discount_amount
                        ):
                            discount_usd = min(
                                subtotal_usd,
                                round(float(discount_model.max_discount_amount), 2),
                            )
                            if subtotal_usd > 0:
                                capped_ratio = discount_usd / subtotal_usd
                                discount_toman = min(
                                    subtotal_toman,
                                    int(round(subtotal_toman * capped_ratio)),
                                )
                            else:
                                discount_toman = 0
                        else:
                            discount_usd = min(subtotal_usd, raw_discount_usd)
                            discount_toman = min(
                                subtotal_toman,
                                int(
                                    round(
                                        subtotal_toman
                                        * (discount_model.discount_percent / 100.0)
                                    )
                                ),
                            )

                total_usd = round(max(0.0, subtotal_usd - discount_usd), 2)
                total_toman = max(0, subtotal_toman - discount_toman)

                year = datetime.now(timezone.utc).year
                order_number = f"ARU-{year}-{uuid.uuid4().hex[:8].upper()}"

                # P0-C2 safe pending-payment state:
                # no payment gateway call, no stock deduction, no promo usage increment,
                # no loyalty points award, and no paid confirmation email.
                order = Order(
                    order_number=order_number,
                    user_id=user_id,
                    status="pending_payment",
                    payment_status="pending",
                    payment_reference=None,
                    subtotal=subtotal_usd,
                    discount_amount=discount_usd,
                    shipping_cost=0.0,
                    total=total_usd,
                    total_toman=total_toman,
                    promo_code=discount_model.code if discount_model else None,
                    customer_name=payload.customer_name,
                    customer_phone=payload.customer_phone or user_phone,
                    shipping_address=payload.shipping_address,
                    postal_code=payload.postal_code,
                    notes=payload.notes,
                )
                order.items.extend(built_items)
                order.status_history.append(
                    OrderStatusHistory(
                        status="pending_payment",
                        note="Order saved with pending payment. Payment processing is unavailable and inventory is not reserved.",
                    )
                )

                self.db.add(order)
                await self.db.flush()

                if cleaned_key:
                    self.db.add(
                        OrderIdempotencyRecord(
                            user_id=user_id,
                            idempotency_key=cleaned_key,
                            payload_hash=payload_hash,
                            cart_hash=cart_hash,
                            order_id=order.id,
                        )
                    )
                    await self.db.flush()

                # Clear cart inside the SAME database transaction (never calling a helper that commits separately)
                await self.db.execute(
                    delete(CartItem).where(CartItem.user_id == user_id)
                )
                await self.db.commit()

                loaded = (
                    await self.db.execute(
                        self._order_query().where(Order.id == order.id)
                    )
                ).scalar_one()
                return OrderResponse.model_validate(loaded)

            except IntegrityError:
                await self.db.rollback()
                if cleaned_key:
                    for _ in range(4):
                        existing = await self._resolve_existing_idempotent_order(
                            user_id, cleaned_key, payload_hash
                        )
                        if existing is not None:
                            return existing
                        await asyncio.sleep(0.02)
                if attempt < max_attempts - 1:
                    await asyncio.sleep(0.02 * (attempt + 1))
                    continue
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Concurrent order submission conflict; please retry",
                )
            except OperationalError as op_err:
                await self.db.rollback()
                if (
                    "database is locked" in str(op_err).lower()
                    and attempt < max_attempts - 1
                ):
                    await asyncio.sleep(0.025 * (attempt + 1))
                    continue
                raise
            except Exception:
                await self.db.rollback()
                raise

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Order submission temporarily busy; please retry",
        )

    async def list_user_orders(self, user_id: int) -> List[OrderResponse]:
        stmt = (
            self._order_query()
            .where(Order.user_id == user_id)
            .order_by(Order.created_at.desc(), Order.id.desc())
        )
        rows = (await self.db.execute(stmt)).scalars().all()
        return [OrderResponse.model_validate(o) for o in rows]

    async def list_all_orders(self) -> List[OrderResponse]:
        stmt = self._order_query().order_by(Order.created_at.desc(), Order.id.desc())
        rows = (await self.db.execute(stmt)).scalars().all()
        return [OrderResponse.model_validate(o) for o in rows]

    async def get_order(
        self, order_id: int, current_user: User
    ) -> OrderResponse:
        loaded = (
            await self.db.execute(self._order_query().where(Order.id == order_id))
        ).scalar_one_or_none()
        if not loaded:
            raise HTTPException(status_code=404, detail="Order not found")
        if not current_user.is_admin and loaded.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        return OrderResponse.model_validate(loaded)

    async def update_order_status(
        self, order_id: int, payload: OrderStatusUpdate
    ) -> OrderResponse:
        loaded = (
            await self.db.execute(self._order_query().where(Order.id == order_id))
        ).scalar_one_or_none()
        if not loaded:
            raise HTTPException(status_code=404, detail="Order not found")
        loaded.status = payload.status
        loaded.status_history.append(
            OrderStatusHistory(
                status=payload.status,
                note=payload.note or f"Status updated to {payload.status}",
            )
        )
        await self.db.commit()
        refreshed = (
            await self.db.execute(self._order_query().where(Order.id == order_id))
        ).scalar_one()
        return OrderResponse.model_validate(refreshed)
