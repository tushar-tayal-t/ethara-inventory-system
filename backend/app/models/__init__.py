from app.core.database import Base
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order
from app.models.order_item import OrderItem

# We add relationship attribute back to Customer here or in customer.py
from sqlalchemy.orm import relationship
Customer.orders = relationship("Order", back_populates="customer", cascade="all, delete-orphan")

__all__ = ["Base", "Product", "Customer", "Order", "OrderItem"]
