# FATURASM

FATURASM is an AI-assisted finance ERP built for a final university capstone demo. It connects invoice upload, OCR extraction, human review, approval workflow, payment tracking, purchase orders, expenses, general ledger, payment-risk forecasting, reports, suppliers, customers, users, and analytics in one admin app.

## Features

- JWT-protected admin console
- PDF/image invoice upload with OCR and structured extraction
- Human review queue for low-confidence extraction runs
- Invoice, customer, supplier, payment, and workflow management
- ERP modules for purchase orders, expenses, general ledger, and user management
- Approval gates for forecasts, reminders, and payment recording
- AI payment-risk forecasts and invoice-level insights
- Reports, task center, nav badges, CSV exports, and demo settings
- Real Google Identity login when configured and MockPay Sandbox payment gateway
- Demo seed data for realistic dashboards and presentation flows

## Tech Stack

Frontend:
- Next.js 14
- React
- TypeScript
- Tailwind CSS

Backend:
- FastAPI
- Tesseract OCR via `pytesseract`
- SQLAlchemy
- SQLite (default)
- Python 3.9+

OCR:
- `pytesseract` (requires the Tesseract binary on your system)
- Optional `easyocr` fallback (only used if installed)
- Optional OpenCV preprocessing (improves OCR quality if available)

## Getting Started

### Recommended Demo Setup

- Node.js (LTS recommended)
- Python 3.9+
- Tesseract installed (for `pytesseract` to work)

1. Install frontend dependencies:
```bash
npm install
```

2. Install backend dependencies:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
cd ..
```

3. Seed demo data:
```bash
npm run seed:demo
```

4. Run the frontend and backend:
```bash
npm run dev:all
```

5. Open the admin app:
```bash
http://localhost:3000/admin/login
```

Default demo account:
- Email: `admin@invoiceforecast.com`
- Password: `admin123`

Additional seeded email/password fallback personas:
- Finance Manager: `manager@vicai.demo` / `manager123`
- AP Specialist: `accountant@vicai.demo` / `accountant123`
- Internal Auditor: `auditor@vicai.demo` / `auditor123`

Real Google login:
- Create a Google OAuth Client ID.
- Add it to `.env` as `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
- Add it to `backend/.env` as `GOOGLE_CLIENT_ID`.
- Keep email/password personas ready as the no-internet fallback.

Run the backend smoke check after both servers are running:
```bash
npm run smoke:backend
```

Demo invoice samples are available in `docs/demo-assets/`. For a live OCR upload, convert `simple-service-invoice.txt` or `turkish-style-invoice.txt` to PDF using print-to-PDF, then upload it from `/admin/invoices/upload`.

## Useful Scripts

```bash
npm run dev          # Frontend only
npm run dev:backend  # FastAPI backend only
npm run dev:all      # Frontend + backend
npm run seed:demo    # Realistic capstone dataset
npm run smoke:backend
npm run lint
npm run build
npm run test:e2e     # Browser smoke test for the capstone path
```

Optional (if your backend runs on a different host/port):
- Set `NEXT_PUBLIC_API_URL` (the frontend defaults to `http://localhost:8000`).

## Main API Endpoints

Most endpoints are under `/api/v1`.

### Health

- `GET /health`

### Upload / OCR

- `POST /api/v1/upload/ocr-only`
  - Runs OCR and returns extracted data without saving an invoice.
- `POST /api/v1/upload/invoice`
  - Runs OCR, then creates/updates supplier/customer/invoice records and saves extracted fields.
- `POST /api/v1/upload/invoice-with-data`
  - Saves an invoice using user-provided fields (typically after OCR review/editing).

Manage stored invoice images:
- `GET /api/v1/upload/invoice-image/{invoice_id}`
- `POST /api/v1/upload/invoice-image/{invoice_id}`
- `DELETE /api/v1/upload/invoice-image/{invoice_id}`

### Invoices

- `GET /api/v1/invoices?skip=&limit=&start_date=&end_date=`
- `GET /api/v1/invoices/{invoice_id}`
- `POST /api/v1/invoices`
- `PUT /api/v1/invoices/{invoice_id}`
- `DELETE /api/v1/invoices/{invoice_id}`
- `GET /api/v1/invoices/customer/{customer_id}`
- `GET /api/v1/invoices/supplier/{supplier_id}`

### Customers

- `GET /api/v1/customers?skip=&limit=`
- `GET /api/v1/customers/{customer_id}`
- `POST /api/v1/customers/`
- `PUT /api/v1/customers/{customer_id}`
- `DELETE /api/v1/customers/{customer_id}?cascade=true`

### Forecasts

- `GET /api/v1/forecasts?skip=&limit=`
- `GET /api/v1/forecasts/{forecast_id}`
- `POST /api/v1/forecasts`
- `GET /api/v1/forecasts/invoice/{invoice_id}`
- `POST /api/v1/forecasts/predict/{invoice_id}`

### Analytics

- `GET /api/v1/analytics/overview?days=30&start_date_str=YYYY-MM-DD&end_date_str=YYYY-MM-DD`
- `GET /api/v1/analytics/invoice-trends?days=30`
- `GET /api/v1/analytics/revenue?days=30`
- `GET /api/v1/analytics/invoices?days=30`
- `GET /api/v1/analytics/revenue-forecast?days=30` (returns a 30-day time series)

## Project Layout

- `app/`: Next.js pages (including the admin UI)
- `backend/`: FastAPI application (routers, services, OCR extraction, database models/schemas)
- `lib/`: Frontend API client utilities and shared types

## Testing

```bash
cd backend
pytest
```

## Project Structure

```
vicai/
├── app/
│   └── admin/             # Admin console routes
├── backend/
│   ├── app/
│   │   ├── main.py        # FastAPI application
│   │   ├── models.py      # Database models
│   │   ├── schemas.py     # Pydantic schemas
│   │   ├── routers/       # API routes
│   │   └── services/
│   ├── scripts/           # Demo seed and smoke checks
│   ├── tests/             # Backend workflow tests
│   └── requirements.txt
├── components/            # Shared admin UI components
└── lib/
    ├── api.ts             # Frontend API utilities
    └── csv.ts             # CSV export helper
```

## Presentation Flow

1. Log in at `/admin/login`
2. Start from Dashboard and Tasks to show operational load
3. Upload or review an invoice
4. Approve it from invoice detail or workflow
5. Record a payment and show partial payment status
6. Create and complete a MockPay Sandbox checkout from invoice detail
7. Generate or inspect the AI forecast
8. Open Purchase Orders, Expenses, Ledger, and Users to show the broader ERP workspace
9. Export reports and finish in Analytics

## Final Demo Checklist

1. `npm run seed:demo`
2. `npm run dev:all`
3. `npm run smoke:backend`
4. Visit `/admin/login` and use the demo account.
5. Open Dashboard, Tasks, Invoices, one Invoice Detail page, Reports, and Analytics.
6. Use Reports to download both PDF and CSV outputs.
