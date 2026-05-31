# Demo Risks And Mitigation

## Purpose
This note is for the live presentation team. It highlights what may fail, look incomplete, or require explanation during the demo, and how to manage each point confidently.

## 1. Backend Restart Requirement
Risk:
- Some newly added workflow and feedback-loop schema fields rely on the latest backend startup/migration pass.

Impact:
- If backend was not restarted after recent changes, workflow or analytics pieces may appear incomplete.

Mitigation:
- Restart backend before demo.
- Verify that workflow page loads and invoice approval/reminder actions respond.

## 2. Invoice List Export Button
Risk:
- `app/admin/invoices/page.tsx` still shows an export button that is not wired.

Impact:
- Clicking it during demo may do nothing and break confidence.

Mitigation:
- Do not use invoice list export in the live demo.
- Use supplier analytics CSV export instead, because that one is implemented and demo-ready.

## 3. Reminder Flow Is Internal Only
Risk:
- Workflow reminder action creates internal workflow state and notifications only.
- It does not send real email or SMS.

Impact:
- Audience may assume an actual communication channel exists.

Mitigation:
- Phrase it correctly:
  - “Reminder queueing is implemented.”
  - “External delivery integration is the next step.”
- Show workflow notification/log behavior instead of claiming outbound messaging.

## 4. OCR Accuracy Variability
Risk:
- OCR and line-item extraction can vary depending on invoice layout and quality.

Impact:
- A poor sample invoice may create weak extraction results during demo.

Mitigation:
- Prepare one or two clean demo invoices in advance.
- Use the synthetic reference files in `docs/demo-assets/`.
- Convert `simple-service-invoice.txt` or `turkish-style-invoice.txt` to PDF with print-to-PDF before live upload.
- If extraction is imperfect, pivot to review queue and human-in-the-loop story.

## 5. Empty-State Risk
Risk:
- Some pages depend on real data:
  - workflow page
  - review queue
  - analytics
  - supplier insights

Impact:
- If database is too empty, screens will look less impressive.

Mitigation:
- Run `npm run seed:demo` before the presentation.
- Make sure there are:
  - a few invoices
  - at least one supplier with spend
  - one invoice pending approval
  - one review-required extraction
  - one payment record

## 6. Dashboard Customer Count
Risk:
- Dashboard customer total is based on a frontend workaround, not a dedicated aggregate endpoint.

Impact:
- Large datasets could make that metric less ideal from a scalability perspective.

Mitigation:
- Treat it as a current product metric, not as a final performance claim.
- Avoid deep technical focus on that specific count implementation during presentation.

## 7. Auth Scope Is Still Admin-Centric
Risk:
- The product currently behaves as an admin-first system, not a complex multi-role permissions platform.

Impact:
- Questions about role hierarchy or departmental access may expose this gap.

Mitigation:
- Position current auth as:
  - “secure admin access foundation”
  - “ready for future role expansion”

## 8. OCR Feedback Loop Is Reporting, Not Retraining
Risk:
- The system tracks corrections and exposes learning-loop analytics, but it does not yet retrain models automatically.

Impact:
- If presented incorrectly, audience may think active model learning already exists.

Mitigation:
- Say:
  - “We now capture structured correction signals.”
  - “This creates the foundation for continuous model improvement.”

## 9. Environment Sensitivity
Risk:
- Demo depends on:
  - frontend running
  - backend running
  - correct `.env`
  - seeded admin credentials

Impact:
- Misconfiguration can cause login or data-loading failures.

Mitigation:
- Before presentation:
  - verify login works
  - verify dashboard loads
  - verify upload page opens
  - verify one invoice detail page works

## 10. Best Safe Demo Path
Recommended order:
1. Login
2. Dashboard
3. Upload
4. Review Queue
5. Invoice Detail
6. Workflow
7. Suppliers
8. Analytics

Why:
- This path shows value progressively and keeps the strongest screen, invoice detail, near the center of the story.

## Presenter Guidance
- Do not oversell unfinished integrations.
- Lean into the workflow + review + analytics story.
- If one feature underperforms, pivot to another connected screen instead of stopping.

Best fallback message:
- “What matters is that the operational loop is already connected end-to-end, and now we’re strengthening the automation around it.”
