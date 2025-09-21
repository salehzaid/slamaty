#!/usr/bin/env python3
"""
سكريبت نقل البيانات الافتراضية إلى قاعدة البيانات المحلية
قاعدة البيانات: salamaty_db
المستخدم: postgres
كلمة المرور: mass
"""

import os
import sys
import subprocess
from pathlib import Path

def run_sql_file(sql_file_path, database_url):
    """تشغيل ملف SQL على قاعدة البيانات"""
    try:
        # استخراج معلومات الاتصال من URL
        # postgresql://postgres:mass@localhost:5432/salamaty_db
        parts = database_url.replace('postgresql://', '').split('@')
        user_pass = parts[0].split(':')
        host_db = parts[1].split('/')
        host_port = host_db[0].split(':')
        
        username = user_pass[0]
        password = user_pass[1]
        host = host_port[0]
        port = host_port[1] if len(host_port) > 1 else '5432'
        database = host_db[1]
        
        print(f"الاتصال بقاعدة البيانات: {host}:{port}/{database}")
        print(f"المستخدم: {username}")
        
        # تشغيل psql command
        cmd = [
            'psql',
            f'-h {host}',
            f'-p {port}',
            f'-U {username}',
            f'-d {database}',
            f'-f {sql_file_path}'
        ]
        
        # تعيين متغير البيئة لكلمة المرور
        env = os.environ.copy()
        env['PGPASSWORD'] = password
        
        print("تشغيل سكريبت SQL...")
        result = subprocess.run(' '.join(cmd), shell=True, env=env, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ تم تشغيل السكريبت بنجاح!")
            print("النتائج:")
            print(result.stdout)
            return True
        else:
            print("❌ حدث خطأ في تشغيل السكريبت:")
            print("STDERR:", result.stderr)
            print("STDOUT:", result.stdout)
            return False
            
    except Exception as e:
        print(f"❌ خطأ في تشغيل السكريبت: {e}")
        return False

def check_psql_installed():
    """فحص إذا كان psql مثبت"""
    try:
        result = subprocess.run(['psql', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ PostgreSQL مثبت: {result.stdout.strip()}")
            return True
        else:
            print("❌ PostgreSQL غير مثبت")
            return False
    except FileNotFoundError:
        print("❌ PostgreSQL غير مثبت أو غير موجود في PATH")
        return False

def check_database_connection(database_url):
    """فحص الاتصال بقاعدة البيانات"""
    try:
        parts = database_url.replace('postgresql://', '').split('@')
        user_pass = parts[0].split(':')
        host_db = parts[1].split('/')
        host_port = host_db[0].split(':')
        
        username = user_pass[0]
        password = user_pass[1]
        host = host_port[0]
        port = host_port[1] if len(host_port) > 1 else '5432'
        database = host_db[1]
        
        cmd = [
            'psql',
            f'-h {host}',
            f'-p {port}',
            f'-U {username}',
            f'-d {database}',
            '-c "SELECT version();"'
        ]
        
        env = os.environ.copy()
        env['PGPASSWORD'] = password
        
        result = subprocess.run(' '.join(cmd), shell=True, env=env, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ الاتصال بقاعدة البيانات ناجح!")
            return True
        else:
            print("❌ فشل الاتصال بقاعدة البيانات:")
            print("STDERR:", result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ خطأ في فحص الاتصال: {e}")
        return False

def main():
    """الدالة الرئيسية"""
    print("=" * 60)
    print("🚀 بدء عملية نقل البيانات إلى قاعدة البيانات المحلية")
    print("=" * 60)
    
    # إعدادات قاعدة البيانات المحلية
    database_url = "postgresql://postgres:mass@localhost:5432/salamaty_db"
    sql_file = "migrate_to_local_db.sql"
    
    # فحص وجود ملف SQL
    if not os.path.exists(sql_file):
        print(f"❌ ملف SQL غير موجود: {sql_file}")
        return False
    
    print(f"📁 ملف SQL: {sql_file}")
    print(f"🗄️ قاعدة البيانات: {database_url}")
    
    # فحص تثبيت PostgreSQL
    print("\n1️⃣ فحص تثبيت PostgreSQL...")
    if not check_psql_installed():
        print("يرجى تثبيت PostgreSQL أولاً")
        return False
    
    # فحص الاتصال بقاعدة البيانات
    print("\n2️⃣ فحص الاتصال بقاعدة البيانات...")
    if not check_database_connection(database_url):
        print("يرجى التأكد من:")
        print("- تشغيل خادم PostgreSQL")
        print("- إنشاء قاعدة البيانات salamaty_db")
        print("- صحة بيانات الاتصال")
        return False
    
    # تشغيل سكريبت SQL
    print("\n3️⃣ تشغيل سكريبت نقل البيانات...")
    if run_sql_file(sql_file, database_url):
        print("\n🎉 تم نقل البيانات بنجاح!")
        print("\n📊 البيانات المنقولة:")
        print("- 5 مستخدمين")
        print("- 6 أقسام")
        print("- 6 تصنيفات تقييم")
        print("- 9 عناصر تقييم")
        print("- 6 جولات")
        print("- 5 خطط تصحيحية")
        print("- 7 نتائج تقييم")
        
        print("\n🔗 يمكنك الآن:")
        print("1. فتح pgAdmin4 والاتصال بقاعدة البيانات salamaty_db")
        print("2. تحديث إعدادات التطبيق لاستخدام قاعدة البيانات المحلية")
        print("3. تشغيل التطبيق والتحقق من البيانات")
        
        return True
    else:
        print("\n❌ فشل في نقل البيانات")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
