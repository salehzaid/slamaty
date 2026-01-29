#!/usr/bin/env python3
"""
سكريبت لإعادة تعيين كلمات مرور جميع المستخدمين إلى: user123
"""

from database import SessionLocal
from models_updated import User
from auth import get_password_hash

def reset_all_passwords():
    db = SessionLocal()
    
    try:
        print("=" * 80)
        print("🔑 إعادة تعيين كلمات مرور المستخدمين")
        print("=" * 80)
        
        # Get all users
        users = db.query(User).all()
        
        # Default password for all users
        default_password = "user123"
        hashed_password = get_password_hash(default_password)
        
        print(f"\n📊 إجمالي المستخدمين: {len(users)}")
        print(f"🔐 كلمة المرور الجديدة للجميع: {default_password}")
        print(f"\n🔄 جاري تحديث كلمات المرور...\n")
        
        updated_count = 0
        for user in users:
            user.hashed_password = hashed_password
            print(f"✅ تم تحديث: {user.username} ({user.email})")
            updated_count += 1
        
        # Commit all changes
        db.commit()
        
        print(f"\n{'=' * 80}")
        print(f"✅ تم تحديث {updated_count} كلمة مرور بنجاح!")
        print(f"🔐 كلمة المرور الموحدة: {default_password}")
        print(f"{'=' * 80}\n")
        
        # Print list of users for reference
        print("\n📋 قائمة المستخدمين المحدثة:")
        print("=" * 80)
        for user in users:
            print(f"""
Username: {user.username}
Email: {user.email}
Password: {default_password}
Role: {user.role}
Name: {user.first_name} {user.last_name}
{"-" * 80}
""")
        
    except Exception as e:
        print(f"❌ خطأ: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    reset_all_passwords()
