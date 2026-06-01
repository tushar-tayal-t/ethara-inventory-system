from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False, server_default="")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    orders = relationship("Order", back_populates="customer", cascade="all, delete-orphan")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
