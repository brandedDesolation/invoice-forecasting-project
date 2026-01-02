"""
Analytics endpoints for financial insights and metrics
Uses invoice.status field instead of Payment table for paid calculations
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, case
from typing import List, Optional
from datetime import date, datetime, timedelta

from ..database import get_db
from .. import models
from pydantic import BaseModel

router = APIRouter()


# Response schemas
class RevenueMetrics(BaseModel):
    total_revenue: float
    paid_revenue: float
    pending_revenue: float
    overdue_revenue: float
    revenue_change_percent: Optional[float] = None


class InvoiceMetrics(BaseModel):
    total_invoices: int
    paid_invoices: int
    pending_invoices: int
    overdue_invoices: int
    invoices_change_percent: Optional[float] = None


class InvoiceTrendData(BaseModel):
    date: str
    amount: float
    count: int


class TimeSeriesData(BaseModel):
    date: str
    value: float
    label: str


class AnalyticsOverview(BaseModel):
    revenue: RevenueMetrics
    invoices: InvoiceMetrics
    invoice_trends: List[InvoiceTrendData]
    revenue_forecast: List[TimeSeriesData]


def get_invoice_status(invoice, today: date) -> str:
    """
    Determine invoice status - uses manual status if set, otherwise calculates from due date
    """
    if invoice.status:
        return invoice.status.lower()
    
    # Auto-calculate based on due date
    if invoice.due_date:
        if invoice.due_date < today:
            return "overdue"
    return "pending"


@router.get("/overview")
async def get_analytics_overview(
    days: int = 30,
    start_date_str: Optional[str] = None,
    end_date_str: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get comprehensive analytics overview using invoice.status"""
    
    today = date.today()
    
    # Use custom date range if provided
    if start_date_str and end_date_str:
        try:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
            days = (end_date - start_date).days or 1
        except ValueError:
            start_date = today - timedelta(days=days)
            end_date = today
    else:
        start_date = today - timedelta(days=days)
        end_date = today
    
    previous_period_start = start_date - timedelta(days=days)
    
    # Get all invoices
    from sqlalchemy.orm import joinedload
    all_invoices = db.query(models.Invoice).options(
        joinedload(models.Invoice.items)
    ).all()
    
    # Calculate revenue and invoice counts based on status
    total_revenue = 0.0
    paid_revenue = 0.0
    pending_revenue = 0.0
    overdue_revenue = 0.0
    
    paid_invoices = 0
    pending_invoices = 0
    overdue_invoices = 0
    
    for invoice in all_invoices:
        total_revenue += invoice.total
        status = get_invoice_status(invoice, today)
        
        if status == "paid":
            paid_revenue += invoice.total
            paid_invoices += 1
        elif status == "overdue":
            overdue_revenue += invoice.total
            overdue_invoices += 1
        elif status == "cancelled" or status == "void":
            # Don't count cancelled/void invoices in pending/overdue
            pass
        else:  # pending or unknown
            pending_revenue += invoice.total
            pending_invoices += 1
    
    total_invoices = len(all_invoices)
    
    # Previous period revenue for comparison
    prev_period_revenue = db.query(func.sum(models.Invoice.total)).filter(
        and_(
            models.Invoice.issue_date >= previous_period_start,
            models.Invoice.issue_date < start_date
        )
    ).scalar() or 0.0
    current_period_revenue = db.query(func.sum(models.Invoice.total)).filter(
        models.Invoice.issue_date >= start_date
    ).scalar() or 0.0
    
    revenue_change = 0.0
    if prev_period_revenue > 0:
        revenue_change = ((current_period_revenue - prev_period_revenue) / prev_period_revenue) * 100
    
    # Previous period invoice count for comparison
    prev_period_invoices = db.query(func.count(models.Invoice.id)).filter(
        and_(
            models.Invoice.issue_date >= previous_period_start,
            models.Invoice.issue_date < start_date
        )
    ).scalar() or 0
    invoices_change = 0.0
    if prev_period_invoices > 0:
        invoices_change = ((total_invoices - prev_period_invoices) / prev_period_invoices) * 100
    
    # Invoice trends (invoices created per day over the period)
    invoice_trends_data = []
    for i in range(days):
        trend_date = start_date + timedelta(days=i)
        day_invoices = db.query(
            func.sum(models.Invoice.total),
            func.count(models.Invoice.id)
        ).filter(
            func.date(models.Invoice.issue_date) == trend_date
        ).first()
        
        invoice_trends_data.append({
            "date": trend_date.isoformat(),
            "amount": float(day_invoices[0] or 0),
            "count": int(day_invoices[1] or 0)
        })
    
    # Revenue forecast (next 30 days based on average)
    revenue_forecast = []
    avg_daily_revenue = current_period_revenue / days if days > 0 else 0
    for i in range(30):
        forecast_date = today + timedelta(days=i)
        revenue_forecast.append({
            "date": forecast_date.isoformat(),
            "value": avg_daily_revenue * (i + 1),
            "label": f"Day {i + 1}"
        })
    
    return AnalyticsOverview(
        revenue=RevenueMetrics(
            total_revenue=float(total_revenue),
            paid_revenue=float(paid_revenue),
            pending_revenue=float(pending_revenue),
            overdue_revenue=float(overdue_revenue),
            revenue_change_percent=revenue_change
        ),
        invoices=InvoiceMetrics(
            total_invoices=total_invoices,
            paid_invoices=paid_invoices,
            pending_invoices=pending_invoices,
            overdue_invoices=overdue_invoices,
            invoices_change_percent=invoices_change
        ),
        invoice_trends=invoice_trends_data,
        revenue_forecast=revenue_forecast
    )


@router.get("/invoice-trends")
async def get_invoice_trends(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get invoice creation trends over time"""
    start_date = date.today() - timedelta(days=days)
    
    trends = []
    for i in range(days):
        trend_date = start_date + timedelta(days=i)
        day_invoices = db.query(
            func.sum(models.Invoice.total),
            func.count(models.Invoice.id)
        ).filter(
            func.date(models.Invoice.issue_date) == trend_date
        ).first()
        
        trends.append(InvoiceTrendData(
            date=trend_date.isoformat(),
            amount=float(day_invoices[0] or 0),
            count=int(day_invoices[1] or 0)
        ))
    
    return trends


@router.get("/revenue")
async def get_revenue_metrics(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get revenue metrics using invoice.status"""
    today = date.today()
    start_date = today - timedelta(days=days)
    previous_period_start = start_date - timedelta(days=days)
    
    # Get all invoices and calculate by status
    all_invoices = db.query(models.Invoice).all()
    
    total_revenue = 0.0
    paid_revenue = 0.0
    pending_revenue = 0.0
    overdue_revenue = 0.0
    
    for invoice in all_invoices:
        total_revenue += invoice.total
        status = get_invoice_status(invoice, today)
        
        if status == "paid":
            paid_revenue += invoice.total
        elif status == "overdue":
            overdue_revenue += invoice.total
        elif status == "cancelled" or status == "void":
            pass
        else:
            pending_revenue += invoice.total
    
    # Calculate change
    prev_period_revenue = db.query(func.sum(models.Invoice.total)).filter(
        and_(
            models.Invoice.issue_date >= previous_period_start,
            models.Invoice.issue_date < start_date
        )
    ).scalar() or 0.0
    current_period_revenue = db.query(func.sum(models.Invoice.total)).filter(
        models.Invoice.issue_date >= start_date
    ).scalar() or 0.0
    
    revenue_change = 0.0
    if prev_period_revenue > 0:
        revenue_change = ((current_period_revenue - prev_period_revenue) / prev_period_revenue) * 100
    
    return RevenueMetrics(
        total_revenue=float(total_revenue),
        paid_revenue=float(paid_revenue),
        pending_revenue=float(pending_revenue),
        overdue_revenue=float(overdue_revenue),
        revenue_change_percent=revenue_change
    )


@router.get("/invoices")
async def get_invoice_metrics(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get invoice metrics using invoice.status"""
    today = date.today()
    start_date = today - timedelta(days=days)
    previous_period_start = start_date - timedelta(days=days)
    
    # Get all invoices
    all_invoices = db.query(models.Invoice).all()
    total_invoices = len(all_invoices)
    
    # Calculate metrics by status
    paid_invoices = 0
    pending_invoices = 0
    overdue_invoices = 0
    
    for invoice in all_invoices:
        status = get_invoice_status(invoice, today)
        
        if status == "paid":
            paid_invoices += 1
        elif status == "overdue":
            overdue_invoices += 1
        elif status == "cancelled" or status == "void":
            pass
        else:
            pending_invoices += 1
    
    # Calculate change
    prev_period_invoices = db.query(func.count(models.Invoice.id)).filter(
        and_(
            models.Invoice.issue_date >= previous_period_start,
            models.Invoice.issue_date < start_date
        )
    ).scalar() or 0
    invoices_change = 0.0
    if prev_period_invoices > 0:
        invoices_change = ((total_invoices - prev_period_invoices) / prev_period_invoices) * 100
    
    return InvoiceMetrics(
        total_invoices=total_invoices,
        paid_invoices=paid_invoices,
        pending_invoices=pending_invoices,
        overdue_invoices=overdue_invoices,
        invoices_change_percent=invoices_change
    )


@router.get("/revenue-forecast")
async def get_revenue_forecast(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get revenue forecast for next N days"""
    today = date.today()
    start_date = today - timedelta(days=days)
    
    # Calculate average daily revenue
    period_revenue = db.query(func.sum(models.Invoice.total)).filter(
        models.Invoice.issue_date >= start_date
    ).scalar() or 0.0
    
    avg_daily_revenue = period_revenue / days if days > 0 else 0
    
    forecast = []
    for i in range(30):
        forecast_date = today + timedelta(days=i)
        forecast.append(TimeSeriesData(
            date=forecast_date.isoformat(),
            value=avg_daily_revenue * (i + 1),
            label=f"Day {i + 1}"
        ))
    
    return forecast
