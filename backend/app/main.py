# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Request
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.exceptions import HTTPException as FastAPIHTTPException
from app.core.config import settings
from app.routers import products_router, customers_router, orders_router, analytics_router
from app.core.database import Base, engine

# Auto-initialize database tables
Base.metadata.create_all(bind=engine)

# Initialize the FastAPI App instance
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Custom exception handler for Starlette HTTPExceptions
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "data": None
        }
    )

# Custom exception handler for FastAPI HTTPExceptions
@app.exception_handler(FastAPIHTTPException)
async def fastapi_http_exception_handler(request: Request, exc: FastAPIHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "data": None
        }
    )

# Custom exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    error_messages = []
    for err in errors:
        loc = " -> ".join(str(item) for item in err.get("loc", []))
        msg = err.get("msg", "")
        error_messages.append(f"{loc}: {msg}")
    
    combined_message = "; ".join(error_messages) or "Validation error"
    
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": combined_message,
            "data": None
        }
    )

# Set up CORS middleware (cross-origin resource sharing) for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, change to list of trusted frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register endpoints with global API V1 path prefix
app.include_router(products_router, prefix=settings.API_V1_STR)
app.include_router(customers_router, prefix=settings.API_V1_STR)
app.include_router(orders_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    """
    Root entry point.
    Provides API details and dynamic reference links.
    """
    return {
        "message": f"Welcome to the {settings.PROJECT_NAME}!",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "status": "healthy"
    }

if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
