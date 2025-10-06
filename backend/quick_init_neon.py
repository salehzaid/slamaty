"""
Quick Database Initialization for Neon (Production)
Run this directly to initialize the production database
"""
import os
from dotenv import load_dotenv

# Use production environment
os.environ['DATABASE_URL'] = 'postgresql://neondb_owner:npg_ERS5fHwxWiu2@ep-lingering-morning-adejreab-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

# Import and run the initialization script
from init_database import main

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Quick Init: Neon Production Database")
    print("=" * 60)
    print()
    main()
