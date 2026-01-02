"""
Invoice CRUD operations
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from ..database import get_db
from ..schemas import Invoice, InvoiceCreate, InvoiceUpdate, InvoiceItemCreate, InvoiceItemUpdateRequest
from .. import models

router = APIRouter()


@router.get("/", response_model=List[Invoice])
async def get_invoices(
    skip: int = 0, 
    limit: int = 100, 
    start_date: date = None,
    end_date: date = None,
    db: Session = Depends(get_db)
):
    """Get all invoices with optional date filtering"""
    from sqlalchemy.orm import joinedload
    
    query = db.query(models.Invoice).options(
        joinedload(models.Invoice.customer),
        joinedload(models.Invoice.supplier),
        joinedload(models.Invoice.items)
    )
    
    if start_date:
        query = query.filter(models.Invoice.issue_date >= start_date)
    if end_date:
        query = query.filter(models.Invoice.issue_date <= end_date)
    
    invoices = query.offset(skip).limit(limit).all()
    return invoices


@router.get("/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Get invoice by ID"""
    from sqlalchemy.orm import joinedload
    
    invoice = db.query(models.Invoice).options(
        joinedload(models.Invoice.customer),
        joinedload(models.Invoice.supplier),
        joinedload(models.Invoice.items)
    ).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.post("/", response_model=Invoice)
async def create_invoice(invoice: InvoiceCreate, db: Session = Depends(get_db)):
    """Create a new invoice with line items"""
    
    # Verify customer and supplier exist
    customer = db.query(models.Customer).filter(models.Customer.id == invoice.customer_id).first()
    if not customer:
        raise HTTPException(status_code=400, detail="Customer not found")
    
    supplier = db.query(models.Supplier).filter(models.Supplier.id == invoice.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=400, detail="Supplier not found")
    
    # Create invoice
    invoice_data = invoice.dict(exclude={'items'})
    db_invoice = models.Invoice(**invoice_data)
    db.add(db_invoice)
    db.flush()  # Get the invoice ID
    
    # Create invoice items
    for item_data in invoice.items:
        item_data_dict = item_data.dict()
        item_data_dict['invoice_id'] = db_invoice.id
        db_item = models.InvoiceItem(**item_data_dict)
        db.add(db_item)
    
    db.commit()
    db.refresh(db_invoice)
    return db_invoice


@router.put("/{invoice_id}", response_model=Invoice)
async def update_invoice(invoice_id: int, invoice_update: InvoiceUpdate, db: Session = Depends(get_db)):
    """Update invoice information and items"""
    from sqlalchemy.orm import joinedload
    
    db_invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Update invoice fields (excluding items)
    update_data = invoice_update.dict(exclude_unset=True, exclude={'items'})
    for field, value in update_data.items():
        setattr(db_invoice, field, value)
    
    # Handle items update if provided
    if invoice_update.items is not None:
        # Get existing item IDs
        existing_item_ids = {item.id for item in db_invoice.items}
        
        # Process items: update existing, create new, delete removed
        new_item_ids = set()
        for item_data in invoice_update.items:
            if item_data.id and item_data.id in existing_item_ids:
                # Update existing item
                db_item = db.query(models.InvoiceItem).filter(
                    models.InvoiceItem.id == item_data.id,
                    models.InvoiceItem.invoice_id == invoice_id
                ).first()
                if db_item:
                    item_dict = item_data.dict(exclude={'id'})
                    for field, value in item_dict.items():
                        setattr(db_item, field, value)
                    new_item_ids.add(item_data.id)
            else:
                # Create new item
                item_dict = item_data.dict(exclude={'id'})
                item_dict['invoice_id'] = invoice_id
                db_item = models.InvoiceItem(**item_dict)
                db.add(db_item)
        
        # Delete items that were removed
        items_to_delete = existing_item_ids - new_item_ids
        if items_to_delete:
            db.query(models.InvoiceItem).filter(
                models.InvoiceItem.id.in_(items_to_delete),
                models.InvoiceItem.invoice_id == invoice_id
            ).delete(synchronize_session=False)
    
    db.commit()
    db.refresh(db_invoice)
    
    # Reload with relationships
    db_invoice = db.query(models.Invoice).options(
        joinedload(models.Invoice.customer),
        joinedload(models.Invoice.supplier),
        joinedload(models.Invoice.items)
    ).filter(models.Invoice.id == invoice_id).first()
    
    return db_invoice


@router.delete("/{invoice_id}")
async def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Delete an invoice"""
    db_invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    db.delete(db_invoice)
    db.commit()
    return {"message": "Invoice deleted successfully"}


@router.get("/customer/{customer_id}", response_model=List[Invoice])
async def get_invoices_by_customer(customer_id: int, db: Session = Depends(get_db)):
    """Get all invoices for a specific customer"""
    invoices = db.query(models.Invoice).filter(models.Invoice.customer_id == customer_id).all()
    return invoices


@router.get("/supplier/{supplier_id}", response_model=List[Invoice])
async def get_invoices_by_supplier(supplier_id: int, db: Session = Depends(get_db)):
    """Get all invoices for a specific supplier"""
    invoices = db.query(models.Invoice).filter(models.Invoice.supplier_id == supplier_id).all()
    return invoices
