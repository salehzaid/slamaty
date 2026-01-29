#!/usr/bin/env python3
"""
اختبار استدعاء API للمستخدمين
"""

import requests
import json

def test_get_users():
    """اختبار طلب GET /api/users"""
    
    # أولاً نحتاج تسجيل الدخول للحصول على التوكن
    print("=" * 80)
    print("🔐 تسجيل الدخول...")
    print("=" * 80)
    
    login_url = "http://127.0.0.1:8000/api/auth/signin"
    login_data = {
        "email": "admin@salamaty.com",
        "password": "admin123"
    }
    
    try:
        login_response = requests.post(login_url, json=login_data)
        print(f"Status Code: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            token = login_result.get("access_token")
            user = login_result.get("user")
            
            print(f"✅ تسجيل الدخول نجح")
            print(f"User: {user.get('first_name')} {user.get('last_name')}")
            print(f"Role: {user.get('role')}")
            print(f"Token: {token[:20]}...")
            
            # الآن نجرب استدعاء API المستخدمين
            print("\n" + "=" * 80)
            print("📋 جلب قائمة المستخدمين...")
            print("=" * 80)
            
            users_url = "http://127.0.0.1:8000/api/users"
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            users_response = requests.get(users_url, headers=headers)
            print(f"Status Code: {users_response.status_code}")
            
            if users_response.status_code == 200:
                users = users_response.json()
                print(f"\n✅ تم جلب {len(users)} مستخدم")
                print("\n" + "=" * 80)
                print("قائمة المستخدمين:")
                print("=" * 80)
                
                for user in users:
                    print(f"""
ID: {user.get('id')}
اسم المستخدم: {user.get('username')}
البريد الإلكتروني: {user.get('email')}
الاسم: {user.get('first_name')} {user.get('last_name')}
الدور: {user.get('role')}
القسم: {user.get('department')}
{"-" * 80}
""")
            elif users_response.status_code == 403:
                print(f"❌ ممنوع من الوصول - يتطلب صلاحيات super_admin أو quality_manager")
                print(f"Response: {users_response.text}")
            else:
                print(f"❌ فشل استدعاء API")
                print(f"Response: {users_response.text}")
        else:
            print(f"❌ فشل تسجيل الدخول")
            print(f"Response: {login_response.text}")
            
    except Exception as e:
        print(f"❌ خطأ: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_get_users()
