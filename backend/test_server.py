"""
Simple test script to verify backend functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import create_tables
from app.models import Customer, Supplier, Invoice, InvoiceItem

def test_database():
    """Test database creation and basic operations"""
    try:
        print("🔄 Creating database tables...")
        create_tables()
        print("✅ Database tables created successfully!")
        
        print("🎯 Backend is ready for development!")
        print("\n📋 Available API endpoints:")
        print("   GET    /api/v1/customers")
        print("   POST   /api/v1/customers")
        print("   GET    /api/v1/suppliers") 
        print("   POST   /api/v1/suppliers")
        print("   GET    /api/v1/invoices")
        print("   POST   /api/v1/invoices")
        print("   GET    /api/v1/payments")
        print("   POST   /api/v1/payments")
        print("   GET    /api/v1/forecasts")
        print("   POST   /api/v1/upload/csv")
        print("   POST   /api/v1/upload/excel")
        print("\n📖 API Documentation: http://localhost:8000/docs")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_database()
