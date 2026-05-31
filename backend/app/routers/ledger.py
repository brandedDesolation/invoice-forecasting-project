"""
General ledger routes and summaries.
"""

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas import LedgerEntry, LedgerSummary

router = APIRouter()


@router.get("/", response_model=List[LedgerEntry])
async def get_ledger_entries(db: Session = Depends(get_db)):
    return db.query(models.LedgerEntry).order_by(models.LedgerEntry.entry_date.desc(), models.LedgerEntry.id.desc()).all()


@router.get("/summary", response_model=LedgerSummary)
async def get_ledger_summary(db: Session = Depends(get_db)):
    entries = db.query(models.LedgerEntry).all()
    receivables = sum(entry.debit - entry.credit for entry in entries if entry.account == "Accounts Receivable")
    payables = sum(entry.credit - entry.debit for entry in entries if entry.account == "Accounts Payable")
    cash_collected = sum(entry.debit for entry in entries if entry.account == "Cash")
    expenses = sum(entry.debit for entry in entries if entry.account == "Operating Expenses")
    balance = sum(entry.debit - entry.credit for entry in entries)
    return LedgerSummary(
        receivables=round(receivables, 2),
        payables=round(payables, 2),
        cash_collected=round(cash_collected, 2),
        expenses=round(expenses, 2),
        balance=round(balance, 2),
    )
