"""
Expense routes for company spend management.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas import Expense, ExpenseCreate, ExpenseUpdate

router = APIRouter()


@router.get("/", response_model=List[Expense])
async def get_expenses(category: str | None = None, approval_status: str | None = None, db: Session = Depends(get_db)):
    query = db.query(models.Expense).order_by(models.Expense.expense_date.desc())
    if category:
        query = query.filter(models.Expense.category == category)
    if approval_status:
        query = query.filter(models.Expense.approval_status == approval_status)
    return query.all()


@router.post("/", response_model=Expense)
async def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db)):
    if db.query(models.Expense).filter(models.Expense.expense_number == payload.expense_number).first():
        raise HTTPException(status_code=400, detail="Expense number already exists")
    expense = models.Expense(**payload.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.put("/{expense_id}", response_model=Expense)
async def update_expense(expense_id: int, payload: ExpenseUpdate, db: Session = Depends(get_db)):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    return expense
