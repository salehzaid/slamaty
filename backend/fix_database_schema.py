#!/usr/bin/env python3
"""
Fix database schema for production
"""

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

def fix_database_schema():
    """Fix database schema issues"""
    print("🔧 Fixing database schema...")
    
    # Load environment variables
    load_dotenv('env.production')
    
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("❌ DATABASE_URL not found in environment variables")
        return False
    
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        # Create session
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        try:
            # Check if end_date column exists in rounds table
            check_column_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'rounds' AND column_name = 'end_date'
            """)
            result = db.execute(check_column_query)
            column_exists = result.fetchone() is not None
            
            if not column_exists:
                print("➕ Adding missing end_date column to rounds table...")
                add_column_query = text("""
                    ALTER TABLE rounds 
                    ADD COLUMN end_date TIMESTAMP WITH TIME ZONE
                """)
                db.execute(add_column_query)
                db.commit()
                print("✅ Added end_date column")
            else:
                print("✅ end_date column already exists")
            
            # Check if other missing columns exist
            missing_columns = [
                'completion_percentage',
                'evaluation_items'
            ]
            
            for column in missing_columns:
                check_query = text(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'rounds' AND column_name = '{column}'
                """)
                result = db.execute(check_query)
                if result.fetchone() is None:
                    print(f"➕ Adding missing {column} column...")
                    
                    if column == 'completion_percentage':
                        alter_query = text(f"ALTER TABLE rounds ADD COLUMN {column} INTEGER DEFAULT 0")
                    elif column == 'evaluation_items':
                        alter_query = text(f"ALTER TABLE rounds ADD COLUMN {column} TEXT")
                    
                    db.execute(alter_query)
                    db.commit()
                    print(f"✅ Added {column} column")
                else:
                    print(f"✅ {column} column already exists")
            
            # Check table structure
            structure_query = text("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'rounds'
                ORDER BY ordinal_position
            """)
            result = db.execute(structure_query)
            columns = result.fetchall()
            
            print("\n📋 Current rounds table structure:")
            for col in columns:
                print(f"  - {col[0]}: {col[1]} ({'NULL' if col[2] == 'YES' else 'NOT NULL'})")
            
            return True
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Error fixing database schema: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main function"""
    print("=" * 60)
    print("🔧 Database Schema Fix Tool")
    print("=" * 60)
    
    success = fix_database_schema()
    
    if success:
        print("\n✅ Database schema fixed successfully!")
    else:
        print("\n❌ Failed to fix database schema")
        sys.exit(1)

if __name__ == "__main__":
    main()
