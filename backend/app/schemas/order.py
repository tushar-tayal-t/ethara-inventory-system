from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

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

class OrderBase(BaseModel):
    customer_id: int = Field(..., description="ID of the customer who placed the order")
    status: str = Field(default="pending", description="Status of the order: pending, completed, cancelled")
    total_amount: float = Field(default=0.0, ge=0.0, description="Total cost of items in this order")

class OrderCreate(BaseModel):
    customer_id: int = Field(..., description="ID of the customer placing the order")
    items: List[OrderItemCreate] = Field(..., min_length=1, description="List of items in the order")

class OrderUpdate(BaseModel):
    status: Optional[str] = None

class OrderResponse(OrderBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    customer_name: Optional[str] = None
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True

class OrderResponseEnvelope(BaseModel):
    success: bool
    message: str
    data: Optional[OrderResponse] = None

class OrderListResponseEnvelope(BaseModel):
    success: bool
    message: str
    data: List[OrderResponse]
