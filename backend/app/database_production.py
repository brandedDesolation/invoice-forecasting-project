"""
Production database configuration
Supports multiple database backends with environment-based switching
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool, StaticPool
from sqlalchemy.engine import Engine

def get_database_url() -> str:
    """Get database URL from environment variables"""
    database_type = os.getenv("DATABASE_TYPE", "sqlite").lower()
    
    if database_type == "postgresql":
        return f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
    elif database_type == "mysql":
        return f"mysql+pymysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
    else:
        # SQLite for development
        return os.getenv("DATABASE_URL", "sqlite:///./invoice_forecast.db")

def create_database_engine() -> Engine:
    """Create database engine based on environment"""
    database_url = get_database_url()
    database_type = os.getenv("DATABASE_TYPE", "sqlite").lower()
    
    # Engine configuration based on database type
    if database_type == "sqlite":
        # Development configuration
        return create_engine(
            database_url,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
            echo=os.getenv("SQL_ECHO", "false").lower() == "true"
        )
    
    elif database_type in ["postgresql", "mysql"]:
        # Production configuration
        return create_engine(
            database_url,
            poolclass=QueuePool,
            pool_size=int(os.getenv("DB_POOL_SIZE", "10")),
            max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "20")),
            pool_pre_ping=True,  # Verify connections before use
            pool_recycle=3600,   # Recycle connections every hour
            echo=os.getenv("SQL_ECHO", "false").lower() == "true"
        )
    
    else:
        raise ValueError(f"Unsupported database type: {database_type}")

# Create engine and session factory
engine = create_database_engine()
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
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")

def drop_tables():
    """Drop all tables in the database"""
    from .models import Base
    Base.metadata.drop_all(bind=engine)
    print("🗑️ Database tables dropped successfully!")

def get_database_info():
    """Get database connection information"""
    database_type = os.getenv("DATABASE_TYPE", "sqlite").lower()
    database_url = get_database_url()
    
    return {
        "type": database_type,
        "url": database_url.replace(database_url.split('@')[0].split('://')[1], "***") if '@' in database_url else database_url,
        "pool_size": engine.pool.size() if hasattr(engine.pool, 'size') else "N/A",
        "max_overflow": engine.pool._max_overflow if hasattr(engine.pool, '_max_overflow') else "N/A"
    }









