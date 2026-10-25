from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple
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

    def _resolve_validated_color(
        self, product: Product, selected_color: Optional[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        available_colors = [
            c for c in (product.colors or []) if isinstance(c, dict)
        ]

        if selected_color is None:
            return dict(available_colors[0]) if available_colors else None

        if not isinstance(selected_color, dict):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid selected finish format",
            )

        requested_id = str(selected_color.get("id") or "").strip()
        requested_hex = str(selected_color.get("hex") or "").strip().lower()

        if not available_colors:
            if not requested_id or requested_id == "default-silver-champagne":
                return None
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected finish is not available for this product",
            )

        if requested_id:
            needle = requested_id.lower()
            for color in available_colors:
                cid = str(color.get("id") or "").strip().lower()
                if cid == needle:
                    return dict(color)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected finish is not available for this product",
            )

        if requested_hex:
            for color in available_colors:
                chex = str(color.get("hex") or "").strip().lower()
                if chex == requested_hex:
                    return dict(color)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected finish is not available for this product",
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected finish is not available for this product",
        )

    def _resolve_validated_edition(
        self, product: Product, selected_edition: Optional[str]
    ) -> Optional[str]:
        available_editions = [
            ed
            for ed in (product.editions or [])
            if isinstance(ed, dict) and str(ed.get("id") or "").strip()
        ]
        requested = (
            selected_edition.strip() if isinstance(selected_edition, str) else ""
        )

        if not available_editions:
            if not requested or requested == "default":
                return None
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected edition is not available for this product",
            )

        if not requested:
            return str(available_editions[0]["id"]).strip()

        for ed in available_editions:
            ed_id = str(ed.get("id") or "").strip()
            if ed_id == requested:
                return ed_id

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected edition is not available for this product",
        )

    def _compute_unit_prices(
        self, product: Product, selected_edition: Optional[str]
    ) -> Tuple[float, int]:
        unit_usd = float(product.price)
        unit_toman = int(product.price_toman)
        if selected_edition and product.editions:
            for ed in product.editions:
                if isinstance(ed, dict) and ed.get("id") == selected_edition:
                    unit_usd += float(ed.get("priceDelta", 0.0))
                    unit_toman += int(ed.get("priceDeltaToman", 0))
                    break
        return round(unit_usd, 2), unit_toman

    async def validate_discount(
        self, code: Optional[str], subtotal: float
    ) -> Optional[Discount]:
        if not code or not code.strip():
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
        if discount.expires_at is not None:
            expires_at = discount.expires_at
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at < datetime.now(timezone.utc):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Promo code has expired",
                )
        if discount.usage_limit is not None and discount.used_count >= discount.usage_limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Promo code usage limit reached",
            )
        if subtotal <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot apply promo code to an empty cart",
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

        if promo_code and promo_code.strip():
            discount = await self.validate_discount(promo_code, subtotal_usd)
            if discount:
                applied_code = discount.code
                promo_percent = discount.discount_percent
                discount_usd = round(subtotal_usd * (promo_percent / 100.0), 2)
                if (
                    discount.max_discount_amount
                    and discount_usd > discount.max_discount_amount
                ):
                    discount_usd = round(discount.max_discount_amount, 2)
                    if subtotal_usd > 0:
                        capped_ratio = discount_usd / subtotal_usd
                        discount_toman = int(round(subtotal_toman * capped_ratio))
                    else:
                        discount_toman = 0
                else:
                    discount_toman = int(
                        round(subtotal_toman * (promo_percent / 100.0))
                    )

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
        if payload.quantity < 1 or payload.quantity > 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid item quantity",
            )

        product = (
            await self.db.execute(
                select(Product).where(
                    Product.id == payload.product_id, Product.is_active.is_(True)
                )
            )
        ).scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        if not product.in_stock or product.stock_quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product is currently out of stock",
            )

        canonical_color = self._resolve_validated_color(
            product, payload.selected_color
        )
        canonical_edition = self._resolve_validated_edition(
            product, payload.selected_edition
        )

        product_rows_stmt = select(CartItem).where(
            CartItem.user_id == user_id,
            CartItem.product_id == product.id,
        )
        product_rows = (await self.db.execute(product_rows_stmt)).scalars().all()
        existing_product_qty = sum(r.quantity for r in product_rows)

        if existing_product_qty + payload.quantity > product.stock_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Requested quantity exceeds available stock "
                    f"({product.stock_quantity} available)"
                ),
            )

        canonical_color_id = (canonical_color or {}).get("id")
        default_edition_id = (
            str(product.editions[0]["id"]).strip()
            if product.editions
            and isinstance(product.editions[0], dict)
            and product.editions[0].get("id")
            else None
        )

        matched: Optional[CartItem] = None
        for row in product_rows:
            row_color_id = (row.selected_color or {}).get("id")
            row_edition = row.selected_edition or default_edition_id
            if row_color_id == canonical_color_id and row_edition == canonical_edition:
                matched = row
                break

        if matched:
            new_line_qty = matched.quantity + payload.quantity
            if new_line_qty > 50:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Maximum quantity per cart item is 50",
                )
            matched.quantity = new_line_qty
            matched.selected_color = canonical_color
            matched.selected_edition = canonical_edition
        else:
            self.db.add(
                CartItem(
                    user_id=user_id,
                    product_id=product.id,
                    quantity=payload.quantity,
                    selected_color=canonical_color,
                    selected_edition=canonical_edition,
                )
            )

        await self.db.commit()
        return await self.get_cart_summary(user_id)

    async def update_item(
        self, user_id: int, item_id: int, quantity: int
    ) -> CartSummaryResponse:
        if quantity < 0 or quantity > 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid item quantity",
            )

        stmt = (
            select(CartItem)
            .options(selectinload(CartItem.product))
            .where(CartItem.id == item_id, CartItem.user_id == user_id)
        )
        row = (await self.db.execute(stmt)).scalar_one_or_none()
        if not row:
            raise HTTPException(status_code=404, detail="Cart item not found")

        if quantity == 0:
            await self.db.delete(row)
            await self.db.commit()
            return await self.get_cart_summary(user_id)

        product = row.product
        if not product or not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product is no longer available",
            )
        if not product.in_stock or product.stock_quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product is currently out of stock",
            )

        other_rows_stmt = select(CartItem).where(
            CartItem.user_id == user_id,
            CartItem.product_id == product.id,
            CartItem.id != row.id,
        )
        other_rows = (await self.db.execute(other_rows_stmt)).scalars().all()
        other_qty = sum(r.quantity for r in other_rows)

        if other_qty + quantity > product.stock_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Requested quantity exceeds available stock "
                    f"({product.stock_quantity} available)"
                ),
            )

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
