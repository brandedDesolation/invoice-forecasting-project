"""
Customer CRUD operations
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..schemas import Customer, CustomerCreate, CustomerUpdate
from .. import models

router = APIRouter()


@router.get("/", response_model=List[Customer])
async def get_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all customers with pagination"""
    customers = db.query(models.Customer).offset(skip).limit(limit).all()
    return customers


@router.get("/{customer_id}", response_model=Customer)
async def get_customer(customer_id: int, db: Session = Depends(get_db)):
    """Get customer by ID"""
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.post("/", response_model=Customer)
async def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    """Create a new customer"""
    db_customer = models.Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


@router.put("/{customer_id}", response_model=Customer)
async def update_customer(customer_id: int, customer_update: CustomerUpdate, db: Session = Depends(get_db)):
    """Update customer information"""
    db_customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    update_data = customer_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_customer, field, value)
    
    db.commit()
    db.refresh(db_customer)
    return db_customer


@router.delete("/{customer_id}")
async def delete_customer(
    customer_id: int, 
    cascade: bool = False,
    db: Session = Depends(get_db)
):
    """
    Delete a customer.
    
    - If cascade=False (default): Only deletes if customer has no invoices
    - If cascade=True: Deletes customer AND all their invoices
    """
    db_customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Check if customer has any invoices
    invoices = db.query(models.Invoice).filter(models.Invoice.customer_id == customer_id).all()
    invoice_count = len(invoices)
    
    if invoice_count > 0 and not cascade:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete customer. They have {invoice_count} invoice(s). Use cascade=true to delete customer and all their invoices."
        )
    
    # If cascade, delete all related invoices first
    if cascade and invoice_count > 0:
        for invoice in invoices:
            # Delete invoice items first
            db.query(models.InvoiceItem).filter(models.InvoiceItem.invoice_id == invoice.id).delete()
            # Delete forecasts
            db.query(models.Forecast).filter(models.Forecast.invoice_id == invoice.id).delete()
            # Delete the invoice
            db.delete(invoice)
    
    db.delete(db_customer)
    db.commit()
    
    if cascade and invoice_count > 0:
        return {"message": f"Customer and {invoice_count} invoice(s) deleted successfully"}
    return {"message": "Customer deleted successfully"}
