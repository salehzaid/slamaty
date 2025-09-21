#!/usr/bin/env python3
"""
Test script to check the fixed my rounds functionality
"""

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_my_rounds_fixed():
    """Test the fixed my rounds functionality"""
    
    # Database URL
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:mass@localhost:5432/salamaty_system")
    
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        # Test connection
        with engine.connect() as conn:
            print("✅ Database connection successful")
            
            # Get users
            result = conn.execute(text("SELECT id, first_name, last_name FROM users LIMIT 5;"))
            users = result.fetchall()
            
            print(f"\n👥 Found {len(users)} users:")
            for user in users:
                user_id, first_name, last_name = user
                user_name = f"{first_name} {last_name}"
                print(f"  - ID: {user_id}, Name: '{user_name}'")
                
                # Test my rounds for this user
                result = conn.execute(text("""
                    SELECT id, title, assigned_to 
                    FROM rounds 
                    WHERE assigned_to LIKE :user_name_pattern
                """), {"user_name_pattern": f"%{user_name}%"}
                )
                
                user_rounds = result.fetchall()
                print(f"    Found {len(user_rounds)} rounds assigned to '{user_name}'")
                
                for round in user_rounds:
                    print(f"      - ID: {round[0]}, Title: {round[1]}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_my_rounds_fixed()
