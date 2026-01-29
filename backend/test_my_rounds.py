import requests
import json

def test_my_rounds():
    # Login as admin@salamaty.com
    login_url = "http://127.0.0.1:8000/api/auth/signin"
    login_data = {"email": "admin@salamaty.com", "password": "admin123"}
    resp = requests.post(login_url, json=login_data)
    
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        return
        
    data = resp.json()
    token = data.get("access_token")
    user = data.get("user")
    print(f"Logged in as: {user['first_name']} {user['last_name']} (ID: {user['id']})")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Get My Rounds
    url = "http://127.0.0.1:8000/api/rounds/my"
    resp = requests.get(url, headers=headers)
    print(f"My Rounds Status Code: {resp.status_code}")
    
    try:
        rounds = resp.json()
        print(f"Found {len(rounds)} rounds in 'My Rounds'")
        for r in rounds:
            print(f" - ID: {r['id']}, Title: {r['title']}, Status: {r['status']}")
    except Exception as e:
        print(f"Error parsing response: {e}")
        print(f"Raw Response: {resp.text}")

if __name__ == "__main__":
    test_my_rounds()
