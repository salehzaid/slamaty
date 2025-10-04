#!/usr/bin/env python3
"""
اختبار الاتصال بقاعدة بيانات Neon وعرض المستخدمين الموجودين
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from models_updated import User, UserRole, Base
from datetime import datetime

# إعدادات قاعدة البيانات Neon
NEON_DATABASE_URL = "postgresql://neondb_owner:npg_ERS5fHwxWiu2@ep-lingering-morning-adejreab.us-east-1.aws.neon.tech/neondb?sslmode=require"

def test_neon_connection():
    """اختبار الاتصال بقاعدة بيانات Neon وعرض المستخدمين"""
    
    try:
        print("🔗 اختبار الاتصال بقاعدة بيانات Neon...")
        
        # إنشاء محرك قاعدة البيانات
        engine = create_engine(NEON_DATABASE_URL)
        
        # اختبار الاتصال
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("✅ تم الاتصال بقاعدة البيانات بنجاح!")
        
        # إنشاء جلسة قاعدة البيانات
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # فحص الجداول الموجودة
        print("\n📋 الجداول الموجودة في قاعدة البيانات:")
        with engine.connect() as connection:
            result = connection.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            """))
            tables = result.fetchall()
            for table in tables:
                print(f"  📊 {table[0]}")
        
        # محاولة قراءة المستخدمين الموجودين
        print("\n👥 المستخدمون الموجودون في قاعدة البيانات:")
        try:
            users = db.query(User).all()
            if users:
                for user in users:
                    print(f"  👤 {user.username} ({user.email}) - {user.first_name} {user.last_name} - {user.role}")
                print(f"\n📊 إجمالي المستخدمين: {len(users)}")
            else:
                print("  ⚠️ لا توجد مستخدمين في الجدول")
        except Exception as e:
            print(f"  ❌ خطأ في قراءة المستخدمين: {e}")
            print("  💡 قد تحتاج إلى إنشاء جدول المستخدمين أولاً")
        
        return True
        
    except Exception as e:
        print(f"❌ خطأ في الاتصال: {e}")
        print("\n💡 تأكد من:")
        print("  1. صحة رابط قاعدة البيانات")
        print("  2. وجود كلمة المرور الصحيحة")
        print("  3. إعدادات الجدار الناري")
        return False
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    print("🚀 اختبار الاتصال بقاعدة بيانات Neon")
    print("=" * 50)
    
    if test_neon_connection():
        print("\n✅ تم اختبار الاتصال بنجاح!")
        print("\nالآن يمكنك:")
        print("1. نسخ DATABASE_URL من env.neon إلى .env")
        print("2. إعادة تشغيل Backend")
        print("3. تسجيل الدخول باستخدام المستخدمين الموجودين")
    else:
        print("\n❌ فشل في الاتصال بقاعدة البيانات")
        print("يرجى التحقق من إعدادات قاعدة البيانات")
        sys.exit(1)
