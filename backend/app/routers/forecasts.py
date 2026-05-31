"""
Forecast CRUD operations
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..schemas import Forecast, ForecastCreate, ForecastPredictionResponse
from .. import models
from ..services.audit_service import create_audit_event
from ..services.forecast_service import build_forecast, get_latest_forecast_insight

router = APIRouter()


@router.get("/", response_model=List[Forecast])
async def get_forecasts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all forecasts with pagination"""
    forecasts = db.query(models.Forecast).offset(skip).limit(limit).all()
    return forecasts


@router.get("/invoice/{invoice_id}", response_model=List[Forecast])
async def get_forecasts_by_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Get all forecasts for a specific invoice"""
    forecasts = db.query(models.Forecast).filter(models.Forecast.invoice_id == invoice_id).all()
    return forecasts


@router.get("/invoice/{invoice_id}/latest")
async def get_latest_forecast(invoice_id: int, db: Session = Depends(get_db)):
    """Get the latest forecast insight for a specific invoice"""
    insight = get_latest_forecast_insight(invoice_id, db)
    return insight


@router.get("/{forecast_id}", response_model=Forecast)
async def get_forecast(forecast_id: int, db: Session = Depends(get_db)):
    """Get forecast by ID"""
    forecast = db.query(models.Forecast).filter(models.Forecast.id == forecast_id).first()
    if not forecast:
        raise HTTPException(status_code=404, detail="Forecast not found")
    return forecast


@router.post("/", response_model=Forecast)
async def create_forecast(forecast: ForecastCreate, db: Session = Depends(get_db)):
    """Create a new forecast"""
    invoice = db.query(models.Invoice).filter(models.Invoice.id == forecast.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=400, detail="Invoice not found")

    db_forecast = models.Forecast(**forecast.dict())
    db.add(db_forecast)
    db.flush()
    create_audit_event(
        db,
        invoice_id=db_forecast.invoice_id,
        event_type="forecast_created",
        title="Forecast created",
        message="A payment forecast was manually created.",
        metadata={"forecast_id": db_forecast.id},
    )
    db.commit()
    db.refresh(db_forecast)
    return db_forecast


@router.post("/predict/{invoice_id}", response_model=ForecastPredictionResponse)
async def predict_payment_date(invoice_id: int, db: Session = Depends(get_db)):
    """Generate a payment prediction using invoice history and payment behavior"""
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if (invoice.approval_status or "pending").lower() != "approved":
        raise HTTPException(status_code=400, detail="Invoice must be approved before a payment forecast is generated")

    try:
        forecast, insight = build_forecast(invoice_id, db)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    create_audit_event(
        db,
        invoice_id=invoice_id,
        event_type="forecast_generated",
        title="Forecast generated",
        message="A payment-risk forecast was generated.",
        actor="VICAI",
        metadata={"forecast_id": forecast.id, "risk_level": insight.get("risk_level")},
    )
    db.commit()

    return {
        "message": "Prediction generated successfully",
        "forecast": forecast,
        "insight": insight,
    }
