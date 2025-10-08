#!/usr/bin/env python3
"""
Script to check rounds data - deadline and end_date columns
"""

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

def check_rounds_dates():
    """Check deadline and end_date in rounds table"""
    
    # Database URL - استخدام salamaty_db كما في database.py
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:mass@localhost:5432/salamaty_db")
    
    print("=" * 80)
    print("فحص بيانات الجولات - deadline و end_date")
    print("=" * 80)
    
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        # Test connection
        with engine.connect() as conn:
            print("\n✅ تم الاتصال بقاعدة البيانات بنجاح")
            
            # Check if columns exist
            print("\n🔍 التحقق من وجود الأعمدة...")
            result = conn.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'rounds' 
                AND column_name IN ('scheduled_date', 'deadline', 'end_date')
                ORDER BY ordinal_position;
            """))
            
            columns = result.fetchall()
            
            if columns:
                print("✅ الأعمدة الموجودة:")
                for col in columns:
                    print(f"   - {col[0]} ({col[1]})")
            else:
                print("❌ لم يتم العثور على الأعمدة")
                return
            
            # Get rounds data
            print("\n📊 جلب بيانات الجولات...")
            result = conn.execute(text("""
                SELECT 
                    id,
                    round_code,
                    title,
                    scheduled_date,
                    deadline,
                    end_date,
                    department,
                    round_type,
                    created_at
                FROM rounds 
                ORDER BY created_at DESC
                LIMIT 10;
            """))
            
            rounds = result.fetchall()
            
            if not rounds:
                print("❌ لا توجد جولات في قاعدة البيانات")
                return
            
            print(f"\n✅ تم العثور على {len(rounds)} جولة:")
            print("\n" + "=" * 80)
            
            for round_data in rounds:
                print(f"\n🔵 الجولة {round_data[0]}")
                print("-" * 80)
                print(f"   كود الجولة:         {round_data[1]}")
                print(f"   العنوان:           {round_data[2] or 'غير محدد'}")
                print(f"   القسم:             {round_data[6] or 'غير محدد'}")
                print(f"   نوع الجولة:        {round_data[7] or 'غير محدد'}")
                print(f"\n   📅 التواريخ:")
                print(f"   scheduled_date:    {round_data[3] or 'غير محدد'}")
                print(f"   deadline:          {round_data[4] or 'غير محدد'}")
                print(f"   end_date:          {round_data[5] or 'غير محدد'}")
                print(f"\n   تاريخ الإنشاء:     {round_data[8] or 'غير محدد'}")
                
                # حساب المدة
                if round_data[3] and round_data[5]:
                    try:
                        scheduled = datetime.fromisoformat(str(round_data[3]).replace('Z', '+00:00'))
                        end_date = datetime.fromisoformat(str(round_data[5]).replace('Z', '+00:00'))
                        duration = (end_date - scheduled).days
                        print(f"   المدة:             {duration} يوم")
                    except Exception as e:
                        print(f"   المدة:             خطأ في الحساب - {e}")
                
                print("-" * 80)
            
            # Statistics
            print("\n\n📈 إحصائيات:")
            print("=" * 80)
            
            result = conn.execute(text("""
                SELECT 
                    COUNT(*) as total,
                    COUNT(deadline) as with_deadline,
                    COUNT(end_date) as with_end_date
                FROM rounds;
            """))
            
            stats = result.fetchone()
            print(f"   إجمالي الجولات:        {stats[0]}")
            print(f"   جولات مع deadline:     {stats[1]} ({stats[1]/stats[0]*100:.1f}%)")
            print(f"   جولات مع end_date:     {stats[2]} ({stats[2]/stats[0]*100:.1f}%)")
            print("=" * 80)
            
    except Exception as e:
        print(f"\n❌ خطأ: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_rounds_dates()
