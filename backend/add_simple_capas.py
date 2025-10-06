"""
Add simple CAPA data - compatible with current schema
"""
import os
from datetime import datetime, timedelta

os.environ['DATABASE_URL'] = 'postgresql://neondb_owner:npg_ERS5fHwxWiu2@ep-lingering-morning-adejreab-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

from database import SessionLocal
from models_updated import Capa, User

db = SessionLocal()

try:
    admin = db.query(User).filter(User.username == "admin").first()
    quality_mgr = db.query(User).filter(User.username == "quality_manager").first()
    
    if not admin:
        print("❌ admin not found")
        exit(1)
    
    print("🚀 Adding sample CAPAs...")
    print("="*60)
    
    capas = [
        {
            "title": "تحسين إجراءات النظافة في الطوارئ",
            "description": "تم رصد نقص في التزام العاملين بإجراءات النظافة",
            "department": "الطوارئ",
            "priority": "high",
            "status": "in_progress",
            "target_date": datetime.now() + timedelta(days=15),
            "created_by_id": admin.id,
            "assigned_to_id": quality_mgr.id if quality_mgr else admin.id,
            "assigned_to": quality_mgr.username if quality_mgr else admin.username,
            "estimated_cost": 5000
        },
        {
            "title": "تحديث بروتوكول إدارة الأدوية - حرج",
            "description": "تحديث بروتوكولات تخزين الأدوية بشكل عاجل",
            "department": "الصيدلية",
            "priority": "critical",
            "status": "pending",
            "target_date": datetime.now() - timedelta(days=2),
            "created_by_id": admin.id,
            "assigned_to_id": admin.id,
            "assigned_to": admin.username,
            "estimated_cost": 15000
        },
        {
            "title": "تدريب الطاقم على معدات السلامة",
            "description": "تدريب شامل على استخدام معدات السلامة",
            "department": "العناية المركزة",
            "priority": "medium",
            "status": "completed",
            "target_date": datetime.now() - timedelta(days=5),
            "created_by_id": admin.id,
            "assigned_to_id": quality_mgr.id if quality_mgr else admin.id,
            "assigned_to": quality_mgr.username if quality_mgr else admin.username,
            "closed_at": datetime.now() - timedelta(days=2),
            "estimated_cost": 8000
        },
        {
            "title": "مراجعة بروتوكولات العدوى",
            "description": "مراجعة وتحديث بروتوكولات مكافحة العدوى",
            "department": "مكافحة العدوى",
            "priority": "high",
            "status": "in_progress",
            "target_date": datetime.now() + timedelta(days=10),
            "created_by_id": admin.id,
            "assigned_to_id": admin.id,
            "assigned_to": admin.username,
            "estimated_cost": 7000
        },
        {
            "title": "تحسين نظام الوثائق الطبية",
            "description": "رقمنة الوثائق الطبية القديمة",
            "department": "السجلات الطبية",
            "priority": "high",
            "status": "in_progress",
            "target_date": datetime.now() + timedelta(days=20),
            "created_by_id": admin.id,
            "assigned_to_id": quality_mgr.id if quality_mgr else admin.id,
            "assigned_to": quality_mgr.username if quality_mgr else admin.username,
            "estimated_cost": 25000
        },
        {
            "title": "خطة طوارئ - متأخرة",
            "description": "تطوير خطة طوارئ محدثة للحالات الحرجة",
            "department": "الطوارئ",
            "priority": "critical",
            "status": "pending",
            "target_date": datetime.now() - timedelta(days=3),
            "created_by_id": admin.id,
            "assigned_to_id": admin.id,
            "assigned_to": admin.username,
            "estimated_cost": 12000
        },
        {
            "title": "تحديث معايير السلامة في العمليات",
            "description": "تطبيق معايير السلامة الحديثة في غرف العمليات",
            "department": "العمليات",
            "priority": "high",
            "status": "in_progress",
            "target_date": datetime.now() + timedelta(days=12),
            "created_by_id": admin.id,
            "assigned_to_id": admin.id,
            "assigned_to": admin.username,
            "estimated_cost": 18000
        },
        {
            "title": "تحديث سياسة الأدوية عالية الخطورة",
            "description": "تحديث سياسات التعامل مع الأدوية عالية الخطورة",
            "department": "الصيدلية",
            "priority": "critical",
            "status": "pending",
            "target_date": datetime.now() + timedelta(days=5),
            "created_by_id": admin.id,
            "assigned_to_id": quality_mgr.id if quality_mgr else admin.id,
            "assigned_to": quality_mgr.username if quality_mgr else admin.username,
            "estimated_cost": 9000
        }
    ]
    
    added = 0
    for capa_data in capas:
        existing = db.query(Capa).filter(Capa.title == capa_data['title']).first()
        if not existing:
            capa = Capa(**capa_data)
            db.add(capa)
            added += 1
            print(f"  ✅ {capa_data['title']}")
        else:
            print(f"  ⏭️  موجود: {capa_data['title']}")
    
    db.commit()
    
    total = db.query(Capa).count()
    
    print("\n" + "="*60)
    print(f"✅ تمت إضافة {added} خطة جديدة")
    print(f"📊 الإجمالي: {total} خطة تصحيحية")
    print("="*60)
    
    # Stats
    print("\n📊 الإحصائيات:")
    print(f"  معلقة: {db.query(Capa).filter(Capa.status == 'pending').count()}")
    print(f"  قيد التنفيذ: {db.query(Capa).filter(Capa.status == 'in_progress').count()}")
    print(f"  مكتملة: {db.query(Capa).filter(Capa.status == 'completed').count()}")
    print(f"  حرجة: {db.query(Capa).filter(Capa.priority == 'critical').count()}")
    print(f"  عالية: {db.query(Capa).filter(Capa.priority == 'high').count()}")
    
    today = datetime.now().date()
    overdue = db.query(Capa).filter(
        Capa.target_date < today,
        Capa.status != 'completed'
    ).count()
    print(f"  متأخرة: {overdue}")
    
    print("\n✅ الداشبورد جاهز للعرض!")
    
    db.close()
    
except Exception as e:
    print(f"❌ خطأ: {e}")
    db.rollback()
