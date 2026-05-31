"""
Database configuration and session management
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import os

# Database URL - using SQLite for development
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./invoice_forecast.db")
DEBUG_SQL = os.getenv("DEBUG_SQL", "false").lower() == "true"

is_sqlite = "sqlite" in DATABASE_URL
is_sqlite_memory = DATABASE_URL.endswith(":memory:") or DATABASE_URL == "sqlite://"

# Create engine with SQLite-specific configurations
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if is_sqlite else {},
    poolclass=StaticPool if is_sqlite_memory else None,
    echo=DEBUG_SQL
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all tables in the database"""
    from .models import Base
    from .migrations import run_minimal_migrations
    Base.metadata.create_all(bind=engine)
    run_minimal_migrations(engine)
    print("✅ Database tables created successfully!")


def drop_tables():
    """Drop all tables in the database"""
    from .models import Base
    Base.metadata.drop_all(bind=engine)
    print("🗑️ Database tables dropped successfully!")
