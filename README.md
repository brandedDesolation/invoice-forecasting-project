# Invoice Processing System

A simple invoice processing system with OCR capabilities.

## Features

- Invoice image upload
- OCR text extraction using EasyOCR
- Invoice data extraction and database storage
- Simple demo frontend

## Tech Stack

Frontend:
- Next.js 14
- TypeScript
- Tailwind CSS

Backend:
- FastAPI
- EasyOCR
- SQLAlchemy
- SQLite

## Getting Started

### Frontend

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open http://localhost:3000/demo to access the demo page

### Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment and install dependencies:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Run the backend server:
```bash
python -m app.main
```

The API will be available at http://localhost:8000

## Project Structure

```
vicai/
├── app/
│   └── demo/
│       └── page.tsx       # Demo invoice upload page
├── backend/
│   ├── app/
│   │   ├── main.py        # FastAPI application
│   │   ├── models.py      # Database models
│   │   ├── schemas.py     # Pydantic schemas
│   │   ├── routers/       # API routes
│   │   └── services/
│   │       └── ocr_service.py  # OCR processing
│   └── requirements.txt
└── lib/
    └── api.ts             # Frontend API utilities
```

## Usage

1. Start the backend server
2. Start the frontend development server
3. Navigate to /demo
4. Upload an invoice image
5. View the extracted invoice data
