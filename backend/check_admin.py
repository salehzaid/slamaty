from database import get_db
from models_updated import User
from auth import get_password_hash

db = next(get_db())
try:
    user = db.query(User).filter(User.email == "admin@salamaty.com").first()
    if user:
        print(f"User found: {user.username} (ID: {user.id})")
        print(f"Role: {user.role}")
        # Reset password just in case
        user.hashed_password = get_password_hash("admin123")
        db.commit()
        print("Password reset to 'admin123'")
    else:
        print("User 'admin@salamaty.com' NOT FOUND")
        # List all users
        users = db.query(User).all()
        print("Existing users:")
        for u in users:
            print(f"- {u.username} ({u.email})")
finally:
    db.close()
