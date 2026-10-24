from datetime import datetime, timezone
from typing import Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.cart import CartItem
from app.models.discount import Discount
from app.models.product import Product
from app.schemas.cart import CartItemCreate, CartItemResponse, CartSummaryResponse
from app.services.product_service import serialize_product_model


class CartService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def _compute_unit_prices(
        self, product: Product, selected_edition: Optional[str]
    ) -> Tuple[float, int]:
        unit_usd = float(product.price)
        unit_toman = int(product.price_toman)
        if selected_edition and product.editions:
            for ed in product.editions:
                if ed.get("id") == selected_edition:
                    unit_usd += float(ed.get("priceDelta", 0.0))
                    unit_toman += int(ed.get("priceDeltaToman", 0))
                    break
        return round(unit_usd, 2), unit_toman

    async def validate_discount(
        self, code: Optional[str], subtotal: float
    ) -> Optional[Discount]:
        if not code:
            return None
        cleaned = code.strip().upper()
        stmt = select(Discount).where(
            Discount.code == cleaned, Discount.is_active.is_(True)
        )
        discount = (await self.db.execute(stmt)).scalar_one_or_none()
        if not discount:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid or inactive promo code",
            )
        if discount.expires_at and discount.expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Promo code has expired",
            )
        if discount.usage_limit is not None and discount.used_count >= discount.usage_limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Promo code usage limit reached",
            )
        if subtotal < discount.min_order_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Minimum order amount for {cleaned} is {discount.min_order_amount}",
            )
        return discount

    async def get_cart_summary(
        self, user_id: int, promo_code: Optional[str] = None
    ) -> CartSummaryResponse:
        stmt = (
            select(CartItem)
            .options(
                selectinload(CartItem.product).selectinload(Product.images),
                selectinload(CartItem.product).selectinload(Product.brand),
                selectinload(CartItem.product).selectinload(Product.primary_category),
            )
            .where(CartItem.user_id == user_id)
            .order_by(CartItem.id.asc())
        )
        rows = (await self.db.execute(stmt)).scalars().all()

        items_out: list[CartItemResponse] = []
        subtotal_usd = 0.0
        subtotal_toman = 0
        item_count = 0

        for row in rows:
            if not row.product or not row.product.is_active:
                continue
            unit_usd, unit_toman = self._compute_unit_prices(
                row.product, row.selected_edition
            )
            line_usd = round(unit_usd * row.quantity, 2)
            line_toman = unit_toman * row.quantity
            subtotal_usd += line_usd
            subtotal_toman += line_toman
            item_count += row.quantity

            items_out.append(
                CartItemResponse(
                    id=row.id,
                    product_id=row.product_id,
                    quantity=row.quantity,
                    selected_color=row.selected_color,
                    selected_edition=row.selected_edition,
                    unit_price=unit_usd,
                    unit_price_toman=unit_toman,
                    line_total=line_usd,
                    line_total_toman=line_toman,
                    product=serialize_product_model(row.product),
                )
            )

        subtotal_usd = round(subtotal_usd, 2)
        discount_usd = 0.0
        discount_toman = 0
        applied_code: Optional[str] = None
        promo_percent = 0.0

        if promo_code and subtotal_usd > 0:
            discount = await self.validate_discount(promo_code, subtotal_usd)
            if discount:
                applied_code = discount.code
                promo_percent = discount.discount_percent
                discount_usd = round(subtotal_usd * (promo_percent / 100.0), 2)
                if discount.max_discount_amount and discount_usd > discount.max_discount_amount:
                    discount_usd = round(discount.max_discount_amount, 2)
                discount_toman = int(round(subtotal_toman * (promo_percent / 100.0)))

        return CartSummaryResponse(
            items=items_out,
            item_count=item_count,
            subtotal=subtotal_usd,
            subtotal_toman=subtotal_toman,
            discount_amount=discount_usd,
            discount_toman=discount_toman,
            total=round(max(0.0, subtotal_usd - discount_usd), 2),
            total_toman=max(0, subtotal_toman - discount_toman),
            promo_code=applied_code,
            promo_percent=promo_percent,
        )

    async def add_item(
        self, user_id: int, payload: CartItemCreate
    ) -> CartSummaryResponse:
        product = (
            await self.db.execute(
                select(Product).where(
                    Product.id == payload.product_id, Product.is_active.is_(True)
                )
            )
        ).scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        if not product.in_stock or product.stock_quantity < payload.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Requested quantity exceeds available stock",
            )

        existing_stmt = select(CartItem).where(
            CartItem.user_id == user_id,
            CartItem.product_id == payload.product_id,
            CartItem.selected_edition == payload.selected_edition,
        )
        existing_rows = (await self.db.execute(existing_stmt)).scalars().all()
        color_id = (payload.selected_color or {}).get("id")
        matched: Optional[CartItem] = None
        for row in existing_rows:
            if (row.selected_color or {}).get("id") == color_id:
                matched = row
                break

        if matched:
            matched.quantity = min(50, matched.quantity + payload.quantity)
        else:
            default_color = payload.selected_color or (
                product.colors[0] if product.colors else None
            )
            self.db.add(
                CartItem(
                    user_id=user_id,
                    product_id=product.id,
                    quantity=payload.quantity,
                    selected_color=default_color,
                    selected_edition=payload.selected_edition,
                )
            )

        await self.db.commit()
        return await self.get_cart_summary(user_id)

    async def update_item(
        self, user_id: int, item_id: int, quantity: int
    ) -> CartSummaryResponse:
        stmt = select(CartItem).where(
            CartItem.id == item_id, CartItem.user_id == user_id
        )
        row = (await self.db.execute(stmt)).scalar_one_or_none()
        if not row:
            raise HTTPException(status_code=404, detail="Cart item not found")

        if quantity <= 0:
            await self.db.delete(row)
        else:
            row.quantity = quantity
        await self.db.commit()
        return await self.get_cart_summary(user_id)

    async def remove_item(self, user_id: int, item_id: int) -> CartSummaryResponse:
        stmt = select(CartItem).where(
            CartItem.id == item_id, CartItem.user_id == user_id
        )
        row = (await self.db.execute(stmt)).scalar_one_or_none()
        if not row:
            raise HTTPException(status_code=404, detail="Cart item not found")
        await self.db.delete(row)
        await self.db.commit()
        return await self.get_cart_summary(user_id)

    async def clear_cart(self, user_id: int) -> None:
        await self.db.execute(delete(CartItem).where(CartItem.user_id == user_id))
        await self.db.commit()
