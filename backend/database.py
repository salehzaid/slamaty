from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL - يمكن تغييرها حسب البيئة
# Default to salamaty_db to ensure all data is persisted to the expected local DB
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:mass@localhost:5432/salamaty_db")

# Print which database name is being used (mask credentials) for easier debugging in logs
try:
    from urllib.parse import urlparse
    parsed = urlparse(DATABASE_URL)
    db_name = parsed.path.lstrip('/') if parsed.path else DATABASE_URL
    print(f"[DB] Using database: {db_name}")
except Exception:
    print("[DB] Using DATABASE_URL (unable to parse name)")

# Create engine with better error handling and connection pooling
try:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Verify connections before use
        pool_recycle=300,    # Recycle connections every 5 minutes
        echo=False,          # Set to True for SQL debugging
        connect_args={
            "connect_timeout": 10,
            "application_name": "salamaty_app"
        }
    )
    print("[DB] Engine created successfully")
except Exception as e:
    print(f"[DB] Error creating engine: {e}")
    raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

try:
    from sqlalchemy.orm import declarative_base
    Base = declarative_base()
except ImportError:
    from sqlalchemy.ext.declarative import declarative_base
    Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        # Ensure the session uses the public schema so table names resolve correctly
        db.execute(text("SET search_path TO public;"))
        # Test the connection before yielding
        db.execute(text("SELECT 1"))
        yield db
    except SQLAlchemyError as e:
        print(f"[DB] Database session error: {e}")
        db.rollback()
        raise
    except Exception as e:
        print(f"[DB] Unexpected database error: {e}")
        db.rollback()
        raise
    finally:
        db.close()
