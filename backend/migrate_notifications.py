#!/usr/bin/env python3
"""
Migration script to add notification tables to the database
"""

import os
import sys
import psycopg2
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from database import DATABASE_URL

def run_migration():
    """Run the notification tables migration"""
    
    # Get database URL
    database_url = DATABASE_URL
    
    if not database_url:
        print("❌ Error: Database URL not found. Please check your environment variables.")
        return False
    
    try:
        # Connect to the database
        print("🔌 Connecting to database...")
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Read the migration SQL file
        migration_file = backend_dir / "add_notification_tables.sql"
        with open(migration_file, 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        
        print("📄 Running notification tables migration...")
        
        # Execute the migration
        cursor.execute(migration_sql)
        
        print("✅ Notification tables migration completed successfully!")
        
        # Verify the tables were created
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('notifications', 'user_notification_settings')
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        print(f"📊 Created tables: {[table[0] for table in tables]}")
        
        # Check if default settings were created for users
        cursor.execute("SELECT COUNT(*) FROM user_notification_settings;")
        settings_count = cursor.fetchone()[0]
        print(f"👥 Created notification settings for {settings_count} users")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error running migration: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Starting notification tables migration...")
    success = run_migration()
    
    if success:
        print("🎉 Migration completed successfully!")
        sys.exit(0)
    else:
        print("💥 Migration failed!")
        sys.exit(1)
