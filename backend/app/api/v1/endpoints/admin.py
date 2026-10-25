from typing import Any, Dict, List
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderResponse, OrderStatusUpdate
from app.schemas.user import UserResponse
from app.services.analytics_service import AnalyticsService
from app.services.order_service import OrderService

router = APIRouter()


@router.get("/dashboard")
async def get_admin_dashboard(
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    overview = await AnalyticsService(db).get_overview()
    recent_orders = (await OrderService(db).list_all_orders())[:5]
    low_stock_rows = (
        await db.execute(
            select(Product)
            .where(Product.is_active.is_(True), Product.stock_quantity <= 5)
            .order_by(Product.stock_quantity.asc())
        )
    ).scalars().all()
    return {
        "overview": overview,
        "recent_orders": recent_orders,
        "low_stock_products": [
            {
                "id": p.id,
                "sku": p.sku,
                "name": p.name,
                "name_fa": p.name_fa,
                "stock_quantity": p.stock_quantity,
            }
            for p in low_stock_rows
        ],
    }


@router.get("/orders", response_model=List[OrderResponse])
async def list_all_orders_admin(
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> List[OrderResponse]:
    return await OrderService(db).list_all_orders()


@router.patch("/orders/{order_id}/status", response_model=OrderResponse)
async def update_order_status_admin(
    order_id: int,
    payload: OrderStatusUpdate,
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> OrderResponse:
    return await OrderService(db).update_order_status(order_id, payload)


@router.get("/users", response_model=List[UserResponse])
async def list_users_admin(
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> List[UserResponse]:
    rows = (
        await db.execute(
            select(User)
            .options(selectinload(User.addresses))
            .order_by(User.created_at.desc(), User.id.desc())
        )
    ).scalars().all()
    return [UserResponse.model_validate(u) for u in rows]
