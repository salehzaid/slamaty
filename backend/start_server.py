#!/usr/bin/env python3
"""
تشغيل Backend مع إصلاح المشاكل تلقائياً
"""

import os
import sys
import subprocess
from pathlib import Path

def run_command(cmd, description):
    """تشغيل أمر مع عرض الوصف"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ {description} - نجح")
            return True
        else:
            print(f"❌ {description} - فشل: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ خطأ في {description}: {e}")
        return False

def main():
    print("🚀 تشغيل نظام سلامتي Backend")
    print("=" * 40)
    
    # التأكد من المجلد الصحيح
    backend_path = Path(__file__).parent
    os.chdir(backend_path)
    
    # 1. إنشاء ملف .env
    if not os.path.exists('.env'):
        run_command("cp env.local .env", "نسخ ملف الإعدادات")
    
    print("\n🎉 تم الإعداد بنجاح!")
    print("\n🔑 بيانات تسجيل الدخول:")
    print("   البريد الإلكتروني: test@example.com")
    print("   كلمة المرور: admin123")
    print("\n🚀 بدء تشغيل الخادم...")
    
    # 2. تشغيل الخادم
    os.system("python main.py")

if __name__ == "__main__":
    main()
