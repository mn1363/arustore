from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.product import (
    PaginatedProductsResponse,
    ProductCreate,
    ProductFilter,
    ProductResponse,
    ProductUpdate,
)
from app.services.product_service import ProductService
from app.services.recommendation_service import RecommendationService

router = APIRouter()


@router.get("/", response_model=PaginatedProductsResponse)
async def get_products(
    category_id: Optional[int] = Query(None),
    category_slug: Optional[str] = Query(None),
    brand_id: Optional[int] = Query(None),
    brand_slug: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    in_stock: Optional[bool] = Query(None),
    is_on_sale: Optional[bool] = Query(None),
    is_featured: Optional[bool] = Query(None),
    sort_by: str = Query("newest"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> PaginatedProductsResponse:
    filters = ProductFilter(
        category_id=category_id,
        category_slug=category_slug,
        brand_id=brand_id,
        brand_slug=brand_slug,
        min_price=min_price,
        max_price=max_price,
        search=search,
        in_stock=in_stock,
        is_on_sale=is_on_sale,
        is_featured=is_featured,
        sort_by=sort_by,
    )
    return await ProductService(db).list_products(filters, page, page_size)


@router.get("/{identifier}", response_model=ProductResponse)
async def get_product(
    identifier: str,
    db: AsyncSession = Depends(get_db),
) -> ProductResponse:
    product = await ProductService(db).get_product(identifier)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/{product_id}/related", response_model=List[ProductResponse])
async def get_related_products(
    product_id: int,
    limit: int = Query(4, ge=1, le=12),
    db: AsyncSession = Depends(get_db),
) -> List[ProductResponse]:
    return await RecommendationService(db).get_related_products(product_id, limit=limit)


@router.post(
    "/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED
)
async def create_product(
    payload: ProductCreate,
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> ProductResponse:
    return await ProductService(db).create_product(payload)


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    payload: ProductUpdate,
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> ProductResponse:
    return await ProductService(db).update_product(product_id, payload)


@router.delete("/{product_id}", response_model=MessageResponse)
async def delete_product(
    product_id: int,
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await ProductService(db).delete_product(product_id)
    return MessageResponse(message="Product archived")
