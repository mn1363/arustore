from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class PaginationMeta(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool


class MessageResponse(BaseModel):
    message: str


class BrandCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=160)
    name_fa: str = Field(..., min_length=2, max_length=160)
    slug: Optional[str] = None
    description: Optional[str] = None
    description_fa: Optional[str] = None
    logo: Optional[str] = None
    country: str = "Iran"


class BrandResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    name_fa: str
    slug: str
    description: Optional[str] = None
    description_fa: Optional[str] = None
    logo: Optional[str] = None
    country: str
    product_count: int = 0


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=160)
    name_fa: str = Field(..., min_length=2, max_length=160)
    slug: Optional[str] = None
    parent_id: Optional[int] = None
    description: Optional[str] = None
    description_fa: Optional[str] = None
    image: Optional[str] = None
    accent: Optional[str] = None
    sort_order: int = 0


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    parent_id: Optional[int] = None
    name: str
    name_fa: str
    slug: str
    description: Optional[str] = None
    description_fa: Optional[str] = None
    image: Optional[str] = None
    accent: Optional[str] = None
    product_count: int = 0


class ReviewCreate(BaseModel):
    product_id: int
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = Field(None, max_length=200)
    comment: str = Field(..., min_length=3, max_length=2000)


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    user_id: int
    author_name: str = ""
    rating: int
    title: Optional[str] = None
    comment: str
    is_verified_purchase: bool
    created_at: Optional[datetime] = None


class AnalyticsEventCreate(BaseModel):
    event_type: str = Field(..., min_length=2, max_length=64)
    product_id: Optional[int] = None
    session_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AnalyticsOverviewResponse(BaseModel):
    total_revenue: float
    total_revenue_toman: int
    total_orders: int
    total_products: int
    total_users: int
    in_stock_products: int
    orders_by_status: Dict[str, int]
    top_products: List[Dict[str, Any]]
