#!/usr/bin/env python3
"""
اختبار بسيط لوظيفة جولاتي
"""

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_my_rounds_simple():
    """اختبار بسيط لوظيفة جولاتي"""
    
    # Database URL
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:mass@localhost:5432/salamaty_system")
    
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        # Test connection
        with engine.connect() as conn:
            print("✅ الاتصال بقاعدة البيانات نجح")
            
            # اختبار مع معرف المستخدم 7
            user_id = 7
            print(f"🔍 البحث عن الجولات للمستخدم {user_id}")
            
            # البحث عن الجولات التي تحتوي على معرف المستخدم
            result = conn.execute(text("""
                SELECT id, title, assigned_to 
                FROM rounds 
                WHERE assigned_to LIKE :user_id_pattern
            """), {"user_id_pattern": f"%{user_id}%"}
            )
            
            user_rounds = result.fetchall()
            print(f"📊 النتيجة: {len(user_rounds)} جولة للمستخدم {user_id}")
            
            for round in user_rounds:
                print(f"  - ID: {round[0]}, العنوان: {round[1]}, المكلفون: {round[2]}")
            
            # اختبار مع معرف المستخدم 1
            user_id = 1
            print(f"\n🔍 البحث عن الجولات للمستخدم {user_id}")
            
            result = conn.execute(text("""
                SELECT id, title, assigned_to 
                FROM rounds 
                WHERE assigned_to LIKE :user_id_pattern
            """), {"user_id_pattern": f"%{user_id}%"}
            )
            
            user_rounds = result.fetchall()
            print(f"📊 النتيجة: {len(user_rounds)} جولة للمستخدم {user_id}")
            
            for round in user_rounds:
                print(f"  - ID: {round[0]}, العنوان: {round[1]}, المكلفون: {round[2]}")
            
    except Exception as e:
        print(f"❌ خطأ: {e}")

if __name__ == "__main__":
    test_my_rounds_simple()
