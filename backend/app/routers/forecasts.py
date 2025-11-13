"""
Forecast CRUD operations
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..schemas import Forecast, ForecastCreate
from .. import models

router = APIRouter()


@router.get("/", response_model=List[Forecast])
async def get_forecasts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all forecasts with pagination"""
    forecasts = db.query(models.Forecast).offset(skip).limit(limit).all()
    return forecasts


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
    
    # Verify invoice exists
    invoice = db.query(models.Invoice).filter(models.Invoice.id == forecast.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=400, detail="Invoice not found")
    
    db_forecast = models.Forecast(**forecast.dict())
    db.add(db_forecast)
    db.commit()
    db.refresh(db_forecast)
    return db_forecast


@router.get("/invoice/{invoice_id}", response_model=List[Forecast])
async def get_forecasts_by_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Get all forecasts for a specific invoice"""
    forecasts = db.query(models.Forecast).filter(models.Forecast.invoice_id == invoice_id).all()
    return forecasts


@router.post("/predict/{invoice_id}")
async def predict_payment_date(invoice_id: int, db: Session = Depends(get_db)):
    """Generate AI prediction for payment date (placeholder for ML integration)"""
    
    # Verify invoice exists
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # TODO: Integrate with ML model when ready
    # For now, return a placeholder prediction
    
    from datetime import date, timedelta
    import random
    
    # Simple placeholder logic - predict payment 30 days after due date
    predicted_date = invoice.due_date + timedelta(days=30) if invoice.due_date else invoice.issue_date + timedelta(days=30)
    confidence = random.uniform(0.7, 0.95)  # Random confidence between 70-95%
    risk_score = random.uniform(0.1, 0.4)   # Random risk between 10-40%
    
    forecast_data = ForecastCreate(
        invoice_id=invoice_id,
        predicted_payment_date=predicted_date,
        confidence_score=confidence,
        prediction_method="STATISTICAL_PLACEHOLDER",
        risk_score=risk_score,
        notes="Placeholder prediction - ML model integration pending"
    )
    
    db_forecast = models.Forecast(**forecast_data.dict())
    db.add(db_forecast)
    db.commit()
    db.refresh(db_forecast)
    
    return {
        "message": "Prediction generated successfully",
        "forecast": db_forecast,
        "note": "This is a placeholder prediction. ML model integration will be added later."
    }
