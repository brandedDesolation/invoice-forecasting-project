"""
Upload router for invoice image processing.
"""

import json
import mimetypes
import os
import shutil
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from dateutil import parser as date_parser
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..auth import require_admin_user
from ..database import get_db
from ..models import Customer, ExtractionRun, Invoice, InvoiceItem, Supplier, User, WorkflowNotification
from ..schemas import ExtractedInvoiceData, InvoiceUploadResponse
from ..services.document_extraction import get_document_extraction_service
from ..services.audit_service import create_audit_event

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".pdf"}


def get_or_create_supplier(db: Session, supplier_data: dict) -> Supplier:
    """Get existing supplier or create new one"""
    if supplier_data.get("tax_id"):
        supplier = db.query(Supplier).filter(Supplier.tax_id == supplier_data["tax_id"]).first()
        if supplier:
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

    if supplier_data.get("name"):
        supplier = db.query(Supplier).filter(Supplier.name.ilike(f"%{supplier_data['name']}%")).first()
        if supplier:
            return supplier

    supplier = Supplier(
        name=supplier_data.get("name") or "Unknown Supplier",
        tax_id=supplier_data.get("tax_id"),
        address=supplier_data.get("address"),
        phone=supplier_data.get("phone"),
        email=supplier_data.get("email"),
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


def get_or_create_customer(db: Session, customer_data: dict) -> Customer:
    """Get existing customer or create new one"""
    if customer_data.get("tax_id"):
        customer = db.query(Customer).filter(Customer.tax_id == customer_data["tax_id"]).first()
        if customer:
            return customer

    if customer_data.get("name"):
        customer = db.query(Customer).filter(Customer.name.ilike(f"%{customer_data['name']}%")).first()
        if customer:
            return customer

    customer = Customer(
        name=customer_data.get("name") or "Unknown Customer",
        tax_id=customer_data.get("tax_id"),
        address=customer_data.get("address"),
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def _serialize_json(data: Any) -> str:
    def _default(value: Any) -> Any:
        if isinstance(value, (date, datetime)):
            return value.isoformat()
        return str(value)

    return json.dumps(data, default=_default, ensure_ascii=True)


def _deserialize_json(data: Optional[str], fallback: Any) -> Any:
    if not data:
        return fallback
    try:
        return json.loads(data)
    except json.JSONDecodeError:
        return fallback


def _parse_date_safe(date_value: Any) -> Optional[date]:
    if date_value is None or date_value == "":
        return None
    if isinstance(date_value, datetime):
        return date_value.date()
    if isinstance(date_value, date):
        return date_value
    if isinstance(date_value, str):
        try:
            return date_parser.parse(date_value, dayfirst=True).date()
        except Exception:
            return None
    return None


def _save_uploaded_file(file: UploadFile) -> Path:
    file_ext = Path(file.filename or "").suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{timestamp}_{file.filename}"
    file_path = UPLOAD_DIR / safe_filename
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error saving file: {str(exc)}") from exc
    return file_path


def _parse_items(items_json: Optional[str]) -> List[Dict[str, Any]]:
    items = _deserialize_json(items_json, [])
    if not isinstance(items, list):
        return []

    parsed_items: List[Dict[str, Any]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        parsed_items.append({
            "description": item.get("description") or "Invoice item",
            "quantity": float(item.get("quantity", 1.0) or 1.0),
            "unit_price": float(item["unit_price"]) if item.get("unit_price") not in (None, "") else None,
            "discount": float(item.get("discount", 0.0) or 0.0),
            "tax_rate": float(item.get("tax_rate", 0.0) or 0.0),
            "tax_amount": float(item.get("tax_amount", 0.0) or 0.0),
            "total": float(item.get("total", 0.0) or 0.0),
        })
    return parsed_items


def _save_invoice_items(db: Session, invoice_id: int, items: List[Dict[str, Any]]) -> None:
    db.query(InvoiceItem).filter(InvoiceItem.invoice_id == invoice_id).delete()
    for item_data in items:
        db.add(InvoiceItem(invoice_id=invoice_id, **item_data))


def _collect_correction_fields(original_data: Dict[str, Any], corrected_data: Dict[str, Any]) -> List[str]:
    tracked_paths = [
        ("invoice_number",),
        ("issue_date",),
        ("due_date",),
        ("amounts", "subtotal"),
        ("amounts", "tax"),
        ("amounts", "total"),
        ("customer", "name"),
        ("customer", "tax_id"),
        ("supplier", "name"),
        ("supplier", "tax_id"),
        ("items",),
    ]

    def _get_value(payload: Dict[str, Any], path: tuple) -> Any:
        current: Any = payload
        for part in path:
            if not isinstance(current, dict):
                return None
            current = current.get(part)
        return current

    changes: List[str] = []
    for path in tracked_paths:
        original_value = _get_value(original_data, path)
        corrected_value = _get_value(corrected_data, path)
        if json.dumps(original_value, default=str, sort_keys=True) != json.dumps(corrected_value, default=str, sort_keys=True):
            changes.append(".".join(path))
    return changes


def _create_extraction_run(db: Session, source_filename: str, extracted_data: Dict[str, Any]) -> ExtractionRun:
    extraction_run = ExtractionRun(
        source_filename=source_filename,
        provider_name=extracted_data.get("provider_name") or "local_ocr",
        model_version=extracted_data.get("model_version"),
        raw_text=extracted_data.get("raw_text"),
        original_data=_serialize_json(extracted_data),
        corrected_data=None,
        corrected_fields=_serialize_json([]),
        field_confidence=_serialize_json(extracted_data.get("field_confidence", {})),
        ocr_confidence=extracted_data.get("ocr_confidence"),
        overall_confidence=extracted_data.get("overall_confidence"),
        review_required=bool(extracted_data.get("review_required")),
        correction_count=0,
        status="extracted",
    )
    db.add(extraction_run)
    db.commit()
    db.refresh(extraction_run)
    return extraction_run


def _build_response_data(extracted_data: Dict[str, Any]) -> ExtractedInvoiceData:
    return ExtractedInvoiceData(
        invoice_number=extracted_data.get("invoice_number"),
        issue_date=extracted_data.get("issue_date"),
        due_date=extracted_data.get("due_date"),
        amounts=extracted_data.get("amounts", {}),
        supplier=extracted_data.get("supplier", {}),
        customer=extracted_data.get("customer", {}),
        items=extracted_data.get("items", []),
        raw_text=extracted_data.get("raw_text"),
        ocr_confidence=extracted_data.get("ocr_confidence"),
        overall_confidence=extracted_data.get("overall_confidence"),
        field_confidence=extracted_data.get("field_confidence", {}),
        provider_name=extracted_data.get("provider_name"),
        model_version=extracted_data.get("model_version"),
        review_required=bool(extracted_data.get("review_required")),
    )


@router.post("/invoice", response_model=InvoiceUploadResponse)
async def upload_invoice(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload and process invoice image, then save immediately.
    """
    file_path = _save_uploaded_file(file)

    try:
        extraction_service = get_document_extraction_service()
        extracted_data = extraction_service.extract_document(str(file_path))
        extraction_run = _create_extraction_run(db, file.filename or file_path.name, extracted_data)

        supplier = get_or_create_supplier(db, extracted_data.get("supplier", {}))
        customer = get_or_create_customer(db, extracted_data.get("customer", {}))

        existing_invoice = None
        if extracted_data.get("invoice_number"):
            existing_invoice = db.query(Invoice).filter(
                Invoice.invoice_number == extracted_data["invoice_number"],
                Invoice.supplier_id == supplier.id,
            ).first()

        issue_date = _parse_date_safe(extracted_data.get("issue_date")) or datetime.now().date()
        due_date = _parse_date_safe(extracted_data.get("due_date"))

        if existing_invoice:
            invoice = existing_invoice
            invoice.issue_date = issue_date
            invoice.due_date = due_date or invoice.due_date
            invoice.subtotal = extracted_data.get("amounts", {}).get("subtotal", 0.0) or 0.0
            invoice.tax = extracted_data.get("amounts", {}).get("tax", 0.0) or 0.0
            invoice.total = extracted_data.get("amounts", {}).get("total", 0.0) or 0.0
            invoice.image_path = str(file_path)
            invoice.raw_text = extracted_data.get("raw_text")
            invoice.ocr_confidence = extracted_data.get("overall_confidence") or extracted_data.get("ocr_confidence")
            invoice.extraction_status = "completed"
            invoice.status = invoice.status or "pending"
            invoice.approval_status = invoice.approval_status or "pending"
        else:
            invoice = Invoice(
                invoice_number=extracted_data.get("invoice_number") or f"INV-{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                issue_date=issue_date,
                due_date=due_date,
                subtotal=extracted_data.get("amounts", {}).get("subtotal", 0.0) or 0.0,
                tax=extracted_data.get("amounts", {}).get("tax", 0.0) or 0.0,
                total=extracted_data.get("amounts", {}).get("total", 0.0) or 0.0,
                customer_id=customer.id,
                supplier_id=supplier.id,
                image_path=str(file_path),
                raw_text=extracted_data.get("raw_text"),
                ocr_confidence=extracted_data.get("overall_confidence") or extracted_data.get("ocr_confidence"),
                extraction_status="completed",
                status="pending",
                approval_status="pending",
            )
            db.add(invoice)
            db.flush()
            db.add(WorkflowNotification(
                invoice_id=invoice.id,
                type="approval_required",
                title=f"Invoice {invoice.invoice_number} awaiting approval",
                message="An uploaded invoice was extracted and is ready for approval.",
                action_url=f"/admin/invoices/view/{invoice.id}",
            ))
            create_audit_event(
                db,
                invoice_id=invoice.id,
                event_type="invoice_uploaded",
                title="Invoice uploaded",
                message=f"{file.filename} was uploaded and extracted.",
                metadata={"source_filename": file.filename, "review_required": bool(extraction_run.review_required)},
            )

        _save_invoice_items(db, invoice.id, extracted_data.get("items", []))
        extraction_run.invoice_id = invoice.id
        extraction_run.status = "saved_without_review" if not extraction_run.review_required else "saved_pending_review"
        if existing_invoice:
            create_audit_event(
                db,
                invoice_id=invoice.id,
                event_type="invoice_reprocessed",
                title="Invoice reprocessed",
                message=f"{file.filename} refreshed OCR data for this invoice.",
                metadata={"source_filename": file.filename},
            )

        db.commit()
        db.refresh(invoice)

        return InvoiceUploadResponse(
            success=True,
            message="Invoice processed and saved successfully",
            invoice_id=invoice.id,
            extracted_data=_build_response_data(extracted_data),
            extraction_run_id=extraction_run.id,
        )
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing invoice: {str(exc)}") from exc


@router.post("/invoices/batch", response_model=List[InvoiceUploadResponse])
async def upload_invoices_batch(files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    results = []
    for file in files:
        try:
            result = await upload_invoice(file, db)
            results.append(result)
        except Exception as exc:
            results.append(InvoiceUploadResponse(success=False, message=f"Error processing {file.filename}: {str(exc)}"))
    return results


@router.get("/invoice-image/{invoice_id}")
async def get_invoice_image_info(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    has_image = invoice.image_path is not None and os.path.exists(invoice.image_path)
    return {
        "filename": Path(invoice.image_path).name if invoice.image_path else None,
        "path": invoice.image_path or "",
        "has_image": has_image,
    }


@router.get("/invoice-image/{invoice_id}/file")
async def get_invoice_image_file(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if not invoice.image_path or not os.path.exists(invoice.image_path):
        raise HTTPException(status_code=404, detail="Invoice image not found")

    media_type, _ = mimetypes.guess_type(invoice.image_path)
    return FileResponse(invoice.image_path, media_type=media_type or "application/octet-stream", filename=Path(invoice.image_path).name)


@router.post("/invoice-image/{invoice_id}")
async def upload_invoice_image(invoice_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.image_path and os.path.exists(invoice.image_path):
        try:
            os.remove(invoice.image_path)
        except OSError:
            pass

    file_path = _save_uploaded_file(file)
    invoice.image_path = str(file_path)
    db.commit()
    db.refresh(invoice)

    return {
        "message": "Invoice image uploaded successfully",
        "success": True,
        "filename": file_path.name,
        "path": str(file_path),
    }


@router.delete("/invoice-image/{invoice_id}")
async def delete_invoice_image(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.image_path and os.path.exists(invoice.image_path):
        try:
            os.remove(invoice.image_path)
        except OSError:
            pass

    invoice.image_path = None
    db.commit()
    return {"message": "Invoice image deleted successfully", "success": True}


@router.post("/ocr-only")
async def process_ocr_only(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Extract invoice data without saving an invoice yet.
    """
    file_path = _save_uploaded_file(file)

    try:
        extraction_service = get_document_extraction_service()
        extracted_data = extraction_service.extract_document(str(file_path))
        extraction_run = _create_extraction_run(db, file.filename or file_path.name, extracted_data)

        def format_date(value: Any) -> Any:
            if value is None:
                return None
            if hasattr(value, "isoformat"):
                return value.isoformat()
            return str(value)

        return {
            "invoice_number": extracted_data.get("invoice_number"),
            "issue_date": format_date(extracted_data.get("issue_date")),
            "due_date": format_date(extracted_data.get("due_date")),
            "amounts": extracted_data.get("amounts", {}),
            "supplier": extracted_data.get("supplier", {}),
            "customer": extracted_data.get("customer", {}),
            "items": extracted_data.get("items", []),
            "raw_text": extracted_data.get("raw_text", ""),
            "ocr_confidence": extracted_data.get("ocr_confidence", 0),
            "overall_confidence": extracted_data.get("overall_confidence", extracted_data.get("ocr_confidence", 0)),
            "field_confidence": extracted_data.get("field_confidence", {}),
            "provider_name": extracted_data.get("provider_name", "unknown"),
            "model_version": extracted_data.get("model_version"),
            "review_required": bool(extracted_data.get("review_required")),
            "temp_file_path": str(file_path),
            "extraction_run_id": extraction_run.id,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(exc)}") from exc


@router.post("/invoice-with-data")
async def save_invoice_with_data(
    file: UploadFile = File(...),
    invoice_number: str = Form(None),
    issue_date: str = Form(None),
    due_date: str = Form(None),
    subtotal: float = Form(0.0),
    tax: float = Form(0.0),
    total: float = Form(0.0),
    customer_name: str = Form(None),
    customer_tax_id: str = Form(None),
    supplier_name: str = Form(None),
    supplier_tax_id: str = Form(None),
    customer_id: int = Form(None),
    items_json: str = Form("[]"),
    extraction_run_id: int = Form(None),
    original_extracted_data_json: str = Form(None),
    raw_text: str = Form(None),
    ocr_confidence: float = Form(None),
    overall_confidence: float = Form(None),
    field_confidence_json: str = Form(None),
    provider_name: str = Form(None),
    model_version: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
):
    """
    Save invoice with user-reviewed data after OCR extraction.
    """
    file_path = _save_uploaded_file(file)

    try:
        if customer_id:
            customer = db.query(Customer).filter(Customer.id == customer_id).first()
            if not customer:
                raise HTTPException(status_code=404, detail="Selected customer not found")
        elif customer_name:
            customer = get_or_create_customer(db, {"name": customer_name, "tax_id": customer_tax_id})
        else:
            customer = get_or_create_customer(db, {"name": "Unknown Customer"})

        if supplier_name:
            supplier = get_or_create_supplier(db, {"name": supplier_name, "tax_id": supplier_tax_id})
        else:
            supplier = get_or_create_supplier(db, {"name": "Unknown Supplier"})

        parsed_issue_date = _parse_date_safe(issue_date) or datetime.now().date()
        parsed_due_date = _parse_date_safe(due_date)
        parsed_items = _parse_items(items_json)

        invoice = Invoice(
            invoice_number=invoice_number or f"INV-{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            issue_date=parsed_issue_date,
            due_date=parsed_due_date,
            subtotal=subtotal or 0.0,
            tax=tax or 0.0,
            total=total or 0.0,
            customer_id=customer.id,
            supplier_id=supplier.id,
            image_path=str(file_path),
            raw_text=raw_text,
            ocr_confidence=overall_confidence or ocr_confidence,
            extraction_status="completed",
            status="pending",
            approval_status="pending",
        )
        db.add(invoice)
        db.flush()
        db.add(WorkflowNotification(
            invoice_id=invoice.id,
            type="approval_required",
            title=f"Invoice {invoice.invoice_number} awaiting approval",
            message="A reviewed invoice was saved and is ready for approval.",
            action_url=f"/admin/invoices/view/{invoice.id}",
        ))
        create_audit_event(
            db,
            invoice_id=invoice.id,
            event_type="reviewed_invoice_saved",
            title="Reviewed invoice saved",
            message="Human-reviewed extraction data was saved as an invoice.",
            actor=current_user.name,
            metadata={"source_filename": file.filename},
        )

        _save_invoice_items(db, invoice.id, parsed_items)

        corrected_payload = {
            "invoice_number": invoice_number,
            "issue_date": _parse_date_safe(issue_date),
            "due_date": _parse_date_safe(due_date),
            "amounts": {"subtotal": subtotal or 0.0, "tax": tax or 0.0, "total": total or 0.0},
            "customer": {"name": customer_name, "tax_id": customer_tax_id},
            "supplier": {"name": supplier_name, "tax_id": supplier_tax_id},
            "items": parsed_items,
            "raw_text": raw_text,
            "ocr_confidence": ocr_confidence,
            "overall_confidence": overall_confidence,
            "field_confidence": _deserialize_json(field_confidence_json, {}),
            "provider_name": provider_name,
            "model_version": model_version,
        }

        original_payload = _deserialize_json(original_extracted_data_json, {})
        extraction_run = None
        if extraction_run_id:
            extraction_run = db.query(ExtractionRun).filter(ExtractionRun.id == extraction_run_id).first()
            if extraction_run:
                original_payload = _deserialize_json(extraction_run.original_data, original_payload)

        corrected_fields = _collect_correction_fields(original_payload, corrected_payload) if original_payload else []
        correction_count = len(corrected_fields)
        if extraction_run:
            extraction_run.invoice_id = invoice.id
            extraction_run.corrected_data = _serialize_json(corrected_payload)
            extraction_run.corrected_fields = _serialize_json(corrected_fields)
            extraction_run.correction_count = correction_count
            extraction_run.status = "reviewed_saved"
            extraction_run.review_required = bool(extraction_run.review_required or correction_count > 0)
            extraction_run.reviewed_by_id = current_user.id
            extraction_run.reviewed_at = datetime.utcnow()
            create_audit_event(
                db,
                invoice_id=invoice.id,
                event_type="extraction_reviewed",
                title="Extraction reviewed",
                message=f"{correction_count} field correction(s) captured.",
                actor=current_user.name,
                metadata={"corrected_fields": corrected_fields},
            )

        db.commit()
        db.refresh(invoice)

        return {
            "success": True,
            "message": "Invoice saved successfully",
            "invoice_id": invoice.id,
            "extraction_run_id": extraction_run.id if extraction_run else None,
        }
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error saving invoice: {str(exc)}") from exc


@router.get("/status")
async def get_upload_status():
    upload_count = len(list(UPLOAD_DIR.glob("*"))) if UPLOAD_DIR.exists() else 0
    return {
        "upload_directory": str(UPLOAD_DIR),
        "total_files": upload_count,
        "status": "ready",
    }
