# FATURASM Live Demo Workflow

This is the exact demo flow for İpek. Keep this file open during rehearsal.

## Before The Demo

Run the app:

```bash
npm run seed:demo
npm run dev:all
```

Open:

```text
http://localhost:3000/admin/login
```

Login:

```text
admin@invoiceforecast.com
admin123
```

Prepare one invoice file:

- Use `docs/demo-assets/simple-service-invoice.txt`
- Open it and print/save as PDF, or screenshot it as an image
- Keep the file on Desktop so it is easy to upload

## Demo Rule

If upload or OCR is slow, do not panic. Use seeded invoice backup:

```text
Menu → Finance → Invoices → open a pending invoice
```

Good seeded backup invoices:

- `VICAI-DEMO-2026-004`
- `VICAI-DEMO-2026-005`

## 1. Login

Action:

```text
Go to /admin/login
Enter admin@invoiceforecast.com
Enter admin123
Click Sign In
```

Say:

“We start from a protected login page. FATURASM supports role-based users such as admin, finance manager, accountant, and auditor. For demo reliability we use email login, but Google Identity login is also implemented when configured.”

Expected result:

```text
Dashboard opens
```

## 2. Dashboard

Action:

```text
Show dashboard cards and action center
```

Say:

“This is the finance cockpit. It summarizes total invoices, active customers, revenue, overdue invoices, purchase orders, expenses, and ledger balance. The action center shows operational items that need attention.”

Point to:

- Total Invoices
- Total Revenue
- Overdue Invoices
- Purchase Orders
- Expenses
- Ledger Balance

## 3. Open Invoices

Action:

```text
Click hamburger menu
Finance → Invoices
```

Say:

“Invoices are the core object of the system. Each invoice connects to customer, supplier, approval state, payments, forecasts, and audit events.”

Expected result:

```text
Invoice list opens
```

## 4. Primary Option: Upload A New Invoice

Action:

```text
Click Upload Invoice
Choose prepared invoice PDF/image
Submit upload
```

Say:

“Here we upload an actual invoice document. The system uses OCR to extract structured invoice fields instead of requiring the user to type everything manually.”

If upload succeeds:

```text
Open the created invoice or follow the app result page
```

If upload is slow or fails:

Say:

“For demo safety, I will use a seeded invoice that already represents the same lifecycle.”

Then use backup flow below.

## 5. Backup Option: Use Seeded Invoice

Action:

```text
Menu → Finance → Invoices
Open VICAI-DEMO-2026-004 or another pending invoice
```

Say:

“This seeded invoice is part of our realistic demo dataset. It lets us show the same business process reliably.”

Expected result:

```text
Invoice detail page opens
```

## 6. Invoice Detail

Action:

```text
Show invoice fields, customer, supplier, totals, line items
```

Say:

“This page shows the full invoice record: extracted fields, supplier and customer information, totals, line items, approval status, payments, AI insights, and audit trail.”

Point to:

- Invoice number
- Supplier
- Customer
- Total
- Approval status
- Payment panel
- Audit trail

## 7. Review Queue

Action:

```text
Menu → Operations → Review Queue
Show review-required items
```

Say:

“If OCR confidence is low, the document is routed to the Review Queue. This is our human-in-the-loop step. The system does not blindly trust AI output for financial data.”

Then return:

```text
Menu → Finance → Invoices → open selected invoice again
```

## 8. Approve Invoice

Action:

```text
On invoice detail, find approval/workflow area
Click Approve
Add note if needed: Approved during team demo
Submit
```

Say:

“Payments and forecasts are approval-gated. This means the system prevents payment operations until a finance manager approves the invoice.”

Expected result:

```text
Approval status becomes approved
Audit trail updates
```

If payment previously failed:

Say:

“Before approval, payment is blocked. After approval, payment becomes available.”

## 9. Add Manual Partial Payment

Action:

```text
In payment panel, enter an amount smaller than invoice total
Payment method: Bank Transfer
Reference: DEMO-PAY-001
Notes: Team demo partial payment
Submit
```

Recommended amount:

```text
1000
```

Say:

“Now I record a partial payment. The invoice status updates automatically, so the invoice can become partially paid instead of only pending or paid.”

Expected result:

```text
Payment appears in payment list
Invoice status refreshes
Audit trail gets payment event
```

## 10. Complete MockPay Sandbox

Action:

```text
Click Create Checkout
Then click Complete Sandbox Payment
```

Say:

“This is MockPay Sandbox. It simulates an external payment provider. We use this instead of real bank credentials so the demo is reliable, but the system still follows a provider-style checkout flow.”

Expected result:

```text
Checkout session created
Sandbox payment completed
Payment list refreshes
Audit trail updates
```

## 11. Generate Or Show AI Forecast

Action:

```text
Find AI forecast/insights area
Click Generate Forecast if visible
Or show existing forecast
```

Say:

“The system also provides payment-risk forecasting. It estimates risk and expected payment behavior using invoice and customer payment context.”

Expected result:

```text
Risk level / predicted payment insight visible
```

## 12. Show Audit Trail

Action:

```text
Scroll to Audit Trail
```

Say:

“The audit trail records important lifecycle events: invoice creation, review, approval, payment, forecast, and MockPay checkout. This makes the system more trustworthy for finance and audit teams.”

Point to:

- Approval event
- Payment event
- MockPay event
- Forecast event

## 13. Purchase Orders

Action:

```text
Menu → Finance → Purchase Orders
Open one PO
```

Say:

“Purchase Orders add the procurement side of the ERP. We can track supplier commitments, expected delivery dates, statuses, line items, and totals before invoices arrive.”

## 14. Expenses

Action:

```text
Menu → Finance → Expenses
Show filters and CSV export
```

Say:

“Expenses expand the system beyond invoices. FATURASM tracks company spending such as travel, software, office, utilities, and logistics.”

## 15. Ledger

Action:

```text
Menu → Finance → Ledger
Show summary cards and ledger rows
```

Say:

“The ledger gives accounting-style visibility. It shows accounts, debit, credit, source, and reference. We are not claiming to build full accounting software, but this gives traceability across finance events.”

Point to:

- Receivables
- Payables
- Cash Collected
- Expenses
- Debit/Credit rows

## 16. Reports

Action:

```text
Menu → Business → Reports
Click Download PDF or show report cards
```

Say:

“Managers can export reports as PDF or CSV. This supports supplier spend analysis, invoice risk review, and executive summaries.”

## 17. Users

Action:

```text
Menu → Admin → Users
```

Say:

“The system also includes user management. Users have role labels such as admin, finance manager, accountant, and auditor. This makes the authentication layer feel like a real ERP access system.”

## 18. Closing Demo Line

Say:

“This completes the full invoice-to-payment workflow. FATURASM starts from an invoice document, extracts and reviews data, controls approval, records payment, simulates provider checkout, creates audit visibility, and connects the result to ERP modules such as purchase orders, expenses, ledger, reports, analytics, and users.”

## Emergency Recovery

If the app freezes:

```bash
lsof -ti tcp:3000 tcp:8000 | xargs kill -9
rm -rf .next
npm run seed:demo
npm run dev:all
```

If payment fails:

```text
Check that invoice is approved first.
Use a smaller payment amount.
Use seeded invoice backup.
```

If upload fails:

```text
Use seeded invoice backup.
Say: “To keep the demo stable, I will continue from a pre-seeded invoice that represents the same workflow.”
```

If Google login is asked:

Say:

“Real Google Identity login is implemented, but it requires a Google OAuth Client ID in environment variables. For presentation reliability, we use seeded email/password users.”
