# VICAI Backend

FastAPI backend for the VICAI capstone app: JWT and Google Identity authentication, invoice OCR upload, review queue, customers, suppliers, payments, purchase orders, expenses, ledger, workflow approvals, reminders, forecasts, reports, and analytics.

## Quick Start

### Prerequisites
- Python 3.9+
- pip or poetry

### Installation

1. Create virtual environment:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Seed demo data:
```bash
python3 scripts/seed_demo.py
```

5. Run the development server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs (Swagger)**: http://localhost:8000/docs
- **Alternative Docs (ReDoc)**: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── routers/             # API route handlers
│   ├── services/            # OCR, extraction, forecasting logic
│   ├── auth.py              # JWT auth and default admin seeding
│   ├── database.py          # SQLAlchemy session/engine
│   ├── migrations.py        # Minimal SQLite additive migrations
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   └── main.py
├── scripts/                 # Demo seed and smoke checks
├── tests/                   # Focused workflow tests
├── requirements.txt         # Python dependencies
└── .env.example             # Environment variables template
```

## API Endpoints

### Health
- `GET /health` - Health check
- `GET /health/db` - Database health check

### Auth
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/google`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`

### Operations
- `/api/v1/customers` - Customer CRUD
- `/api/v1/suppliers` - Supplier CRUD
- `/api/v1/invoices` - Invoice CRUD and line items
- `/api/v1/upload` - OCR upload, OCR-only extraction, reviewed invoice save, image files
- `/api/v1/review` - Human review queue and correction tracking
- `/api/v1/workflow` - Approval, reminders, notifications, workflow summary
- `/api/v1/payments` - Payment CRUD and invoice status refresh
- `/api/v1/users` - ERP user directory, role updates, and activation controls
- `/api/v1/purchase-orders` - Supplier purchase order workflow
- `/api/v1/expenses` - Company expense tracking and approval status
- `/api/v1/ledger` - Lightweight general ledger entries and summaries
- `/api/v1/forecasts` - Payment-risk forecast generation and latest forecast insight
- `/api/v1/analytics` - Revenue, invoice, supplier, AI, and learning-loop analytics

## Testing

```bash
pytest
```

## Demo Utilities

```bash
python3 scripts/seed_demo.py     # Create realistic demo data
python3 scripts/smoke_check.py   # Verify running API, auth, and key endpoints
```

The root project also includes Playwright frontend smoke tests:

```bash
cd ..
npm run test:e2e
```

## Development Notes

- Tesseract must be installed on the system for local OCR.
- `DEBUG=false` and `DEBUG_SQL=false` are the safer defaults.
- Payments, reminders, and forecasts are approval-gated for the capstone workflow story.
- The app uses minimal migrations for local demo development. Recreate or reseed the SQLite DB if you make large schema changes.

## Security

- Never commit `.env` file
- Change `SECRET_KEY` in production
- Use environment variables for sensitive data


