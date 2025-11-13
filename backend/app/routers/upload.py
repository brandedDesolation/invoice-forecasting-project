"""
Upload router for invoice image processing
"""

import os
import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from ..models import Invoice, Supplier, Customer, InvoiceItem
from ..schemas import InvoiceUploadResponse, ExtractedInvoiceData
from ..services.ocr_service import get_ocr_service

router = APIRouter()

# Upload directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


def get_or_create_supplier(db: Session, supplier_data: dict) -> Supplier:
    """Get existing supplier or create new one"""
    # Try to find by tax_id first
    if supplier_data.get("tax_id"):
        supplier = db.query(Supplier).filter(
            Supplier.tax_id == supplier_data["tax_id"]
        ).first()
        if supplier:
            # Update fields if provided
            if supplier_data.get("name") and not supplier.name:
                supplier.name = supplier_data["name"]
            if supplier_data.get("address") and not supplier.address:
                supplier.address = supplier_data["address"]
            if supplier_data.get("phone") and not supplier.phone:
                supplier.phone = supplier_data["phone"]
            if supplier_data.get("email") and not supplier.email:
                supplier.email = supplier_data["email"]
            db.commit()
            return supplier
    
    # Try to find by name
    if supplier_data.get("name"):
        supplier = db.query(Supplier).filter(
            Supplier.name.ilike(f"%{supplier_data['name']}%")
        ).first()
        if supplier:
            return supplier
    
    # Create new supplier
    supplier = Supplier(
        name=supplier_data.get("name") or "Unknown Supplier",
        tax_id=supplier_data.get("tax_id"),
        address=supplier_data.get("address"),
        phone=supplier_data.get("phone"),
        email=supplier_data.get("email")
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


def get_or_create_customer(db: Session, customer_data: dict) -> Customer:
    """Get existing customer or create new one"""
    # Try to find by tax_id first
    if customer_data.get("tax_id"):
        customer = db.query(Customer).filter(
            Customer.tax_id == customer_data["tax_id"]
        ).first()
        if customer:
            return customer
    
    # Try to find by name
    if customer_data.get("name"):
        customer = db.query(Customer).filter(
            Customer.name.ilike(f"%{customer_data['name']}%")
        ).first()
        if customer:
            return customer
    
    # Create new customer with default name if no info available
    customer = Customer(
        name=customer_data.get("name") or "Unknown Customer",
        tax_id=customer_data.get("tax_id"),
        address=customer_data.get("address")
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.post("/invoice", response_model=InvoiceUploadResponse)
async def upload_invoice(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload and process invoice image
    
    - **file**: Invoice image file (PNG, JPG, JPEG)
    - Returns extracted invoice data and saves to database
    """
    # Validate file type
    allowed_extensions = {".png", ".jpg", ".jpeg", ".pdf"}
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Save uploaded file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{timestamp}_{file.filename}"
    file_path = UPLOAD_DIR / safe_filename
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")
    
    try:
        # Initialize OCR service
        ocr_service = get_ocr_service()
        
        # Process invoice with OCR
        extracted_data = ocr_service.process_invoice(str(file_path))
        
        # Get or create supplier
        supplier = get_or_create_supplier(db, extracted_data.get("supplier", {}))
        
        # Get or create customer
        customer = get_or_create_customer(db, extracted_data.get("customer", {}))
        
        # Check if invoice already exists
        existing_invoice = None
        if extracted_data.get("invoice_number"):
            existing_invoice = db.query(Invoice).filter(
                Invoice.invoice_number == extracted_data["invoice_number"],
                Invoice.supplier_id == supplier.id
            ).first()
        
        if existing_invoice:
            # Update existing invoice
            invoice = existing_invoice
            invoice.issue_date = extracted_data.get("issue_date") or invoice.issue_date
            invoice.due_date = extracted_data.get("due_date") or invoice.due_date
            invoice.subtotal = extracted_data.get("amounts", {}).get("subtotal", 0.0)
            invoice.tax = extracted_data.get("amounts", {}).get("tax", 0.0)
            invoice.total = extracted_data.get("amounts", {}).get("total", 0.0)
            invoice.image_path = str(file_path)
            invoice.raw_text = extracted_data.get("raw_text")
            invoice.ocr_confidence = extracted_data.get("ocr_confidence")
            invoice.extraction_status = "completed"
        else:
            # Create new invoice
            invoice = Invoice(
                invoice_number=extracted_data.get("invoice_number") or f"INV-{timestamp}",
                issue_date=extracted_data.get("issue_date") or datetime.now().date(),
                due_date=extracted_data.get("due_date"),
                subtotal=extracted_data.get("amounts", {}).get("subtotal", 0.0),
                tax=extracted_data.get("amounts", {}).get("tax", 0.0),
                total=extracted_data.get("amounts", {}).get("total", 0.0),
                customer_id=customer.id,
                supplier_id=supplier.id,
                image_path=str(file_path),
                raw_text=extracted_data.get("raw_text"),
                ocr_confidence=extracted_data.get("ocr_confidence"),
                extraction_status="completed"
            )
            db.add(invoice)
            db.flush()  # Get invoice ID
        
        # Add invoice items if any
        items_data = extracted_data.get("items", [])
        if items_data:
            # Delete existing items if updating
            if existing_invoice:
                db.query(InvoiceItem).filter(
                    InvoiceItem.invoice_id == invoice.id
                ).delete()
            
            for item_data in items_data:
                item = InvoiceItem(
                    invoice_id=invoice.id,
                    description=item_data.get("description", ""),
                    quantity=item_data.get("quantity", 1.0),
                    unit_price=item_data.get("unit_price"),
                    discount=item_data.get("discount", 0.0),
                    tax_rate=item_data.get("tax_rate", 0.0),
                    tax_amount=item_data.get("tax_amount", 0.0),
                    total=item_data.get("total", 0.0)
                )
                db.add(item)
        
        db.commit()
        db.refresh(invoice)
        
        # Prepare response
        response_data = ExtractedInvoiceData(
            invoice_number=extracted_data.get("invoice_number"),
            issue_date=extracted_data.get("issue_date"),
            due_date=extracted_data.get("due_date"),
            amounts=extracted_data.get("amounts", {}),
            supplier=extracted_data.get("supplier", {}),
            customer=extracted_data.get("customer", {}),
            items=extracted_data.get("items", []),
            raw_text=extracted_data.get("raw_text"),
            ocr_confidence=extracted_data.get("ocr_confidence")
        )
        
        return InvoiceUploadResponse(
            success=True,
            message="Invoice processed and saved successfully",
            invoice_id=invoice.id,
            extracted_data=response_data
        )
        
    except Exception as e:
        # Update invoice status if it was created
        if 'invoice' in locals() and invoice.id:
            invoice.extraction_status = "failed"
            db.commit()
        
        raise HTTPException(
            status_code=500,
            detail=f"Error processing invoice: {str(e)}"
        )


@router.post("/invoices/batch", response_model=List[InvoiceUploadResponse])
async def upload_invoices_batch(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload and process multiple invoice images
    
    - **files**: List of invoice image files
    - Returns list of extracted invoice data
    """
    results = []
    
    for file in files:
        try:
            result = await upload_invoice(file, db)
            results.append(result)
        except Exception as e:
            results.append(InvoiceUploadResponse(
                success=False,
                message=f"Error processing {file.filename}: {str(e)}"
            ))
    
    return results


@router.get("/invoice-image/{invoice_id}")
async def get_invoice_image_info(invoice_id: int, db: Session = Depends(get_db)):
    """Get invoice image information"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    has_image = invoice.image_path is not None and os.path.exists(invoice.image_path)
    
    return {
        "filename": Path(invoice.image_path).name if invoice.image_path else None,
        "path": invoice.image_path or "",
        "has_image": has_image
    }


@router.post("/invoice-image/{invoice_id}")
async def upload_invoice_image(
    invoice_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload/replace invoice image for an existing invoice"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Validate file type
    allowed_extensions = {".png", ".jpg", ".jpeg", ".pdf"}
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Delete old image if exists
    if invoice.image_path and os.path.exists(invoice.image_path):
        try:
            os.remove(invoice.image_path)
        except Exception as e:
            print(f"Warning: Could not delete old image file: {e}")
    
    # Save new file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{timestamp}_{file.filename}"
    file_path = UPLOAD_DIR / safe_filename
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")
    
    # Update invoice with new image path
    invoice.image_path = str(file_path)
    db.commit()
    db.refresh(invoice)
    
    return {
        "message": "Invoice image uploaded successfully",
        "success": True,
        "filename": safe_filename,
        "path": str(file_path)
    }


@router.delete("/invoice-image/{invoice_id}")
async def delete_invoice_image(invoice_id: int, db: Session = Depends(get_db)):
    """Delete invoice image"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Delete the image file if it exists
    if invoice.image_path and os.path.exists(invoice.image_path):
        try:
            os.remove(invoice.image_path)
        except Exception as e:
            # Log error but don't fail - file might already be deleted
            print(f"Warning: Could not delete image file: {e}")
    
    # Clear image path from database
    invoice.image_path = None
    db.commit()
    
    return {
        "message": "Invoice image deleted successfully",
        "success": True
    }


@router.get("/status")
async def get_upload_status():
    """Get upload directory status"""
    upload_count = len(list(UPLOAD_DIR.glob("*"))) if UPLOAD_DIR.exists() else 0
    return {
        "upload_directory": str(UPLOAD_DIR),
        "total_files": upload_count,
        "status": "ready"
    }
