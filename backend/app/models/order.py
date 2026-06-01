from sqlalchemy import Column, Integer, ForeignKey, Float, DateTime, String
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    customer = relationship("Customer", back_populates="orders")
    status = Column(String, default="pending", nullable=False)
    total_amount = Column(Float, default=0.0, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    @property
    def customer_name(self):
        return self.customer.name if self.customer else None

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
