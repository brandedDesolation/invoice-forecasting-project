"""
Analytics endpoints for revenue, invoices, forecasts, and AI automation metrics.
"""

from collections import defaultdict
import json
from datetime import date, datetime, timedelta
from typing import Dict, List, Tuple

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter()


def _resolve_date_window(days: int = 30, start_date_str: str = None, end_date_str: str = None) -> Tuple[date, date]:
    if start_date_str and end_date_str:
        return (
            datetime.fromisoformat(start_date_str).date(),
            datetime.fromisoformat(end_date_str).date(),
        )

    end_date = date.today()
    start_date = end_date - timedelta(days=max(days - 1, 0))
    return start_date, end_date


def _previous_window(start_date: date, end_date: date) -> Tuple[date, date]:
    window_days = (end_date - start_date).days + 1
    previous_end = start_date - timedelta(days=1)
    previous_start = previous_end - timedelta(days=window_days - 1)
    return previous_start, previous_end


def _fetch_invoices(db: Session, start_date: date, end_date: date) -> List[models.Invoice]:
    return (
        db.query(models.Invoice)
        .filter(models.Invoice.issue_date >= start_date, models.Invoice.issue_date <= end_date)
        .all()
    )


def _is_overdue(invoice: models.Invoice) -> bool:
    if invoice.status and invoice.status.lower() == "paid":
        return False
    if invoice.status and invoice.status.lower() == "overdue":
        return True
    return bool(invoice.due_date and invoice.due_date < date.today())


def _revenue_metrics(invoices: List[models.Invoice], previous_invoices: List[models.Invoice]) -> Dict[str, float]:
    total_revenue = sum(invoice.total or 0.0 for invoice in invoices)
    paid_revenue = sum(invoice.total or 0.0 for invoice in invoices if (invoice.status or "").lower() == "paid")
    overdue_revenue = sum(invoice.total or 0.0 for invoice in invoices if _is_overdue(invoice))
    pending_revenue = max(total_revenue - paid_revenue - overdue_revenue, 0.0)

    previous_total = sum(invoice.total or 0.0 for invoice in previous_invoices)
    if previous_total > 0:
        revenue_change_percent = ((total_revenue - previous_total) / previous_total) * 100.0
    else:
        revenue_change_percent = 0.0

    return {
        "total_revenue": round(total_revenue, 2),
        "paid_revenue": round(paid_revenue, 2),
        "pending_revenue": round(pending_revenue, 2),
        "overdue_revenue": round(overdue_revenue, 2),
        "revenue_change_percent": round(revenue_change_percent, 2),
    }


def _invoice_metrics(invoices: List[models.Invoice], previous_invoices: List[models.Invoice]) -> Dict[str, float]:
    total_invoices = len(invoices)
    paid_invoices = sum(1 for invoice in invoices if (invoice.status or "").lower() == "paid")
    overdue_invoices = sum(1 for invoice in invoices if _is_overdue(invoice))
    pending_invoices = max(total_invoices - paid_invoices - overdue_invoices, 0)

    previous_total = len(previous_invoices)
    if previous_total > 0:
        change_percent = ((total_invoices - previous_total) / previous_total) * 100.0
    else:
        change_percent = 0.0

    return {
        "total_invoices": total_invoices,
        "paid_invoices": paid_invoices,
        "pending_invoices": pending_invoices,
        "overdue_invoices": overdue_invoices,
        "invoices_change_percent": round(change_percent, 2),
    }


def _invoice_trends(invoices: List[models.Invoice], start_date: date, end_date: date) -> List[Dict[str, float]]:
    daily = {}
    for invoice in invoices:
        key = invoice.issue_date.isoformat()
        daily.setdefault(key, {"amount": 0.0, "count": 0})
        daily[key]["amount"] += invoice.total or 0.0
        daily[key]["count"] += 1

    output: List[Dict[str, float]] = []
    current = start_date
    while current <= end_date:
        key = current.isoformat()
        values = daily.get(key, {"amount": 0.0, "count": 0})
        output.append({"date": key, "amount": round(values["amount"], 2), "count": values["count"]})
        current += timedelta(days=1)
    return output


def _revenue_forecast(invoices: List[models.Invoice], days: int) -> List[Dict[str, float]]:
    if not invoices:
        today = date.today()
        return [
            {"date": (today + timedelta(days=index + 1)).isoformat(), "value": 0.0, "label": "Forecast"}
            for index in range(min(days, 14))
        ]

    daily_totals: Dict[str, float] = {}
    for invoice in invoices:
        key = invoice.issue_date.isoformat()
        daily_totals[key] = daily_totals.get(key, 0.0) + (invoice.total or 0.0)

    recent_values = list(daily_totals.values())[-7:]
    baseline = sum(recent_values) / len(recent_values) if recent_values else 0.0
    forecast_horizon = min(max(days, 7), 21)
    today = date.today()
    return [
        {
            "date": (today + timedelta(days=index + 1)).isoformat(),
            "value": round(baseline, 2),
            "label": "Forecast",
        }
        for index in range(forecast_horizon)
    ]


def _month_start(value: date) -> date:
    return value.replace(day=1)


def _add_months(value: date, months: int) -> date:
    month_index = (value.month - 1) + months
    year = value.year + (month_index // 12)
    month = (month_index % 12) + 1
    return date(year, month, 1)


def _supplier_analytics(
    suppliers: List[models.Supplier],
    invoices: List[models.Invoice],
    month_window: int,
    reference_date: date,
) -> Dict[str, object]:
    invoice_groups: Dict[int, List[models.Invoice]] = defaultdict(list)
    for invoice in invoices:
        invoice_groups[invoice.supplier_id].append(invoice)

    recent_cutoff = reference_date - timedelta(days=30)
    previous_cutoff = reference_date - timedelta(days=60)

    supplier_breakdown: List[Dict[str, object]] = []
    for supplier in suppliers:
        linked_invoices = invoice_groups.get(supplier.id, [])
        total_spend = round(sum(invoice.total or 0.0 for invoice in linked_invoices), 2)
        invoice_count = len(linked_invoices)
        average_invoice = round(total_spend / invoice_count, 2) if invoice_count else 0.0
        last_invoice_date = max((invoice.issue_date for invoice in linked_invoices), default=None)
        recent_30_day_spend = round(
            sum((invoice.total or 0.0) for invoice in linked_invoices if invoice.issue_date >= recent_cutoff),
            2,
        )
        previous_30_day_spend = round(
            sum(
                (invoice.total or 0.0)
                for invoice in linked_invoices
                if previous_cutoff <= invoice.issue_date < recent_cutoff
            ),
            2,
        )

        supplier_breakdown.append(
            {
                "supplier_id": supplier.id,
                "supplier_name": supplier.name,
                "invoice_count": invoice_count,
                "total_spend": total_spend,
                "average_invoice": average_invoice,
                "last_invoice_date": last_invoice_date,
                "recent_30_day_spend": recent_30_day_spend,
                "previous_30_day_spend": previous_30_day_spend,
            }
        )

    supplier_breakdown.sort(key=lambda supplier: supplier["total_spend"], reverse=True)

    month_window = max(month_window, 1)
    end_month = _month_start(reference_date)
    month_points: List[Dict[str, object]] = []
    for offset in range(month_window):
        month_start = _add_months(end_month, -(month_window - offset - 1))
        next_month = _add_months(month_start, 1)
        month_invoices = [invoice for invoice in invoices if month_start <= invoice.issue_date < next_month]
        month_points.append(
            {
                "month": month_start.isoformat()[:7],
                "label": month_start.isoformat()[:7],
                "amount": round(sum(invoice.total or 0.0 for invoice in month_invoices), 2),
                "invoice_count": len(month_invoices),
                "active_suppliers": len({invoice.supplier_id for invoice in month_invoices}),
            }
        )

    total_spend = round(sum(supplier["total_spend"] for supplier in supplier_breakdown), 2)
    total_invoices = sum(int(supplier["invoice_count"]) for supplier in supplier_breakdown)
    active_suppliers = sum(1 for supplier in supplier_breakdown if supplier["invoice_count"] > 0)
    largest_supplier = supplier_breakdown[0] if supplier_breakdown else None
    largest_supplier_share = (
        round(float(largest_supplier["total_spend"]) / total_spend, 4)
        if largest_supplier and total_spend > 0
        else 0.0
    )

    return {
        "total_suppliers": len(suppliers),
        "active_suppliers": active_suppliers,
        "total_spend": total_spend,
        "total_invoices": total_invoices,
        "average_invoice": round(total_spend / total_invoices, 2) if total_invoices else 0.0,
        "average_spend_per_supplier": round(total_spend / active_suppliers, 2) if active_suppliers else 0.0,
        "suppliers_with_recent_activity": sum(1 for supplier in supplier_breakdown if supplier["recent_30_day_spend"] > 0),
        "largest_supplier_share": largest_supplier_share,
        "largest_supplier": largest_supplier,
        "top_suppliers": supplier_breakdown[:5],
        "supplier_breakdown": supplier_breakdown,
        "monthly_spend": month_points,
    }


def _ai_automation_metrics(db: Session, start_date: date, end_date: date) -> Dict[str, float]:
    extraction_runs = (
        db.query(models.ExtractionRun)
        .filter(models.ExtractionRun.created_at >= datetime.combine(start_date, datetime.min.time()))
        .filter(models.ExtractionRun.created_at <= datetime.combine(end_date, datetime.max.time()))
        .all()
    )
    forecasts = (
        db.query(models.Forecast)
        .filter(models.Forecast.created_at >= datetime.combine(start_date, datetime.min.time()))
        .filter(models.Forecast.created_at <= datetime.combine(end_date, datetime.max.time()))
        .all()
    )

    total_extractions = len(extraction_runs)
    corrected_runs = sum(1 for run in extraction_runs if run.corrected_data)
    review_required_count = sum(1 for run in extraction_runs if run.review_required)
    avg_confidence = (
        sum((run.overall_confidence or run.ocr_confidence or 0.0) for run in extraction_runs) / total_extractions
        if total_extractions
        else 0.0
    )
    correction_rate = (corrected_runs / total_extractions) if total_extractions else 0.0
    avg_correction_count = (
        sum(run.correction_count for run in extraction_runs) / total_extractions if total_extractions else 0.0
    )
    high_risk_forecasts = sum(1 for forecast in forecasts if (forecast.risk_score or 0.0) >= 0.75)
    avg_forecast_confidence = (
        sum(forecast.confidence_score or 0.0 for forecast in forecasts) / len(forecasts)
        if forecasts
        else 0.0
    )

    return {
        "total_extractions": total_extractions,
        "avg_confidence": round(avg_confidence, 3),
        "review_required_count": review_required_count,
        "corrected_runs": corrected_runs,
        "correction_rate": round(correction_rate, 3),
        "avg_correction_count": round(avg_correction_count, 2),
        "forecast_count": len(forecasts),
        "high_risk_forecasts": high_risk_forecasts,
        "avg_forecast_confidence": round(avg_forecast_confidence, 3),
    }


def _learning_loop_metrics(db: Session, start_date: date, end_date: date) -> Dict[str, object]:
    extraction_runs = (
        db.query(models.ExtractionRun)
        .filter(models.ExtractionRun.created_at >= datetime.combine(start_date, datetime.min.time()))
        .filter(models.ExtractionRun.created_at <= datetime.combine(end_date, datetime.max.time()))
        .all()
    )

    field_counts: Dict[str, int] = defaultdict(int)
    provider_totals: Dict[str, Dict[str, float]] = defaultdict(
        lambda: {"total_runs": 0, "corrected_runs": 0, "total_corrections": 0}
    )

    corrected_runs = 0
    total_corrections = 0

    for run in extraction_runs:
        provider_name = run.provider_name or "unknown"
        provider_totals[provider_name]["total_runs"] += 1

        corrected_fields: List[str] = []
        if run.corrected_fields:
            try:
                parsed_fields = json.loads(run.corrected_fields)
                if isinstance(parsed_fields, list):
                    corrected_fields = [str(field) for field in parsed_fields]
            except json.JSONDecodeError:
                corrected_fields = []

        for field in corrected_fields:
            field_counts[field] += 1

        if run.correction_count > 0:
            corrected_runs += 1
            provider_totals[provider_name]["corrected_runs"] += 1
        total_corrections += run.correction_count
        provider_totals[provider_name]["total_corrections"] += run.correction_count

    provider_breakdown = []
    for provider_name, values in provider_totals.items():
        total_runs = int(values["total_runs"])
        corrected_run_count = int(values["corrected_runs"])
        provider_breakdown.append(
            {
                "provider_name": provider_name,
                "total_runs": total_runs,
                "corrected_runs": corrected_run_count,
                "correction_rate": round(corrected_run_count / total_runs, 3) if total_runs else 0.0,
                "avg_correction_count": round(values["total_corrections"] / total_runs, 2) if total_runs else 0.0,
            }
        )

    provider_breakdown.sort(key=lambda provider: provider["correction_rate"], reverse=True)
    top_corrected_fields = [
        {"field": field, "count": count}
        for field, count in sorted(field_counts.items(), key=lambda item: item[1], reverse=True)[:6]
    ]

    return {
        "total_runs": len(extraction_runs),
        "corrected_runs": corrected_runs,
        "total_corrections": total_corrections,
        "top_corrected_fields": top_corrected_fields,
        "provider_breakdown": provider_breakdown,
    }


@router.get("/overview")
async def get_analytics_overview(
    days: int = 30,
    start_date_str: str = None,
    end_date_str: str = None,
    db: Session = Depends(get_db),
):
    start_date, end_date = _resolve_date_window(days, start_date_str, end_date_str)
    previous_start, previous_end = _previous_window(start_date, end_date)

    invoices = _fetch_invoices(db, start_date, end_date)
    previous_invoices = _fetch_invoices(db, previous_start, previous_end)

    return {
        "revenue": _revenue_metrics(invoices, previous_invoices),
        "invoices": _invoice_metrics(invoices, previous_invoices),
        "invoice_trends": _invoice_trends(invoices, start_date, end_date),
        "revenue_forecast": _revenue_forecast(invoices, days),
        "ai_automation": _ai_automation_metrics(db, start_date, end_date),
    }


@router.get("/revenue")
async def get_revenue_metrics(
    days: int = 30,
    start_date_str: str = None,
    end_date_str: str = None,
    db: Session = Depends(get_db),
):
    start_date, end_date = _resolve_date_window(days, start_date_str, end_date_str)
    previous_start, previous_end = _previous_window(start_date, end_date)
    invoices = _fetch_invoices(db, start_date, end_date)
    previous_invoices = _fetch_invoices(db, previous_start, previous_end)
    return _revenue_metrics(invoices, previous_invoices)


@router.get("/invoices")
async def get_invoice_metrics(
    days: int = 30,
    start_date_str: str = None,
    end_date_str: str = None,
    db: Session = Depends(get_db),
):
    start_date, end_date = _resolve_date_window(days, start_date_str, end_date_str)
    previous_start, previous_end = _previous_window(start_date, end_date)
    invoices = _fetch_invoices(db, start_date, end_date)
    previous_invoices = _fetch_invoices(db, previous_start, previous_end)
    return _invoice_metrics(invoices, previous_invoices)


@router.get("/revenue-forecast")
async def get_revenue_forecast(days: int = 30, db: Session = Depends(get_db)):
    start_date, end_date = _resolve_date_window(days)
    invoices = _fetch_invoices(db, start_date, end_date)
    return _revenue_forecast(invoices, days)


@router.get("/invoice-trends")
async def get_invoice_trends(days: int = 30, db: Session = Depends(get_db)):
    start_date, end_date = _resolve_date_window(days)
    invoices = _fetch_invoices(db, start_date, end_date)
    return _invoice_trends(invoices, start_date, end_date)


@router.get("/ai-automation")
async def get_ai_automation_metrics(days: int = 30, db: Session = Depends(get_db)):
    start_date, end_date = _resolve_date_window(days)
    return _ai_automation_metrics(db, start_date, end_date)


@router.get("/learning-loop", response_model=schemas.LearningLoopSummary)
async def get_learning_loop_metrics(
    days: int = 30,
    start_date_str: str = None,
    end_date_str: str = None,
    db: Session = Depends(get_db),
):
    start_date, end_date = _resolve_date_window(days, start_date_str, end_date_str)
    return _learning_loop_metrics(db, start_date, end_date)


@router.get("/suppliers", response_model=schemas.SupplierAnalyticsSummary)
async def get_supplier_analytics(
    days: int | None = None,
    start_date_str: str = None,
    end_date_str: str = None,
    month_window: int = 6,
    db: Session = Depends(get_db),
):
    suppliers = db.query(models.Supplier).all()

    if start_date_str and end_date_str:
        start_date, end_date = _resolve_date_window(30, start_date_str, end_date_str)
        invoices = _fetch_invoices(db, start_date, end_date)
        reference_date = end_date
    elif days is not None:
        start_date, end_date = _resolve_date_window(days)
        invoices = _fetch_invoices(db, start_date, end_date)
        reference_date = end_date
    else:
        invoices = db.query(models.Invoice).all()
        reference_date = date.today()

    return _supplier_analytics(suppliers, invoices, month_window, reference_date)
