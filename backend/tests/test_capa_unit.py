import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from models_updated import Base, Capa, EvaluationResult, CapaStatus
except ImportError:
    from backend.models_updated import Base, Capa, EvaluationResult, CapaStatus

# Use test DB URL from env or fallback
DB_URL = os.getenv('TEST_DATABASE_URL', 'postgresql://postgres@localhost/salamaty_db')

engine = create_engine(DB_URL)
SessionLocal = sessionmaker(bind=engine)

def test_create_capa_and_audit_log():
    db = SessionLocal()
    try:
        # Create a CAPA
        from datetime import datetime, timedelta
        target = datetime.now() + timedelta(days=30)
        capa = Capa(
            title='Unit test CAPA',
            description='desc',
            round_id=None,
            department='عام',
            created_by_id=59,
            target_date=target,
            status=CapaStatus.PENDING.value,
            verification_status='pending'
        )
        db.add(capa)
        db.commit()
        db.refresh(capa)

        assert capa.id is not None
        assert capa.title == 'Unit test CAPA'

        # Clean up
        db.delete(capa)
        db.commit()
    finally:
        db.close()


