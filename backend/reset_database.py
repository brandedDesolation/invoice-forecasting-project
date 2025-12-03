"""
Reset database - drops and recreates all tables
WARNING: This will delete all existing data!
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import drop_tables, create_tables, engine
from app.models import Base

if __name__ == "__main__":
    print("⚠️  WARNING: This will delete all existing data!")
    response = input("Are you sure you want to reset the database? (yes/no): ")
    
    if response.lower() == "yes":
        print("\n🗑️  Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        print("✅ Tables dropped")
        
        print("\n📦 Creating new tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully!")
        print("\n✨ Database reset complete!")
    else:
        print("❌ Database reset cancelled.")




