#!/usr/bin/env python3
"""
Test direct round creation in database
"""

import sys
sys.path.append('.')
from database import get_db
from models_updated import Round
from datetime import datetime, timedelta
import json

def test_direct_round_creation():
    """Test creating a round directly in database"""
    
    print("=" * 80)
    print("اختبار إنشاء جولة مباشرة في قاعدة البيانات")
    print("=" * 80)
    
    try:
        db = next(get_db())
        
        # Calculate dates
        scheduled_date = datetime.now() + timedelta(days=1)
        deadline_days = 7
        end_date = scheduled_date + timedelta(days=deadline_days)
        
        # Create round data
        round_data = {
            "round_code": f"RND-TEST-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "title": "جولة اختبار النظام المحدث",
            "description": "جولة لاختبار حفظ deadline و end_date",
            "round_type": "PATIENT_SAFETY",
            "department": "العناية المركزة",
            "assigned_to": json.dumps(["testuser"]),
            "scheduled_date": scheduled_date,
            "deadline": end_date,  # deadline as calculated date
            "end_date": end_date,  # end_date as calculated date
            "priority": "medium",
            "notes": "اختبار النظام المحدث",
            "created_by_id": 24,  # testuser ID
            "evaluation_items": json.dumps([])
        }
        
        print("📝 بيانات الجولة:")
        print(f"   كود الجولة: {round_data['round_code']}")
        print(f"   العنوان: {round_data['title']}")
        print(f"   التاريخ المجدول: {round_data['scheduled_date']}")
        print(f"   المهلة: {round_data['deadline']}")
        print(f"   تاريخ الانتهاء: {round_data['end_date']}")
        
        # Create round
        print("\n🚀 إنشاء الجولة...")
        new_round = Round(**round_data)
        
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
    test_direct_round_creation()
