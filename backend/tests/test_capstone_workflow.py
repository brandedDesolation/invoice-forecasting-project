import os
from datetime import date, timedelta
from uuid import uuid4

os.environ["DATABASE_URL"] = "sqlite:///./test_capstone_workflow.db"
os.environ["DEBUG_SQL"] = "false"
os.environ["DEFAULT_ADMIN_EMAIL"] = "admin@invoiceforecast.com"
os.environ["DEFAULT_ADMIN_PASSWORD"] = "admin123"

from fastapi.testclient import TestClient  # noqa: E402

from app.auth import ensure_default_admin  # noqa: E402
from app.database import SessionLocal, create_tables  # noqa: E402
from app.main import app  # noqa: E402
from app.models import LedgerEntry  # noqa: E402


client = TestClient(app)


def setup_module():
    create_tables()
    db = SessionLocal()
    try:
        ensure_default_admin(db)
    finally:
        db.close()


def auth_headers():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@invoiceforecast.com", "password": "admin123"},
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def create_party(headers, endpoint, name):
    suffix = uuid4().hex[:8]
    response = client.post(
        endpoint,
        json={
            "name": f"{name} {suffix}",
            "tax_id": f"TAX-{suffix}",
            "email": "finance@example.com",
            "phone": "+90 212 555 0000",
            "address": "Istanbul",
        },
        headers=headers,
    )
    assert response.status_code in {200, 201}
    return response.json()


def test_approval_gates_payment_and_forecast_then_allows_collection_flow():
    headers = auth_headers()
    suffix = uuid4().hex[:8]
    customer = create_party(headers, "/api/v1/customers/", "Workflow Test Customer")
    supplier = create_party(headers, "/api/v1/suppliers/", "Workflow Test Supplier")

    invoice_response = client.post(
        "/api/v1/invoices/",
        json={
            "invoice_number": f"TEST-{suffix}",
            "issue_date": date.today().isoformat(),
            "due_date": (date.today() + timedelta(days=30)).isoformat(),
            "subtotal": 1000,
            "tax": 200,
            "total": 1200,
            "customer_id": customer["id"],
            "supplier_id": supplier["id"],
            "items": [{"description": "Test service", "quantity": 1, "unit_price": 1000, "tax_amount": 200, "total": 1200}],
        },
        headers=headers,
    )
    assert invoice_response.status_code == 200
    invoice = invoice_response.json()
    assert invoice["status"] == "pending"
    assert invoice["approval_status"] == "pending"

    blocked_payment = client.post(
        "/api/v1/payments/",
        json={"invoice_id": invoice["id"], "amount": 100, "payment_date": date.today().isoformat()},
        headers=headers,
    )
    assert blocked_payment.status_code == 400

    blocked_forecast = client.post(f"/api/v1/forecasts/predict/{invoice['id']}", headers=headers)
    assert blocked_forecast.status_code == 400

    approval_response = client.post(
        f"/api/v1/workflow/invoice/{invoice['id']}/approval",
        json={"status": "approved", "note": "Approved in test"},
        headers=headers,
    )
    assert approval_response.status_code == 200
    assert approval_response.json()["approval_status"] == "approved"

    payment_response = client.post(
        "/api/v1/payments/",
        json={"invoice_id": invoice["id"], "amount": 400, "payment_date": date.today().isoformat()},
        headers=headers,
    )
    assert payment_response.status_code == 200

    refreshed_invoice = client.get(f"/api/v1/invoices/{invoice['id']}", headers=headers)
    assert refreshed_invoice.status_code == 200
    assert refreshed_invoice.json()["status"] == "partially_paid"
    assert len(refreshed_invoice.json()["payments"]) == 1

    latest_forecast = client.get(f"/api/v1/forecasts/invoice/{invoice['id']}/latest", headers=headers)
    assert latest_forecast.status_code == 200
    assert latest_forecast.json()["risk_level"] in {"low", "medium", "high"}


def test_google_auth_requires_configuration_and_user_roles_work():
    headers = auth_headers()

    google_response = client.post("/api/v1/auth/google", json={"id_token": "not-a-token"})
    assert google_response.status_code == 503

    users_response = client.get("/api/v1/users/", headers=headers)
    assert users_response.status_code == 200
    assert any(user["email"] == "admin@invoiceforecast.com" for user in users_response.json())

    user_id = users_response.json()[0]["id"]
    update_response = client.put(f"/api/v1/users/{user_id}", json={"role": "auditor"}, headers=headers)
    assert update_response.status_code == 200
    assert update_response.json()["role"] == "auditor"


def test_purchase_order_expense_and_ledger_endpoints():
    headers = auth_headers()
    supplier = create_party(headers, "/api/v1/suppliers/", "ERP Test Supplier")
    suffix = uuid4().hex[:8]

    po_response = client.post(
        "/api/v1/purchase-orders/",
        json={
            "po_number": f"TEST-PO-{suffix}",
            "supplier_id": supplier["id"],
            "request_date": date.today().isoformat(),
            "expected_delivery_date": (date.today() + timedelta(days=10)).isoformat(),
            "status": "approved",
            "subtotal": 1000,
            "tax": 200,
            "total": 1200,
            "items": [{"description": "ERP item", "quantity": 2, "unit_price": 500, "total": 1000}],
        },
        headers=headers,
    )
    assert po_response.status_code == 200
    assert po_response.json()["items"][0]["description"] == "ERP item"

    expense_response = client.post(
        "/api/v1/expenses/",
        json={
            "expense_number": f"TEST-EXP-{suffix}",
            "vendor": "ERP Vendor",
            "category": "Software",
            "expense_date": date.today().isoformat(),
            "amount": 500,
            "tax": 100,
            "total": 600,
            "approval_status": "pending",
            "reimbursable": False,
        },
        headers=headers,
    )
    assert expense_response.status_code == 200

    db = SessionLocal()
    try:
        db.add(LedgerEntry(
            entry_date=date.today(),
            account="Operating Expenses",
            description="Test expense posting",
            debit=600,
            credit=0,
            source_type="expense",
            reference=f"TEST-EXP-{suffix}",
        ))
        db.commit()
    finally:
        db.close()

    ledger_response = client.get("/api/v1/ledger/summary", headers=headers)
    assert ledger_response.status_code == 200
    assert ledger_response.json()["expenses"] >= 600
