# Invoice Forecasting System

AI-powered invoice processing, forecasting, and analytics.

The frontend (Next.js) uses the FastAPI backend (Python) for OCR extraction, invoice CRUD, analytics, and (placeholder) forecasting.

## Features

- Invoice image OCR + editable extracted fields
- Save extracted invoices (including supplier/customer + line items when provided)
- Invoice CRUD (create/edit/delete, manage invoice images)
- Forecasting endpoints (currently includes a placeholder prediction flow)
- Analytics dashboards (revenue, invoice counts, trends, and a simple revenue forecast)
- Admin UI

## Tech Stack

Frontend:
- Next.js 14
- React
- TypeScript
- Tailwind CSS

Backend:
- FastAPI
- SQLAlchemy
- SQLite (default)
- Python 3.9+

OCR:
- `pytesseract` (requires the Tesseract binary on your system)
- Optional `easyocr` fallback (only used if installed)
- Optional OpenCV preprocessing (improves OCR quality if available)

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- Python 3.9+
- Tesseract installed (for `pytesseract` to work)

### 1) Start the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env as needed

bash run.sh
```

Backend URLs:
- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 2) Start the frontend

From the repo root:

```bash
npm install
npm run dev
```

Open:
- http://localhost:3000

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
