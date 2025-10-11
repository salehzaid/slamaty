#!/usr/bin/env python3
"""
سكريبت لإضافة بيانات عينة واقعية للجولات
Seed script to add realistic sample rounds data
"""

import sys
import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
from models_updated import Round, RoundType, RoundStatus, User, EvaluationCategory, EvaluationItem
import random

def get_or_create_users(db: Session):
    """Get existing users or create sample ones"""
    users = db.query(User).all()
    if not users:
        print("⚠️ No users found. Please run recreate_users.py first")
        return []
    print(f"✅ Found {len(users)} users")
    return users

def get_evaluation_data(db: Session):
    """Get evaluation categories and items"""
    categories = db.query(EvaluationCategory).filter(EvaluationCategory.is_active == True).all()
    items = db.query(EvaluationItem).filter(EvaluationItem.is_active == True).all()
    
    print(f"✅ Found {len(categories)} categories and {len(items)} evaluation items")
    return categories, items

def create_sample_rounds(db: Session):
    """Create realistic sample rounds"""
    
    # Get users
    users = get_or_create_users(db)
    if not users:
        return
    
    # Get evaluation data
    categories, items = get_evaluation_data(db)
    
    # Sample departments
    departments = [
        "الطوارئ",
        "العناية المركزة",
        "الجراحة",
        "الأطفال",
        "النساء والولادة",
        "المختبر",
        "الأشعة",
        "الصيدلية"
    ]
    
    # Sample rounds data
    sample_rounds = [
        {
            "title": "جولة سلامة المرضى - الطوارئ",
            "description": "جولة دورية للتحقق من إجراءات سلامة المرضى في قسم الطوارئ",
            "round_type": RoundType.PATIENT_SAFETY,
            "department": "الطوارئ",
            "status": RoundStatus.COMPLETED,
            "days_ago": 10,
            "compliance": 95,
            "completion": 100,
            "priority": "high"
        },
        {
            "title": "فحص مكافحة العدوى - العناية المركزة",
            "description": "تقييم بروتوكولات مكافحة العدوى وتعقيم الأجهزة",
            "round_type": RoundType.INFECTION_CONTROL,
            "department": "العناية المركزة",
            "status": RoundStatus.IN_PROGRESS,
            "days_ago": 2,
            "compliance": 75,
            "completion": 60,
            "priority": "urgent"
        },
        {
            "title": "تقييم النظافة والتعقيم - الجراحة",
            "description": "فحص شامل لمستويات النظافة والتعقيم في غرف العمليات",
            "round_type": RoundType.HYGIENE,
            "department": "الجراحة",
            "status": RoundStatus.SCHEDULED,
            "days_ago": -5,
            "compliance": 0,
            "completion": 0,
            "priority": "high"
        },
        {
            "title": "مراجعة سلامة الأدوية - الصيدلية",
            "description": "التحقق من إجراءات تخزين وصرف الأدوية",
            "round_type": RoundType.MEDICATION_SAFETY,
            "department": "الصيدلية",
            "status": RoundStatus.COMPLETED,
            "days_ago": 15,
            "compliance": 88,
            "completion": 100,
            "priority": "medium"
        },
        {
            "title": "فحص سلامة المعدات - الأشعة",
            "description": "تقييم حالة وصيانة أجهزة الأشعة والتصوير",
            "round_type": RoundType.EQUIPMENT_SAFETY,
            "department": "الأشعة",
            "status": RoundStatus.PENDING_REVIEW,
            "days_ago": 1,
            "compliance": 82,
            "completion": 90,
            "priority": "medium"
        },
        {
            "title": "تقييم البيئة الآمنة - الأطفال",
            "description": "فحص سلامة البيئة المحيطة وإجراءات الوقاية من الحوادث",
            "round_type": RoundType.ENVIRONMENTAL,
            "department": "الأطفال",
            "status": RoundStatus.IN_PROGRESS,
            "days_ago": 3,
            "compliance": 78,
            "completion": 50,
            "priority": "medium"
        },
        {
            "title": "جولة عامة - النساء والولادة",
            "description": "تقييم شامل للإجراءات والممارسات العامة",
            "round_type": RoundType.GENERAL,
            "department": "النساء والولادة",
            "status": RoundStatus.OVERDUE,
            "days_ago": 20,
            "compliance": 65,
            "completion": 40,
            "priority": "urgent"
        },
        {
            "title": "مراجعة مكافحة العدوى - المختبر",
            "description": "تقييم إجراءات السلامة البيولوجية والتخلص من النفايات",
            "round_type": RoundType.INFECTION_CONTROL,
            "department": "المختبر",
            "status": RoundStatus.SCHEDULED,
            "days_ago": -7,
            "compliance": 0,
            "completion": 0,
            "priority": "high"
        },
        {
            "title": "جولة سلامة المرضى - الجراحة",
            "description": "التحقق من قوائم التحقق الجراحية وإجراءات تحديد الهوية",
            "round_type": RoundType.PATIENT_SAFETY,
            "department": "الجراحة",
            "status": RoundStatus.COMPLETED,
            "days_ago": 5,
            "compliance": 92,
            "completion": 100,
            "priority": "high"
        },
        {
            "title": "فحص سلامة المعدات - الطوارئ",
            "description": "تقييم جاهزية معدات الطوارئ والإنعاش",
            "round_type": RoundType.EQUIPMENT_SAFETY,
            "department": "الطوارئ",
            "status": RoundStatus.IN_PROGRESS,
            "days_ago": 1,
            "compliance": 85,
            "completion": 70,
            "priority": "urgent"
        }
    ]
    
    created_rounds = []
    
    for idx, round_data in enumerate(sample_rounds, start=1):
        # Calculate dates
        scheduled_date = datetime.now() - timedelta(days=round_data['days_ago'])
        end_date = scheduled_date + timedelta(days=14)  # 2 weeks duration
        deadline = scheduled_date + timedelta(days=10)
        
        # Select random users (1-3)
        num_assigned = random.randint(1, min(3, len(users)))
        assigned_users = random.sample(users, num_assigned)
        assigned_user_ids = [u.id for u in assigned_users]
        
        # Select random categories (2-4)
        if categories:
            num_categories = random.randint(2, min(4, len(categories)))
            selected_cat_ids = [c.id for c in random.sample(categories, num_categories)]
        else:
            selected_cat_ids = []
        
        # Select random evaluation items (3-8)
        if items:
            num_items = random.randint(3, min(8, len(items)))
            selected_item_ids = [i.id for i in random.sample(items, num_items)]
        else:
            selected_item_ids = []
        
        # Create round
        db_round = Round(
            round_code=f"RND-SEED-{idx:04d}",
            title=round_data['title'],
            description=round_data['description'],
            round_type=round_data['round_type'],
            department=round_data['department'],
            status=round_data['status'],
            scheduled_date=scheduled_date,
            deadline=deadline,
            end_date=end_date,
            priority=round_data['priority'],
            compliance_percentage=round_data['compliance'],
            completion_percentage=round_data['completion'],
            notes=f"جولة تجريبية تم إنشاؤها لاختبار النظام - {datetime.now().strftime('%Y-%m-%d')}",
            created_by_id=users[0].id,  # Admin user
            assigned_to=f"[{', '.join([f'{u.first_name} {u.last_name}' for u in assigned_users])}]",
            assigned_to_ids=assigned_user_ids,  # Store as Python list (JSONB)
            selected_categories=selected_cat_ids,  # Store as Python list (JSONB)
            evaluation_items=selected_item_ids  # Store as Python list (JSONB)
        )
        
        db.add(db_round)
        created_rounds.append(db_round)
        
        print(f"✅ Created round {idx}/{len(sample_rounds)}: {round_data['title']}")
        print(f"   - Categories: {selected_cat_ids}")
        print(f"   - Items: {selected_item_ids}")
        print(f"   - Assigned to: {assigned_user_ids}")
    
    # Commit all
    try:
        db.commit()
        print(f"\n🎉 Successfully created {len(created_rounds)} sample rounds")
        
        # Verify
        print("\n📊 Verification:")
        for round_type in RoundType:
            count = db.query(Round).filter(Round.round_type == round_type).count()
            if count > 0:
                print(f"   - {round_type.value}: {count} rounds")
        
        # Check data integrity
        rounds_with_categories = db.query(Round).filter(Round.selected_categories != []).count()
        rounds_with_items = db.query(Round).filter(Round.evaluation_items != []).count()
        
        print(f"\n📈 Data Integrity:")
        print(f"   - Rounds with categories: {rounds_with_categories}")
        print(f"   - Rounds with evaluation items: {rounds_with_items}")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error committing rounds: {e}")
        raise

def main():
    """Main function"""
    print("=" * 60)
    print("إضافة بيانات عينة للجولات - Sample Rounds Seeder")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # Check if rounds already exist
        existing_rounds = db.query(Round).filter(Round.round_code.like('RND-SEED-%')).count()
        
        if existing_rounds > 0:
            print(f"\n⚠️ Found {existing_rounds} existing sample rounds")
            response = input("Do you want to delete them and recreate? (yes/no): ")
            if response.lower() in ['yes', 'y']:
                db.query(Round).filter(Round.round_code.like('RND-SEED-%')).delete()
                db.commit()
                print("✅ Deleted existing sample rounds")
            else:
                print("❌ Aborted")
                return
        
        # Create sample rounds
        create_sample_rounds(db)
        
        print("\n✅ Done! Sample rounds have been created successfully.")
        print("\nYou can now:")
        print("1. View rounds in the frontend: http://localhost:5174/rounds/list")
        print("2. Check reports: http://localhost:5174/reports")
        print("3. Test API: curl -H 'Authorization: Bearer <token>' http://localhost:8000/api/rounds")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()

