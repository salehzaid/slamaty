#!/usr/bin/env python3
"""
سكريبت إنشاء جداول قاعدة البيانات لـ نظام سلامتي
يتم تشغيله تلقائياً لإنشاء جميع الجداول والبيانات الأولية
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv

# تحميل متغيرات البيئة
load_dotenv()

def create_database_tables():
    """إنشاء جداول قاعدة البيانات"""
    
    # إعدادات قاعدة البيانات
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:mass@localhost:5432/salamaty_system")
    
    try:
        # إنشاء محرك قاعدة البيانات
        engine = create_engine(DATABASE_URL)
        
        print("🔗 جاري الاتصال بقاعدة البيانات...")
        
        # اختبار الاتصال
        with engine.connect() as connection:
            result = connection.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"✅ تم الاتصال بنجاح: {version}")
        
        print("📋 جاري إنشاء الجداول...")
        
        # قراءة وتنفيذ سكريبت SQL من نفس مجلد الملف
        sql_path = os.path.join(os.path.dirname(__file__), 'create_database.sql')
        with open(sql_path, 'r', encoding='utf-8') as file:
            sql_script = file.read()
        
        # تقسيم السكريبت إلى أوامر منفصلة
        commands = [cmd.strip() for cmd in sql_script.split(';') if cmd.strip()]
        
        with engine.connect() as connection:
            for i, command in enumerate(commands, 1):
                if command:
                    try:
                        connection.execute(text(command))
                        print(f"✅ تم تنفيذ الأمر {i}/{len(commands)}")
                    except Exception as e:
                        if "already exists" in str(e) or "duplicate key" in str(e):
                            print(f"⚠️  تحذير في الأمر {i}: {e}")
                        else:
                            print(f"❌ خطأ في الأمر {i}: {e}")
            
            # تأكيد التغييرات
            connection.commit()
        
        print("🎉 تم إنشاء جميع الجداول بنجاح!")
        
        # عرض ملخص الجداول
        with engine.connect() as connection:
            result = connection.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            """))
            
            tables = [row[0] for row in result.fetchall()]
            print(f"\n📊 الجداول المنشأة ({len(tables)}):")
            for table in tables:
                print(f"  • {table}")
        
        # عرض عدد السجلات في كل جدول
        print(f"\n📈 عدد السجلات في كل جدول:")
        with engine.connect() as connection:
            for table in tables:
                try:
                    result = connection.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    count = result.fetchone()[0]
                    print(f"  • {table}: {count} سجل")
                except Exception as e:
                    print(f"  • {table}: خطأ في العد - {e}")
        
        return True
        
    except SQLAlchemyError as e:
        print(f"❌ خطأ في قاعدة البيانات: {e}")
        return False
    except Exception as e:
        print(f"❌ خطأ عام: {e}")
        return False

def test_connection():
    """اختبار الاتصال بقاعدة البيانات"""
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:mass@localhost:5432/salamaty_system")
    
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("✅ اختبار الاتصال نجح!")
            return True
    except Exception as e:
        print(f"❌ فشل اختبار الاتصال: {e}")
        return False

if __name__ == "__main__":
    print("🚀 بدء إنشاء قاعدة بيانات نظام سلامتي")
    print("=" * 50)
    
    # اختبار الاتصال أولاً
    if not test_connection():
        print("❌ لا يمكن الاتصال بقاعدة البيانات. تأكد من:")
        print("  1. تشغيل PostgreSQL")
        print("  2. وجود قاعدة البيانات salamaty_system")
        print("  3. صحة بيانات الاتصال في ملف .env")
        sys.exit(1)
    
    # إنشاء الجداول
    if create_database_tables():
        print("\n🎉 تم إنشاء قاعدة البيانات بنجاح!")
        print("يمكنك الآن تشغيل التطبيق باستخدام: python main.py")
    else:
        print("\n❌ فشل في إنشاء قاعدة البيانات")
        sys.exit(1)
