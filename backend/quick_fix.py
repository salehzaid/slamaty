#!/usr/bin/env python3
"""
إصلاح سريع لجميع المشاكل
"""

import os
import subprocess
import signal
import time

def kill_process_on_port(port):
    """إيقاف العملية التي تستخدم منفذ معين"""
    try:
        result = subprocess.run(f"lsof -ti:{port}", shell=True, capture_output=True, text=True)
        if result.stdout.strip():
            pids = result.stdout.strip().split('\n')
            for pid in pids:
                if pid:
                    os.kill(int(pid), signal.SIGTERM)
                    print(f"🔄 تم إيقاف العملية {pid} على المنفذ {port}")
            time.sleep(2)
        return True
    except Exception as e:
        print(f"⚠️ تحذير: {e}")
        return False

def main():
    print("🚀 إصلاح سريع لجميع المشاكل")
    print("=" * 40)
    
    # 1. إيقاف العمليات القديمة
    print("🔄 إيقاف العمليات القديمة...")
    kill_process_on_port(8000)  # Backend
    kill_process_on_port(5174)  # Frontend
    
    # 2. إصلاح bcrypt
    print("🔧 إصلاح bcrypt...")
    os.system("pip install --upgrade 'bcrypt==4.0.1' 'passlib[bcrypt]==1.7.4'")
    
    # 3. إنشاء مستخدم جديد
    print("👤 إنشاء مستخدم جديد...")
    os.system("python create_new_user.py")
    
    print("\n🎉 تم الإصلاح!")
    print("\n📍 الآن شغّل:")
    print("1️⃣ Backend: python main.py")
    print("2️⃣ Frontend: npm run dev (في ترمينال جديد)")
    print("3️⃣ Ngrok: ngrok http 5174 (في ترمينال ثالث)")
    
    print("\n🔑 بيانات الدخول الجديدة:")
    print("   👤 اسم المستخدم: testuser")
    print("   🔑 كلمة المرور: test123")

if __name__ == "__main__":
    main()
