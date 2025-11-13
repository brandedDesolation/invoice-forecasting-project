# Invoice Forecasting API - Backend

AI-powered invoice forecasting and financial solutions backend built with FastAPI.

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- pip or poetry

### Installation

1. **Create virtual environment:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Run the development server:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs (Swagger)**: http://localhost:8000/docs
- **Alternative Docs (ReDoc)**: http://localhost:8000/redoc

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── routes/          # API route handlers
│   ├── core/
│   │   ├── config.py        # Configuration settings
│   │   └── database.py      # Database setup
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Business logic
│   └── main.py              # FastAPI application
├── tests/                   # Test files
├── requirements.txt         # Python dependencies
└── .env.example            # Environment variables template
```

## 🔧 API Endpoints

### Health
- `GET /health` - Health check
- `GET /health/db` - Database health check

### Coming Soon
- Invoice CRUD operations
- File upload for invoice data
- Forecasting endpoints
- Analytics endpoints
- Authentication

## 🧪 Testing

```bash
pytest
```

## 📝 Development

- All routes should be in `app/api/routes/`
- Database models in `app/models/`
- Business logic in `app/services/`
- Request/Response schemas in `app/schemas/`

## 🔐 Security

- Never commit `.env` file
- Change `SECRET_KEY` in production
- Use environment variables for sensitive data


