#!/usr/bin/env python3
"""
Test direct round creation with API-like data
"""

import sys
sys.path.append('.')
from database import get_db
from models_updated import Round
from datetime import datetime, timedelta
import json

def test_direct_round_with_api_data():
    """Test creating a round with API-like data"""
    
    print("=" * 80)
    print("اختبار إنشاء جولة مع بيانات مشابهة للـ API")
    print("=" * 80)
    
    try:
        db = next(get_db())
        
        # Calculate dates
        scheduled_date = datetime.now() + timedelta(days=1)
        deadline_days = 3  # 3 days
        end_date = scheduled_date + timedelta(days=deadline_days)
        
        # Create round data similar to what API receives
        round_data = {
            "round_code": f"RND-API-TEST-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "title": "جولة اختبار API المحدث",
            "description": "جولة لاختبار API مع deadline و end_date",
            "round_type": "PATIENT_SAFETY",
            "department": "العناية المركزة",
            "assigned_to": json.dumps(["amjad"]),
            "scheduled_date": scheduled_date,
            "deadline": end_date.isoformat(),  # Send as ISO string like API
            "end_date": end_date.isoformat(),  # Send as ISO string like API
            "priority": "medium",
            "notes": "اختبار API المحدث",
            "created_by_id": 40,  # amjad ID
            "evaluation_items": json.dumps([])
        }
        
        print("📝 بيانات الجولة:")
        print(f"   كود الجولة: {round_data['round_code']}")
        print(f"   العنوان: {round_data['title']}")
        print(f"   التاريخ المجدول: {round_data['scheduled_date']}")
        print(f"   المهلة (ISO): {round_data['deadline']}")
        print(f"   تاريخ الانتهاء (ISO): {round_data['end_date']}")
        
        # Convert string dates to datetime (simulating what crud.py does)
        deadline_dt = None
        if round_data['deadline']:
            if isinstance(round_data['deadline'], str):
                deadline_dt = datetime.fromisoformat(round_data['deadline'].replace('Z', '+00:00'))
            else:
                deadline_dt = round_data['deadline']
        
        end_date_dt = None
        if round_data['end_date']:
            if isinstance(round_data['end_date'], str):
                end_date_dt = datetime.fromisoformat(round_data['end_date'].replace('Z', '+00:00'))
            else:
                end_date_dt = round_data['end_date']
        
        print(f"\n🔄 تحويل التواريخ:")
        print(f"   deadline_dt: {deadline_dt}")
        print(f"   end_date_dt: {end_date_dt}")
        
        # Create round
        print("\n🚀 إنشاء الجولة...")
        new_round = Round(
            round_code=round_data['round_code'],
            title=round_data['title'],
            description=round_data['description'],
            round_type=round_data['round_type'],
            department=round_data['department'],
            assigned_to=round_data['assigned_to'],
            scheduled_date=round_data['scheduled_date'],
            deadline=deadline_dt,
            end_date=end_date_dt,
            priority=round_data['priority'],
            notes=round_data['notes'],
            created_by_id=round_data['created_by_id'],
            evaluation_items=round_data['evaluation_items']
        )
        
        db.add(new_round)
        db.commit()
        db.refresh(new_round)
        
        print("✅ تم إنشاء الجولة بنجاح")
        print(f"   ID: {new_round.id}")
        print(f"   كود الجولة: {new_round.round_code}")
        
        # Verify the data
        print("\n🔍 التحقق من البيانات المحفوظة:")
        print("-" * 50)
        print(f"   scheduled_date: {new_round.scheduled_date}")
        print(f"   deadline:       {new_round.deadline}")
        print(f"   end_date:       {new_round.end_date}")
        print("-" * 50)
        
        # Check if dates are correct
        if new_round.scheduled_date and new_round.end_date:
            print("\n✅ تم حفظ التواريخ بنجاح!")
            
            # Calculate duration
            duration = (new_round.end_date - new_round.scheduled_date).days
            print(f"   المدة: {duration} يوم")
            
            # Check if deadline and end_date are the same
            if new_round.deadline and new_round.end_date:
                if new_round.deadline.date() == new_round.end_date.date():
                    print("✅ التواريخ متطابقة - deadline == end_date")
                else:
                    print("⚠️ التواريخ غير متطابقة")
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
    test_direct_round_with_api_data()
