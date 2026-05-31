"""
FastAPI main application
Invoice Forecasting API
"""

import os
from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
import uvicorn
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from .auth import ensure_default_admin, require_admin_user
from .database import SessionLocal, create_tables
from .routers import analytics, auth, customers, expenses, forecasts, invoices, ledger, payments, purchase_orders, review, suppliers, upload, users, workflow

# Create FastAPI app
app = FastAPI(
    title="Invoice Forecasting API",
    description="AI-powered invoice forecasting and financial automation system",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
allowed_origins = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
admin_dependencies = [Depends(require_admin_user)]

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(customers.router, prefix="/api/v1/customers", tags=["customers"], dependencies=admin_dependencies)
app.include_router(suppliers.router, prefix="/api/v1/suppliers", tags=["suppliers"], dependencies=admin_dependencies)
app.include_router(invoices.router, prefix="/api/v1/invoices", tags=["invoices"], dependencies=admin_dependencies)
app.include_router(payments.router, prefix="/api/v1/payments", tags=["payments"], dependencies=admin_dependencies)
app.include_router(purchase_orders.router, prefix="/api/v1/purchase-orders", tags=["purchase-orders"], dependencies=admin_dependencies)
app.include_router(expenses.router, prefix="/api/v1/expenses", tags=["expenses"], dependencies=admin_dependencies)
app.include_router(ledger.router, prefix="/api/v1/ledger", tags=["ledger"], dependencies=admin_dependencies)
app.include_router(forecasts.router, prefix="/api/v1/forecasts", tags=["forecasts"], dependencies=admin_dependencies)
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"], dependencies=admin_dependencies)
app.include_router(upload.router, prefix="/api/v1/upload", tags=["upload"], dependencies=admin_dependencies)
app.include_router(review.router, prefix="/api/v1/review", tags=["review"], dependencies=admin_dependencies)
app.include_router(workflow.router, prefix="/api/v1/workflow", tags=["workflow"], dependencies=admin_dependencies)
app.include_router(users.router, prefix="/api/v1/users", tags=["users"], dependencies=admin_dependencies)


@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup"""
    create_tables()
    db = SessionLocal()
    try:
        ensure_default_admin(db)
    finally:
        db.close()


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Invoice Forecasting API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "API is running"}


@app.get("/health/db")
async def database_health_check():
    """Database health check endpoint"""
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "reachable"}
    finally:
        db.close()


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors"""
    debug = os.getenv("DEBUG", "false").lower() == "true"
    return JSONResponse(
        status_code=500,
        content={
            "message": "Internal server error",
            "detail": str(exc) if debug else "Unexpected server error",
            "success": False
        }
    )


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )