"""
Payment CRUD operations
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..schemas import Payment, PaymentCreate, PaymentUpdate
from .. import models

router = APIRouter()


@router.get("/", response_model=List[Payment])
async def get_payments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all payments with pagination"""
    payments = db.query(models.Payment).offset(skip).limit(limit).all()
    return payments


@router.get("/{payment_id}", response_model=Payment)
async def get_payment(payment_id: int, db: Session = Depends(get_db)):
    """Get payment by ID"""
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.post("/", response_model=Payment)
async def create_payment(payment: PaymentCreate, db: Session = Depends(get_db)):
    """Create a new payment"""
    
    # Verify invoice exists
    invoice = db.query(models.Invoice).filter(models.Invoice.id == payment.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=400, detail="Invoice not found")
    
    db_payment = models.Payment(**payment.dict())
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment


@router.put("/{payment_id}", response_model=Payment)
async def update_payment(payment_id: int, payment_update: PaymentUpdate, db: Session = Depends(get_db)):
    """Update payment information"""
    db_payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    update_data = payment_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_payment, field, value)
    
    db.commit()
    db.refresh(db_payment)
    return db_payment


@router.delete("/{payment_id}")
async def delete_payment(payment_id: int, db: Session = Depends(get_db)):
    """Delete a payment"""
    db_payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    db.delete(db_payment)
    db.commit()
    return {"message": "Payment deleted successfully"}


@router.get("/invoice/{invoice_id}", response_model=List[Payment])
async def get_payments_by_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Get all payments for a specific invoice"""
    payments = db.query(models.Payment).filter(models.Payment.invoice_id == invoice_id).all()
    return payments
