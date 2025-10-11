#!/usr/bin/env python3
"""
سكريبت لإعادة إنشاء المستخدمين في قاعدة البيانات
"""

from database import get_db
from models_updated import User, UserRole
from auth import get_password_hash
from sqlalchemy.orm import Session
from datetime import datetime

def create_users():
    """إنشاء المستخدمين المطلوبين"""
    
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
            "password": "123456"
        },
        {
            "username": "quality_manager",
            "email": "quality@salamaty.com",
            "first_name": "فاطمة",
            "last_name": "الأحمد",
            "role": UserRole.QUALITY_MANAGER,
            "position": "مديرة الجودة",
            "phone": "0501234568",
            "password": "123456"
        },
        {
            "username": "ed_head",
            "email": "ed@salamaty.com",
            "first_name": "أحمد",
            "last_name": "المحمد",
            "role": UserRole.DEPARTMENT_HEAD,
            "position": "رئيس قسم الطوارئ",
            "phone": "0501234569",
            "password": "123456"
        },
        {
            "username": "assessor1",
            "email": "assessor@salamaty.com",
            "first_name": "سارة",
            "last_name": "المقيم",
            "role": UserRole.ASSESSOR,
            "position": "مقيم جودة",
            "phone": "0501234570",
            "password": "123456"
        },
        {
            "username": "viewer1",
            "email": "viewer@salamaty.com",
            "first_name": "خالد",
            "last_name": "المشاهد",
            "role": UserRole.VIEWER,
            "position": "مشاهد",
            "phone": "0501234571",
            "password": "123456"
        }
    ]
    
    db = next(get_db())
    
    try:
        print("بدء إنشاء المستخدمين...")
        
        for user_data in users_data:
            # فحص إذا كان المستخدم موجود بالفعل
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()
            if existing_user:
                print(f"المستخدم {user_data['email']} موجود بالفعل، تم تخطيه")
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
            print(f"تم إنشاء المستخدم: {user_data['first_name']} {user_data['last_name']} ({user_data['email']})")
        
        # حفظ التغييرات
        db.commit()
        print("تم حفظ جميع المستخدمين بنجاح!")
        
        # عرض المستخدمين المنشأين
        print("\nالمستخدمون المنشأون:")
        users = db.query(User).all()
        for user in users:
            print(f"  - ID: {user.id}, الاسم: {user.first_name} {user.last_name}, البريد: {user.email}, الدور: {user.role}")
            
    except Exception as e:
        print(f"خطأ في إنشاء المستخدمين: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_users()
