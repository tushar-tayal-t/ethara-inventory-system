from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Name of the product")
    sku: str = Field(..., min_length=1, max_length=50, description="Unique SKU code of the product")
    description: Optional[str] = Field(None, description="Optional details about the product")
    price: float = Field(..., gt=0.0, description="Price of the product must be greater than zero")
    stock: int = Field(default=0, ge=0, description="Inventory stock level must be zero or more")

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    sku: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0.0)
    stock: Optional[int] = Field(None, ge=0)

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProductResponseEnvelope(BaseModel):
    success: bool
    message: str
    data: Optional[ProductResponse] = None

class ProductListResponseEnvelope(BaseModel):
    success: bool
    message: str
    data: list[ProductResponse]
