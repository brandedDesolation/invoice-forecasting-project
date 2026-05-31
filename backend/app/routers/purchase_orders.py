"""
Purchase order routes for procurement workflow.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas import PurchaseOrder, PurchaseOrderCreate, PurchaseOrderUpdate

router = APIRouter()


def _replace_items(db: Session, purchase_order: models.PurchaseOrder, items) -> None:
    purchase_order.items.clear()
    for item in items:
        purchase_order.items.append(models.PurchaseOrderItem(**item.model_dump()))


@router.get("/", response_model=List[PurchaseOrder])
async def get_purchase_orders(skip: int = 0, limit: int = 100, status: str | None = None, db: Session = Depends(get_db)):
    query = db.query(models.PurchaseOrder).order_by(models.PurchaseOrder.created_at.desc())
    if status:
        query = query.filter(models.PurchaseOrder.status == status)
    return query.offset(skip).limit(limit).all()


@router.post("/", response_model=PurchaseOrder)
async def create_purchase_order(payload: PurchaseOrderCreate, db: Session = Depends(get_db)):
    if db.query(models.PurchaseOrder).filter(models.PurchaseOrder.po_number == payload.po_number).first():
        raise HTTPException(status_code=400, detail="Purchase order number already exists")

    data = payload.model_dump(exclude={"items"})
    purchase_order = models.PurchaseOrder(**data)
    db.add(purchase_order)
    db.flush()
    _replace_items(db, purchase_order, payload.items)
    db.commit()
    db.refresh(purchase_order)
    return purchase_order


@router.get("/{purchase_order_id}", response_model=PurchaseOrder)
async def get_purchase_order(purchase_order_id: int, db: Session = Depends(get_db)):
    purchase_order = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.id == purchase_order_id).first()
    if not purchase_order:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return purchase_order


@router.put("/{purchase_order_id}", response_model=PurchaseOrder)
async def update_purchase_order(purchase_order_id: int, payload: PurchaseOrderUpdate, db: Session = Depends(get_db)):
    purchase_order = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.id == purchase_order_id).first()
    if not purchase_order:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    data = payload.model_dump(exclude_unset=True, exclude={"items"})
    for field, value in data.items():
        setattr(purchase_order, field, value)
    if payload.items is not None:
        _replace_items(db, purchase_order, payload.items)

    db.commit()
    db.refresh(purchase_order)
    return purchase_order
