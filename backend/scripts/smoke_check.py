"""
Pre-demo smoke check for a running VICAI backend.

Run from the backend directory after starting the API:
    python3 scripts/smoke_check.py
"""

from __future__ import annotations

import os
import sys

import requests


API_URL = os.getenv("API_URL", "http://localhost:8000")
ADMIN_EMAIL = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@invoiceforecast.com")
ADMIN_PASSWORD = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin123")


def check(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def main() -> int:
    print(f"Checking VICAI API at {API_URL}")

    health = requests.get(f"{API_URL}/health", timeout=10)
    check(health.ok, f"/health failed: {health.status_code}")

    db_health = requests.get(f"{API_URL}/health/db", timeout=10)
    check(db_health.ok, f"/health/db failed: {db_health.status_code}")

    login = requests.post(
        f"{API_URL}/api/v1/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=10,
    )
    check(login.ok, f"login failed: {login.status_code} {login.text}")
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    endpoints = {
        "customers": "/api/v1/customers/",
        "suppliers": "/api/v1/suppliers/",
        "invoices": "/api/v1/invoices/",
        "workflow": "/api/v1/workflow/summary",
        "review": "/api/v1/review/queue?review_required=true",
        "analytics": "/api/v1/analytics/overview?days=90",
    }
    for label, path in endpoints.items():
        response = requests.get(f"{API_URL}{path}", headers=headers, timeout=10)
        check(response.ok, f"{label} check failed: {response.status_code} {response.text}")
        print(f"- {label}: ok")

    print("VICAI smoke check passed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Smoke check failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
