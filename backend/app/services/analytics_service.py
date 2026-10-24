from typing import Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import AnalyticsEvent, Order
from app.models.product import Product
from app.models.user import User
from app.schemas.common import AnalyticsEventCreate, AnalyticsOverviewResponse
from app.tasks.analytics_tasks import record_analytics_snapshot_task


class AnalyticsService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def record_event(
        self, payload: AnalyticsEventCreate, user_id: Optional[int] = None
    ) -> AnalyticsEvent:
        event = AnalyticsEvent(
            event_type=payload.event_type,
            user_id=user_id,
            product_id=payload.product_id,
            session_id=payload.session_id,
            metadata_json=payload.metadata,
        )
        self.db.add(event)
        await self.db.commit()
        await self.db.refresh(event)

        try:
            record_analytics_snapshot_task.delay(payload.event_type, payload.metadata)
        except Exception:
            pass
        return event

    async def get_overview(self) -> AnalyticsOverviewResponse:
        rev_row = (
            await self.db.execute(
                select(
                    func.coalesce(func.sum(Order.total), 0.0),
                    func.coalesce(func.sum(Order.total_toman), 0),
                    func.count(Order.id),
                ).where(Order.status != "cancelled")
            )
        ).one()

        total_products = int(
            (
                await self.db.execute(
                    select(func.count(Product.id)).where(Product.is_active.is_(True))
                )
            ).scalar_one()
            or 0
        )
        in_stock_products = int(
            (
                await self.db.execute(
                    select(func.count(Product.id)).where(
                        Product.is_active.is_(True), Product.in_stock.is_(True)
                    )
                )
            ).scalar_one()
            or 0
        )
        total_users = int(
            (await self.db.execute(select(func.count(User.id)))).scalar_one() or 0
        )

        status_rows = (
            await self.db.execute(
                select(Order.status, func.count(Order.id)).group_by(Order.status)
            )
        ).all()
        orders_by_status = {str(st): int(cnt) for st, cnt in status_rows}

        top_rows = (
            await self.db.execute(
                select(Product)
                .where(Product.is_active.is_(True))
                .order_by(Product.view_count.desc(), Product.rating_avg.desc())
                .limit(5)
            )
        ).scalars().all()
        top_products = [
            {
                "id": p.id,
                "slug": p.slug,
                "name": p.name,
                "name_fa": p.name_fa,
                "price": p.price,
                "price_toman": p.price_toman,
                "stock_quantity": p.stock_quantity,
                "view_count": p.view_count,
            }
            for p in top_rows
        ]

        return AnalyticsOverviewResponse(
            total_revenue=round(float(rev_row[0]), 2),
            total_revenue_toman=int(rev_row[1]),
            total_orders=int(rev_row[2]),
            total_products=total_products,
            total_users=total_users,
            in_stock_products=in_stock_products,
            orders_by_status=orders_by_status,
            top_products=top_products,
        )
