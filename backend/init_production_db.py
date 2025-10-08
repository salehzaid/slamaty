#!/usr/bin/env python3
"""
Production Database Initialization Script
Initializes the production database with tables and initial data
"""

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

# Load environment variables
load_dotenv('env.production')

# Import models and schemas
from models_updated import Base, UserRole, User, Department, RoundTypeSettings, EvaluationCategory
from auth import get_password_hash

def test_database_connection():
    """Test database connection"""
    try:
        DATABASE_URL = os.getenv("DATABASE_URL")
        if not DATABASE_URL:
            print("❌ DATABASE_URL not found in environment variables")
            return False
            
        print(f"🔗 Testing connection to database...")
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"✅ Connected to PostgreSQL: {version}")
            return True
            
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def create_tables():
    """Create all database tables"""
    print("📋 Creating database tables...")
    try:
        DATABASE_URL = os.getenv("DATABASE_URL")
        engine = create_engine(DATABASE_URL)
        
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully!")
        return True
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False

def create_initial_data():
    """Create initial data"""
    print("👥 Creating initial data...")
    
    try:
        DATABASE_URL = os.getenv("DATABASE_URL")
        engine = create_engine(DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        db = SessionLocal()
        
        # Create test admin user
        admin_user = {
            "username": "testadmin",
            "email": "testadmin@salamaty.com",
            "first_name": "مدير",
            "last_name": "النظام",
            "hashed_password": get_password_hash("test123"),
            "role": UserRole.SUPER_ADMIN,
            "department": "الإدارة العامة",
            "position": "مدير النظام",
            "phone": "+966500000000",
            "is_active": True
        }
        
        existing_admin = db.query(User).filter(User.email == admin_user["email"]).first()
        if not existing_admin:
            user = User(**admin_user)
            db.add(user)
            db.commit()
            print("✅ Created admin user: testadmin@salamaty.com")
        else:
            print("⏭️  Admin user already exists")
        
        # Create some departments
        departments_data = [
            {"name": "الطوارئ", "description": "قسم الطوارئ", "code": "ER", "is_active": True},
            {"name": "العمليات", "description": "قسم العمليات الجراحية", "code": "SURG", "is_active": True},
            {"name": "العناية المركزة", "description": "قسم العناية المركزة", "code": "ICU", "is_active": True},
        ]
        
        created_depts = 0
        for dept_data in departments_data:
            existing = db.query(Department).filter(Department.name == dept_data["name"]).first()
            if not existing:
                dept = Department(**dept_data)
                db.add(dept)
                created_depts += 1
        
        if created_depts > 0:
            db.commit()
            print(f"✅ Created {created_depts} departments")
        else:
            print("⏭️  All departments already exist")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating initial data: {e}")
        if 'db' in locals():
            db.rollback()
            db.close()
        return False

def main():
    """Main initialization function"""
    print("=" * 60)
    print("🚀 Production Database Initialization")
    print("=" * 60)
    
    # Test connection
    if not test_database_connection():
        sys.exit(1)
    
    # Create tables
    if not create_tables():
        sys.exit(1)
    
    # Create initial data
    if not create_initial_data():
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("🎉 Database initialization completed successfully!")
    print("=" * 60)
    print("\n📝 Login credentials:")
    print("  👤 Admin: testadmin@salamaty.com / test123")
    print("\n")

if __name__ == "__main__":
    main()
