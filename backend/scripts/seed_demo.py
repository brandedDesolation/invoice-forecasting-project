"""
Seed a realistic VICAI demo dataset.

Run from the backend directory:
    python scripts/seed_demo.py
"""

from __future__ import annotations

import json
from datetime import date, datetime, timedelta
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.auth import ensure_default_admin, get_password_hash  # noqa: E402
from app.database import SessionLocal, create_tables  # noqa: E402
from app.models import (  # noqa: E402
    AuditEvent,
    Customer,
    ExtractionRun,
    Forecast,
    Expense,
    Invoice,
    InvoiceItem,
    LedgerEntry,
    Payment,
    PurchaseOrder,
    PurchaseOrderItem,
    Supplier,
    User,
    WorkflowNotification,
)
from app.services.audit_service import create_audit_event  # noqa: E402


TODAY = date.today()
DEMO_PREFIX = "VICAI-DEMO"


def upsert_party(db, model, *, name: str, tax_id: str, email: str, phone: str, address: str):
    party = db.query(model).filter(model.tax_id == tax_id).first()
    if not party:
        party = model(tax_id=tax_id)
        db.add(party)

    party.name = name
    party.email = email
    party.phone = phone
    party.address = address
    return party


def upsert_demo_user(db, *, email: str, password: str, name: str, company: str, role: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email)
        db.add(user)

    user.name = name
    user.role = role
    user.company = company
    user.password_hash = get_password_hash(password)
    user.is_active = True
    return user


def seed_demo_users(db) -> list[User]:
    users = [
        upsert_demo_user(
            db,
            email="admin@invoiceforecast.com",
            password="admin123",
            name="Ipek Zeytin",
            company="VICAI Finance Operations",
            role="admin",
        ),
        upsert_demo_user(
            db,
            email="manager@vicai.demo",
            password="manager123",
            name="Deniz Kaya",
            company="Finance Manager",
            role="finance_manager",
        ),
        upsert_demo_user(
            db,
            email="accountant@vicai.demo",
            password="accountant123",
            name="Ece Demir",
            company="Accounts Payable",
            role="accountant",
        ),
        upsert_demo_user(
            db,
            email="auditor@vicai.demo",
            password="auditor123",
            name="Mert Arslan",
            company="Internal Audit",
            role="auditor",
        ),
        upsert_demo_user(
            db,
            email="google.user@vicai.demo",
            password="google-sso-demo",
            name="Google Demo User",
            company="Google Workspace SSO",
            role="finance_manager",
        ),
    ]
    db.commit()
    return users


def reset_demo_invoices(db) -> None:
    demo_invoices = db.query(Invoice).filter(Invoice.invoice_number.like(f"{DEMO_PREFIX}-%")).all()
    demo_invoice_ids = [invoice.id for invoice in demo_invoices]
    if not demo_invoice_ids:
        return

    db.query(WorkflowNotification).filter(WorkflowNotification.invoice_id.in_(demo_invoice_ids)).delete(synchronize_session=False)
    db.query(AuditEvent).filter(AuditEvent.invoice_id.in_(demo_invoice_ids)).delete(synchronize_session=False)
    db.query(ExtractionRun).filter(ExtractionRun.invoice_id.in_(demo_invoice_ids)).delete(synchronize_session=False)
    db.query(Forecast).filter(Forecast.invoice_id.in_(demo_invoice_ids)).delete(synchronize_session=False)
    db.query(Payment).filter(Payment.invoice_id.in_(demo_invoice_ids)).delete(synchronize_session=False)
    db.query(InvoiceItem).filter(InvoiceItem.invoice_id.in_(demo_invoice_ids)).delete(synchronize_session=False)
    db.query(Invoice).filter(Invoice.id.in_(demo_invoice_ids)).delete(synchronize_session=False)
    db.commit()


def reset_erp_demo_data(db) -> None:
    db.query(LedgerEntry).filter(LedgerEntry.reference.like(f"{DEMO_PREFIX}-%")).delete(synchronize_session=False)
    db.query(Expense).filter(Expense.expense_number.like(f"{DEMO_PREFIX}-EXP-%")).delete(synchronize_session=False)
    demo_pos = db.query(PurchaseOrder).filter(PurchaseOrder.po_number.like(f"{DEMO_PREFIX}-PO-%")).all()
    demo_po_ids = [po.id for po in demo_pos]
    if demo_po_ids:
        db.query(PurchaseOrderItem).filter(PurchaseOrderItem.purchase_order_id.in_(demo_po_ids)).delete(synchronize_session=False)
        db.query(PurchaseOrder).filter(PurchaseOrder.id.in_(demo_po_ids)).delete(synchronize_session=False)
    db.commit()


def add_ledger_entry(db, *, entry_date: date, account: str, description: str, debit: float = 0.0, credit: float = 0.0, source_type: str, reference: str) -> None:
    db.add(LedgerEntry(
        entry_date=entry_date,
        account=account,
        description=description,
        debit=debit,
        credit=credit,
        source_type=source_type,
        reference=reference,
    ))


def seed() -> None:
    create_tables()
    db = SessionLocal()
    try:
      ensure_default_admin(db)
      demo_users = seed_demo_users(db)
      reset_demo_invoices(db)
      reset_erp_demo_data(db)

      customers = [
          upsert_party(db, Customer, name="Anka Robotics A.S.", tax_id="TR1002003001", email="finance@ankarobotics.com", phone="+90 212 555 0101", address="Maslak, Istanbul"),
          upsert_party(db, Customer, name="Nova Retail Group", tax_id="TR1002003002", email="ap@novaretail.com", phone="+90 216 555 0102", address="Atasehir, Istanbul"),
          upsert_party(db, Customer, name="Mavi Logistics", tax_id="TR1002003003", email="payments@mavilogistics.com", phone="+90 232 555 0103", address="Alsancak, Izmir"),
          upsert_party(db, Customer, name="Ege Health Network", tax_id="TR1002003004", email="accounting@egehealth.com", phone="+90 232 555 0104", address="Bornova, Izmir"),
      ]

      suppliers = [
          upsert_party(db, Supplier, name="Atlas Cloud Services", tax_id="TR9008007001", email="billing@atlascloud.com", phone="+90 212 555 0201", address="Levent, Istanbul"),
          upsert_party(db, Supplier, name="Bosphorus Office Supply", tax_id="TR9008007002", email="invoice@bosphorusoffice.com", phone="+90 212 555 0202", address="Sisli, Istanbul"),
          upsert_party(db, Supplier, name="Kuzey Logistics Partner", tax_id="TR9008007003", email="finance@kuzeylogistics.com", phone="+90 312 555 0203", address="Cankaya, Ankara"),
          upsert_party(db, Supplier, name="Verde Energy", tax_id="TR9008007004", email="collections@verdeenergy.com", phone="+90 224 555 0204", address="Nilüfer, Bursa"),
      ]
      db.commit()

      purchase_orders = []
      po_specs = [
          ("VICAI-DEMO-PO-2026-001", suppliers[0], -42, -18, "received", "Annual cloud infrastructure package", 1, 168000),
          ("VICAI-DEMO-PO-2026-002", suppliers[1], -25, 8, "approved", "Office devices and onboarding kits", 18, 2450),
          ("VICAI-DEMO-PO-2026-003", suppliers[2], -16, 15, "approved", "Regional logistics support", 1, 94000),
          ("VICAI-DEMO-PO-2026-004", suppliers[3], -7, 24, "draft", "Renewable energy supply estimate", 1, 182000),
      ]
      for number, supplier, request_offset, delivery_offset, status, description, quantity, unit_price in po_specs:
          subtotal = quantity * unit_price
          tax = subtotal * 0.2
          purchase_order = PurchaseOrder(
              po_number=number,
              supplier_id=supplier.id,
              request_date=TODAY + timedelta(days=request_offset),
              expected_delivery_date=TODAY + timedelta(days=delivery_offset),
              status=status,
              subtotal=subtotal,
              tax=tax,
              total=subtotal + tax,
              notes="Seeded ERP procurement record.",
          )
          db.add(purchase_order)
          db.flush()
          db.add(PurchaseOrderItem(
              purchase_order_id=purchase_order.id,
              description=description,
              quantity=quantity,
              unit_price=unit_price,
              total=subtotal,
          ))
          purchase_orders.append(purchase_order)
          add_ledger_entry(
              db,
              entry_date=purchase_order.request_date,
              account="Accounts Payable",
              description=f"Purchase order commitment {number}",
              credit=purchase_order.total,
              source_type="purchase_order",
              reference=number,
          )

      expense_specs = [
          ("VICAI-DEMO-EXP-001", "THY Corporate", "Travel", -28, 18500, "approved", True),
          ("VICAI-DEMO-EXP-002", "Notion Labs", "Software", -21, 7200, "approved", False),
          ("VICAI-DEMO-EXP-003", "Bosphorus Office Supply", "Office", -11, 9650, "pending", False),
          ("VICAI-DEMO-EXP-004", "Verde Energy", "Utilities", -6, 12400, "approved", False),
          ("VICAI-DEMO-EXP-005", "Kuzey Logistics Partner", "Logistics", -3, 15100, "pending", False),
      ]
      expenses = []
      for number, vendor, category, offset, amount, status, reimbursable in expense_specs:
          tax = amount * 0.2
          expense = Expense(
              expense_number=number,
              vendor=vendor,
              category=category,
              expense_date=TODAY + timedelta(days=offset),
              amount=amount,
              tax=tax,
              total=amount + tax,
              approval_status=status,
              reimbursable=reimbursable,
              notes="Seeded company expense for ERP demo.",
          )
          db.add(expense)
          expenses.append(expense)
          add_ledger_entry(
              db,
              entry_date=expense.expense_date,
              account="Operating Expenses",
              description=f"{category} expense {number}",
              debit=expense.total,
              source_type="expense",
              reference=number,
          )

      invoices = [
          {
              "number": "VICAI-DEMO-2026-001",
              "customer": customers[0],
              "supplier": suppliers[0],
              "issue_offset": -52,
              "due_offset": -22,
              "subtotal": 112000,
              "tax": 22400,
              "status": "paid",
              "approval_status": "approved",
              "payments": [(134400, -18, "Bank Transfer")],
              "risk": 0.18,
              "confidence": 0.91,
              "review_required": False,
          },
          {
              "number": "VICAI-DEMO-2026-002",
              "customer": customers[1],
              "supplier": suppliers[1],
              "issue_offset": -34,
              "due_offset": -4,
              "subtotal": 46750,
              "tax": 9350,
              "status": "overdue",
              "approval_status": "approved",
              "payments": [],
              "risk": 0.76,
              "confidence": 0.82,
              "review_required": True,
          },
          {
              "number": "VICAI-DEMO-2026-003",
              "customer": customers[2],
              "supplier": suppliers[2],
              "issue_offset": -21,
              "due_offset": 9,
              "subtotal": 78300,
              "tax": 15660,
              "status": "partially_paid",
              "approval_status": "approved",
              "payments": [(42000, -3, "Credit Card")],
              "risk": 0.43,
              "confidence": 0.87,
              "review_required": False,
          },
          {
              "number": "VICAI-DEMO-2026-004",
              "customer": customers[3],
              "supplier": suppliers[3],
              "issue_offset": -12,
              "due_offset": 18,
              "subtotal": 156000,
              "tax": 31200,
              "status": "pending",
              "approval_status": "pending",
              "payments": [],
              "risk": 0.58,
              "confidence": 0.79,
              "review_required": True,
          },
          {
              "number": "VICAI-DEMO-2026-005",
              "customer": customers[0],
              "supplier": suppliers[1],
              "issue_offset": -7,
              "due_offset": 23,
              "subtotal": 18850,
              "tax": 3770,
              "status": "pending",
              "approval_status": "pending",
              "payments": [],
              "risk": 0.32,
              "confidence": 0.88,
              "review_required": False,
          },
          {
              "number": "VICAI-DEMO-2026-006",
              "customer": customers[1],
              "supplier": suppliers[0],
              "issue_offset": -68,
              "due_offset": -38,
              "subtotal": 92000,
              "tax": 18400,
              "status": "paid",
              "approval_status": "approved",
              "payments": [(55200, -34, "Bank Transfer"), (55200, -28, "Bank Transfer")],
              "risk": 0.22,
              "confidence": 0.9,
              "review_required": False,
          },
      ]

      for index, spec in enumerate(invoices):
          issue_date = TODAY + timedelta(days=spec["issue_offset"])
          due_date = TODAY + timedelta(days=spec["due_offset"])
          total = spec["subtotal"] + spec["tax"]
          invoice = Invoice(
              invoice_number=spec["number"],
              issue_date=issue_date,
              due_date=due_date,
              subtotal=spec["subtotal"],
              tax=spec["tax"],
              total=total,
              customer_id=spec["customer"].id,
              supplier_id=spec["supplier"].id,
              purchase_order_id=purchase_orders[index % len(purchase_orders)].id,
              extraction_status="completed",
              ocr_confidence=0.86 if not spec["review_required"] else 0.62,
              status=spec["status"],
              approval_status=spec["approval_status"],
              approved_at=datetime.utcnow() - timedelta(days=5) if spec["approval_status"] == "approved" else None,
              approval_note="Approved during demo seed review." if spec["approval_status"] == "approved" else None,
          )
          db.add(invoice)
          db.flush()
          add_ledger_entry(
              db,
              entry_date=issue_date,
              account="Accounts Receivable",
              description=f"Invoice posted {invoice.invoice_number}",
              debit=total,
              source_type="invoice",
              reference=invoice.invoice_number,
          )
          create_audit_event(
              db,
              invoice_id=invoice.id,
              event_type="demo_invoice_seeded",
              title="Demo invoice seeded",
              message=f"{invoice.invoice_number} was created by the demo seed script.",
              actor="VICAI demo seed",
              metadata={"status": spec["status"], "approval_status": spec["approval_status"]},
          )

          db.add_all([
              InvoiceItem(invoice_id=invoice.id, description="Service package", quantity=1, unit_price=spec["subtotal"] * 0.7, tax_rate=20, tax_amount=spec["tax"] * 0.7, total=(spec["subtotal"] + spec["tax"]) * 0.7),
              InvoiceItem(invoice_id=invoice.id, description="Operations support", quantity=1, unit_price=spec["subtotal"] * 0.3, tax_rate=20, tax_amount=spec["tax"] * 0.3, total=(spec["subtotal"] + spec["tax"]) * 0.3),
          ])

          for amount, offset, method in spec["payments"]:
              db.add(Payment(invoice_id=invoice.id, amount=amount, payment_date=TODAY + timedelta(days=offset), payment_method=method, reference=f"PAY-{invoice.invoice_number[-3:]}", notes="Demo payment"))
              add_ledger_entry(
                  db,
                  entry_date=TODAY + timedelta(days=offset),
                  account="Cash",
                  description=f"Payment received for {invoice.invoice_number}",
                  debit=amount,
                  source_type="payment",
                  reference=invoice.invoice_number,
              )
              add_ledger_entry(
                  db,
                  entry_date=TODAY + timedelta(days=offset),
                  account="Accounts Receivable",
                  description=f"Receivable cleared for {invoice.invoice_number}",
                  credit=amount,
                  source_type="payment",
                  reference=invoice.invoice_number,
              )
              create_audit_event(
                  db,
                  invoice_id=invoice.id,
                  event_type="payment_seeded",
                  title="Demo payment recorded",
                  message=f"Seeded payment of {amount:.2f} via {method}.",
                  actor="VICAI demo seed",
              )

          db.add(Forecast(
              invoice_id=invoice.id,
              predicted_payment_date=due_date + timedelta(days=round(spec["risk"] * 12)),
              confidence_score=spec["confidence"],
              prediction_method="demo_ai_baseline",
              risk_score=spec["risk"],
              notes=json.dumps({
                  "summary": "Predicted from seeded customer payment behavior, invoice amount, and due-date pressure.",
                  "risk_band": "high" if spec["risk"] >= 0.65 else "medium" if spec["risk"] >= 0.4 else "low",
              }),
          ))
          create_audit_event(
              db,
              invoice_id=invoice.id,
              event_type="forecast_seeded",
              title="Demo forecast generated",
              message="Seeded AI payment-risk forecast for presentation data.",
              actor="VICAI demo seed",
          )

          extracted = {
              "invoice_number": invoice.invoice_number,
              "supplier": {"name": spec["supplier"].name, "tax_id": spec["supplier"].tax_id},
              "customer": {"name": spec["customer"].name, "tax_id": spec["customer"].tax_id},
              "amounts": {"subtotal": spec["subtotal"], "tax": spec["tax"], "total": total},
              "issue_date": issue_date.isoformat(),
              "due_date": due_date.isoformat(),
          }
          db.add(ExtractionRun(
              invoice_id=invoice.id,
              source_filename=f"{invoice.invoice_number}.pdf",
              provider_name="local_ocr",
              model_version="demo-seed-v1",
              raw_text=f"Demo OCR text for {invoice.invoice_number}",
              original_data=json.dumps(extracted),
              corrected_data=json.dumps(extracted) if spec["review_required"] else None,
              corrected_fields=json.dumps(["due_date", "total"]) if spec["review_required"] else json.dumps([]),
              field_confidence=json.dumps({"invoice_number": 0.94, "supplier": 0.88, "total": 0.74 if spec["review_required"] else 0.91}),
              ocr_confidence=0.86 if not spec["review_required"] else 0.62,
              overall_confidence=0.84 if not spec["review_required"] else 0.66,
              review_required=spec["review_required"],
              correction_count=2 if spec["review_required"] else 0,
              status="review_required" if spec["review_required"] else "reviewed",
              reviewed_at=datetime.utcnow() - timedelta(days=1) if not spec["review_required"] else None,
          ))
          create_audit_event(
              db,
              invoice_id=invoice.id,
              event_type="extraction_seeded",
              title="Demo extraction run created",
              message="Seeded OCR extraction and review metadata.",
              actor="VICAI demo seed",
              metadata={"review_required": spec["review_required"]},
          )

          if spec["approval_status"] == "pending":
              db.add(WorkflowNotification(
                  invoice_id=invoice.id,
                  type="approval_required",
                  title="Invoice awaiting approval",
                  message=f"{invoice.invoice_number} is ready for manager approval.",
                  status="unread",
                  action_url=f"/admin/invoices/view/{invoice.id}",
              ))
          if spec["status"] == "overdue":
              db.add(WorkflowNotification(
                  invoice_id=invoice.id,
                  type="payment_overdue",
                  title="Payment overdue",
                  message=f"{invoice.invoice_number} is overdue and should be followed up.",
                  status="unread",
                  action_url=f"/admin/invoices/view/{invoice.id}",
              ))

      db.commit()
      print("Seeded VICAI demo data:")
      print(f"- {len(customers)} customers")
      print(f"- {len(suppliers)} suppliers")
      print(f"- {len(demo_users)} demo users")
      print(f"- {len(purchase_orders)} purchase orders")
      print(f"- {len(expenses)} expenses")
      print(f"- {len(invoices)} invoices with payments, forecasts, reviews, and notifications")
    finally:
      db.close()


if __name__ == "__main__":
    seed()
