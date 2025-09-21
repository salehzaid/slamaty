#!/usr/bin/env python3
"""
Test script to verify photo upload functionality
"""

import requests
import json

# Test data
API_BASE = "http://localhost:8000"
TEST_PHOTO_URL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="

def test_user_creation():
    """Test creating a user with photo"""
    print("🧪 Testing user creation with photo...")
    
    user_data = {
        "username": "test_user_photo",
        "email": "test_photo@example.com",
        "first_name": "Test",
        "last_name": "User",
        "role": "viewer",
        "department": "Test Department",
        "phone": "1234567890",
        "position": "Test Position",
        "photo_url": TEST_PHOTO_URL,
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(f"{API_BASE}/users", json=user_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ User created successfully with photo!")
            return response.json()
        else:
            print("❌ Failed to create user")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_user_update(user_id):
    """Test updating a user with photo"""
    print(f"🧪 Testing user update with photo for user ID: {user_id}...")
    
    update_data = {
        "first_name": "Updated",
        "last_name": "User",
        "photo_url": TEST_PHOTO_URL
    }
    
    try:
        response = requests.put(f"{API_BASE}/users/{user_id}", json=update_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ User updated successfully with photo!")
            return response.json()
        else:
            print("❌ Failed to update user")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_get_user(user_id):
    """Test getting user data to verify photo_url is saved"""
    print(f"🧪 Testing get user for user ID: {user_id}...")
    
    try:
        response = requests.get(f"{API_BASE}/users/{user_id}")
        print(f"Status Code: {response.status_code}")
        user_data = response.json()
        print(f"User Data: {json.dumps(user_data, indent=2)}")
        
        if user_data.get('photo_url'):
            print("✅ Photo URL is saved and retrieved successfully!")
            return True
        else:
            print("❌ Photo URL is not saved or retrieved")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting photo upload tests...")
    
    # Test 1: Create user with photo
    user = test_user_creation()
    if user:
        user_id = user['id']
        
        # Test 2: Get user to verify photo is saved
        test_get_user(user_id)
        
        # Test 3: Update user with new photo
        test_user_update(user_id)
        
        # Test 4: Get user again to verify update
        test_get_user(user_id)
    
    print("🏁 Tests completed!")
