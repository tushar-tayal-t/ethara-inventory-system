from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1, description="Name of the customer")
    email: str = Field(..., description="Email address of the customer")
    phone: Optional[str] = Field(None, description="Optional phone contact")

class CustomerCreate(CustomerBase):
    password: str = Field(..., min_length=6, description="Password for the customer account")

class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    email: Optional[str] = None
    phone: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CustomerLogin(BaseModel):
    email: str = Field(..., description="Email address of the customer")
    password: str = Field(..., description="Password of the customer")

class CustomerResponseEnvelope(BaseModel):
    success: bool
    message: str
    data: Optional[CustomerResponse] = None

class CustomerListResponseEnvelope(BaseModel):
    success: bool
    message: str
    data: list[CustomerResponse]

class CustomerAuthData(BaseModel):
    token: str
    customer: CustomerResponse

class CustomerAuthEnvelope(BaseModel):
    success: bool
    message: str
    data: CustomerAuthData
