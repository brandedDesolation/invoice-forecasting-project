"""
Supplier CRUD operations.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import models
from ..database import get_db
from ..schemas import Supplier, SupplierCreate, SupplierUpdate

router = APIRouter()


@router.get("/", response_model=List[Supplier])
async def get_suppliers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Supplier).offset(skip).limit(limit).all()


@router.get("/{supplier_id}", response_model=Supplier)
async def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.post("/", response_model=Supplier)
async def create_supplier(supplier: SupplierCreate, db: Session = Depends(get_db)):
    db_supplier = models.Supplier(**supplier.dict())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@router.put("/{supplier_id}", response_model=Supplier)
async def update_supplier(supplier_id: int, supplier_update: SupplierUpdate, db: Session = Depends(get_db)):
    db_supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    for field, value in supplier_update.dict(exclude_unset=True).items():
        setattr(db_supplier, field, value)

    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@router.delete("/{supplier_id}")
async def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    db_supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    has_invoices = db.query(models.Invoice).filter(models.Invoice.supplier_id == supplier_id).first()
    if has_invoices:
        raise HTTPException(status_code=400, detail="Cannot delete supplier with linked invoices")

    db.delete(db_supplier)
    db.commit()
    return {"message": "Supplier deleted successfully", "success": True}
