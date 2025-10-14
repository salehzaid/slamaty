import pytest
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from backend.database import get_db
    from backend import crud
    from backend.auth import get_password_hash
except ImportError:
    from database import get_db
    import crud
    from auth import get_password_hash


def get_db_session():
    gen = get_db()
    db = next(gen)
    try:
        yield db
    finally:
        try:
            gen.close()
        except Exception:
            pass


def test_create_capas_from_evaluation_items():
    gen = get_db()
    db = next(gen)
    try:
        # Ensure a quality manager user exists (id=2 is used elsewhere)
        from backend.models_updated import User, EvaluationCategory
        qm = db.query(User).filter(User.email == 'testqm@local').first()
        if not qm:
            hashed = get_password_hash('test123')
            qm = User(username='testqm', email='testqm@local', hashed_password=hashed, first_name='Test', last_name='QM', role='quality_manager', department='QA', is_active=True)
            db.add(qm)
            db.commit()
            db.refresh(qm)

        # Create a unique category for this test
        import uuid
        test_cat_id = int(str(uuid.uuid4().int)[:6])
        cat = db.query(EvaluationCategory).filter(EvaluationCategory.name == f'E2E-CAT-{test_cat_id}').first()
        if not cat:
            cat = EvaluationCategory(name=f'E2E-CAT-{test_cat_id}', color='blue')
            db.add(cat)
            try:
                db.commit()
                db.refresh(cat)
            except Exception:
                # If a concurrent insert or sequence issue caused a PK conflict, rollback
                db.rollback()
                # Try to fetch the category that matches our generated name
                cat = db.query(EvaluationCategory).filter(EvaluationCategory.name == f'E2E-CAT-{test_cat_id}').first()
                if not cat:
                    # Fallback: pick any existing category to continue the test
                    cat = db.query(EvaluationCategory).first()

        # Ensure DB sequences are set to avoid duplicate primary key errors
        try:
            db.execute("SELECT setval(pg_get_serial_sequence('evaluation_items','id'), COALESCE((SELECT MAX(id) FROM evaluation_items), 1))")
            db.execute("SELECT setval(pg_get_serial_sequence('rounds','id'), COALESCE((SELECT MAX(id) FROM rounds), 1))")
            db.execute("SELECT setval(pg_get_serial_sequence('users','id'), COALESCE((SELECT MAX(id) FROM users), 1))")
            db.commit()
        except Exception:
            db.rollback()

        # Create evaluation items
        from backend.models_updated import EvaluationItem, Round
        items = []
        for i in range(3):
            unique_code = f'TEST-{uuid.uuid4().hex[:8]}-{i}'
            it = EvaluationItem(code=unique_code, title=f'Test Item {i}', category_id=cat.id, category_name=cat.name, category_color=cat.color)
            db.add(it)
            db.flush()
            items.append(it)
        db.commit()

        # Create round with these items
        rnd = db.query(Round).filter(Round.id == 5000).first()
        if not rnd:
            from datetime import datetime
            rnd = Round(id=5000, round_code='RND-5000', title='Test Round', round_type='general', department='عام', assigned_to='[]', assigned_to_ids=[], scheduled_date=datetime.utcnow(), created_by_id=qm.id, evaluation_items=[it.id for it in items])
            db.add(rnd)
            db.commit()
            db.refresh(rnd)

        # Create evaluation results: make one not_applied, others applied
        evals = []
        for idx, it in enumerate(items):
            status = 'not_applied' if idx == 0 else 'applied'
            evals.append({'item_id': it.id, 'status': status, 'comments': 'auto'})

        created_results, updated_round = crud.create_evaluation_results(db, rnd.id, evals, qm.id, finalize=False)
        assert len(created_results) == 3

        # Now create CAPAs for non-compliant items
        res = crud.create_capas_for_round_non_compliance(db, rnd.id, qm.id, threshold=70)
        assert res['success'] is True
        # Should create at least 1 capa for the not_applied item
        assert res['created_capas'] and len(res['created_capas']) >= 1
    finally:
        try:
            gen.close()
        except Exception:
            pass


