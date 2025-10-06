#!/usr/bin/env python3
"""
Backfill Script: نقل الإجراءات من JSON إلى جدول capa_actions

يقرأ corrective_actions, preventive_actions, verification_steps من جدول capas
ويحوّلها إلى صفوف في capa_actions
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
import json
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv('env.local')

def get_db_url():
    """Get database URL from environment"""
    return os.getenv("DATABASE_URL", "postgresql://postgres:mass@localhost:5432/salamaty_db")

def parse_date(date_str):
    """تحويل نص التاريخ إلى datetime"""
    if not date_str:
        return None
    try:
        if isinstance(date_str, str):
            # Try ISO format first
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return date_str
    except Exception:
        try:
            # Try common formats
            for fmt in ['%Y-%m-%d', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S']:
                try:
                    return datetime.strptime(date_str, fmt)
                except:
                    continue
            return None
        except:
            return None

def backfill_capa_actions():
    """نقل الإجراءات من JSON إلى جدول capa_actions"""
    
    engine = create_engine(get_db_url())
    
    with engine.begin() as connection:
        print("=" * 80)
        print("🚀 Backfill: Converting CAPA actions from JSON to table rows")
        print("=" * 80)
        
        try:
            # Step 1: Get all CAPAs
            print("\n📝 Step 1: Fetching all CAPAs...")
            
            capas_sql = text("""
                SELECT id, corrective_actions, preventive_actions, verification_steps 
                FROM capas
                ORDER BY id;
            """)
            
            capas = connection.execute(capas_sql).fetchall()
            print(f"   ✅ Found {len(capas)} CAPAs to process")
            
            # Counters
            total_actions = 0
            total_corrective = 0
            total_preventive = 0
            total_verification = 0
            errors = 0
            
            # Step 2: Process each CAPA
            print("\n📝 Step 2: Processing CAPAs...")
            
            for capa in capas:
                capa_id = capa[0]
                corrective_json = capa[1]
                preventive_json = capa[2]
                verification_json = capa[3]
                
                print(f"\n   Processing CAPA ID: {capa_id}")
                
                # Process corrective actions
                try:
                    # Handle both string JSON and direct list from DB
                    if isinstance(corrective_json, str):
                        corrective_actions = json.loads(corrective_json) if corrective_json and corrective_json != '[]' else []
                    elif isinstance(corrective_json, list):
                        corrective_actions = corrective_json
                    else:
                        corrective_actions = []
                    
                    if not isinstance(corrective_actions, list):
                        corrective_actions = []
                    
                    for action in corrective_actions:
                        if not action or not isinstance(action, dict):
                            continue
                        
                        task = action.get('task', '')
                        if not task:
                            continue
                        
                        due_date = parse_date(action.get('due_date'))
                        assigned_to = action.get('assigned_to', '')
                        assigned_to_id = action.get('assigned_to_id')
                        notes = action.get('notes', '')
                        status = action.get('status', 'open')
                        completed_at = parse_date(action.get('completed_at'))
                        
                        insert_sql = text("""
                            INSERT INTO capa_actions 
                            (capa_id, action_type, task, due_date, assigned_to, assigned_to_id, 
                             notes, status, completed_at, required)
                            VALUES 
                            (:capa_id, :action_type, :task, :due_date, :assigned_to, :assigned_to_id, 
                             :notes, :status, :completed_at, :required)
                        """)
                        
                        connection.execute(insert_sql, {
                            'capa_id': capa_id,
                            'action_type': 'corrective',
                            'task': task,
                            'due_date': due_date,
                            'assigned_to': assigned_to,
                            'assigned_to_id': assigned_to_id,
                            'notes': notes,
                            'status': status,
                            'completed_at': completed_at,
                            'required': True
                        })
                        
                        total_corrective += 1
                        total_actions += 1
                    
                    if corrective_actions:
                        print(f"      ✅ Added {len(corrective_actions)} corrective actions")
                
                except Exception as e:
                    print(f"      ⚠️  Error processing corrective actions: {e}")
                    errors += 1
                
                # Process preventive actions
                try:
                    # Handle both string JSON and direct list from DB
                    if isinstance(preventive_json, str):
                        preventive_actions = json.loads(preventive_json) if preventive_json and preventive_json != '[]' else []
                    elif isinstance(preventive_json, list):
                        preventive_actions = preventive_json
                    else:
                        preventive_actions = []
                    
                    if not isinstance(preventive_actions, list):
                        preventive_actions = []
                    
                    for action in preventive_actions:
                        if not action or not isinstance(action, dict):
                            continue
                        
                        task = action.get('task', '')
                        if not task:
                            continue
                        
                        due_date = parse_date(action.get('due_date'))
                        assigned_to = action.get('assigned_to', '')
                        assigned_to_id = action.get('assigned_to_id')
                        notes = action.get('notes', '')
                        status = action.get('status', 'open')
                        completed_at = parse_date(action.get('completed_at'))
                        
                        insert_sql = text("""
                            INSERT INTO capa_actions 
                            (capa_id, action_type, task, due_date, assigned_to, assigned_to_id, 
                             notes, status, completed_at, required)
                            VALUES 
                            (:capa_id, :action_type, :task, :due_date, :assigned_to, :assigned_to_id, 
                             :notes, :status, :completed_at, :required)
                        """)
                        
                        connection.execute(insert_sql, {
                            'capa_id': capa_id,
                            'action_type': 'preventive',
                            'task': task,
                            'due_date': due_date,
                            'assigned_to': assigned_to,
                            'assigned_to_id': assigned_to_id,
                            'notes': notes,
                            'status': status,
                            'completed_at': completed_at,
                            'required': True
                        })
                        
                        total_preventive += 1
                        total_actions += 1
                    
                    if preventive_actions:
                        print(f"      ✅ Added {len(preventive_actions)} preventive actions")
                
                except Exception as e:
                    print(f"      ⚠️  Error processing preventive actions: {e}")
                    errors += 1
                
                # Process verification steps
                try:
                    # Handle both string JSON and direct list from DB
                    if isinstance(verification_json, str):
                        verification_steps = json.loads(verification_json) if verification_json and verification_json != '[]' else []
                    elif isinstance(verification_json, list):
                        verification_steps = verification_json
                    else:
                        verification_steps = []
                    
                    if not isinstance(verification_steps, list):
                        verification_steps = []
                    
                    for step in verification_steps:
                        if not step or not isinstance(step, dict):
                            continue
                        
                        task = step.get('step', '')
                        if not task:
                            continue
                        
                        required = step.get('required', True)
                        completed = step.get('completed', False)
                        completed_at = parse_date(step.get('completed_at'))
                        completed_by_id = step.get('completed_by_id')
                        notes = step.get('notes', '')
                        status = 'completed' if completed else 'open'
                        
                        insert_sql = text("""
                            INSERT INTO capa_actions 
                            (capa_id, action_type, task, due_date, assigned_to, assigned_to_id, 
                             notes, status, completed_at, completed_by_id, required)
                            VALUES 
                            (:capa_id, :action_type, :task, :due_date, :assigned_to, :assigned_to_id, 
                             :notes, :status, :completed_at, :completed_by_id, :required)
                        """)
                        
                        connection.execute(insert_sql, {
                            'capa_id': capa_id,
                            'action_type': 'verification',
                            'task': task,
                            'due_date': None,  # verification steps don't have due_date in current schema
                            'assigned_to': None,
                            'assigned_to_id': None,
                            'notes': notes,
                            'status': status,
                            'completed_at': completed_at,
                            'completed_by_id': completed_by_id,
                            'required': required
                        })
                        
                        total_verification += 1
                        total_actions += 1
                    
                    if verification_steps:
                        print(f"      ✅ Added {len(verification_steps)} verification steps")
                
                except Exception as e:
                    print(f"      ⚠️  Error processing verification steps: {e}")
                    errors += 1
            
            # Step 3: Verify results
            print("\n📝 Step 3: Verifying backfill results...")
            
            count_sql = text("""
                SELECT action_type, COUNT(*) as count
                FROM capa_actions
                GROUP BY action_type
                ORDER BY action_type;
            """)
            
            results = connection.execute(count_sql).fetchall()
            
            print("\n   📊 Actions by type:")
            for row in results:
                print(f"      {row[0]}: {row[1]} actions")
            
            total_in_db = connection.execute(text("SELECT COUNT(*) FROM capa_actions")).fetchone()[0]
            
            print("\n" + "=" * 80)
            print("✅ Backfill completed!")
            print(f"   📊 Summary:")
            print(f"      - Total CAPAs processed: {len(capas)}")
            print(f"      - Corrective actions: {total_corrective}")
            print(f"      - Preventive actions: {total_preventive}")
            print(f"      - Verification steps: {total_verification}")
            print(f"      - Total actions created: {total_in_db}")
            print(f"      - Errors encountered: {errors}")
            print("=" * 80)
            
            return True
            
        except Exception as e:
            print(f"\n❌ Backfill failed: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    import sys
    success = backfill_capa_actions()
    sys.exit(0 if success else 1)

