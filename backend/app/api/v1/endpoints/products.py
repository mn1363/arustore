from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.product_service import ProductService
from app.schemas.product import ProductCreate, ProductUpdate, ProductFilter
from app.api.deps import get_current_user, get_current_admin

router = APIRouter()

@router.get("/")
async def get_products(
    category_id: Optional[int] = Query(None),
    brand_id: Optional[int] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    in_stock: Optional[bool] = Query(None),
    is_on_sale: Optional[bool] = Query(None),
    sort_by: Optional[str] = Query("newest"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    filters = ProductFilter(
        category_id=category_id,
        brand_id=brand_id,
        min_price=min_price,
        max_price=max_price,
        search=search,
        in_stock=in_stock,
        is_on_sale=is_on_sale,
        sort_by=sort_by
    )
    service = ProductService(db)
    return await service.list_products(filters, page, page_size)

@router.get("/{product_id}")
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    service = ProductService(db)
    product = await service.get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
