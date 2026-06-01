from sqlalchemy import Column, Integer, ForeignKey, Float
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship
from app.core.database import Base

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)

    # Establish relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product")
    @property
    def product_name(self):
        return self.product.name if self.product else None

