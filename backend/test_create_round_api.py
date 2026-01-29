import requests
import json

def test_create_round():
    url = "http://127.0.0.1:8000/api/rounds"
    
    # First get a token
    login_url = "http://127.0.0.1:8000/api/auth/signin"
    login_data = {"email": "admin@salamaty.com", "password": "admin123"}
    resp = requests.post(login_url, json=login_data)
    token = resp.json().get("access_token")
    
    if not token:
        print("Login failed")
        return

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "title": "Test Round from Script",
        "description": "Description",
        "round_type": "patient_safety",
        "department": "الطوارئ",
        "assigned_to": [1],
        "selected_categories": [1],
        "scheduled_date": "2026-01-28T10:00:00",
        "priority": "medium",
        "evaluation_items": [1]
    }
    
    print(f"Creating round with payload: {json.dumps(payload)}")
    resp = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {resp.status_code}")
    print(f"Response: {resp.text}")

if __name__ == "__main__":
    test_create_round()
