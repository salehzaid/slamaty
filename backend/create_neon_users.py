#!/usr/bin/env python3
"""
إنشاء المستخدمين في قاعدة بيانات Neon
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from models_updated import User, UserRole, Base
from auth import get_password_hash
from datetime import datetime

# إعدادات قاعدة البيانات Neon
NEON_DATABASE_URL = "postgresql://neondb_owner:npg_ERS5fHwxWiu2@ep-lingering-morning-adejreab-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def create_neon_users():
    """إنشاء المستخدمين في قاعدة بيانات Neon"""
    
    try:
        print("🔗 الاتصال بقاعدة بيانات Neon...")
        
        # إنشاء محرك قاعدة البيانات
        engine = create_engine(NEON_DATABASE_URL)
        
        # اختبار الاتصال
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("✅ تم الاتصال بقاعدة البيانات بنجاح!")
        
        # إنشاء الجداول إذا لم تكن موجودة
        print("📋 إنشاء الجداول...")
        Base.metadata.create_all(bind=engine)
        
        # إنشاء جلسة قاعدة البيانات
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # قائمة المستخدمين المطلوبين
        users_data = [
            {
                "username": "admin",
                "email": "admin@salamaty.com",
                "first_name": "مدير",
                "last_name": "النظام",
                "role": UserRole.SUPER_ADMIN,
                "position": "مدير النظام",
                "phone": "0501234567",
                "password": "admin123"
            },
            {
                "username": "quality_manager",
                "email": "quality@salamaty.com",
                "first_name": "فاطمة",
                "last_name": "الأحمد",
                "role": UserRole.QUALITY_MANAGER,
                "position": "مديرة الجودة",
                "phone": "0501234568",
                "password": "admin123"
            },
            {
                "username": "ed_head",
                "email": "ed@salamaty.com",
                "first_name": "أحمد",
                "last_name": "المحمد",
                "role": UserRole.DEPARTMENT_HEAD,
                "position": "رئيس قسم الطوارئ",
                "phone": "0501234569",
                "password": "admin123"
            },
            {
                "username": "assessor1",
                "email": "assessor@salamaty.com",
                "first_name": "سارة",
                "last_name": "المقيم",
                "role": UserRole.ASSESSOR,
                "position": "مقيم جودة",
                "phone": "0501234570",
                "password": "admin123"
            },
            {
                "username": "viewer1",
                "email": "viewer@salamaty.com",
                "first_name": "خالد",
                "last_name": "المشاهد",
                "role": UserRole.VIEWER,
                "position": "مشاهد",
                "phone": "0501234571",
                "password": "admin123"
            }
        ]
        
        print("👥 بدء إنشاء المستخدمين...")
        
        for user_data in users_data:
            # فحص إذا كان المستخدم موجود بالفعل
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()
            if existing_user:
                print(f"✅ المستخدم {user_data['email']} موجود بالفعل، تم تخطيه")
                continue
            
            # إنشاء المستخدم الجديد
            hashed_password = get_password_hash(user_data["password"])
            
            new_user = User(
                username=user_data["username"],
                email=user_data["email"],
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                role=user_data["role"],
                position=user_data["position"],
                phone=user_data["phone"],
                hashed_password=hashed_password,
                is_active=True,
                created_at=datetime.now()
            )
            
            db.add(new_user)
            print(f"✅ تم إنشاء المستخدم: {user_data['first_name']} {user_data['last_name']} ({user_data['email']})")
        
        # حفظ التغييرات
        db.commit()
        print("🎉 تم حفظ جميع المستخدمين بنجاح!")
        
        # عرض المستخدمين المنشأين
        print("\n📋 المستخدمون المتاحون:")
        users = db.query(User).all()
        for user in users:
            print(f"  👤 {user.username} ({user.email}) - {user.first_name} {user.last_name} - {user.role}")
        
        print("\n🔑 بيانات تسجيل الدخول:")
        print("  📧 admin@salamaty.com / 🔑 admin123")
        print("  📧 quality@salamaty.com / 🔑 admin123")
        print("  📧 ed@salamaty.com / 🔑 admin123")
        print("  📧 assessor@salamaty.com / 🔑 admin123")
        print("  📧 viewer@salamaty.com / 🔑 admin123")
        
        return True
        
    except Exception as e:
        print(f"❌ خطأ في إنشاء المستخدمين: {e}")
        return False
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    print("🚀 إنشاء المستخدمين في قاعدة بيانات Neon")
    print("=" * 50)
    
    if create_neon_users():
        print("\n✅ تم إنشاء المستخدمين بنجاح!")
        print("\nالآن يمكنك:")
        print("1. تحديث DATABASE_URL في ملف .env")
        print("2. إعادة تشغيل Backend")
        print("3. تسجيل الدخول باستخدام البيانات أعلاه")
    else:
        print("\n❌ فشل في إنشاء المستخدمين")
        sys.exit(1)
