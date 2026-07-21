"""
Database Configuration
Configures database connection for AI learning service
"""

import os
from sqlalchemy import create_engine, Engine
from sqlalchemy.orm import sessionmaker, Session

# Database Configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./ai_learning.db"  # Default to SQLite for development
)

def create_db_engine() -> Engine:
    """Create database engine"""
    return create_engine(
        DATABASE_URL,
        echo=False,  # Set to True for SQL debugging
        pool_pre_ping=True,  # Verify connections before using
    )

def get_db_session():
    """Get database session"""
    engine = create_db_engine()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()

def test_connection() -> bool:
    """Test database connection"""
    try:
        engine = create_db_engine()
        with engine.connect() as conn:
            from sqlalchemy import text
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False
