#!/usr/bin/env python3
"""
سكريبت للتحقق من بيانات المستخدمين في قاعدة البيانات
"""

from database import SessionLocal
from models_updated import User
from sqlalchemy import text

def main():
    db = SessionLocal()
    
    try:
        print("=" * 80)
        print("🔍 فحص المستخدمين في جدول public.users")
        print("=" * 80)
        
        # استعلام مباشر على جدول users
        result = db.execute(text("""
            SELECT id, username, email, first_name, last_name, role, department, is_active 
            FROM public.users 
            ORDER BY id
        """))
        
        users = result.fetchall()
        
        print(f"\n📊 إجمالي عدد المستخدمين في قاعدة البيانات: {len(users)}")
        print("\n" + "=" * 80)
        
        for user in users:
            print(f"""
ID: {user[0]}
اسم المستخدم: {user[1]}
البريد الإلكتروني: {user[2]}
الاسم الأول: {user[3]}
الاسم الأخير: {user[4]}
الدور: {user[5]}
القسم: {user[6]}
نشط: {user[7]}
{"-" * 80}
""")
        
        print("\n" + "=" * 80)
        print("✅ تم الانتهاء من فحص قاعدة البيانات")
        print("=" * 80)
        
        # التحقق من عدد المستخدمين باستخدام ORM
        print("\n🔍 التحقق باستخدام SQLAlchemy ORM:")
        orm_users = db.query(User).all()
        print(f"📊 عدد المستخدمين عبر ORM: {len(orm_users)}")
        
        if len(users) != len(orm_users):
            print("⚠️ تحذير: هناك اختلاف بين الاستعلام المباشر و ORM!")
        else:
            print("✅ النتائج متطابقة بين الاستعلام المباشر و ORM")
        
    except Exception as e:
        print(f"❌ خطأ: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    main()
