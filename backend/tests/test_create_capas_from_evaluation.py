from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from models_updated import Base, Round, EvaluationItem, EvaluationResult, Capa
    from crud import create_capas_for_round_non_compliance
except ImportError:
    from backend.models_updated import Base, Round, EvaluationItem, EvaluationResult, Capa
    from backend.crud import create_capas_for_round_non_compliance

from datetime import datetime

DB_URL = os.getenv('TEST_DATABASE_URL', 'postgresql://postgres@localhost/salamaty_db')
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(bind=engine)


def test_create_capas_for_round_non_compliance_creates_and_skips_duplicates():
    db = SessionLocal()
    try:
        # create a round
        r = Round(
            round_code=f"TEST-{int(datetime.utcnow().timestamp())}",
            title='Test Round',
            round_type='general',
            department='عام',
            assigned_to='[]',
            assigned_to_ids=[],
            scheduled_date=datetime.utcnow(),
            created_by_id=1
        )
        db.add(r)
        db.commit()
        db.refresh(r)

        # create evaluation item
        item = EvaluationItem(
            code=f"ITM-{r.id}-1",
            title='Failing Item',
            category_id=1,
            category_name='Cat',
            category_color='blue'
        )
        db.add(item)
        db.commit()
        db.refresh(item)

        # add a failing evaluation result (score < 70)
        ev = EvaluationResult(
            round_id=r.id,
            item_id=item.id,
            score=30,
            comments='failed',
            evaluated_by=1
        )
        db.add(ev)
        db.commit()
        db.refresh(ev)

        # create CAPAs for non compliance
        res = create_capas_for_round_non_compliance(db, r.id, creator_id=1, threshold=70)
        assert res['success'] is True
        assert res['total_items'] == 1
        assert len(res['created_capas']) == 1

        # run again - should skip duplicate and create none
        res2 = create_capas_for_round_non_compliance(db, r.id, creator_id=1, threshold=70)
        assert res2['success'] is True
        assert res2['created_capas'] == []

        # cleanup created capas and records
        db.query(Capa).filter(Capa.round_id == r.id).delete()
        db.query(EvaluationResult).filter(EvaluationResult.round_id == r.id).delete()
        db.query(EvaluationItem).filter(EvaluationItem.id == item.id).delete()
        db.query(Round).filter(Round.id == r.id).delete()
        db.commit()

    finally:
        db.close()


