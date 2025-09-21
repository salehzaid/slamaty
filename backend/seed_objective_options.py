#!/usr/bin/env python3
"""
سكريبت لإضافة خيارات الارتباط الافتراضية إلى قاعدة البيانات
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from database import get_db
from models_updated import ObjectiveOption

def seed_objective_options():
    """إضافة خيارات الارتباط الافتراضية"""
    
    # خيارات الارتباط الافتراضية
    default_options = [
        {
            "name": "سباهي (CBAHI)",
            "description": "المعايير السعودية للرعاية الصحية",
            "is_active": True
        },
        {
            "name": "JCI",
            "description": "المعايير الدولية المشتركة",
            "is_active": True
        },
        {
            "name": "WHO Patient Safety Goals",
            "description": "أهداف السلامة للمرضى - منظمة الصحة العالمية",
            "is_active": True
        },
        {
            "name": "هدف داخلي للمستشفى",
            "description": "معايير محلية خاصة بالمستشفى",
            "is_active": True
        }
    ]
    
    # الحصول على جلسة قاعدة البيانات
    db = next(get_db())
    
    try:
        # التحقق من وجود خيارات مسبقاً
        existing_options = db.query(ObjectiveOption).count()
        
        if existing_options > 0:
            print(f"تم العثور على {existing_options} خيار موجود بالفعل. تخطي الإضافة.")
            return
        
        # إضافة الخيارات الافتراضية
        for option_data in default_options:
            objective_option = ObjectiveOption(
                name=option_data["name"],
                description=option_data["description"],
                is_active=option_data["is_active"]
            )
            db.add(objective_option)
        
        # حفظ التغييرات
        db.commit()
        print(f"تم إضافة {len(default_options)} خيار ارتباط افتراضي بنجاح!")
        
        # عرض الخيارات المضافة
        all_options = db.query(ObjectiveOption).all()
        print("\nخيارات الارتباط الحالية:")
        for option in all_options:
            print(f"- {option.name}: {option.description}")
            
    except Exception as e:
        print(f"خطأ في إضافة خيارات الارتباط: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_objective_options()
