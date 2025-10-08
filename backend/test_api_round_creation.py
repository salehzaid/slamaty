#!/usr/bin/env python3
"""
Test API round creation with deadline and end_date
"""

import requests
import json
from datetime import datetime, timedelta

def test_api_round_creation():
    """Test creating a round through API"""
    
    base_url = "http://localhost:8000"
    
    print("=" * 80)
    print("اختبار إنشاء جولة عبر API مع deadline و end_date")
    print("=" * 80)
    
    try:
        # Step 1: Login
        print("\n🔐 تسجيل الدخول...")
        login_data = {
            "username": "amjad",
            "password": "password123"
        }
        
        login_response = requests.post(f"{base_url}/api/auth/signin", json=login_data)
        
        if login_response.status_code != 200:
            print(f"❌ فشل في تسجيل الدخول: {login_response.status_code}")
            print(login_response.text)
            return
        
        token = login_response.json()["access_token"]
        print("✅ تم تسجيل الدخول بنجاح")
        
        # Step 2: Get required data
        print("\n📋 جلب البيانات المطلوبة...")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get departments
        dept_response = requests.get(f"{base_url}/api/departments", headers=headers)
        departments = dept_response.json()
        department = departments[0]["name"] if departments else "العناية المركزة"
        print(f"   القسم: {department}")
        
        # Get round types
        round_types_response = requests.get(f"{base_url}/api/round-types", headers=headers)
        round_types = round_types_response.json()
        round_type = round_types[0]["name"] if round_types else "PATIENT_SAFETY"
        print(f"   نوع الجولة: {round_type}")
        
        # Get users
        users_response = requests.get(f"{base_url}/api/users", headers=headers)
        users = users_response.json()
        user_id = users[0]["id"] if users else 1
        print(f"   المستخدم: {users[0]['first_name']} {users[0]['last_name']} (ID: {user_id})")
        
        # Get evaluation items
        items_response = requests.get(f"{base_url}/api/evaluation-items", headers=headers)
        items = items_response.json()
        item_ids = [item["id"] for item in items[:3]] if items else []
        print(f"   عناصر التقييم: {len(item_ids)} عنصر")
        
        # Step 3: Create round data
        print("\n📝 إنشاء بيانات الجولة...")
        
        # Calculate dates
        scheduled_date = datetime.now() + timedelta(days=1)
        deadline_days = 5  # 5 days
        end_date = scheduled_date + timedelta(days=deadline_days)
        
        round_data = {
            "title": "جولة اختبار API المحدث",
            "description": "جولة لاختبار API مع deadline و end_date",
            "round_type": round_type,
            "department": department,
            "assigned_to": [user_id],
            "evaluation_items": item_ids,
            "scheduled_date": scheduled_date.isoformat(),
            "deadline": end_date.isoformat(),  # Send as ISO string
            "end_date": end_date.isoformat(),  # Send as ISO string
            "priority": "medium",
            "notes": "اختبار API المحدث"
        }
        
        print(f"   العنوان: {round_data['title']}")
        print(f"   التاريخ المجدول: {round_data['scheduled_date']}")
        print(f"   المهلة: {round_data['deadline']}")
        print(f"   تاريخ الانتهاء: {round_data['end_date']}")
        
        # Step 4: Create round
        print("\n🚀 إنشاء الجولة عبر API...")
        
        create_response = requests.post(f"{base_url}/api/rounds", 
                                      json=round_data, 
                                      headers=headers)
        
        if create_response.status_code != 200:
            print(f"❌ فشل في إنشاء الجولة: {create_response.status_code}")
            print(create_response.text)
            return
        
        created_round = create_response.json()
        print("✅ تم إنشاء الجولة بنجاح")
        print(f"   كود الجولة: {created_round['round_code']}")
        print(f"   ID: {created_round['id']}")
        
        # Step 5: Verify the round was created with correct data
        print("\n🔍 التحقق من البيانات المحفوظة...")
        
        # Get the created round
        round_id = created_round['id']
        get_response = requests.get(f"{base_url}/api/rounds/{round_id}", headers=headers)
        
        if get_response.status_code != 200:
            print(f"❌ فشل في جلب الجولة: {get_response.status_code}")
            return
        
        saved_round = get_response.json()
        
        print("\n📊 البيانات المحفوظة:")
        print("-" * 50)
        print(f"   scheduled_date: {saved_round.get('scheduled_date', 'غير محدد')}")
        print(f"   deadline:       {saved_round.get('deadline', 'غير محدد')}")
        print(f"   end_date:       {saved_round.get('end_date', 'غير محدد')}")
        print(f"   round_code:     {saved_round.get('round_code', 'غير محدد')}")
        print(f"   title:          {saved_round.get('title', 'غير محدد')}")
        print(f"   department:     {saved_round.get('department', 'غير محدد')}")
        print("-" * 50)
        
        # Check if dates are correct
        if saved_round.get('scheduled_date') and saved_round.get('end_date'):
            print("\n✅ تم حفظ التواريخ بنجاح!")
        else:
            print("\n❌ لم يتم حفظ التواريخ بشكل صحيح")
            
        print("\n" + "=" * 80)
        print("تم الانتهاء من الاختبار")
        print("=" * 80)
        
    except Exception as e:
        print(f"\n❌ خطأ: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_api_round_creation()
