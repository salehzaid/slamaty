#!/usr/bin/env python3
"""
Test script to create a round on production and capture full error response
"""
import requests
import json
from datetime import datetime, timedelta

# Production URL
BASE_URL = "https://qpsrounds-production.up.railway.app"

def test_create_round():
    """Test creating a round on production"""
    
    # Step 1: Login to get token
    print("🔐 Logging in...")
    login_data = {
        "email": "admin@salamaty.com",
        "password": "123456"
    }
    
    try:
        login_response = requests.post(
            f"{BASE_URL}/api/auth/signin",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        login_response.raise_for_status()
        token = login_response.json()["access_token"]
        print(f"✅ Login successful, token: {token[:50]}...")
    except Exception as e:
        print(f"❌ Login failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")
        return
    
    # Step 2: Try to create a round
    print("\n📝 Creating round...")
    
    scheduled_date = (datetime.now() + timedelta(days=1)).isoformat()
    
    round_data = {
        "title": "Test Round from Script",
        "description": "Testing production round creation",
        "round_type": "general",
        "department": "IT",
        "assigned_to": [1],
        "selected_categories": [1],
        "scheduled_date": scheduled_date,
        "priority": "medium",
        "evaluation_items": [1, 2, 3]
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    try:
        print(f"Sending request to: {BASE_URL}/api/rounds")
        print(f"Data: {json.dumps(round_data, indent=2)}")
        
        create_response = requests.post(
            f"{BASE_URL}/api/rounds",
            json=round_data,
            headers=headers
        )
        
        print(f"\n📊 Status Code: {create_response.status_code}")
        print(f"📊 Headers: {dict(create_response.headers)}")
        
        if create_response.status_code == 200:
            print(f"✅ Round created successfully!")
            print(f"Response: {json.dumps(create_response.json(), indent=2)}")
        else:
            print(f"❌ Failed to create round!")
            print(f"Response Text: {create_response.text}")
            print(f"Response Headers: {create_response.headers}")
            
            # Try to parse as JSON
            try:
                error_json = create_response.json()
                print(f"Error JSON: {json.dumps(error_json, indent=2)}")
            except:
                print("(Response is not JSON)")
                
    except Exception as e:
        print(f"❌ Request failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response Status: {e.response.status_code}")
            print(f"Response Text: {e.response.text}")

if __name__ == "__main__":
    test_create_round()

