"""
Review queue routes for extraction runs.
"""

import json
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models
from ..auth import require_admin_user
from ..database import get_db
from ..schemas import ExtractionRun, ExtractionRunListItem, ExtractionRunReviewUpdate, ReviewQueueResponse
from ..services.audit_service import create_audit_event

router = APIRouter()


def _parse_corrected_fields(raw_value: str | None) -> List[str]:
    try:
        parsed = json.loads(raw_value) if raw_value else []
    except json.JSONDecodeError:
        parsed = []
    return parsed if isinstance(parsed, list) else []


def _to_run_detail(run: models.ExtractionRun) -> ExtractionRun:
    return ExtractionRun(
        id=run.id,
        invoice_id=run.invoice_id,
        source_filename=run.source_filename,
        provider_name=run.provider_name,
        model_version=run.model_version,
        raw_text=run.raw_text,
        original_data=run.original_data,
        corrected_data=run.corrected_data,
        corrected_fields=_parse_corrected_fields(run.corrected_fields),
        field_confidence=run.field_confidence,
        ocr_confidence=run.ocr_confidence,
        overall_confidence=run.overall_confidence,
        review_required=run.review_required,
        correction_count=run.correction_count,
        status=run.status,
        reviewed_by_id=run.reviewed_by_id,
        reviewed_at=run.reviewed_at,
        created_at=run.created_at,
        updated_at=run.updated_at,
    )


def _to_list_item(run: models.ExtractionRun) -> ExtractionRunListItem:
    invoice = run.invoice
    corrected_fields = _parse_corrected_fields(run.corrected_fields)
    return ExtractionRunListItem(
        id=run.id,
        invoice_id=run.invoice_id,
        source_filename=run.source_filename,
        provider_name=run.provider_name,
        model_version=run.model_version,
        ocr_confidence=run.ocr_confidence,
        overall_confidence=run.overall_confidence,
        corrected_fields=corrected_fields if isinstance(corrected_fields, list) else [],
        review_required=run.review_required,
        correction_count=run.correction_count,
        status=run.status,
        reviewed_by_id=run.reviewed_by_id,
        reviewed_at=run.reviewed_at,
        created_at=run.created_at,
        invoice_number=invoice.invoice_number if invoice else None,
        customer_name=invoice.customer.name if invoice and invoice.customer else None,
        supplier_name=invoice.supplier.name if invoice and invoice.supplier else None,
    )


@router.get("/queue", response_model=ReviewQueueResponse)
async def get_review_queue(
    status: str | None = None,
    review_required: bool | None = True,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin_user),
):
    query = db.query(models.ExtractionRun).order_by(models.ExtractionRun.created_at.desc())
    if status:
        query = query.filter(models.ExtractionRun.status == status)
    if review_required is not None:
        query = query.filter(models.ExtractionRun.review_required == review_required)

    total = query.count()
    runs = query.offset(skip).limit(limit).all()
    items = [_to_list_item(run) for run in runs]
    return ReviewQueueResponse(items=items, total=total)


@router.get("/queue/{run_id}", response_model=ExtractionRun)
async def get_review_run(
    run_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin_user),
):
    run = db.query(models.ExtractionRun).filter(models.ExtractionRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Review item not found")
    return _to_run_detail(run)


@router.patch("/queue/{run_id}", response_model=ExtractionRun)
async def update_review_run(
    run_id: int,
    payload: ExtractionRunReviewUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_user),
):
    run = db.query(models.ExtractionRun).filter(models.ExtractionRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Review item not found")

    run.status = payload.status
    if payload.review_required is not None:
        run.review_required = payload.review_required
    if payload.corrected_data is not None:
        run.corrected_data = json.dumps(payload.corrected_data, ensure_ascii=True)
    if payload.corrected_fields is not None:
        run.corrected_fields = json.dumps(payload.corrected_fields, ensure_ascii=True)
        run.correction_count = len(payload.corrected_fields)
    run.reviewed_by_id = current_user.id
    run.reviewed_at = datetime.utcnow()
    if run.invoice_id:
        create_audit_event(
            db,
            invoice_id=run.invoice_id,
            event_type="review_updated",
            title="Review queue updated",
            message=f"Review item marked as {payload.status}.",
            actor=current_user.name,
            metadata={"review_required": run.review_required, "correction_count": run.correction_count},
        )
    db.commit()
    db.refresh(run)
    return _to_run_detail(run)
