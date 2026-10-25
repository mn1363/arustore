from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.product import ProductResponse


class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1, le=50)
    selected_color: Optional[Dict[str, Any]] = None
    selected_edition: Optional[str] = None


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=0, le=50)


class PromoCodeApply(BaseModel):
    code: str = Field(..., min_length=2, max_length=64)


class CartItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    quantity: int
    selected_color: Optional[Dict[str, Any]] = None
    selected_edition: Optional[str] = None
    unit_price: float
    unit_price_toman: int
    line_total: float
    line_total_toman: int
    product: ProductResponse


class CartSummaryResponse(BaseModel):
    items: List[CartItemResponse]
    item_count: int
    subtotal: float
    subtotal_toman: int
    discount_amount: float = 0.0
    discount_toman: int = 0
    total: float
    total_toman: int
    promo_code: Optional[str] = None
    promo_percent: float = 0.0
