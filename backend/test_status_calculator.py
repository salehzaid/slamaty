"""
Test script for status calculator functionality
"""
from datetime import datetime, timezone, timedelta
import sys
sys.path.append('/Users/salehalzaid/Documents/massdeigners/salamah_rounds/backend')

from utils.status_calculator import calculate_round_status, get_days_until_deadline, should_send_reminder

def test_status_calculator():
    """Test various scenarios for status calculation"""
    
    now = datetime.now(timezone.utc)
    
    print("=" * 60)
    print("🧪 Testing Status Calculator")
    print("=" * 60)
    
    # Test 1: Completed round
    print("\n📋 Test 1: Completed Round")
    status = calculate_round_status(
        scheduled_date=now - timedelta(days=5),
        deadline=now + timedelta(days=2),
        end_date=now + timedelta(days=2),
        completion_percentage=100,
        current_status='in_progress'
    )
    print(f"   Expected: completed")
    print(f"   Got: {status}")
    print(f"   ✅ PASS" if status == 'completed' else f"   ❌ FAIL")
    
    # Test 2: Scheduled (future)
    print("\n📋 Test 2: Scheduled Round (Future)")
    status = calculate_round_status(
        scheduled_date=now + timedelta(days=5),
        deadline=now + timedelta(days=10),
        end_date=now + timedelta(days=10),
        completion_percentage=0,
        current_status='scheduled'
    )
    print(f"   Expected: scheduled")
    print(f"   Got: {status}")
    print(f"   ✅ PASS" if status == 'scheduled' else f"   ❌ FAIL")
    
    # Test 3: In Progress
    print("\n📋 Test 3: In Progress Round")
    status = calculate_round_status(
        scheduled_date=now - timedelta(days=2),
        deadline=now + timedelta(days=5),
        end_date=now + timedelta(days=5),
        completion_percentage=50,
        current_status='in_progress'
    )
    print(f"   Expected: in_progress")
    print(f"   Got: {status}")
    print(f"   ✅ PASS" if status == 'in_progress' else f"   ❌ FAIL")
    
    # Test 4: Overdue
    print("\n📋 Test 4: Overdue Round")
    status = calculate_round_status(
        scheduled_date=now - timedelta(days=10),
        deadline=now - timedelta(days=2),
        end_date=now - timedelta(days=2),
        completion_percentage=30,
        current_status='in_progress'
    )
    print(f"   Expected: overdue")
    print(f"   Got: {status}")
    print(f"   ✅ PASS" if status == 'overdue' else f"   ❌ FAIL")
    
    # Test 5: Days calculation
    print("\n📋 Test 5: Days Until Deadline")
    future_date = now + timedelta(days=7)
    days = get_days_until_deadline(future_date)
    print(f"   Expected: ~7 days")
    print(f"   Got: {days} days")
    print(f"   ✅ PASS" if 6 <= days <= 8 else f"   ❌ FAIL")
    
    # Test 6: Reminder logic
    print("\n📋 Test 6: Should Send Reminder (Overdue)")
    should_remind = should_send_reminder(
        scheduled_date=now - timedelta(days=5),
        deadline=now - timedelta(days=1),
        status='overdue',
        completion_percentage=50
    )
    print(f"   Expected: True")
    print(f"   Got: {should_remind}")
    print(f"   ✅ PASS" if should_remind else f"   ❌ FAIL")
    
    print("\n" + "=" * 60)
    print("✅ All tests completed!")
    print("=" * 60)

if __name__ == '__main__':
    test_status_calculator()

