"""
Basic tests for CAPA creation flow and evaluation flags.
Run with: python3 backend/test_capa_flow.py
"""
from datetime import datetime, timedelta, timezone
import sys
sys.path.append('/Users/salehalzaid/Documents/massdeigners/salamah_rounds/backend')

from database import SessionLocal
from crud import create_evaluation_results, create_capa, get_capas

def test_create_evaluation_and_capa():
    db = SessionLocal()
    try:
        # Use existing test round (100), evaluator (59) and a valid evaluation item (8)
        payload = [
            { 'item_id': 8, 'status': 'not_applied', 'comments': 'وثيقة غير متوفرة #capa' }
        ]
        created, round_obj = create_evaluation_results(db, 100, payload, 59, finalize=False)
        print('Created evaluation results:', [r.id for r in created])

        # Now create CAPA manually
        capa_payload = {
            'title': 'Test CAPA from test_create_evaluation_and_capa',
            'description': 'Auto test CAPA',
            'round_id': 100,
            'evaluation_item_id': 8,
            'department': 'عام'
        }
        new_capa = create_capa(db, capa_payload, 59)
        print('Created CAPA id:', new_capa.id)

        caps = get_capas(db, skip=0, limit=10)
        print('Total CAPAs:', len(caps))
        print('CAPAs list sample:', [c.id for c in caps[:5]])
    finally:
        db.close()

if __name__ == '__main__':
    test_create_evaluation_and_capa()


