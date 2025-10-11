import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models_updated import User
from auth import get_password_hash

DB_URL = os.getenv('TEST_DATABASE_URL', os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/salamaty_db'))

engine = create_engine(DB_URL)
SessionLocal = sessionmaker(bind=engine)


def ensure_test_user(email='testqm@local', password='test123'):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            print(f"Test user already exists: {email}")
            return

        hashed = get_password_hash(password)
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
    finally:
        db.close()


if __name__ == '__main__':
    ensure_test_user()


