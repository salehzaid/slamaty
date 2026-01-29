from database import SessionLocal
from models_updated import Round, User
from sqlalchemy import text

def check_rounds():
    db = SessionLocal()
    try:
        print("Checking rounds in DB with assigned_to_ids...")
        rounds = db.query(Round).order_by(Round.id.desc()).limit(10).all()
        print(f"Total rounds found: {db.query(Round).count()}")
        for r in rounds:
            print(f"ID: {r.id}, Title: {r.title}, AssignedIDs: {r.assigned_to_ids}, AssignedNames: {r.assigned_to}")
            
        print("\nChecking users...")
        users = db.query(User).all()
        for u in users:
            print(f"ID: {u.id}, Name: {u.first_name} {u.last_name}, Email: {u.email}")
            
        # specifically check user ID 1 (admin@salamaty.com)
        admin = db.query(User).filter(User.id == 1).first()
        if admin:
             print(f"\nAdmin user found: ID={admin.id}, Name={admin.first_name} {admin.last_name}")
             # Check if rounds are assigned to him
             query = text(f"SELECT id, title, assigned_to_ids FROM rounds WHERE assigned_to_ids @> '[{admin.id}]'::jsonb")
             result = db.execute(query).fetchall()
             print(f"Rounds assigned to admin (ID {admin.id}) using @> operator: {len(result)}")
             for row in result:
                 print(f"  - Round {row[0]}: {row[1]} (IDs: {row[2]})")
        else:
            print("\nAdmin user (ID 1) NOT found!")

    finally:
        db.close()

if __name__ == "__main__":
    check_rounds()
