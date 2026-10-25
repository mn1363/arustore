from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1, le=50)
    selected_color: Optional[Dict[str, Any]] = None
    selected_edition: Optional[str] = None


class OrderCreate(BaseModel):
    # Forbid client-supplied `items`, `price`, `subtotal`, `total`, `payment_status`, or `status`
    # so customer checkout always builds orders strictly from the authenticated server-side cart.
    model_config = ConfigDict(extra="forbid")

    customer_name: str = Field(..., min_length=2, max_length=200)
    customer_phone: Optional[str] = Field(default=None, max_length=32)
    shipping_address: str = Field(..., min_length=5, max_length=1000)
    postal_code: Optional[str] = Field(default=None, max_length=20)
    notes: Optional[str] = Field(default=None, max_length=1000)
    promo_code: Optional[str] = Field(default=None, max_length=64)

    @field_validator("customer_name")
    @classmethod
    def validate_customer_name(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise ValueError("Customer name must be at least 2 characters")
        return cleaned

    @field_validator("shipping_address")
    @classmethod
    def validate_shipping_address(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 5:
            raise ValueError("Shipping address must be at least 5 characters")
        return cleaned

    @field_validator("customer_phone", "postal_code", "notes", "promo_code")
    @classmethod
    def strip_optional_strings(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class OrderStatusUpdate(BaseModel):
    status: str = Field(
        ...,
        pattern="^(pending_payment|processing|shipped|delivered|cancelled)$",
    )
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
    stock_reserved: bool = False
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
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    items: List[OrderItemResponse] = Field(default_factory=list)
    status_history: List[OrderStatusHistoryResponse] = Field(default_factory=list)

    @model_validator(mode="after")
    def compute_stock_reservation_flag(self) -> "OrderResponse":
        # Pending-payment and cancelled orders do NOT reserve inventory;
        # historical paid orders preserve their fulfilled/reserved meaning.
        self.stock_reserved = (
            self.payment_status == "paid" and self.status != "cancelled"
        )
        return self
