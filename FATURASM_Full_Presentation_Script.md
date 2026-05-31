# FATURASM Full Presentation Script

This script is written for three presenters. İpek's part is intentionally longer because she introduces the product workflow and performs the live demo.

## Timing Plan

- Süleyman: 3-4 minutes
- Atakan: 3-4 minutes
- İpek: 7-10 minutes including demo
- Total target: 13-18 minutes

---

## Slide 1: FATURASM

**Speaker: Süleyman**

Hello everyone. We are Group 16, and our project is called FATURASM.

FATURASM is an AI-assisted finance ERP and smart invoice processing system. Our project started with the idea of processing invoices with computer vision, but during development we expanded it into a more complete finance operations platform.

Today we will show not only OCR invoice extraction, but also authentication, invoice review, approval workflow, payment tracking, MockPay Sandbox payment simulation, purchase orders, expenses, ledger, reports, analytics, and user roles.

Our goal was to build something that feels like a working business application, not only a prototype.

---

## Slide 2: Presentation Roadmap

**Speaker: Süleyman**

We divided the presentation into three parts.

First, I will explain the problem, motivation, and broad impact of the project.

Then Atakan will explain the technical architecture, backend structure, data model, and testing.

After that, İpek will explain the product workflow in more detail and show the live demo at the end. Her part is longer because the demo connects all parts of the system together.

---

## Slide 3: Problem and Motivation

**Speaker: Süleyman**

The main problem we focused on is manual invoice processing.

In many companies, invoices are still entered manually into spreadsheets or accounting systems. This causes delays, human errors, missing data, and difficulty tracking payments.

Traditional OCR can extract text from a document, but that alone is not enough. A company also needs review, approval, payment control, audit logs, reports, and analytics.

So our motivation was to build a system that starts with invoice OCR but continues into a complete finance workflow.

---

## Slide 4: From OCR Prototype to Finance ERP

**Speaker: Süleyman**

At the beginning, our project was mainly about smart invoice processing with computer vision.

But if we only extracted text, the system would stop too early. In a real company, invoice data has to be validated, approved, paid, reported, and audited.

That is why FATURASM evolved from an OCR prototype into a finance ERP-style system.

The workflow is: upload the invoice, run OCR, review uncertain fields, approve the invoice, record or simulate payment, and then show the results in audit trails, reports, analytics, and ledger entries.

---

## Slide 5: Broad Impact

**Speaker: Süleyman**

This project has several impacts.

Economically, it reduces manual data-entry work and helps companies track invoices and payments faster.

Environmentally, it supports digital invoice storage and reduces paper-based workflows.

Socially, it helps employees move away from repetitive manual typing and focus more on validation and decision-making.

Legally and ethically, the system keeps financial operations traceable through approval gates and audit trails. This is important because invoice data can affect real financial decisions.

Now Atakan will explain how we built the system technically.

---

## Slide 6: System Architecture

**Speaker: Atakan**

FATURASM uses a modern full-stack architecture.

The frontend is built with Next.js, React, TypeScript, and Tailwind CSS. This is where users interact with dashboards, invoices, reports, workflow pages, and ERP modules.

The backend is built with FastAPI and Python. It exposes REST API endpoints for authentication, invoices, upload, review, workflow, payments, users, purchase orders, expenses, ledger, forecasts, and analytics.

The service layer includes OCR processing, document extraction, forecasting logic, audit helpers, and the payment provider abstraction.

The data layer uses SQLite with SQLAlchemy models. For a capstone project, this gives us a reliable local database and realistic relational data.

---

## Slide 7: Backend and Data Model

**Speaker: Atakan**

The backend data model is one of the most important parts of the project.

The core entities are users, customers, suppliers, invoices, invoice items, and payments.

For the AI and workflow side, we also have extraction runs, forecasts, workflow notifications, and audit events.

For the ERP expansion, we added purchase orders, purchase order items, expenses, and ledger entries.

This model lets the system represent the full lifecycle of finance operations. For example, an invoice can be connected to a supplier, a customer, approval status, payment records, forecast data, audit events, and ledger visibility.

---

## Slide 8: Testing and Reliability

**Speaker: Atakan**

Because we need to present the system live, reliability is very important.

We added backend tests with pytest. These tests cover approval-gated payments and forecasts, Google authentication failure handling, user role updates, purchase order creation, expense creation, and ledger summary behavior.

We also added a Playwright browser smoke test. This test logs into the app and checks key pages like dashboard, invoices, reports, tasks, users, purchase orders, expenses, and ledger.

We also run lint and build checks with Next.js. So the project is not just visually complete; it also has automated verification.

Now İpek will explain the product experience and show the live workflow.

---

## Slide 9: Product Overview

**Speaker: İpek**

Now I will explain the user side of FATURASM and then show the live demo.

The main idea is that the user should feel like they are using a finance cockpit. After logging in, the dashboard gives a summary of invoices, revenue, overdue risk, purchase orders, expenses, and ledger balance.

The navigation is grouped into Operations, Finance, Business, and Admin modules. This makes it feel closer to an ERP system rather than a single-purpose OCR tool.

We also added realistic seed data, so when the application starts, it already looks like a company has been using it.

---

## Slide 10: Authentication and Roles

**Speaker: İpek**

FATURASM is protected by authentication.

For the presentation, we use reliable email and password demo accounts. There are different personas such as admin, finance manager, AP specialist, and internal auditor.

We also implemented real Google Identity login. If a Google OAuth Client ID is configured, the app can verify Google ID tokens through the backend and create a FATURASM JWT session.

For the live presentation, email login is safer because it does not depend on internet configuration, but the real Google login support is already coded.

---

## Slide 11: Invoice Lifecycle

**Speaker: İpek**

This is the most important workflow in the project.

An invoice starts as an uploaded document. The system applies OCR and extracts structured fields such as invoice number, issue date, due date, supplier, customer, subtotal, tax, total, and line items.

If the result needs review, it goes to the Review Queue.

Then the invoice can be approved. Only after approval can payment and forecast operations happen.

After payment, the invoice status updates automatically. The audit trail records the lifecycle events, and the ledger and reports show the financial effect.

---

## Slide 12: Human-in-the-Loop Review

**Speaker: İpek**

A key design decision is that we do not blindly trust OCR.

Invoices can be blurry, rotated, incomplete, or have different layouts. Because of this, the system can mark extraction results as review required.

In the Review Queue, a user can check and correct extracted fields before the data becomes part of the finance system.

This is important ethically and practically because AI should assist finance teams, but human users should still validate uncertain financial data.

---

## Slide 13: Workflow, Payments, and MockPay

**Speaker: İpek**

The workflow module controls invoice approval and reminders.

Payments are approval-gated. This means the system blocks payment actions if the invoice is not approved yet.

For payments, we support manual payment records, including partial payments. If only part of the invoice is paid, the invoice becomes partially paid.

We also added MockPay Sandbox. This simulates a payment provider. It creates a checkout session and lets us complete a sandbox payment without needing real bank or payment-service credentials.

This makes the demo reliable while still showing a realistic provider-style payment flow.

---

## Slide 14: ERP Expansion Modules

**Speaker: İpek**

To make the system feel like a complete finance ERP, we added modules beyond invoices.

Purchase Orders track supplier procurement with PO numbers, expected delivery dates, statuses, line items, and totals.

Expenses track company spend such as travel, software, office, utilities, and logistics. The expenses page also supports filtering and CSV export.

The General Ledger shows lightweight accounting-style entries with debit, credit, account, source, and reference.

The Users page shows ERP users, roles, and account status.

These modules help FATURASM feel like a broader finance platform instead of only an invoice screen.

---

## Slide 15: Reports and Analytics

**Speaker: İpek**

Reports and analytics turn operational data into management information.

The Reports page can export PDF and CSV files, such as executive summaries, invoice risk, and supplier spend.

The Analytics page shows revenue trends, supplier concentration, AI automation metrics, and learning-loop information from the review process.

This is important because after invoices are processed, managers need to understand risk, cash flow, supplier behavior, and operational workload.

---

## Slide 16: Live Demo Plan

**Speaker: İpek**

Now I will switch to the live application.

In the demo, I will first log in and show the dashboard.

Then I will show the invoice module. If upload is stable, I will upload a prepared invoice file. If not, I will use a seeded invoice so the demo stays safe.

Then I will show the invoice detail page, approve the invoice, add a partial payment, complete a MockPay Sandbox checkout, and show the audit trail.

After that, I will open Purchase Orders, Expenses, Ledger, Reports, and Users to show that FATURASM is a full finance ERP-style system.

---

## Slide 17: Demo Backup Plan

**Speaker: İpek**

Because live demos can sometimes be unpredictable, we also prepared a backup plan.

If OCR upload takes too long or the file format causes a problem, I will open one of the seeded demo invoices.

The seeded data already includes pending invoices, approved invoices, payments, forecasts, review items, purchase orders, expenses, and ledger entries.

So even if upload is skipped, we can still show the full invoice lifecycle: approval, payment, MockPay, audit trail, ledger, and reports.

This keeps the presentation reliable.

---

## Slide 18: Conclusion

**Speaker: İpek**

To conclude, FATURASM started as a smart invoice processing project with computer vision, but the final result is a working AI-assisted finance ERP system.

It supports authentication, invoice OCR, human review, approval workflow, payment tracking, MockPay Sandbox, purchase orders, expenses, ledger, reports, analytics, and user management.

The most important achievement is that the project connects AI document processing to a realistic business workflow.

Instead of only reading an invoice, FATURASM shows what happens after the invoice enters the company: it is reviewed, approved, paid, audited, reported, and reflected in finance visibility.

Thank you. Now we are ready for questions.
