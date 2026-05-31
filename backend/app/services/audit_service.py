"""
Audit event helpers for invoice lifecycle tracking.
"""

from __future__ import annotations

import json
from typing import Any

from sqlalchemy.orm import Session

from .. import models


def create_audit_event(
    db: Session,
    *,
    invoice_id: int,
    event_type: str,
    title: str,
    message: str | None = None,
    actor: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> models.AuditEvent:
    event = models.AuditEvent(
        invoice_id=invoice_id,
        event_type=event_type,
        title=title,
        message=message,
        actor=actor,
        metadata_json=json.dumps(metadata, ensure_ascii=True) if metadata else None,
    )
    db.add(event)
    db.flush()
    return event
