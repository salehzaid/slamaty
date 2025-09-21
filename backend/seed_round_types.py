#!/usr/bin/env python3
"""
Script to seed round types data
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models_updated import Base, RoundTypeSettings
import json

def seed_round_types():
    """Seed round types data"""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if round types already exist
        existing_count = db.query(RoundTypeSettings).count()
        if existing_count > 0:
            print(f"Round types already exist ({existing_count} records). Skipping seed.")
            return
        
        # Default round types
        round_types_data = [
            {
                "name": "سلامة المرضى",
                "name_en": "Patient Safety",
                "description": "جولات تقييم سلامة المرضى والرعاية المقدمة",
                "color": "red",
                "icon": "heart",
                "is_active": True,
                "sort_order": 1
            },
            {
                "name": "مكافحة العدوى",
                "name_en": "Infection Control",
                "description": "جولات تقييم إجراءات مكافحة العدوى والنظافة",
                "color": "blue",
                "icon": "droplets",
                "is_active": True,
                "sort_order": 2
            },
            {
                "name": "سلامة الأدوية",
                "name_en": "Medication Safety",
                "description": "جولات تقييم إدارة الأدوية وسلامة الاستخدام",
                "color": "green",
                "icon": "pill",
                "is_active": True,
                "sort_order": 3
            },
            {
                "name": "سلامة المعدات",
                "name_en": "Equipment Safety",
                "description": "جولات تقييم سلامة المعدات الطبية والأجهزة",
                "color": "orange",
                "icon": "wrench",
                "is_active": True,
                "sort_order": 4
            },
            {
                "name": "البيئة",
                "name_en": "Environmental",
                "description": "جولات تقييم البيئة المحيطة والظروف البيئية",
                "color": "green",
                "icon": "leaf",
                "is_active": True,
                "sort_order": 5
            },
            {
                "name": "النظافة العامة",
                "name_en": "General Hygiene",
                "description": "جولات تقييم النظافة العامة والتنظيف",
                "color": "purple",
                "icon": "shield",
                "is_active": True,
                "sort_order": 6
            },
            {
                "name": "عام",
                "name_en": "General",
                "description": "جولات تقييم عامة ومتنوعة",
                "color": "gray",
                "icon": "settings",
                "is_active": True,
                "sort_order": 7
            }
        ]
        
        # Insert round types
        for rt_data in round_types_data:
            round_type = RoundTypeSettings(**rt_data)
            db.add(round_type)
        
        db.commit()
        print(f"Successfully seeded {len(round_types_data)} round types")
        
    except Exception as e:
        print(f"Error seeding round types: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_round_types()
