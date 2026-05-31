"""
Workflow endpoints for approvals, reminders, and notifications.
"""

from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..auth import require_admin_user
from ..database import get_db
from ..services.audit_service import create_audit_event
from ..services.forecast_service import build_forecast

router = APIRouter()


def _serialize_invoice(invoice: models.Invoice) -> schemas.WorkflowInvoiceSummary:
    return schemas.WorkflowInvoiceSummary(
        id=invoice.id,
        invoice_number=invoice.invoice_number,
        issue_date=invoice.issue_date,
        due_date=invoice.due_date,
        total=invoice.total or 0.0,
        status=invoice.status,
        approval_status=invoice.approval_status or "pending",
        customer_name=invoice.customer.name if invoice.customer else None,
        supplier_name=invoice.supplier.name if invoice.supplier else None,
        last_reminder_sent_at=invoice.last_reminder_sent_at,
    )


def _create_notification(
    db: Session,
    *,
    invoice_id: int | None,
    notification_type: str,
    title: str,
    message: str,
    action_url: str | None = None,
) -> models.WorkflowNotification:
    notification = models.WorkflowNotification(
        invoice_id=invoice_id,
        type=notification_type,
        title=title,
        message=message,
        status="unread",
        action_url=action_url,
    )
    db.add(notification)
    db.flush()
    return notification


@router.get("/summary", response_model=schemas.WorkflowSummary)
async def get_workflow_summary(db: Session = Depends(get_db)):
    today = date.today()
    due_soon_cutoff = today + timedelta(days=7)

    invoices = (
        db.query(models.Invoice)
        .options(joinedload(models.Invoice.customer), joinedload(models.Invoice.supplier))
        .all()
    )

    actionable_statuses = {"paid", "cancelled", "void"}
    pending_approval_invoices = [
        invoice for invoice in invoices if (invoice.approval_status or "pending").lower() == "pending"
    ]
    due_soon_invoices = [
        invoice
        for invoice in invoices
        if invoice.due_date
        and today <= invoice.due_date <= due_soon_cutoff
        and (invoice.status or "").lower() not in actionable_statuses
    ]
    overdue_unpaid = [
        invoice
        for invoice in invoices
        if invoice.due_date
        and invoice.due_date < today
        and (invoice.status or "").lower() not in actionable_statuses
    ]

    notifications = (
        db.query(models.WorkflowNotification)
        .order_by(models.WorkflowNotification.created_at.desc())
        .limit(12)
        .all()
    )
    unread_notifications = (
        db.query(models.WorkflowNotification)
        .filter(models.WorkflowNotification.status == "unread")
        .count()
    )

    return schemas.WorkflowSummary(
        pending_approvals=len(pending_approval_invoices),
        due_soon=len(due_soon_invoices),
        overdue_unpaid=len(overdue_unpaid),
        unread_notifications=unread_notifications,
        pending_approval_invoices=[_serialize_invoice(invoice) for invoice in pending_approval_invoices[:8]],
        due_soon_invoices=[_serialize_invoice(invoice) for invoice in due_soon_invoices[:8]],
        notifications=[schemas.WorkflowNotification.model_validate(notification) for notification in notifications],
    )


@router.post("/invoice/{invoice_id}/approval", response_model=schemas.Invoice)
async def update_invoice_approval(
    invoice_id: int,
    approval_update: schemas.InvoiceApprovalUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_user),
):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    normalized_status = approval_update.status.lower().strip()
    if normalized_status not in {"approved", "rejected", "pending"}:
        raise HTTPException(status_code=400, detail="Approval status must be approved, rejected, or pending")

    invoice.approval_status = normalized_status
    invoice.approval_note = approval_update.note
    if normalized_status == "pending":
        invoice.approved_by_id = None
        invoice.approved_at = None
    else:
        invoice.approved_by_id = current_user.id
        invoice.approved_at = datetime.utcnow()

    _create_notification(
        db,
        invoice_id=invoice.id,
        notification_type="approval_update",
        title=f"Invoice {invoice.invoice_number} {normalized_status}",
        message=approval_update.note or f"{current_user.name} marked invoice {invoice.invoice_number} as {normalized_status}.",
        action_url=f"/admin/invoices/view/{invoice.id}",
    )
    create_audit_event(
        db,
        invoice_id=invoice.id,
        event_type="approval_updated",
        title=f"Invoice {normalized_status}",
        message=approval_update.note or f"{current_user.name} marked the invoice as {normalized_status}.",
        actor=current_user.name,
        metadata={"approval_status": normalized_status},
    )

    db.commit()

    if normalized_status == "approved":
        try:
            build_forecast(invoice.id, db)
            _create_notification(
                db,
                invoice_id=invoice.id,
                notification_type="forecast_generated",
                title=f"Forecast generated for {invoice.invoice_number}",
                message="Approval triggered an automatic payment-risk forecast.",
                action_url=f"/admin/invoices/view/{invoice.id}",
            )
            create_audit_event(
                db,
                invoice_id=invoice.id,
                event_type="forecast_generated",
                title="Forecast generated",
                message="Approval triggered an automatic payment-risk forecast.",
                actor="VICAI",
            )
            db.commit()
        except ValueError:
            pass

    db.refresh(invoice)
    return invoice


@router.post("/invoice/{invoice_id}/send-reminder", response_model=schemas.MessageResponse)
async def send_invoice_reminder(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_user),
):
    invoice = (
        db.query(models.Invoice)
        .options(joinedload(models.Invoice.customer), joinedload(models.Invoice.supplier))
        .filter(models.Invoice.id == invoice_id)
        .first()
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if not invoice.due_date:
        raise HTTPException(status_code=400, detail="Invoice does not have a due date")
    if (invoice.approval_status or "pending").lower() != "approved":
        raise HTTPException(status_code=400, detail="Invoice must be approved before reminders can be queued")

    invoice.last_reminder_sent_at = datetime.utcnow()
    supplier_name = invoice.supplier.name if invoice.supplier else "supplier"
    _create_notification(
        db,
        invoice_id=invoice.id,
        notification_type="payment_reminder",
        title=f"Reminder queued for {invoice.invoice_number}",
        message=f"{current_user.name} queued a reminder for {supplier_name} on invoice {invoice.invoice_number}.",
        action_url=f"/admin/invoices/view/{invoice.id}",
    )
    create_audit_event(
        db,
        invoice_id=invoice.id,
        event_type="reminder_queued",
        title="Reminder queued",
        message=f"{current_user.name} queued a reminder for invoice {invoice.invoice_number}.",
        actor=current_user.name,
    )
    db.commit()

    return schemas.MessageResponse(message="Reminder queued successfully", success=True)


@router.post("/notifications/{notification_id}/read", response_model=schemas.WorkflowNotification)
async def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    notification = db.query(models.WorkflowNotification).filter(models.WorkflowNotification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.status = "read"
    notification.read_at = datetime.utcnow()
    db.commit()
    db.refresh(notification)
    return schemas.WorkflowNotification.model_validate(notification)
