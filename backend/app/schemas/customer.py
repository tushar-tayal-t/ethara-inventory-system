from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1, description="Name of the customer")
    email: str = Field(..., description="Email address of the customer")
    phone: Optional[str] = Field(None, description="Optional phone contact")

class CustomerCreate(CustomerBase):
    """Schema for registering a new customer."""
    password: str = Field(..., min_length=6, description="Password for the customer account")

class CustomerUpdate(BaseModel):
    """Schema for updating an existing customer."""
    name: Optional[str] = Field(None, min_length=1)
    email: Optional[str] = None
    phone: Optional[str] = None

class CustomerResponse(CustomerBase):
    """Response schema returned to clients."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CustomerLogin(BaseModel):
    """Schema for customer login."""
    email: str = Field(..., description="Email address of the customer")
    password: str = Field(..., description="Password of the customer")

class CustomerResponseEnvelope(BaseModel):
    """Standard single-customer API response envelope."""
    success: bool
    message: str
    data: Optional[CustomerResponse] = None

class CustomerListResponseEnvelope(BaseModel):
    """Standard customer-list API response envelope."""
    success: bool
    message: str
    data: list[CustomerResponse]

class CustomerAuthData(BaseModel):
    """Token + Customer details payload returned on auth actions."""
    token: str
    customer: CustomerResponse

class CustomerAuthEnvelope(BaseModel):
    """Standard authentication API response envelope."""
    success: bool
    message: str
    data: CustomerAuthData

