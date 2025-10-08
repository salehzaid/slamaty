#!/usr/bin/env python3
"""
Create a test user for testing
"""

import sys
sys.path.append('.')
from database import get_db
from models_updated import User
from passlib.context import CryptContext
from sqlalchemy.orm import Session

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_test_user():
    """Create a test user"""
    
    try:
        db = next(get_db())
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.username == "testuser").first()
        if existing_user:
            print("✅ المستخدم testuser موجود بالفعل")
            print(f"   ID: {existing_user.id}")
            print(f"   Username: {existing_user.username}")
            print(f"   Email: {existing_user.email}")
            return
        
        # Create new user
        hashed_password = pwd_context.hash("testpass")
        
        new_user = User(
            username="testuser",
            email="test@example.com",
            hashed_password=hashed_password,
            first_name="Test",
            last_name="User",
            is_active=True,
            role="admin"
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print("✅ تم إنشاء المستخدم testuser بنجاح")
        print(f"   ID: {new_user.id}")
        print(f"   Username: {new_user.username}")
        print(f"   Email: {new_user.email}")
        print(f"   Password: testpass")
        
    except Exception as e:
        print(f"❌ خطأ: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_test_user()
