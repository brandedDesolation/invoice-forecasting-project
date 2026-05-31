"""
Mock payment provider integration for zero-setup capstone demos.

This mirrors a provider checkout flow without requiring Stripe/iyzico keys.
"""

from __future__ import annotations

import base64
import json
from datetime import datetime


PROVIDER_NAME = "MockPay Sandbox"


def create_checkout_session(*, invoice_id: int, amount: float, currency: str = "TRY") -> dict:
    payload = {
        "invoice_id": invoice_id,
        "amount": round(float(amount), 2),
        "currency": currency,
        "created_at": datetime.utcnow().isoformat(),
    }
    encoded = base64.urlsafe_b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8")
    session_id = f"mockpay_{encoded}"
    return {
        "provider": PROVIDER_NAME,
        "checkout_session_id": session_id,
        "checkout_url": f"https://checkout.mockpay.local/session/{session_id}",
        "status": "created",
        "amount": payload["amount"],
        "currency": currency,
        "message": "MockPay checkout session created. Complete it from the sandbox button.",
    }


def parse_checkout_session(session_id: str) -> dict:
    if not session_id.startswith("mockpay_"):
        raise ValueError("Unsupported checkout session")
    encoded = session_id.replace("mockpay_", "", 1)
    return json.loads(base64.urlsafe_b64decode(encoded.encode("utf-8")).decode("utf-8"))
