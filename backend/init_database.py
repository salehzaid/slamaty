"""
Database Initialization Script
Creates tables and populates initial data for production
"""
import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Load environment variables
load_dotenv('env.local')

# Import models and schemas
from models_updated import Base, UserRole, User, Department, RoundTypeSettings, EvaluationCategory
from auth import get_password_hash
from database import engine, SessionLocal

def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully!")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        raise

def create_initial_users(db):
    """Create initial admin and test users"""
    print("\nCreating initial users...")
    
    users = [
        {
            "username": "admin",
            "email": "admin@salamah.com",
            "first_name": "مدير",
            "last_name": "النظام",
            "hashed_password": get_password_hash("admin123"),
            "role": UserRole.SUPER_ADMIN,
            "is_active": True
        },
        {
            "username": "quality_manager",
            "email": "quality@salamah.com",
            "first_name": "مدير",
            "last_name": "الجودة",
            "hashed_password": get_password_hash("quality123"),
            "role": UserRole.QUALITY_MANAGER,
            "is_active": True
        },
        {
            "username": "assessor1",
            "email": "assessor1@salamah.com",
            "first_name": "المقيم",
            "last_name": "الأول",
            "hashed_password": get_password_hash("assessor123"),
            "role": UserRole.ASSESSOR,
            "is_active": True
        },
        {
            "username": "department_head",
            "email": "dept@salamah.com",
            "first_name": "مدير",
            "last_name": "القسم",
            "hashed_password": get_password_hash("dept123"),
            "role": UserRole.DEPARTMENT_HEAD,
            "is_active": True
        }
    ]
    
    created_count = 0
    for user_data in users:
        existing = db.query(User).filter(User.username == user_data["username"]).first()
        if not existing:
            user = User(**user_data)
            db.add(user)
            created_count += 1
            print(f"  ✅ Created user: {user_data['username']}")
        else:
            print(f"  ⏭️  User exists: {user_data['username']}")
    
    db.commit()
    print(f"✅ Users created: {created_count}")

def create_initial_departments(db):
    """Create initial departments"""
    print("\nCreating initial departments...")
    
    departments = [
        {"name": "الطوارئ", "description": "قسم الطوارئ", "is_active": True},
        {"name": "العمليات", "description": "قسم العمليات الجراحية", "is_active": True},
        {"name": "العناية المركزة", "description": "قسم العناية المركزة", "is_active": True},
        {"name": "الأطفال", "description": "قسم طب الأطفال", "is_active": True},
        {"name": "النساء والولادة", "description": "قسم النساء والولادة", "is_active": True},
        {"name": "الباطنية", "description": "قسم الباطنية", "is_active": True},
        {"name": "الجراحة", "description": "قسم الجراحة العامة", "is_active": True},
        {"name": "العظام", "description": "قسم جراحة العظام", "is_active": True},
        {"name": "الأشعة", "description": "قسم الأشعة", "is_active": True},
        {"name": "المختبر", "description": "المختبر الطبي", "is_active": True},
        {"name": "الصيدلية", "description": "الصيدلية", "is_active": True},
    ]
    
    created_count = 0
    for dept_data in departments:
        existing = db.query(Department).filter(Department.name == dept_data["name"]).first()
        if not existing:
            dept = Department(**dept_data)
            db.add(dept)
            created_count += 1
            print(f"  ✅ Created department: {dept_data['name']}")
        else:
            print(f"  ⏭️  Department exists: {dept_data['name']}")
    
    db.commit()
    print(f"✅ Departments created: {created_count}")

def create_initial_round_types(db):
    """Create initial round types"""
    print("\nCreating initial round types...")
    
    round_types = [
        {
            "name": "جولة روتينية",
            "name_en": "Routine Round",
            "description": "جولة تفتيشية روتينية للأقسام",
            "color": "blue",
            "icon": "clipboard-check",
            "is_active": True,
            "sort_order": 1
        },
        {
            "name": "جولة طارئة",
            "name_en": "Emergency Round",
            "description": "جولة عاجلة للتحقق من مشكلة محددة",
            "color": "red",
            "icon": "alert-circle",
            "is_active": True,
            "sort_order": 2
        },
        {
            "name": "جولة متابعة",
            "name_en": "Follow-up Round",
            "description": "جولة لمتابعة خطة تصحيحية سابقة",
            "color": "orange",
            "icon": "repeat",
            "is_active": True,
            "sort_order": 3
        },
        {
            "name": "جولة ليلية",
            "name_en": "Night Round",
            "description": "جولة تفتيشية خلال الفترة المسائية",
            "color": "purple",
            "icon": "moon",
            "is_active": True,
            "sort_order": 4
        },
        {
            "name": "تدقيق داخلي",
            "name_en": "Internal Audit",
            "description": "جولة تدقيق شاملة للقسم",
            "color": "green",
            "icon": "search",
            "is_active": True,
            "sort_order": 5
        }
    ]
    
    created_count = 0
    for rt_data in round_types:
        existing = db.query(RoundTypeSettings).filter(RoundTypeSettings.name == rt_data["name"]).first()
        if not existing:
            rt = RoundTypeSettings(**rt_data)
            db.add(rt)
            created_count += 1
            print(f"  ✅ Created round type: {rt_data['name']}")
        else:
            print(f"  ⏭️  Round type exists: {rt_data['name']}")
    
    db.commit()
    print(f"✅ Round types created: {created_count}")

def create_initial_evaluation_categories(db):
    """Create initial evaluation categories"""
    print("\nCreating initial evaluation categories...")
    
    categories = [
        {
            "name": "سلامة المرضى",
            "description": "معايير متعلقة بسلامة المرضى",
            "weight": 30,
            "is_active": True
        },
        {
            "name": "مكافحة العدوى",
            "description": "معايير النظافة ومكافحة العدوى",
            "weight": 25,
            "is_active": True
        },
        {
            "name": "إدارة الأدوية",
            "description": "معايير تخزين وصرف الأدوية",
            "weight": 20,
            "is_active": True
        },
        {
            "name": "الوثائق الطبية",
            "description": "معايير التوثيق والسجلات الطبية",
            "weight": 15,
            "is_active": True
        },
        {
            "name": "البيئة والمعدات",
            "description": "معايير البيئة المادية والمعدات",
            "weight": 10,
            "is_active": True
        }
    ]
    
    created_count = 0
    for cat_data in categories:
        existing = db.query(EvaluationCategory).filter(EvaluationCategory.name == cat_data["name"]).first()
        if not existing:
            cat = EvaluationCategory(**cat_data)
            db.add(cat)
            created_count += 1
            print(f"  ✅ Created category: {cat_data['name']}")
        else:
            print(f"  ⏭️  Category exists: {cat_data['name']}")
    
    db.commit()
    print(f"✅ Evaluation categories created: {created_count}")

def main():
    """Main initialization function"""
    print("=" * 60)
    print("🚀 Database Initialization Script")
    print("=" * 60)
    
    # Check database connection
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection successful!")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)
    
    # Create tables
    create_tables()
    
    # Create session
    db = SessionLocal()
    
    try:
        # Initialize data
        create_initial_users(db)
        create_initial_departments(db)
        create_initial_round_types(db)
        create_initial_evaluation_categories(db)
        
        print("\n" + "=" * 60)
        print("🎉 Database initialization completed successfully!")
        print("=" * 60)
        print("\n📝 Login credentials:")
        print("  👤 Admin: admin / admin123")
        print("  👤 Quality Manager: quality_manager / quality123")
        print("  👤 Assessor: assessor1 / assessor123")
        print("  👤 Department Head: department_head / dept123")
        print("\n")
        
    except Exception as e:
        print(f"\n❌ Error during initialization: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
