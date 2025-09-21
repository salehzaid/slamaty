#!/usr/bin/env python3
"""
Migration script to change photo_url column type from VARCHAR(255) to TEXT
This allows storing larger base64 encoded images
"""

import os
import sys
from sqlalchemy import create_engine, text
from database import DATABASE_URL

def run_migration():
    """Run the migration to change photo_url column type"""
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        # Read the SQL migration file
        with open('fix_photo_url_column_type.sql', 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Execute the migration
        with engine.connect() as connection:
            # Start a transaction
            trans = connection.begin()
            try:
                # Execute the SQL commands
                connection.execute(text(sql_content))
                trans.commit()
                print("✅ Migration completed successfully!")
                print("✅ Changed photo_url column type to TEXT")
            except Exception as e:
                trans.rollback()
                print(f"❌ Migration failed: {e}")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error running migration: {e}")
        return False

if __name__ == "__main__":
    print("🔄 Starting migration to change photo_url column type...")
    success = run_migration()
    
    if success:
        print("🎉 Migration completed successfully!")
        print("📸 Now you can upload larger profile photos!")
        sys.exit(0)
    else:
        print("💥 Migration failed!")
        sys.exit(1)
