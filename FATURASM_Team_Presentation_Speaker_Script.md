## FATURASM
**Speaker:** Süleyman

Open the presentation by introducing the project name, team members, and the main idea: FATURASM is no longer only an OCR project; it is a working finance ERP-style capstone application.

## Presentation Roadmap
**Speaker:** Süleyman

Explain that each person will cover a clear part. Mention that İpek will take the longest part because she will connect the product story and run the live demo at the end.

## Problem and Motivation
**Speaker:** Süleyman

Focus on why the project matters. Manual invoice work wastes time, creates errors, and makes payment tracking hard. FATURASM solves this by combining document processing with workflow automation.

## From OCR Prototype to Finance ERP
**Speaker:** Süleyman

Explain the evolution: at first the project focused on reading invoices. The final version shows the whole lifecycle: upload, OCR, review, approval, payment, audit, reports, and ERP modules.

## Broad Impact
**Speaker:** Süleyman

Mention economic, environmental, societal, and legal impact. Keep it short and connect it to the university report.

## System Architecture
**Speaker:** Atakan

Explain the four layers. The important point is that the project is a real full-stack app, not a static UI.

## Backend and Data Model
**Speaker:** Atakan

Talk about data modelling. Emphasize that new ERP entities make the system more complete and realistic.

## Testing and Reliability
**Speaker:** Atakan

Explain that reliability matters for the final presentation. Mention that lint, build, backend tests, smoke backend, and Playwright tests were used.

## Product Overview
**Speaker:** İpek

Start your longer section by connecting the technical work to the user experience. FATURASM is meant to feel like a usable finance workspace.

## Authentication and Roles
**Speaker:** İpek

Say that the demo uses email/password accounts for reliability. Real Google Identity login is implemented and can be enabled with a Google Client ID.

## Invoice Lifecycle
**Speaker:** İpek

This is one of your most important slides. Explain that the system is not just reading invoices; it controls the full lifecycle.

## Human-in-the-Loop Review
**Speaker:** İpek

Emphasize responsibility and reliability. The system uses AI, but keeps humans in control when confidence is low.

## Workflow, Payments, and MockPay
**Speaker:** İpek

Explain the exact demo: first approve the invoice, then add a partial payment, then create and complete MockPay checkout.

## ERP Expansion Modules
**Speaker:** İpek

This slide proves the project is not small. It has broader ERP modules similar to SAP-style finance operations.

## Reports and Analytics
**Speaker:** İpek

Explain that reporting makes the system useful after data is processed. Reports and analytics turn operational data into decisions.

## Live Demo Plan
**Speaker:** İpek

Before switching to the browser, tell the audience exactly what they will see. This makes the demo easier to follow.

## Demo Backup Plan
**Speaker:** İpek

This is your safety slide. If OCR/upload is slow, use seeded data. The full business workflow still works.

## Conclusion
**Speaker:** İpek

Close by summarizing the value: FATURASM combines AI document processing with real finance operations.
