"""
Forecasting service for payment risk and collection timing.
"""

import json
from datetime import timedelta
from statistics import mean
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from .. import models


MODEL_VERSION = "payment-risk-baseline-v1"
PREDICTION_METHOD = "HEURISTIC_AI_BASELINE"


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def _invoice_terms(invoice: models.Invoice) -> int:
    if invoice.issue_date and invoice.due_date:
        delta = (invoice.due_date - invoice.issue_date).days
        if delta > 0:
            return delta
    return 30


def _payment_days_for_invoice(invoice: models.Invoice) -> Optional[int]:
    if getattr(invoice, "payments", None):
        latest_payment_date = max(payment.payment_date for payment in invoice.payments)
        return max(0, (latest_payment_date - invoice.issue_date).days)
    if invoice.status and invoice.status.lower() == "paid" and invoice.due_date:
        return max(0, (invoice.due_date - invoice.issue_date).days)
    return None


def _historical_payment_features(invoice: models.Invoice, db: Session) -> Tuple[List[int], List[int], float]:
    history = (
        db.query(models.Invoice)
        .filter(
            models.Invoice.customer_id == invoice.customer_id,
            models.Invoice.id != invoice.id,
            models.Invoice.issue_date < invoice.issue_date,
        )
        .all()
    )

    payment_days: List[int] = []
    payment_delays: List[int] = []
    paid_ratio = 0.0
    paid_count = 0

    for historical_invoice in history:
        terms = _invoice_terms(historical_invoice)
        actual_payment_days = _payment_days_for_invoice(historical_invoice)
        if actual_payment_days is None:
            continue
        payment_days.append(actual_payment_days)
        payment_delays.append(actual_payment_days - terms)
        paid_count += 1

    if history:
        paid_ratio = paid_count / len(history)

    return payment_days, payment_delays, paid_ratio


def _amount_risk(invoice: models.Invoice, db: Session) -> float:
    previous_amounts = [
        row[0]
        for row in db.query(models.Invoice.total)
        .filter(
            models.Invoice.customer_id == invoice.customer_id,
            models.Invoice.id != invoice.id,
        )
        .limit(50)
        .all()
        if row[0] is not None
    ]
    if not previous_amounts:
        return 0.15

    baseline = mean(previous_amounts)
    if baseline <= 0:
        return 0.15

    ratio = invoice.total / baseline
    if ratio >= 2.0:
        return 0.35
    if ratio >= 1.4:
        return 0.2
    return 0.05


def _risk_level(risk_score: float) -> str:
    if risk_score >= 0.75:
        return "high"
    if risk_score >= 0.45:
        return "medium"
    return "low"


def _recommended_action(risk_score: float) -> str:
    if risk_score >= 0.75:
        return "Follow up before due date and monitor for payment slippage."
    if risk_score >= 0.45:
        return "Queue a reminder shortly after the due date."
    return "Standard collection workflow is sufficient."


def _serialize_notes(payload: Dict[str, Any]) -> str:
    return json.dumps(payload, ensure_ascii=True)


def _parse_notes(notes: Optional[str]) -> Dict[str, Any]:
    if not notes:
        return {}
    try:
        return json.loads(notes)
    except json.JSONDecodeError:
        return {"explanation": notes}


def build_forecast(invoice_id: int, db: Session) -> Tuple[models.Forecast, Dict[str, Any]]:
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise ValueError("Invoice not found")

    payment_days, payment_delays, paid_ratio = _historical_payment_features(invoice, db)
    terms_days = _invoice_terms(invoice)
    avg_payment_days = mean(payment_days) if payment_days else float(terms_days)
    avg_delay = mean(payment_delays) if payment_delays else 0.0
    amount_risk = _amount_risk(invoice, db)

    predicted_days = round(_clamp(avg_payment_days + max(avg_delay, 0.0) * 0.35, 7.0, 120.0))
    predicted_payment_date = invoice.issue_date + timedelta(days=predicted_days)

    late_ratio = (
        len([delay for delay in payment_delays if delay > 0]) / len(payment_delays)
        if payment_delays
        else 0.25
    )
    history_bonus = min(len(payment_days), 12) / 12.0
    confidence_score = _clamp(0.45 + (history_bonus * 0.35) + (paid_ratio * 0.15) - amount_risk * 0.2, 0.35, 0.96)
    risk_score = _clamp(0.2 + (late_ratio * 0.45) + amount_risk + ((1 - paid_ratio) * 0.1), 0.05, 0.95)
    risk_level = _risk_level(risk_score)

    feature_summary = {
        "current_terms_days": terms_days,
        "predicted_payment_days": predicted_days,
        "historical_sample_size": len(payment_days),
        "average_payment_days": round(avg_payment_days, 2),
        "average_delay_days": round(avg_delay, 2),
        "customer_paid_ratio": round(paid_ratio, 2),
        "late_payment_ratio": round(late_ratio, 2),
        "amount_risk": round(amount_risk, 2),
        "invoice_total": round(invoice.total or 0.0, 2),
    }

    explanation = (
        f"Predicted payment in about {predicted_days} days based on customer history, "
        f"payment-term behavior, and invoice amount relative to past invoices."
    )
    recommended_action = _recommended_action(risk_score)
    notes_payload = {
        "model_version": MODEL_VERSION,
        "explanation": explanation,
        "recommended_action": recommended_action,
        "risk_level": risk_level,
        "feature_summary": feature_summary,
        "historical_sample_size": len(payment_days),
    }

    forecast = models.Forecast(
        invoice_id=invoice.id,
        predicted_payment_date=predicted_payment_date,
        confidence_score=confidence_score,
        prediction_method=PREDICTION_METHOD,
        risk_score=risk_score,
        notes=_serialize_notes(notes_payload),
    )
    db.add(forecast)
    db.commit()
    db.refresh(forecast)

    return forecast, {
        "forecast_id": forecast.id,
        "predicted_payment_date": forecast.predicted_payment_date,
        "confidence_score": forecast.confidence_score or 0.0,
        "risk_score": forecast.risk_score or 0.0,
        "risk_level": risk_level,
        "prediction_method": forecast.prediction_method or PREDICTION_METHOD,
        "model_version": MODEL_VERSION,
        "explanation": explanation,
        "recommended_action": recommended_action,
        "historical_sample_size": len(payment_days),
        "feature_summary": feature_summary,
    }


def get_latest_forecast_insight(invoice_id: int, db: Session) -> Optional[Dict[str, Any]]:
    forecast = (
        db.query(models.Forecast)
        .filter(models.Forecast.invoice_id == invoice_id)
        .order_by(models.Forecast.created_at.desc())
        .first()
    )
    if not forecast:
        return None

    payload = _parse_notes(forecast.notes)
    return {
        "forecast_id": forecast.id,
        "predicted_payment_date": forecast.predicted_payment_date,
        "confidence_score": forecast.confidence_score or 0.0,
        "risk_score": forecast.risk_score or 0.0,
        "risk_level": payload.get("risk_level", _risk_level(forecast.risk_score or 0.0)),
        "prediction_method": forecast.prediction_method or PREDICTION_METHOD,
        "model_version": payload.get("model_version", MODEL_VERSION),
        "explanation": payload.get("explanation", "Prediction created from historical invoice behavior."),
        "recommended_action": payload.get("recommended_action", _recommended_action(forecast.risk_score or 0.0)),
        "historical_sample_size": payload.get("historical_sample_size", 0),
        "feature_summary": payload.get("feature_summary", {}),
    }
