import pytest
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from crud import create_evaluation_results, create_capa, get_capas

DB_URL = os.getenv('TEST_DATABASE_URL', 'postgresql://postgres@localhost/salamaty_db')
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(bind=engine)

def test_evaluation_to_capa_flow():
    db = SessionLocal()
    try:
        # Create an evaluation that marks needs_capa via code path
        payload = [{ 'item_id': 8, 'status': 'not_applied', 'comments': 'اختبار #capa' }]
        created, round_obj = create_evaluation_results(db, 100, payload, 59, finalize=False)
        assert len(created) == 1

        # Create CAPA manually
        capa_payload = {
            'title': 'Integration test CAPA',
            'description': 'Integration test',
            'round_id': 100,
            'evaluation_item_id': 8,
            'department': 'عام'
        }
        new_capa = create_capa(db, capa_payload, 59)
        assert new_capa is not None

        # Query CAPAs
        capas = get_capas(db, skip=0, limit=10)
        assert isinstance(capas, list)

    finally:
        db.close()


