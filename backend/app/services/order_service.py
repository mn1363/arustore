from datetime import datetime, timezone
import random
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.cart import CartItem
from app.models.discount import DiscountUsage
from app.models.order import Order, OrderItem, OrderStatusHistory
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate
from app.services.cart_service import CartService
from app.services.payment_service import PaymentService
from app.tasks.email_tasks import send_order_confirmation_email_task


class OrderService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.payment_service = PaymentService()

    def _order_query(self):
        return select(Order).options(
            selectinload(Order.items),
            selectinload(Order.status_history),
        )

    async def create_order(
        self, user: User, payload: OrderCreate
    ) -> OrderResponse:
        cart_service = CartService(self.db)
        order_lines: list[tuple[Product, int, Optional[dict], Optional[str]]] = []
        used_user_cart = False

        if payload.items and len(payload.items) > 0:
            for req_item in payload.items:
                prod = (
                    await self.db.execute(
                        select(Product)
                        .options(selectinload(Product.images))
                        .where(Product.id == req_item.product_id, Product.is_active.is_(True))
                    )
                ).scalar_one_or_none()
                if not prod:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Product {req_item.product_id} not found",
                    )
                order_lines.append(
                    (
                        prod,
                        req_item.quantity,
                        req_item.selected_color,
                        req_item.selected_edition,
                    )
                )
        else:
            used_user_cart = True
            cart_rows = (
                await self.db.execute(
                    select(CartItem)
                    .options(
                        selectinload(CartItem.product).selectinload(Product.images)
                    )
                    .where(CartItem.user_id == user.id)
                )
            ).scalars().all()
            if not cart_rows:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot place an order with an empty cart",
                )
            for row in cart_rows:
                if row.product and row.product.is_active:
                    order_lines.append(
                        (
                            row.product,
                            row.quantity,
                            row.selected_color,
                            row.selected_edition,
                        )
                    )

        if not order_lines:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid items in order",
            )

        subtotal_usd = 0.0
        subtotal_toman = 0
        built_items: list[OrderItem] = []

        for prod, qty, sel_color, sel_ed in order_lines:
            if not prod.in_stock or prod.stock_quantity < qty:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for '{prod.name}'",
                )
            unit_usd, unit_toman = cart_service._compute_unit_prices(prod, sel_ed)
            subtotal_usd += unit_usd * qty
            subtotal_toman += unit_toman * qty

            # Decrement inventory
            prod.stock_quantity -= qty
            prod.in_stock = prod.stock_quantity > 0

            color_obj = sel_color or (prod.colors[0] if prod.colors else {})
            primary_img = prod.images[0].url if prod.images else None

            built_items.append(
                OrderItem(
                    product_id=prod.id,
                    product_name=prod.name,
                    product_name_fa=prod.name_fa,
                    product_image=primary_img,
                    color_name=color_obj.get("name"),
                    color_name_fa=color_obj.get("name_fa"),
                    edition=sel_ed,
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
                discount_usd = round(
                    subtotal_usd * (discount_model.discount_percent / 100.0), 2
                )
                if (
                    discount_model.max_discount_amount
                    and discount_usd > discount_model.max_discount_amount
                ):
                    discount_usd = round(discount_model.max_discount_amount, 2)
                discount_toman = int(
                    round(subtotal_toman * (discount_model.discount_percent / 100.0))
                )

        total_usd = round(max(0.0, subtotal_usd - discount_usd), 2)
        total_toman = max(0, subtotal_toman - discount_toman)

        year = datetime.now(timezone.utc).year
        order_number = f"ARU-{year}-{random.randint(10000, 99999)}"
        payment_tx = self.payment_service.initiate_transaction(order_number, total_toman)

        order = Order(
            order_number=order_number,
            user_id=user.id,
            status="processing",
            payment_status="paid",
            payment_reference=str(payment_tx["authority"]),
            subtotal=subtotal_usd,
            discount_amount=discount_usd,
            shipping_cost=0.0,
            total=total_usd,
            total_toman=total_toman,
            promo_code=discount_model.code if discount_model else None,
            customer_name=payload.customer_name,
            customer_phone=payload.customer_phone or user.phone,
            shipping_address=payload.shipping_address,
            postal_code=payload.postal_code,
            notes=payload.notes,
        )
        order.items.extend(built_items)
        order.status_history.append(
            OrderStatusHistory(
                status="processing",
                note="Order confirmed and queued for quality inspection.",
            )
        )

        self.db.add(order)
        await self.db.flush()

        if discount_model:
            discount_model.used_count += 1
            self.db.add(
                DiscountUsage(
                    discount_id=discount_model.id,
                    user_id=user.id,
                    order_id=order.id,
                )
            )

        user.loyalty_points = (user.loyalty_points or 0) + max(10, int(total_usd))
        if used_user_cart:
            await cart_service.clear_cart(user.id)
        else:
            await self.db.commit()

        try:
            send_order_confirmation_email_task.delay(
                user.email, order.order_number, order.total_toman
            )
        except Exception:
            pass

        loaded = (
            await self.db.execute(self._order_query().where(Order.id == order.id))
        ).scalar_one()
        return OrderResponse.model_validate(loaded)

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
