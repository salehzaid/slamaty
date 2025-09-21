#!/usr/bin/env python3
"""
إنشاء مستخدم جديد للتجربة
"""

import os
import sys
from database import get_db
from models_updated import User, UserRole
from auth import get_password_hash
from dotenv import load_dotenv

# تحميل متغيرات البيئة
load_dotenv()

def create_test_user():
    """إنشاء مستخدم تجريبي جديد"""
    
    try:
        db = next(get_db())
        
        print("🔧 إنشاء مستخدم تجريبي جديد...")
        
        # بيانات المستخدم الجديد
        username = "testuser"
        email = "testuser@salamaty.com"
        password = "test123"
        
        # فحص إذا كان المستخدم موجود
        existing_user = db.query(User).filter(User.username == username).first()
        if existing_user:
            print(f"✅ المستخدم {username} موجود بالفعل")
            # تحديث كلمة المرور
            existing_user.hashed_password = get_password_hash(password)
            db.commit()
            print(f"🔄 تم تحديث كلمة المرور")
        else:
            # إنشاء مستخدم جديد
            hashed_password = get_password_hash(password)
            
            new_user = User(
                username=username,
                email=email,
                first_name="مستخدم",
                last_name="تجريبي",
                role=UserRole.SUPER_ADMIN,
                department="تجريبي",
                phone="0501234999",
                position="مختبر",
                hashed_password=hashed_password,
                is_active=True
            )
            
            db.add(new_user)
            db.commit()
            print(f"✅ تم إنشاء المستخدم الجديد")
        
        print("\n🎉 المستخدم جاهز!")
        print(f"\n🔑 بيانات تسجيل الدخول الجديدة:")
        print(f"   👤 اسم المستخدم: {username}")
        print(f"   🔑 كلمة المرور: {password}")
        print(f"   📧 أو الإيميل: {email}")
        print(f"   🔑 كلمة المرور: {password}")
        
        # عرض جميع المستخدمين المتاحين
        print(f"\n📋 جميع المستخدمين المتاحين:")
        users = db.query(User).filter(User.is_active == True).all()
        for user in users:
            print(f"  👤 {user.username} ({user.email}) - {user.first_name} {user.last_name}")
        
        return True
        
    except Exception as e:
        print(f"❌ خطأ في إنشاء المستخدم: {e}")
        return False

if __name__ == "__main__":
    print("🚀 إنشاء مستخدم تجريبي")
    print("=" * 30)
    
    if create_test_user():
        print("\n✅ تم إنشاء المستخدم بنجاح!")
        print("\nالآن يمكنك:")
        print("1. فتح http://localhost:5174")
        print("2. تسجيل الدخول بـ: testuser / test123")
    else:
        print("\n❌ فشل في إنشاء المستخدم")
        sys.exit(1)
