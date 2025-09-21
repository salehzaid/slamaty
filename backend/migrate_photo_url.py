#!/usr/bin/env python3
"""
Migration script to add photo_url column to users table
Run this script to add the photo_url field to existing database
"""

import os
import sys
from sqlalchemy import create_engine, text
from database import DATABASE_URL

def run_migration():
    """Run the migration to add photo_url column"""
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        # Read the SQL migration file
        with open('add_photo_url_column.sql', 'r', encoding='utf-8') as f:
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
                print("✅ Added photo_url column to users table")
            except Exception as e:
                trans.rollback()
                print(f"❌ Migration failed: {e}")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error running migration: {e}")
        return False

if __name__ == "__main__":
    print("🔄 Starting migration to add photo_url column...")
    success = run_migration()
    
    if success:
        print("🎉 Migration completed successfully!")
        sys.exit(0)
    else:
        print("💥 Migration failed!")
        sys.exit(1)
