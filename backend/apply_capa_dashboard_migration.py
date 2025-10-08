#!/usr/bin/env python3
"""
CAPA Dashboard Migration Script (Python version)

This script applies the CAPA dashboard migration and inserts sample data.

Usage:
    python apply_capa_dashboard_migration.py
"""

import os
import sys
import subprocess
from pathlib import Path
from dotenv import load_dotenv

def main():
    print("=" * 60)
    print("CAPA Dashboard Migration (Python)")
    print("=" * 60)
    print()
    
    # Load environment variables
    env_file = Path(__file__).parent / "env.local"
    if not env_file.exists():
        print("✗ env.local file not found!")
        print("  Please create env.local with DATABASE_URL")
        sys.exit(1)
    
    print("✓ Found env.local file")
    load_dotenv(env_file)
    
    # Get database URL
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("✗ DATABASE_URL not set in env.local")
        sys.exit(1)
    
    print("✓ DATABASE_URL loaded")
    print()
    
    # Apply schema migration
    print("=" * 60)
    print("Step 1: Applying Database Schema Migration")
    print("=" * 60)
    print()
    
    schema_file = Path(__file__).parent / "migrations" / "add_capa_dashboard_tables.sql"
    if not schema_file.exists():
        print(f"✗ Migration file not found: {schema_file}")
        sys.exit(1)
    
    try:
        result = subprocess.run(
            ["psql", db_url, "-f", str(schema_file)],
            capture_output=True,
            text=True,
            check=True
        )
        print(result.stdout)
        print("✓ Schema migration applied successfully!")
    except subprocess.CalledProcessError as e:
        print(f"✗ Schema migration failed!")
        print(f"Error: {e.stderr}")
        sys.exit(1)
    except FileNotFoundError:
        print("✗ psql command not found!")
        print("  Please install PostgreSQL client tools")
        sys.exit(1)
    
    print()
    
    # Insert sample data
    print("=" * 60)
    print("Step 2: Inserting Sample Data")
    print("=" * 60)
    print()
    
    data_file = Path(__file__).parent / "migrations" / "insert_sample_capa_data.sql"
    if not data_file.exists():
        print(f"✗ Data file not found: {data_file}")
        sys.exit(1)
    
    try:
        result = subprocess.run(
            ["psql", db_url, "-f", str(data_file)],
            capture_output=True,
            text=True,
            check=True
        )
        print(result.stdout)
        print("✓ Sample data inserted successfully!")
    except subprocess.CalledProcessError as e:
        print(f"✗ Sample data insertion failed!")
        print(f"Error: {e.stderr}")
        sys.exit(1)
    
    print()
    print("=" * 60)
    print("Migration Complete!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Restart the backend server")
    print("2. Navigate to /capa-dashboard in the frontend")
    print("3. Login with your credentials")
    print("4. Explore the 5 dashboard sections:")
    print("   - نظرة عامة (Overview)")
    print("   - تتبع التقدم (Progress Tracking)")
    print("   - الجدول الزمني (Timeline)")
    print("   - التنبيهات (Alerts)")
    print("   - التقارير (Reports)")
    print()
    print("✓ All data should now be visible!")
    print()

if __name__ == "__main__":
    main()

