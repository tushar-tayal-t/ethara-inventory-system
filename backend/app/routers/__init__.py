from app.routers.products import router as products_router
from app.routers.customers import router as customers_router
from app.routers.orders import router as orders_router
from app.routers.analytics import router as analytics_router

__all__ = [
    "products_router",
    "customers_router",
    "orders_router",
    "analytics_router"
]
