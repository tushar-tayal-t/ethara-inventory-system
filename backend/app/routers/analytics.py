from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import Dict, Any
from app.core.dependencies import get_db, get_current_customer
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order
from app.models.order_item import OrderItem
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any

from app.core.dependencies import get_db, get_current_customer
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order

router = APIRouter(
    prefix="/analytics",
    tags=["analytics"]
)

@router.get("/summary")
def get_dashboard_summary(
    response: Response,
    db: Session = Depends(get_db),
    current_customer: Customer = Depends(get_current_customer)
):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"

    """
    Retrieve comprehensive analytics and metrics for the dashboard home panel.
    Requires an active, authenticated customer Bearer token.
    """
    try:
        total_products = db.query(Product).count()
        total_stock = db.query(func.sum(Product.stock)).scalar() or 0

        total_value = db.query(func.sum(Product.price * Product.stock)).scalar() or 0.0

        total_customers = db.query(Customer).count()

        total_orders = db.query(Order).count()
        total_revenue = db.query(func.sum(Order.total_amount)).scalar() or 0.0

        low_stock_products = db.query(Product).filter(Product.stock < 10).all()
        low_stock_list = [
            {
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "stock": p.stock,
                "price": p.price
            }
            for p in low_stock_products
        ]

        recent_orders_db = db.query(Order).order_by(Order.created_at.desc()).limit(5).all()
        recent_orders_list = []
        for o in recent_orders_db:
            items_summary = []
            for item in o.items:
                items_summary.append({
                    "product_name": item.product_name,
                    "quantity": item.quantity,
                    "price": item.price
                })
            recent_orders_list.append({
                "id": o.id,
                "customer_name": o.customer_name,
                "total_amount": o.total_amount,
                "status": o.status,
                "created_at": o.created_at.isoformat() if o.created_at else None,
                "items": items_summary
            })

        top_selling_query = (
            db.query(
                Product.id,
                Product.name,
                Product.sku,
                Product.price,
                Product.stock,
                func.sum(OrderItem.quantity).label('total_sold'),
                func.sum(OrderItem.quantity * OrderItem.price).label('revenue')
            )
            .join(OrderItem, Product.id == OrderItem.product_id)
            .group_by(Product.id, Product.name, Product.sku, Product.price, Product.stock)
            .order_by(func.sum(OrderItem.quantity).desc())
            .limit(5)
            .all()
        )
        top_selling = []
        for prod in top_selling_query:
            top_selling.append({
                "id": prod.id,
                "name": prod.name,
                "sku": prod.sku,
                "total_sold": int(prod.total_sold),
                "revenue": float(prod.revenue),
                "inventory_value": round(float(prod.price * prod.stock), 2)
            })

        return {
            "success": True,
            "message": "Dashboard analytics retrieved successfully.",
            "data": {
                "metrics": {
                    "total_products": total_products,
                    "total_stock": int(total_stock),
                    "total_inventory_value": round(float(total_value), 2),
                    "total_customers": total_customers,
                    "total_orders": total_orders,
                    "total_revenue": round(float(total_revenue), 2),
                    "low_stock_count": len(low_stock_list)
                },
                "low_stock_alerts": low_stock_list,
                "recent_orders": recent_orders_list,
                "top_selling_products": top_selling
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate analytics: {str(e)}"
        )
