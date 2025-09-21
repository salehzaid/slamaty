#!/usr/bin/env python3
"""
إصلاح مشكلة المستخدمين - حل مشكلة Foreign Key
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from database import get_db
from models_updated import User, UserRole
from auth import get_password_hash
from dotenv import load_dotenv

# تحميل متغيرات البيئة
load_dotenv()

def fix_users():
    """إصلاح مشكلة المستخدمين بدون حذف البيانات المرتبطة"""
    
    try:
        db = next(get_db())
        
        print("🔧 إصلاح مشكلة المستخدمين...")
        
        # البحث عن المستخدم admin
        admin_user = db.query(User).filter(User.username == 'admin').first()
        
        if admin_user:
            print(f"✅ المستخدم admin موجود بالفعل (ID: {admin_user.id})")
            print(f"📧 الإيميل: {admin_user.email}")
            print(f"👤 الاسم: {admin_user.first_name} {admin_user.last_name}")
            print(f"🔑 يمكنك تسجيل الدخول بـ:")
            print(f"   اسم المستخدم: admin")
            print(f"   كلمة المرور: admin123")
            
            # تحديث كلمة المرور للتأكد من أنها صحيحة
            admin_user.hashed_password = get_password_hash("admin123")
            db.commit()
            print("🔄 تم تحديث كلمة المرور")
            
        else:
            print("❌ المستخدم admin غير موجود، سأنشئه...")
            
            # إنشاء مستخدم admin جديد
            hashed_password = get_password_hash("admin123")
            
            new_admin = User(
                username="admin",
                email="admin@salamaty.com",
                first_name="مدير",
                last_name="النظام",
                role=UserRole.SUPER_ADMIN,
                department="إدارة الجودة",
                phone="0501234567",
                position="مدير النظام",
                hashed_password=hashed_password,
                is_active=True
            )
            
            db.add(new_admin)
            db.commit()
            print("✅ تم إنشاء المستخدم admin")
        
        # إنشاء مستخدمين إضافيين إن لم يكونوا موجودين
        additional_users = [
            {
                "username": "quality_manager",
                "email": "quality@salamaty.com",
                "first_name": "فاطمة",
                "last_name": "الأحمد",
                "role": UserRole.QUALITY_MANAGER,
                "password": "admin123"
            },
            {
                "username": "assessor1",
                "email": "assessor@salamaty.com",
                "first_name": "سارة",
                "last_name": "المقيم",
                "role": UserRole.ASSESSOR,
                "password": "admin123"
            }
        ]
        
        for user_data in additional_users:
            existing = db.query(User).filter(User.username == user_data["username"]).first()
            if not existing:
                hashed_password = get_password_hash(user_data["password"])
                new_user = User(
                    username=user_data["username"],
                    email=user_data["email"],
                    first_name=user_data["first_name"],
                    last_name=user_data["last_name"],
                    role=user_data["role"],
                    hashed_password=hashed_password,
                    is_active=True
                )
                db.add(new_user)
                print(f"✅ تم إنشاء المستخدم: {user_data['username']}")
        
        db.commit()
        
        # عرض جميع المستخدمين
        print("\n📋 المستخدمون المتاحون:")
        users = db.query(User).all()
        for user in users:
            print(f"  👤 {user.username} ({user.email}) - {user.role}")
        
        print("\n🎉 تم إصلاح المستخدمين بنجاح!")
        print("\n🔑 بيانات تسجيل الدخول:")
        print("   اسم المستخدم: admin")
        print("   كلمة المرور: admin123")
        print("   أو")
        print("   الإيميل: admin@salamaty.com")
        print("   كلمة المرور: admin123")
        
        return True
        
    except Exception as e:
        print(f"❌ خطأ في إصلاح المستخدمين: {e}")
        return False

def fix_bcrypt_issue():
    """إصلاح مشكلة bcrypt"""
    print("🔧 إصلاح مشكلة bcrypt...")
    
    try:
        # تحديث bcrypt
        os.system("pip install --upgrade bcrypt passlib")
        print("✅ تم تحديث bcrypt")
        return True
    except Exception as e:
        print(f"❌ خطأ في تحديث bcrypt: {e}")
        return False

if __name__ == "__main__":
    print("🚀 بدء إصلاح مشاكل النظام")
    print("=" * 40)
    
    # إصلاح bcrypt أولاً
    fix_bcrypt_issue()
    
    # إصلاح المستخدمين
    if fix_users():
        print("\n✅ تم إصلاح جميع المشاكل!")
        print("يمكنك الآن تشغيل الخادم: python main.py")
    else:
        print("\n❌ فشل في إصلاح المشاكل")
        sys.exit(1)
