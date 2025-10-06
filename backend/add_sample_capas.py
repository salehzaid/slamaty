"""
Add sample CAPA data to Neon database
"""
import os
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import json

os.environ['DATABASE_URL'] = 'postgresql://neondb_owner:npg_ERS5fHwxWiu2@ep-lingering-morning-adejreab-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

from database import SessionLocal
from models_updated import Capa, User, Department

db = SessionLocal()

try:
    # Get users
    admin = db.query(User).filter(User.username == "admin").first()
    quality_mgr = db.query(User).filter(User.username == "quality_manager").first()
    
    # Get departments
    depts = db.query(Department).all()
    
    if not admin:
        print("❌ لم يتم العثور على مستخدم admin")
        exit(1)
    
    print("🚀 إضافة بيانات CAPA تجريبية...")
    print("="*60)
    
    # Sample CAPAs
    sample_capas = [
        {
            "title": "تحسين إجراءات النظافة في الطوارئ",
            "description": "تم رصد نقص في التزام العاملين بإجراءات النظافة في قسم الطوارئ",
            "department": depts[0].name if depts else "الطوارئ",
            "root_cause": "نقص في التوعية والإشراف المستمر",
            "corrective_actions": json.dumps([
                {"action": "تدريب مكثف للعاملين", "status": "completed", "due_date": (datetime.now() + timedelta(days=7)).isoformat()},
                {"action": "تعيين مشرف نظافة", "status": "in_progress", "due_date": (datetime.now() + timedelta(days=10)).isoformat()}
            ]),
            "preventive_actions": json.dumps([
                {"action": "تفعيل نظام مراقبة يومي", "status": "pending", "due_date": (datetime.now() + timedelta(days=15)).isoformat()}
            ]),
            "verification_steps": json.dumps([
                {"step": "مراجعة سجلات النظافة", "status": "pending"}
            ]),
            "status": "in_progress",
            "priority": "high",
            "severity": 4,
            "target_date": datetime.now() + timedelta(days=15),
            "created_by_id": admin.id,
            "assigned_to_id": quality_mgr.id if quality_mgr else admin.id,
            "assigned_to": quality_mgr.username if quality_mgr else admin.username,
            "estimated_cost": 5000,
            "verification_status": "pending",
            "sla_days": 14,
            "escalation_level": 0
        },
        {
            "title": "تحديث بروتوكول إدارة الأدوية",
            "description": "حاجة ملحة لتحديث بروتوكولات تخزين الأدوية وفق المعايير الحديثة",
            "department": depts[1].name if len(depts) > 1 else "الصيدلية",
            "root_cause": "عدم وجود نظام مراقبة حرارة آلي",
            "corrective_actions": json.dumps([
                {"action": "تركيب أجهزة مراقبة حرارة", "status": "pending", "due_date": (datetime.now() + timedelta(days=5)).isoformat()},
                {"action": "إعادة ترتيب المخزن", "status": "pending", "due_date": (datetime.now() + timedelta(days=7)).isoformat()}
            ]),
            "preventive_actions": json.dumps([
                {"action": "تدريب الصيادلة على النظام الجديد", "status": "pending", "due_date": (datetime.now() + timedelta(days=10)).isoformat()}
            ]),
            "verification_steps": json.dumps([]),
            "status": "pending",
            "priority": "critical",
            "severity": 5,
            "target_date": datetime.now() + timedelta(days=7),
            "created_by_id": admin.id,
            "assigned_to_id": admin.id,
            "assigned_to": admin.username,
            "estimated_cost": 15000,
            "verification_status": "pending",
            "sla_days": 7,
            "escalation_level": 1
        },
        {
            "title": "تدريب الطاقم على معدات السلامة",
            "description": "تدريب شامل على استخدام معدات السلامة المحدثة في جميع الأقسام",
            "department": depts[2].name if len(depts) > 2 else "العناية المركزة",
            "root_cause": "عدم وجود برنامج تدريب منظم",
            "corrective_actions": json.dumps([
                {"action": "عقد ورش تدريبية", "status": "completed", "due_date": (datetime.now() - timedelta(days=3)).isoformat()},
                {"action": "توزيع أدلة إرشادية", "status": "completed", "due_date": (datetime.now() - timedelta(days=1)).isoformat()}
            ]),
            "preventive_actions": json.dumps([
                {"action": "برنامج تدريب دوري شهري", "status": "completed", "due_date": (datetime.now() - timedelta(days=1)).isoformat()}
            ]),
            "verification_steps": json.dumps([
                {"step": "اختبار الكفاءة", "status": "completed"}
            ]),
            "status": "completed",
            "priority": "medium",
            "severity": 3,
            "target_date": datetime.now() - timedelta(days=5),
            "created_by_id": admin.id,
            "assigned_to_id": quality_mgr.id if quality_mgr else admin.id,
            "assigned_to": quality_mgr.username if quality_mgr else admin.username,
            "estimated_cost": 8000,
            "verification_status": "approved",
            "sla_days": 14,
            "escalation_level": 0,
            "closed_at": datetime.now() - timedelta(days=2)
        },
        {
            "title": "خطة طوارئ للحالات الحرجة - متأخرة!",
            "description": "تطوير وتحديث خطة الطوارئ للحالات الحرجة",
            "department": depts[0].name if depts else "الطوارئ",
            "root_cause": "خطة قديمة لا تتوافق مع المعايير الحديثة",
            "corrective_actions": json.dumps([
                {"action": "مراجعة الخطة الحالية", "status": "pending", "due_date": (datetime.now() - timedelta(days=1)).isoformat()},
                {"action": "كتابة خطة جديدة", "status": "pending", "due_date": (datetime.now() + timedelta(days=2)).isoformat()}
            ]),
            "preventive_actions": json.dumps([]),
            "verification_steps": json.dumps([]),
            "status": "pending",
            "priority": "critical",
            "severity": 5,
            "target_date": datetime.now() - timedelta(days=3),
            "created_by_id": admin.id,
            "assigned_to_id": admin.id,
            "assigned_to": admin.username,
            "estimated_cost": 12000,
            "verification_status": "pending",
            "sla_days": 7,
            "escalation_level": 2
        },
        {
            "title": "تحسين نظام الوثائق الطبية",
            "description": "رقمنة وتحديث جميع الوثائق الطبية القديمة",
            "department": depts[3].name if len(depts) > 3 else "الأرشيف",
            "root_cause": "نظام ورقي قديم غير فعال",
            "corrective_actions": json.dumps([
                {"action": "مسح الوثائق الورقية", "status": "in_progress", "due_date": (datetime.now() + timedelta(days=10)).isoformat()},
                {"action": "إدخال البيانات رقمياً", "status": "in_progress", "due_date": (datetime.now() + timedelta(days=20)).isoformat()}
            ]),
            "preventive_actions": json.dumps([
                {"action": "تدريب على النظام الإلكتروني", "status": "pending", "due_date": (datetime.now() + timedelta(days=15)).isoformat()}
            ]),
            "verification_steps": json.dumps([]),
            "status": "in_progress",
            "priority": "high",
            "severity": 4,
            "target_date": datetime.now() + timedelta(days=20),
            "created_by_id": admin.id,
            "assigned_to_id": quality_mgr.id if quality_mgr else admin.id,
            "assigned_to": quality_mgr.username if quality_mgr else admin.username,
            "estimated_cost": 25000,
            "verification_status": "pending",
            "sla_days": 21,
            "escalation_level": 0
        },
        {
            "title": "تحديث معايير السلامة في العمليات",
            "description": "تحديث وتطبيق معايير السلامة الحديثة في غرف العمليات",
            "department": depts[4].name if len(depts) > 4 else "العمليات",
            "root_cause": "تغيير في المعايير الدولية",
            "corrective_actions": json.dumps([
                {"action": "مراجعة المعايير الحالية", "status": "in_progress", "due_date": (datetime.now() + timedelta(days=5)).isoformat()},
                {"action": "تطبيق التحديثات", "status": "pending", "due_date": (datetime.now() + timedelta(days=12)).isoformat()}
            ]),
            "preventive_actions": json.dumps([
                {"action": "برنامج مراقبة مستمر", "status": "pending", "due_date": (datetime.now() + timedelta(days=20)).isoformat()}
            ]),
            "verification_steps": json.dumps([
                {"step": "تدقيق خارجي", "status": "pending"}
            ]),
            "status": "in_progress",
            "priority": "high",
            "severity": 4,
            "target_date": datetime.now() + timedelta(days=12),
            "created_by_id": admin.id,
            "assigned_to_id": admin.id,
            "assigned_to": admin.username,
            "estimated_cost": 18000,
            "verification_status": "pending",
            "sla_days": 14,
            "escalation_level": 0
        }
    ]
    
    added = 0
    for capa_data in sample_capas:
        existing = db.query(Capa).filter(Capa.title == capa_data['title']).first()
        if not existing:
            capa = Capa(**capa_data)
            db.add(capa)
            added += 1
            print(f"  ✅ {capa_data['title']}")
        else:
            print(f"  ⏭️  {capa_data['title']} (موجود)")
    
    db.commit()
    
    total = db.query(Capa).count()
    
    print("\n" + "="*60)
    print(f"✅ تمت إضافة {added} خطة تصحيحية جديدة")
    print(f"📊 إجمالي الخطط: {total}")
    print("="*60)
    
    # Show stats
    stats = {
        'معلقة (pending)': db.query(Capa).filter(Capa.status == 'pending').count(),
        'قيد التنفيذ (in_progress)': db.query(Capa).filter(Capa.status == 'in_progress').count(),
        'مكتملة (completed)': db.query(Capa).filter(Capa.status == 'completed').count(),
        'متوقفة (on_hold)': db.query(Capa).filter(Capa.status == 'on_hold').count(),
    }
    
    print("\n📊 توزيع الحالات:")
    for status, count in stats.items():
        print(f"  {status}: {count}")
    
    # Priority stats
    print("\n🎯 توزيع الأولوية:")
    priorities = {
        'حرجة (critical)': db.query(Capa).filter(Capa.priority == 'critical').count(),
        'عالية (high)': db.query(Capa).filter(Capa.priority == 'high').count(),
        'متوسطة (medium)': db.query(Capa).filter(Capa.priority == 'medium').count(),
        'منخفضة (low)': db.query(Capa).filter(Capa.priority == 'low').count(),
    }
    for priority, count in priorities.items():
        print(f"  {priority}: {count}")
    
    print("\n✅ جاهز! الداشبورد سيعرض هذه البيانات الآن.")
    
    db.close()
    
except Exception as e:
    print(f"❌ خطأ: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
