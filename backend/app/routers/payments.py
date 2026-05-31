"""
Payment CRUD operations.
"""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import models
from ..database import get_db
from ..schemas import Payment, PaymentCheckoutRequest, PaymentCheckoutResponse, PaymentCreate, PaymentUpdate
from ..services.audit_service import create_audit_event
from ..services.forecast_service import build_forecast
from ..services.payment_provider import create_checkout_session, parse_checkout_session

router = APIRouter()


def _refresh_invoice_status(invoice: models.Invoice, db: Session) -> None:
    total_paid = sum(payment.amount for payment in invoice.payments)
    if total_paid >= (invoice.total or 0.0) and (invoice.total or 0.0) > 0:
        invoice.status = "paid"
    elif total_paid > 0:
        invoice.status = "partially_paid"
    elif invoice.due_date and invoice.due_date < date.today():
        invoice.status = "overdue"
    elif invoice.status == "paid" and total_paid < (invoice.total or 0.0):
        invoice.status = "pending"
    elif not invoice.status:
        invoice.status = "pending"
    db.flush()


def _ensure_invoice_payment_allowed(invoice: models.Invoice) -> None:
    if (invoice.approval_status or "pending").lower() != "approved":
        raise HTTPException(
            status_code=400,
            detail="Invoice must be approved before payments can be recorded",
        )


def _refresh_forecast(invoice_id: int, db: Session) -> None:
    try:
        build_forecast(invoice_id, db)
    except ValueError:
        return


@router.get("/", response_model=List[Payment])
async def get_payments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Payment).offset(skip).limit(limit).all()


@router.get("/invoice/{invoice_id}", response_model=List[Payment])
async def get_payments_for_invoice(invoice_id: int, db: Session = Depends(get_db)):
    return db.query(models.Payment).filter(models.Payment.invoice_id == invoice_id).all()


@router.get("/{payment_id}", response_model=Payment)
async def get_payment(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.post("/provider/checkout", response_model=PaymentCheckoutResponse)
async def create_provider_checkout(payload: PaymentCheckoutRequest, db: Session = Depends(get_db)):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == payload.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=400, detail="Invoice not found")
    _ensure_invoice_payment_allowed(invoice)
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Checkout amount must be greater than zero")

    session = create_checkout_session(invoice_id=invoice.id, amount=payload.amount)
    create_audit_event(
        db,
        invoice_id=invoice.id,
        event_type="payment_checkout_created",
        title="Payment checkout created",
        message=f"{session['provider']} checkout session created for {payload.amount:.2f} TRY.",
        actor=session["provider"],
        metadata={"checkout_session_id": session["checkout_session_id"], "amount": payload.amount},
    )
    db.commit()
    return session


@router.post("/provider/checkout/{checkout_session_id}/complete", response_model=Payment)
async def complete_provider_checkout(checkout_session_id: str, db: Session = Depends(get_db)):
    try:
        session = parse_checkout_session(checkout_session_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    invoice = db.query(models.Invoice).filter(models.Invoice.id == session["invoice_id"]).first()
    if not invoice:
        raise HTTPException(status_code=400, detail="Invoice not found")
    _ensure_invoice_payment_allowed(invoice)

    existing_payment = (
        db.query(models.Payment)
        .filter(models.Payment.reference == checkout_session_id)
        .first()
    )
    if existing_payment:
        create_audit_event(
            db,
            invoice_id=existing_payment.invoice_id,
            event_type="payment_provider_duplicate",
            title="Duplicate checkout callback ignored",
            message="MockPay Sandbox completion was received again and existing payment was reused.",
            actor="MockPay Sandbox",
            metadata={"checkout_session_id": checkout_session_id, "payment_id": existing_payment.id},
        )
        db.commit()
        return existing_payment

    db_payment = models.Payment(
        invoice_id=invoice.id,
        amount=float(session["amount"]),
        payment_date=date.today(),
        payment_method="MockPay Sandbox",
        reference=checkout_session_id,
        notes="Completed through MockPay sandbox checkout.",
    )
    db.add(db_payment)
    db.flush()
    _refresh_invoice_status(invoice, db)
    create_audit_event(
        db,
        invoice_id=invoice.id,
        event_type="payment_provider_completed",
        title="Payment provider checkout completed",
        message=f"MockPay Sandbox confirmed {db_payment.amount:.2f} TRY.",
        actor="MockPay Sandbox",
        metadata={"checkout_session_id": checkout_session_id, "payment_id": db_payment.id},
    )
    db.commit()
    db.refresh(db_payment)
    _refresh_forecast(invoice.id, db)
    return db_payment


@router.post("/", response_model=Payment)
async def create_payment(payment: PaymentCreate, db: Session = Depends(get_db)):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == payment.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=400, detail="Invoice not found")
    _ensure_invoice_payment_allowed(invoice)

    db_payment = models.Payment(**payment.dict())
    db.add(db_payment)
    db.flush()
    _refresh_invoice_status(invoice, db)
    create_audit_event(
        db,
        invoice_id=invoice.id,
        event_type="payment_created",
        title="Payment recorded",
        message=f"Payment of {db_payment.amount:.2f} recorded.",
        metadata={"amount": db_payment.amount, "payment_date": db_payment.payment_date.isoformat()},
    )
    db.commit()
    db.refresh(db_payment)
    _refresh_forecast(invoice.id, db)
    return db_payment


@router.put("/{payment_id}", response_model=Payment)
async def update_payment(payment_id: int, payment_update: PaymentUpdate, db: Session = Depends(get_db)):
    db_payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    for field, value in payment_update.dict(exclude_unset=True).items():
        setattr(db_payment, field, value)

    invoice = db.query(models.Invoice).filter(models.Invoice.id == db_payment.invoice_id).first()
    if invoice:
        _ensure_invoice_payment_allowed(invoice)
        _refresh_invoice_status(invoice, db)
        create_audit_event(
            db,
            invoice_id=invoice.id,
            event_type="payment_updated",
            title="Payment updated",
            message=f"Payment #{db_payment.id} was updated.",
            metadata={"payment_id": db_payment.id},
        )

    db.commit()
    db.refresh(db_payment)
    if invoice:
        _refresh_forecast(invoice.id, db)
    return db_payment


@router.delete("/{payment_id}")
async def delete_payment(payment_id: int, db: Session = Depends(get_db)):
    db_payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    invoice = db.query(models.Invoice).filter(models.Invoice.id == db_payment.invoice_id).first()
    db.delete(db_payment)
    db.flush()
    if invoice:
        _refresh_invoice_status(invoice, db)
        create_audit_event(
            db,
            invoice_id=invoice.id,
            event_type="payment_deleted",
            title="Payment deleted",
            message=f"Payment #{payment_id} was deleted.",
            metadata={"payment_id": payment_id},
        )
    db.commit()
    if invoice:
        _refresh_forecast(invoice.id, db)
    return {"message": "Payment deleted successfully", "success": True}
