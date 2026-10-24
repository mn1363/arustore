from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1, le=50)
    selected_color: Optional[Dict[str, Any]] = None
    selected_edition: Optional[str] = None


class OrderCreate(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=200)
    customer_phone: Optional[str] = None
    shipping_address: str = Field(..., min_length=5, max_length=1000)
    postal_code: Optional[str] = None
    notes: Optional[str] = None
    promo_code: Optional[str] = None
    # Optional explicit items payload; if omitted, order is created from authenticated user's cart
    items: Optional[List[OrderItemCreate]] = None


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(processing|shipped|delivered|cancelled)$")
    note: Optional[str] = None


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: Optional[int] = None
    product_name: str
    product_name_fa: str
    product_image: Optional[str] = None
    color_name: Optional[str] = None
    color_name_fa: Optional[str] = None
    edition: Optional[str] = None
    quantity: int
    unit_price: float
    unit_price_toman: int


class OrderStatusHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    note: Optional[str] = None
    created_at: Optional[datetime] = None


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_number: str
    user_id: Optional[int] = None
    status: str
    payment_status: str
    payment_reference: Optional[str] = None
    subtotal: float
    discount_amount: float
    shipping_cost: float
    total: float
    total_toman: int
    promo_code: Optional[str] = None
    customer_name: str
    customer_phone: Optional[str] = None
    shipping_address: str
    postal_code: Optional[str] = None
    created_at: Optional[datetime] = None
    items: List[OrderItemResponse] = Field(default_factory=list)
    status_history: List[OrderStatusHistoryResponse] = Field(default_factory=list)
