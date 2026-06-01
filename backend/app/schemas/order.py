from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

# --- Order Item Schemas ---

class OrderItemBase(BaseModel):
    product_id: int = Field(..., description="ID of the product")
    quantity: int = Field(..., gt=0, description="Quantity ordered of this product")

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemResponse(OrderItemBase):
    id: int
    price: float = Field(..., description="Price of the product at the time of purchase")

    product_name: Optional[str] = None
    class Config:
        from_attributes = True

# --- Order Schemas ---

class OrderBase(BaseModel):
    customer_id: int = Field(..., description="ID of the customer who placed the order")
    status: str = Field(default="pending", description="Status of the order: pending, completed, cancelled")
    total_amount: float = Field(default=0.0, ge=0.0, description="Total cost of items in this order")

class OrderCreate(BaseModel):
    """Schema for registering a new order with items.
    Note: total_amount is automatically calculated on the backend.
    """
    customer_id: int = Field(..., description="ID of the customer placing the order")
    items: List[OrderItemCreate] = Field(..., min_length=1, description="List of items in the order")

class OrderUpdate(BaseModel):
    """Schema for updating an existing order's status or details."""
    status: Optional[str] = None

class OrderResponse(OrderBase):
    """Response schema returned to clients."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    customer_name: Optional[str] = None
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True

class OrderResponseEnvelope(BaseModel):
    """Standard single-order API response envelope."""
    success: bool
    message: str
    data: Optional[OrderResponse] = None

class OrderListResponseEnvelope(BaseModel):
    """Standard order-list API response envelope."""
    success: bool
    message: str
    data: List[OrderResponse]

