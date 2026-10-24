import math
from typing import Any, Sequence, TypeVar
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

T = TypeVar("T")


def build_pagination_meta(total: int, page: int, page_size: int) -> dict[str, int | bool]:
    total_pages = max(1, math.ceil(total / page_size)) if page_size > 0 else 1
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1,
    }


async def paginate_select(
    db: AsyncSession,
    stmt: Select[Any],
    page: int = 1,
    page_size: int = 20,
) -> tuple[Sequence[Any], dict[str, int | bool]]:
    safe_page = max(1, page)
    safe_size = max(1, min(page_size, 100))

    count_stmt = select(func.count()).select_from(stmt.order_by(None).subquery())
    total_result = await db.execute(count_stmt)
    total = int(total_result.scalar_one() or 0)

    paged_stmt = stmt.offset((safe_page - 1) * safe_size).limit(safe_size)
    rows = (await db.execute(paged_stmt)).scalars().unique().all()
    return rows, build_pagination_meta(total, safe_page, safe_size)
