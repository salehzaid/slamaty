#!/usr/bin/env python3
"""
Test script to check my rounds functionality
"""

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_my_rounds():
    """Test the my rounds functionality"""
    
    # Database URL
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:mass@localhost:5432/salamaty_system")
    
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        # Test connection
        with engine.connect() as conn:
            print("✅ Database connection successful")
            
            # Check if rounds table exists
            result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rounds';"))
            tables = result.fetchall()
            
            if not tables:
                print("❌ Rounds table does not exist")
                return
            
            print("✅ Rounds table exists")
            
            # Check rounds data
            result = conn.execute(text("SELECT id, title, assigned_to FROM rounds LIMIT 5;"))
            rounds = result.fetchall()
            
            print(f"\n📋 Found {len(rounds)} rounds:")
            for round in rounds:
                print(f"  - ID: {round[0]}, Title: {round[1]}, Assigned To: {round[2]}")
            
            # Check users data
            result = conn.execute(text("SELECT id, first_name, last_name FROM users LIMIT 5;"))
            users = result.fetchall()
            
            print(f"\n👥 Found {len(users)} users:")
            for user in users:
                print(f"  - ID: {user[0]}, Name: {user[1]} {user[2]}")
            
            # Test the my rounds query
            if users:
                user_id = users[0][0]
                print(f"\n🔍 Testing my rounds for user ID {user_id}:")
                
                # Get rounds assigned to this user
                result = conn.execute(text("""
                    SELECT id, title, assigned_to 
                    FROM rounds 
                    WHERE assigned_to LIKE :user_id_pattern
                """), {"user_id_pattern": f"%{user_id}%"}
                )
                
                user_rounds = result.fetchall()
                print(f"  Found {len(user_rounds)} rounds assigned to user {user_id}")
                
                for round in user_rounds:
                    print(f"    - ID: {round[0]}, Title: {round[1]}, Assigned To: {round[2]}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_my_rounds()
