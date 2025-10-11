#!/usr/bin/env python3
"""
Integration tests for data integrity - Round CRUD and Reports
اختبارات التكامل لسلامة البيانات - CRUD للجولات والتقارير
"""

import requests
import json
import sys
from datetime import datetime

BASE_URL = "http://localhost:8000"
TEST_EMAIL = "admin@salamaty.com"
TEST_PASSWORD = "123456"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_success(msg):
    print(f"{Colors.GREEN}✓ {msg}{Colors.END}")

def print_error(msg):
    print(f"{Colors.RED}✗ {msg}{Colors.END}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ {msg}{Colors.END}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠ {msg}{Colors.END}")

def login():
    """Test login and get token"""
    print_info("Testing login...")
    try:
        response = requests.post(f"{BASE_URL}/api/auth/signin", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        response.raise_for_status()
        token = response.json()["access_token"]
        print_success(f"Login successful, token: {token[:50]}...")
        return token
    except Exception as e:
        print_error(f"Login failed: {e}")
        sys.exit(1)

def test_create_round(token):
    """Test creating a new round with data"""
    print_info("Testing round creation...")
    
    round_data = {
        "title": f"اختبار تلقائي - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "description": "جولة اختبار تلقائي للتحقق من سلامة البيانات",
        "round_type": "patient_safety",
        "department": "الطوارئ",
        "scheduled_date": "2025-10-25T10:00:00Z",
        "selected_categories": [10, 11, 12, 13],
        "evaluation_items": [1, 2, 3, 4, 5, 6],
        "assigned_to": [1],
        "priority": "high",
        "notes": "اختبار آلي للتحقق من حفظ البيانات"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/rounds",
            headers={"Authorization": f"Bearer {token}"},
            json=round_data
        )
        response.raise_for_status()
        created_round = response.json()
        
        # Verify data
        assert created_round["title"] == round_data["title"], "Title mismatch"
        assert created_round["selected_categories"] == round_data["selected_categories"], "Categories mismatch"
        assert created_round["evaluation_items"] == round_data["evaluation_items"], "Items mismatch"
        assert created_round["assigned_to_ids"] == round_data["assigned_to"], "Assigned users mismatch"
        
        print_success(f"Round created successfully: ID={created_round['id']}")
        print_info(f"  - Categories: {created_round['selected_categories']}")
        print_info(f"  - Items: {created_round['evaluation_items']}")
        print_info(f"  - Assigned: {created_round['assigned_to_ids']}")
        
        return created_round["id"]
    except AssertionError as e:
        print_error(f"Data validation failed: {e}")
        return None
    except Exception as e:
        print_error(f"Round creation failed: {e}")
        return None

def test_get_round(token, round_id):
    """Test retrieving a round and verify data"""
    print_info(f"Testing round retrieval (ID={round_id})...")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/rounds/{round_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        response.raise_for_status()
        round_data = response.json()
        
        # Verify JSONB fields are lists
        assert isinstance(round_data.get("selected_categories"), list), "Categories should be a list"
        assert isinstance(round_data.get("evaluation_items"), list), "Items should be a list"
        assert isinstance(round_data.get("assigned_to_ids"), list), "Assigned IDs should be a list"
        
        print_success(f"Round retrieved successfully")
        print_info(f"  - Title: {round_data['title']}")
        print_info(f"  - Categories count: {len(round_data.get('selected_categories', []))}")
        print_info(f"  - Items count: {len(round_data.get('evaluation_items', []))}")
        
        return True
    except AssertionError as e:
        print_error(f"Data type validation failed: {e}")
        return False
    except Exception as e:
        print_error(f"Round retrieval failed: {e}")
        return False

def test_get_all_rounds(token):
    """Test retrieving all rounds"""
    print_info("Testing get all rounds...")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/rounds",
            headers={"Authorization": f"Bearer {token}"}
        )
        response.raise_for_status()
        rounds = response.json()
        
        assert isinstance(rounds, list), "Response should be a list"
        print_success(f"Retrieved {len(rounds)} rounds")
        
        # Verify data integrity for first 3 rounds
        for round in rounds[:3]:
            assert isinstance(round.get("selected_categories", []), list), f"Round {round['id']} categories should be list"
            assert isinstance(round.get("evaluation_items", []), list), f"Round {round['id']} items should be list"
            print_info(f"  - Round {round['id']}: {round['title'][:50]}...")
        
        return True
    except AssertionError as e:
        print_error(f"Data validation failed: {e}")
        return False
    except Exception as e:
        print_error(f"Get all rounds failed: {e}")
        return False

def test_update_round(token, round_id):
    """Test updating a round"""
    print_info(f"Testing round update (ID={round_id})...")
    
    update_data = {
        "selected_categories": [14, 15, 16],
        "evaluation_items": [10, 11, 12, 13],
        "notes": "تم التحديث عبر الاختبار التلقائي"
    }
    
    try:
        response = requests.put(
            f"{BASE_URL}/api/rounds/{round_id}",
            headers={"Authorization": f"Bearer {token}"},
            json=update_data
        )
        response.raise_for_status()
        updated_round = response.json()
        
        # Verify updates
        assert updated_round["selected_categories"] == update_data["selected_categories"], "Categories update failed"
        assert updated_round["evaluation_items"] == update_data["evaluation_items"], "Items update failed"
        
        print_success(f"Round updated successfully")
        print_info(f"  - New categories: {updated_round['selected_categories']}")
        print_info(f"  - New items: {updated_round['evaluation_items']}")
        
        return True
    except AssertionError as e:
        print_error(f"Update validation failed: {e}")
        return False
    except Exception as e:
        print_error(f"Round update failed: {e}")
        return False

def test_reports_rounds_by_type(token):
    """Test rounds by type report"""
    print_info("Testing rounds by type report...")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/reports/rounds-by-type",
            headers={"Authorization": f"Bearer {token}"}
        )
        response.raise_for_status()
        report_data = response.json()
        
        assert "round_types" in report_data, "Response should have round_types key"
        assert isinstance(report_data["round_types"], list), "round_types should be a list"
        
        total_rounds = sum(item["value"] for item in report_data["round_types"])
        print_success(f"Report retrieved successfully")
        print_info(f"  - Total round types: {len(report_data['round_types'])}")
        print_info(f"  - Total rounds: {total_rounds}")
        
        for item in report_data["round_types"]:
            print_info(f"    • {item['name']}: {item['value']} rounds")
        
        return True
    except AssertionError as e:
        print_error(f"Report validation failed: {e}")
        return False
    except Exception as e:
        print_error(f"Report request failed: {e}")
        return False

def test_reports_dashboard_stats(token):
    """Test dashboard stats report"""
    print_info("Testing dashboard stats...")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/reports/dashboard-stats",
            headers={"Authorization": f"Bearer {token}"}
        )
        response.raise_for_status()
        stats = response.json()
        
        expected_keys = ["total_rounds", "completed_rounds", "active_rounds", "overdue_rounds"]
        for key in expected_keys:
            assert key in stats, f"Missing key: {key}"
        
        print_success(f"Dashboard stats retrieved successfully")
        print_info(f"  - Total rounds: {stats.get('total_rounds', 0)}")
        print_info(f"  - Completed: {stats.get('completed_rounds', 0)}")
        print_info(f"  - Active: {stats.get('active_rounds', 0)}")
        print_info(f"  - Overdue: {stats.get('overdue_rounds', 0)}")
        
        return True
    except AssertionError as e:
        print_error(f"Stats validation failed: {e}")
        return False
    except Exception as e:
        print_error(f"Stats request failed: {e}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("  اختبارات التكامل - Data Integrity Integration Tests")
    print("="*60 + "\n")
    
    # Login
    token = login()
    
    # Track results
    results = {}
    
    # Test 1: Create round
    print("\n" + "-"*60)
    round_id = test_create_round(token)
    results["create"] = round_id is not None
    
    if round_id:
        # Test 2: Get single round
        print("\n" + "-"*60)
        results["get_single"] = test_get_round(token, round_id)
        
        # Test 3: Update round
        print("\n" + "-"*60)
        results["update"] = test_update_round(token, round_id)
    else:
        results["get_single"] = False
        results["update"] = False
    
    # Test 4: Get all rounds
    print("\n" + "-"*60)
    results["get_all"] = test_get_all_rounds(token)
    
    # Test 5: Reports - Rounds by type
    print("\n" + "-"*60)
    results["report_by_type"] = test_reports_rounds_by_type(token)
    
    # Test 6: Reports - Dashboard stats
    print("\n" + "-"*60)
    results["report_stats"] = test_reports_dashboard_stats(token)
    
    # Summary
    print("\n" + "="*60)
    print("  ملخص النتائج - Test Results Summary")
    print("="*60 + "\n")
    
    total_tests = len(results)
    passed_tests = sum(1 for v in results.values() if v)
    
    for test_name, passed in results.items():
        status = "✓ PASS" if passed else "✗ FAIL"
        color = Colors.GREEN if passed else Colors.RED
        print(f"{color}{status}{Colors.END} - {test_name}")
    
    print(f"\n{Colors.BLUE}Total: {passed_tests}/{total_tests} tests passed{Colors.END}")
    
    if passed_tests == total_tests:
        print(f"\n{Colors.GREEN}🎉 All tests passed! Data integrity is verified.{Colors.END}\n")
        sys.exit(0)
    else:
        print(f"\n{Colors.RED}⚠️  Some tests failed. Please review the output above.{Colors.END}\n")
        sys.exit(1)

if __name__ == "__main__":
    main()

