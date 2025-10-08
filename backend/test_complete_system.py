#!/usr/bin/env python3
"""
Complete system test - check round creation and calendar display
"""

import sys
sys.path.append('.')
from database import get_db
from models_updated import Round
from datetime import datetime, timedelta
import json

def test_complete_system():
    """Test complete system functionality"""
    
    print("=" * 80)
    print("اختبار النظام الكامل - إنشاء الجولة وعرض التقويم")
    print("=" * 80)
    
    try:
        db = next(get_db())
        
        # 1. Check existing rounds
        print("\n📊 فحص الجولات الموجودة...")
        existing_rounds = db.query(Round).order_by(Round.created_at.desc()).limit(5).all()
        
        print(f"   إجمالي الجولات: {len(existing_rounds)}")
        
        for round_data in existing_rounds:
            print(f"\n🔵 {round_data.round_code}")
            print(f"   العنوان: {round_data.title}")
            print(f"   scheduled_date: {round_data.scheduled_date}")
            print(f"   deadline: {round_data.deadline}")
            print(f"   end_date: {round_data.end_date}")
            
            if round_data.scheduled_date and round_data.end_date:
                duration = (round_data.end_date - round_data.scheduled_date).days
                print(f"   المدة: {duration} يوم")
        
        # 2. Check the new test round specifically
        print("\n🔍 البحث عن الجولة الجديدة...")
        test_round = db.query(Round).filter(Round.round_code == "RND-TEST-20251007112301").first()
        
        if test_round:
            print("✅ تم العثور على الجولة الجديدة")
            print(f"   ID: {test_round.id}")
            print(f"   العنوان: {test_round.title}")
            print(f"   scheduled_date: {test_round.scheduled_date}")
            print(f"   deadline: {test_round.deadline}")
            print(f"   end_date: {test_round.end_date}")
            
            if test_round.scheduled_date and test_round.end_date:
                duration = (test_round.end_date - test_round.scheduled_date).days
                print(f"   المدة: {duration} يوم")
                
                # Check if dates are correct
                if test_round.deadline and test_round.end_date:
                    if test_round.deadline.date() == test_round.end_date.date():
                        print("✅ التواريخ متطابقة - deadline == end_date")
                    else:
                        print("⚠️ التواريخ غير متطابقة")
                else:
                    print("❌ مفقود deadline أو end_date")
        else:
            print("❌ لم يتم العثور على الجولة الجديدة")
        
        # 3. Check calendar display logic
        print("\n📅 فحص منطق عرض التقويم...")
        
        # Simulate the calendar logic
        rounds_for_calendar = db.query(Round).filter(
            Round.scheduled_date.isnot(None)
        ).all()
        
        print(f"   الجولات المناسبة للتقويم: {len(rounds_for_calendar)}")
        
        for round_data in rounds_for_calendar:
            if round_data.scheduled_date and round_data.end_date:
                start_date = round_data.scheduled_date
                end_date = round_data.end_date
                duration = (end_date - start_date).days
                
                print(f"\n📅 {round_data.round_code}")
                print(f"   بداية: {start_date.strftime('%Y-%m-%d')}")
                print(f"   نهاية: {end_date.strftime('%Y-%m-%d')}")
                print(f"   المدة: {duration} يوم")
                
                # Check if it's a multi-day event
                if duration > 1:
                    print(f"   ✅ جولة متعددة الأيام - ستظهر من {start_date.strftime('%Y-%m-%d')} إلى {end_date.strftime('%Y-%m-%d')}")
                else:
                    print(f"   📅 جولة ليوم واحد - ستظهر في {start_date.strftime('%Y-%m-%d')}")
        
        # 4. Summary
        print("\n" + "=" * 80)
        print("ملخص الاختبار:")
        print("=" * 80)
        
        total_rounds = db.query(Round).count()
        rounds_with_scheduled = db.query(Round).filter(Round.scheduled_date.isnot(None)).count()
        rounds_with_end_date = db.query(Round).filter(Round.end_date.isnot(None)).count()
        rounds_with_deadline = db.query(Round).filter(Round.deadline.isnot(None)).count()
        
        print(f"✅ إجمالي الجولات: {total_rounds}")
        print(f"✅ جولات مع scheduled_date: {rounds_with_scheduled}")
        print(f"✅ جولات مع end_date: {rounds_with_end_date}")
        print(f"✅ جولات مع deadline: {rounds_with_deadline}")
        
        if test_round and test_round.scheduled_date and test_round.end_date:
            print(f"✅ الجولة الجديدة جاهزة للعرض في التقويم")
            print(f"   من: {test_round.scheduled_date.strftime('%Y-%m-%d')}")
            print(f"   إلى: {test_round.end_date.strftime('%Y-%m-%d')}")
        else:
            print("❌ الجولة الجديدة غير جاهزة للعرض")
        
        print("\n" + "=" * 80)
        print("تم الانتهاء من الاختبار")
        print("=" * 80)
        
    except Exception as e:
        print(f"\n❌ خطأ: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_complete_system()
