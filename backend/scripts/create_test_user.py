import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

try:
    from backend.models_updated import User, UserRole
    from auth import get_password_hash
    from database import engine
except ImportError:
    from models_updated import User, UserRole
    from auth import get_password_hash
    from database import engine

DB_URL = os.getenv('TEST_DATABASE_URL', os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/salamaty_db'))

engine = create_engine(DB_URL)
SessionLocal = sessionmaker(bind=engine)


def ensure_test_user(email='testqm@local', password='test123'):
    db = SessionLocal()
    try:
        # Ensure we always have a hashed password value available for any INSERTs below
        hashed = get_password_hash(password)

        user = db.query(User).filter(User.email == email).first()
        if user:
            print(f"Test user already exists: {email}")
        else:
            user = User(
                username=email.split('@')[0],
                email=email,
                hashed_password=hashed,
                first_name='Test',
                last_name='QM',
                role='quality_manager',
                department='QA',
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created test user: {email} (id={user.id})")

        # Ensure there is at least one more user with id=2 for tests that expect a user with id=2
        user_with_id_2 = db.query(User).filter(User.id == 2).first()
        if not user_with_id_2:
            # Create user with id=2 via ORM to avoid enum/text mismatches in raw SQL
            try:
                user2 = User(
                    id=2,
                    username='testqm2',
                    email='testqm2@local',
                    hashed_password=hashed,
                    first_name='Test2',
                    last_name='QM2',
                    role=UserRole.QUALITY_MANAGER,
                    department='QA',
                    is_active=True
                )
                db.add(user2)
                db.commit()
                print("Ensured user with id=2 exists (created via ORM)")
            except Exception as e:
                db.rollback()
                print(f"Could not ensure id=2 user via ORM: {e}")
        # Ensure user with id=59 exists (used by some unit tests)
        user_59 = db.query(User).filter(User.id == 59).first()
        if not user_59:
            try:
                user59 = User(
                    id=59,
                    username='testuser59',
                    email='test59@local',
                    hashed_password=hashed,
                    first_name='Test59',
                    last_name='User59',
                    department='QA',
                    is_active=True
                )
                db.add(user59)
                db.commit()
                print("Created test user id=59")
            except Exception as e:
                db.rollback()
                print(f"Could not create user id=59 via ORM: {e}")

        # Ensure evaluation category id=1 exists (used by tests)
        from backend.models_updated import EvaluationCategory, Round, EvaluationItem, RiskLevel
        cat = db.query(EvaluationCategory).filter(EvaluationCategory.id == 1).first()
        if not cat:
            try:
                eval_cat = EvaluationCategory(id=1, name='Cat', color='blue')
                db.add(eval_cat)
                db.commit()
                print("Created evaluation category id=1")
            except Exception as e:
                db.rollback()
                print(f"Could not create evaluation category id=1: {e}")

        # Ensure some evaluation items and a round with id=1 exist for E2E tests
        # Ensure evaluation category exists (cat variable above)
        items_needed = 3
        existing_items = db.query(EvaluationItem).filter(EvaluationItem.category_id == cat.id).all()
        created_item_ids = [it.id for it in existing_items]
        try:
            for idx in range(len(created_item_ids)+1, items_needed+1):
                item = EvaluationItem(
                    code=f'E2E-ITEM-{idx}',
                    title=f'E2E Item {idx}',
                    title_en=f'E2E Item {idx}',
                    description='Created for E2E tests',
                    objective='Test objective',
                    category_id=cat.id,
                    category_name=cat.name,
                    category_color=cat.color,
                    is_active=True,
                    is_required=False,
                    weight=1,
                    risk_level=RiskLevel.MINOR
                )
                db.add(item)
                db.flush()
                created_item_ids.append(item.id)
            if created_item_ids:
                db.commit()
                print(f"Ensured {len(created_item_ids)} evaluation items for category id={cat.id}")
        except Exception as e:
            db.rollback()
            print(f"Could not create evaluation items: {e}")

        # Create or ensure round id=1 exists and references these items
        r = db.query(Round).filter(Round.id == 1).first()
        if not r:
            try:
                rnd = Round(
                    id=1,
                    round_code='RND-1',
                    title='E2E Test Round 1',
                    round_type='general',
                    department='عام',
                    assigned_to='[]',
                    assigned_to_ids=[],
                    scheduled_date=None,
                    created_by_id=2,
                    evaluation_items=created_item_ids
                )
                db.add(rnd)
                db.commit()
                print('Created stub round id=1 for E2E')
            except Exception as e:
                db.rollback()
                print(f'Could not create stub round id=1: {e}')
    finally:
        db.close()


if __name__ == '__main__':
    ensure_test_user()


