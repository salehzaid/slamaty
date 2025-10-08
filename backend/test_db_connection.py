#!/usr/bin/env python3
"""
Simple database connection test script
"""

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

def test_database():
    """Test database connection and basic operations"""
    print("🔍 Testing database connection...")
    
    # Load environment variables
    load_dotenv('env.production')
    
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("❌ DATABASE_URL not found in environment variables")
        return False
    
    print(f"📡 Connecting to: {DATABASE_URL[:50]}...")
    
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"✅ Connected to PostgreSQL: {version}")
        
        # Test session
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        try:
            # Test basic query
            result = db.execute(text("SELECT 1"))
            print("✅ Basic query test passed")
            
            # Check tables
            tables_query = text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """)
            result = db.execute(tables_query)
            tables = [row[0] for row in result.fetchall()]
            print(f"📋 Tables found: {tables}")
            
            # Check rounds table specifically
            if 'rounds' in tables:
                count_query = text("SELECT COUNT(*) FROM rounds")
                result = db.execute(count_query)
                count = result.scalar()
                print(f"📊 Rounds count: {count}")
            else:
                print("❌ Rounds table not found!")
                
            # Check users table
            if 'users' in tables:
                count_query = text("SELECT COUNT(*) FROM users")
                result = db.execute(count_query)
                count = result.scalar()
                print(f"👥 Users count: {count}")
            else:
                print("❌ Users table not found!")
                
        finally:
            db.close()
            
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_database()
    sys.exit(0 if success else 1)
