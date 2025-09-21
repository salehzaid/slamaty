from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
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

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
