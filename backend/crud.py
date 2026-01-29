from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, text
from typing import List, Optional
from datetime import datetime
from models_updated import User, Round, Capa, Department, EvaluationResult, Notification, UserNotificationSettings, NotificationType, NotificationStatus, RoundTypeSettings, CapaStatus, VerificationStatus
from schemas import UserCreate, RoundCreate, CapaCreate, DepartmentCreate
# from auth import get_password_hash
import json
import uuid

# Import evaluation models if they exist
try:
    from models_updated import EvaluationCategory, EvaluationItem, EvaluationResult
    EVALUATION_MODELS_AVAILABLE = True
except ImportError:
    EVALUATION_MODELS_AVAILABLE = False
except Exception as e:
    print(f"Warning: Could not import evaluation models: {e}")
    EVALUATION_MODELS_AVAILABLE = False

# User CRUD operations
def create_user(db: Session, user: UserCreate, hashed_password: str):
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        department=user.department,
        phone=user.phone,
        position=user.position,
        photo_url=user.photo_url
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()

def update_user_data(db: Session, user_id: int, user, hashed_password: str):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        return None
    
    print(f"🔍 CRUD - Updating user {user_id}")
    print(f"🔍 CRUD - User data type: {type(user)}")
    print(f"🔍 CRUD - User data: {user}")
    
    # Update user fields only if provided
    if isinstance(user, dict):
        # Handle dict input
        if 'username' in user and user['username'] is not None:
            db_user.username = user['username']
        if 'email' in user and user['email'] is not None:
            db_user.email = user['email']
        if 'first_name' in user and user['first_name'] is not None:
            db_user.first_name = user['first_name']
        if 'last_name' in user and user['last_name'] is not None:
            db_user.last_name = user['last_name']
        if 'role' in user and user['role'] is not None:
            db_user.role = user['role']
        if 'department' in user and user['department'] is not None:
            db_user.department = user['department']
        if 'phone' in user and user['phone'] is not None:
            db_user.phone = user['phone']
        if 'position' in user and user['position'] is not None:
            db_user.position = user.position
        if 'photo_url' in user and user['photo_url'] is not None:
            print(f"🔍 CRUD - Setting photo_url to: {user['photo_url']}")
            db_user.photo_url = user['photo_url']
        else:
            print(f"🔍 CRUD - No photo_url in user data or it's None")
    else:
        # Handle object input
        if hasattr(user, 'username') and user.username is not None:
            db_user.username = user.username
        if hasattr(user, 'email') and user.email is not None:
            db_user.email = user.email
        if hasattr(user, 'first_name') and user.first_name is not None:
            db_user.first_name = user.first_name
        if hasattr(user, 'last_name') and user.last_name is not None:
            db_user.last_name = user.last_name
        if hasattr(user, 'role') and user.role is not None:
            db_user.role = user.role
        if hasattr(user, 'department') and user.department is not None:
            db_user.department = user.department
        if hasattr(user, 'phone') and user.phone is not None:
            db_user.phone = user.phone
        if hasattr(user, 'position') and user.position is not None:
            db_user.position = user.position
        if hasattr(user, 'photo_url') and user.photo_url is not None:
            db_user.photo_url = user.photo_url
    
    # Update password only if provided
    if hashed_password:
        db_user.hashed_password = hashed_password
    
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user_data(db: Session, user_id: int):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        return None
    
    # Handle related data before deleting the user
    # 1. Delete CAPAs created by this user
    capas_created = db.query(Capa).filter(Capa.created_by_id == user_id).all()
    for capa in capas_created:
        db.delete(capa)
    
    # 2. Delete evaluation results created by this user
    evaluation_results = db.query(EvaluationResult).filter(EvaluationResult.evaluated_by == user_id).all()
    for result in evaluation_results:
        db.delete(result)
    
    # 3. Update rounds where this user is assigned (remove from assigned_to)
    rounds = db.query(Round).filter(Round.assigned_to.contains(f'"{db_user.first_name} {db_user.last_name}"')).all()
    for round in rounds:
        if round.assigned_to:
            import json
            try:
                assigned_list = json.loads(round.assigned_to) if isinstance(round.assigned_to, str) else round.assigned_to
                if isinstance(assigned_list, list):
                    # Remove user name from assigned_to list
                    user_name = f"{db_user.first_name} {db_user.last_name}"
                    if user_name in assigned_list:
                        assigned_list.remove(user_name)
                        round.assigned_to = json.dumps(assigned_list) if assigned_list else None
            except:
                pass
    
    # Now delete the user
    db.delete(db_user)
    db.commit()
    return db_user

# Round CRUD operations
def create_round(db: Session, round: RoundCreate, created_by_id: int):
    # Generate unique round code if not provided
    if round.round_code:
        round_code = round.round_code
    else:
        # Generate unique round code
        while True:
            round_code = f"RND-{uuid.uuid4().hex[:8].upper()}"
            # Check if code already exists
            existing = db.query(Round).filter(Round.round_code == round_code).first()
            if not existing:
                break
    
    # Handle assigned_to - it can be either user IDs or user names
    if round.assigned_to:
        if isinstance(round.assigned_to, list):
            # Check if first item is a number (user ID) or string (user name)
            if round.assigned_to and str(round.assigned_to[0]).isdigit():
                # Convert user IDs to user names
                assigned_to_names = []
                for user_id in round.assigned_to:
                    user = get_user_by_id(db, int(user_id))
                    if user:
                        assigned_to_names.append(f"{user.first_name} {user.last_name}")
                assigned_to_json = json.dumps(assigned_to_names)
            else:
                # Already user names
                assigned_to_json = json.dumps(round.assigned_to)
        else:
            # Single value
            assigned_to_json = json.dumps([round.assigned_to])
    else:
        assigned_to_json = json.dumps([])
    
    # Convert string dates to datetime if needed
    deadline_dt = None
    if round.deadline:
        if isinstance(round.deadline, str):
            deadline_dt = datetime.fromisoformat(round.deadline.replace('Z', '+00:00'))
        else:
            deadline_dt = round.deadline
    
    end_date_dt = None
    if round.end_date:
        if isinstance(round.end_date, str):
            end_date_dt = datetime.fromisoformat(round.end_date.replace('Z', '+00:00'))
        else:
            end_date_dt = round.end_date
    
    # Handle assigned_to_ids - now using JSONB, store as Python list
    assigned_to_ids_list = []
    if round.assigned_to and isinstance(round.assigned_to, list):
        try:
            # Convert to integers only if items are numeric
            assigned_to_ids_list = [int(x) for x in round.assigned_to if str(x).isdigit()]
            print(f"✅ Parsed assigned_to_ids: {assigned_to_ids_list}")
        except Exception as e:
            print(f"⚠️ Warning: Could not convert assigned_to to IDs: {e}")
            assigned_to_ids_list = []
    
    # Handle selected_categories - now using JSONB, store as Python list
    selected_categories_list = []
    try:
        raw_selected = getattr(round, 'selected_categories', None)
        if raw_selected is None:
            selected_categories_list = []
        elif isinstance(raw_selected, list):
            # Validate all items are integers
            selected_categories_list = [int(x) for x in raw_selected if isinstance(x, (int, str)) and str(x).isdigit()]
            print(f"✅ Parsed selected_categories: {selected_categories_list}")
        elif isinstance(raw_selected, str):
            # if stored as JSON string like '[]' parse it
            try:
                parsed = json.loads(raw_selected)
                if isinstance(parsed, list):
                    selected_categories_list = [int(x) for x in parsed if isinstance(x, (int, str)) and str(x).isdigit()]
                else:
                    selected_categories_list = []
            except json.JSONDecodeError:
                print(f"⚠️ Warning: Could not parse selected_categories as JSON: {raw_selected}")
                selected_categories_list = []
        else:
            # unknown type - coerce to empty list
            print(f"⚠️ Warning: selected_categories has unexpected type: {type(raw_selected)}")
            selected_categories_list = []
    except Exception as e:
        print(f"⚠️ Warning parsing selected_categories: {e}")
        selected_categories_list = []
    
    # Handle evaluation_items - now using JSONB, store as Python list
    evaluation_items_list = []
    if round.evaluation_items:
        try:
            if isinstance(round.evaluation_items, list):
                evaluation_items_list = [int(x) for x in round.evaluation_items if isinstance(x, (int, str)) and str(x).isdigit()]
                print(f"✅ Parsed evaluation_items: {evaluation_items_list}")
            else:
                print(f"⚠️ Warning: evaluation_items has unexpected type: {type(round.evaluation_items)}")
                evaluation_items_list = []
        except Exception as e:
            print(f"⚠️ Warning parsing evaluation_items: {e}")
            evaluation_items_list = []
    
    db_round = Round(
        round_code=round_code,
        title=round.title,
        description=round.description,
        round_type=round.round_type,
        department=round.department,
        assigned_to=assigned_to_json,
        assigned_to_ids=assigned_to_ids_list,  # Now a Python list, stored as JSONB
        scheduled_date=round.scheduled_date,
        deadline=deadline_dt,
        end_date=end_date_dt,  # تاريخ انتهاء الجولة المحسوب
        priority=round.priority,
        notes=round.notes,
        created_by_id=created_by_id,
        evaluation_items=evaluation_items_list,  # Now a Python list, stored as JSONB
        selected_categories=selected_categories_list  # Now a Python list, stored as JSONB
    )
    db.add(db_round)
    db.commit()
    db.refresh(db_round)
    return db_round

def get_rounds(db: Session, skip: int = 0, limit: int = 100):
    try:
        print(f"🔍 [CRUD] Getting rounds from database (skip={skip}, limit={limit})")
        
        # Test connection first
        db.execute(text("SELECT 1"))
        
        # Get rounds
        rounds = db.query(Round).offset(skip).limit(limit).all()
        print(f"✅ [CRUD] Retrieved {len(rounds)} rounds")
        
        return rounds
    except Exception as e:
        print(f"❌ [CRUD] Error getting rounds: {e}")
        import traceback
        traceback.print_exc()
        raise

def get_round_by_id(db: Session, round_id: int):
    return db.query(Round).filter(Round.id == round_id).first()

def update_round(db: Session, round_id: int, round_data: dict):
    """Update an existing round"""
    db_round = db.query(Round).filter(Round.id == round_id).first()
    if not db_round:
        return None
    
    # Update fields if provided
    if 'title' in round_data and round_data['title'] is not None:
        db_round.title = round_data['title']
    if 'description' in round_data and round_data['description'] is not None:
        db_round.description = round_data['description']
    if 'round_type' in round_data and round_data['round_type'] is not None:
        db_round.round_type = round_data['round_type']
    if 'department' in round_data and round_data['department'] is not None:
        db_round.department = round_data['department']
    if 'assigned_to' in round_data and round_data['assigned_to'] is not None:
        # Convert assigned_to to JSON string if it's a list
        if isinstance(round_data['assigned_to'], list):
            db_round.assigned_to = json.dumps(round_data['assigned_to'])
            # also store numeric IDs as Python list (JSONB)
            try:
                numeric_ids = [int(x) for x in round_data['assigned_to'] if isinstance(x, (int, str)) and str(x).isdigit()]
                db_round.assigned_to_ids = numeric_ids  # Store as Python list (JSONB)
                print(f"✅ Updated assigned_to_ids: {numeric_ids}")
            except Exception as e:
                print(f"⚠️ Warning updating assigned_to_ids: {e}")
                db_round.assigned_to_ids = []
        else:
            db_round.assigned_to = round_data['assigned_to']
            db_round.assigned_to_ids = []
    if 'scheduled_date' in round_data and round_data['scheduled_date'] is not None:
        db_round.scheduled_date = round_data['scheduled_date']
    if 'priority' in round_data and round_data['priority'] is not None:
        db_round.priority = round_data['priority']
    if 'notes' in round_data and round_data['notes'] is not None:
        db_round.notes = round_data['notes']
    if 'evaluation_items' in round_data and round_data['evaluation_items'] is not None:
        # Store as Python list (JSONB)
        if isinstance(round_data['evaluation_items'], list):
            validated_items = [int(x) for x in round_data['evaluation_items'] if isinstance(x, (int, str)) and str(x).isdigit()]
            db_round.evaluation_items = validated_items
            print(f"✅ Updated evaluation_items: {validated_items}")
        else:
            print(f"⚠️ Warning: evaluation_items is not a list, setting to empty")
            db_round.evaluation_items = []
    # Persist selected categories if provided
    if 'selected_categories' in round_data and round_data['selected_categories'] is not None:
        # Store as Python list (JSONB)
        if isinstance(round_data['selected_categories'], list):
            validated_categories = [int(x) for x in round_data['selected_categories'] if isinstance(x, (int, str)) and str(x).isdigit()]
            db_round.selected_categories = validated_categories
            print(f"✅ Updated selected_categories: {validated_categories}")
        else:
            print(f"⚠️ Warning: selected_categories is not a list, setting to empty")
            db_round.selected_categories = []
    
    db.commit()
    db.refresh(db_round)
    return db_round

def delete_round(db: Session, round_id: int):
    """Delete a round by ID"""
    db_round = db.query(Round).filter(Round.id == round_id).first()
    if not db_round:
        return None
    
    # Delete related evaluation results first
    db.query(EvaluationResult).filter(EvaluationResult.round_id == round_id).delete()
    
    # Delete the round
    db.delete(db_round)
    db.commit()
    return db_round

def get_rounds_by_department(db: Session, department: str):
    return db.query(Round).filter(Round.department == department).all()

def get_rounds_by_status(db: Session, status: str):
    return db.query(Round).filter(Round.status == status).all()

def get_rounds_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    """Get rounds assigned to a specific user using JSONB assigned_to_ids"""
    
    print(f"🔍 Getting rounds for user ID: {user_id}")
    
    try:
        # Check if user exists
        user = get_user_by_id(db, user_id)
        if not user:
            print(f"❌ User with ID {user_id} not found")
            return []
        
        print(f"👤 User: {user.first_name} {user.last_name} (ID: {user_id})")
        
        # Query rounds where assigned_to_ids JSONB array contains the user_id
        # Using PostgreSQL JSONB operators: @> checks if left JSONB contains right JSONB
        user_rounds = db.query(Round).filter(
            text(f"assigned_to_ids @> '[{user_id}]'::jsonb")
        ).offset(skip).limit(limit).all()
        
        print(f"🎯 Found {len(user_rounds)} rounds assigned to user ID {user_id}")
        
        return user_rounds
        
    except Exception as e:
        print(f"❌ Error in get_rounds_by_user: {e}")
        import traceback
        traceback.print_exc()
        return []
    
    # تحديث الحالة تلقائياً لكل جولة
    # Use package-relative import to avoid "No module named 'utils'" when running from backend package
    try:
        from backend.utils.status_calculator import calculate_round_status
    except Exception:
        # Fallback to relative import for tests or different launch contexts
        from utils.status_calculator import calculate_round_status
    
    updated_count = 0
    for round in user_rounds:
        # حساب الحالة الجديدة
        calculated_status = calculate_round_status(
            round.scheduled_date,
            round.deadline,
            round.end_date,
            round.completion_percentage or 0,
            round.status
        )
        
        # تحديث فقط إذا تغيرت الحالة
        if round.status != calculated_status:
            old_status = round.status
            round.status = calculated_status
            updated_count += 1
            print(f"  🔄 Updated round {round.id} status: {old_status} → {calculated_status}")
        
        print(f"  ✓ Round {round.id}: {round.title} - Status: {round.status} - assigned_to_ids: {round.assigned_to_ids}")
    
    # حفظ التغييرات إذا كانت هناك تحديثات
    if updated_count > 0:
        try:
            db.commit()
            print(f"✅ Updated {updated_count} round statuses")
        except Exception as e:
            db.rollback()
            print(f"⚠️ Error updating round statuses: {e}")
    
    return user_rounds

# CAPA CRUD operations
def get_department_managers(db: Session, department_name: str):
    """Get department managers by department name"""
    try:
        department = db.query(Department).filter(Department.name == department_name).first()
        if not department or not department.managers:
            return []
        
        # Parse managers JSON string to get user IDs
        import json
        manager_ids = json.loads(department.managers) if isinstance(department.managers, str) else department.managers
        
        # Get user names for these IDs
        managers = []
        for user_id in manager_ids:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                full_name = f"{user.first_name} {user.last_name}".strip()
                managers.append(f"{full_name} ({user.username})")
        
        return managers
    except Exception as e:
        print(f"Error getting department managers: {e}")
        return []

def get_department_manager_ids(db: Session, department_name: str):
    """Get department manager user IDs by department name"""
    try:
        department = db.query(Department).filter(Department.name == department_name).first()
        if not department or not department.managers:
            return []
        
        # Parse managers JSON string to get user IDs
        import json
        manager_ids = json.loads(department.managers) if isinstance(department.managers, str) else department.managers
        
        # Validate that all manager IDs exist in the users table
        valid_manager_ids = []
        for manager_id in manager_ids:
            user = db.query(User).filter(User.id == manager_id).first()
            if user:
                valid_manager_ids.append(manager_id)
            else:
                print(f"⚠️ Warning: Manager ID {manager_id} for department '{department_name}' does not exist in users table, skipping")
        
        return valid_manager_ids
    except Exception as e:
        print(f"Error getting department manager IDs: {e}")
        return []

def create_capa(db: Session, capa_data: dict, created_by_id: int):
    # Accept either a dict or a Pydantic model (CapaCreate). Normalize to dict.
    if hasattr(capa_data, 'dict') and callable(getattr(capa_data, 'dict')):
        try:
            capa_data = capa_data.dict()
        except Exception:
            # Pydantic v2 uses model_dump
            capa_data = capa_data.model_dump()

    # Set default values for all removed fields
    department = capa_data.get("department", "عام")  # Use provided department or default
    priority = "medium"  # Default priority
    assigned_to = "لم يتم تعيين مسؤول"  # Default assignment
    assigned_to_id = capa_data.get("assigned_to_id")
    risk_score = None
    evaluation_item_id = capa_data.get('evaluation_item_id') if capa_data.get('evaluation_item_id') is not None else None  # Link to evaluation item if provided
    
    # Set default target date to 30 days from now unless provided
    from datetime import datetime, timedelta
    if capa_data.get('target_date'):
        target_date = capa_data.get('target_date')
        # ensure datetime if string provided
        if isinstance(target_date, str):
            try:
                # Avoid optional dependency on python-dateutil; use fromisoformat as fallback
                try:
                    target_date = datetime.fromisoformat(target_date)
                except Exception:
                    from datetime import datetime as _dt, timedelta as _td
                    target_date = _dt.now() + _td(days=30)
            except Exception:
                from datetime import datetime as _dt, timedelta as _td
                target_date = _dt.now() + _td(days=30)
    else:
        target_date = datetime.now() + timedelta(days=30)
    
    from models_updated import CapaStatus, VerificationStatus

    # Normalize verification_status input if provided (store lowercase to match DB check)
    input_ver_status = capa_data.get('verification_status')
    if input_ver_status:
        try:
            ver_status_norm = str(input_ver_status).lower()
        except Exception:
            ver_status_norm = str(VerificationStatus.PENDING.value).lower()
    else:
        ver_status_norm = str(VerificationStatus.PENDING.value).lower()

    db_capa = Capa(
        title=capa_data["title"],
        description=capa_data["description"],
        round_id=capa_data.get("round_id"),
        department=department,
        priority=priority,
        status=CapaStatus.PENDING.value,  # Use enum value (matches DB constraint)
        assigned_to=assigned_to,
        assigned_to_id=assigned_to_id,
        evaluation_item_id=evaluation_item_id,
        target_date=target_date,
        risk_score=risk_score,
        created_by_id=created_by_id,
        # New CAPA improvement fields
        root_cause=capa_data.get("root_cause"),
        corrective_actions=json.dumps(capa_data.get("corrective_actions", []), ensure_ascii=False) if not isinstance(capa_data.get("corrective_actions", []), str) else capa_data.get("corrective_actions", "[]"),
        preventive_actions=json.dumps(capa_data.get("preventive_actions", []), ensure_ascii=False) if not isinstance(capa_data.get("preventive_actions", []), str) else capa_data.get("preventive_actions", "[]"),
        verification_steps=json.dumps(capa_data.get("verification_steps", []), ensure_ascii=False) if not isinstance(capa_data.get("verification_steps", []), str) else capa_data.get("verification_steps", "[]"),
        verification_status=ver_status_norm,
        severity=capa_data.get("severity", 3),
        estimated_cost=capa_data.get("estimated_cost"),
        status_history="[]",
        sla_days=capa_data.get("sla_days", 14),
        escalation_level=0
    )
    db.add(db_capa)
    db.commit()
    db.refresh(db_capa)
    
    # Write-through: Add actions to capa_actions table
    try:
        from models_updated import CapaAction
        
        # Process corrective actions
        corrective_actions = capa_data.get("corrective_actions", [])
        if isinstance(corrective_actions, str):
            corrective_actions = json.loads(corrective_actions) if corrective_actions and corrective_actions != '[]' else []
        
        for action in corrective_actions:
            if isinstance(action, dict) and action.get('task'):
                db_action = CapaAction(
                    capa_id=db_capa.id,
                    action_type='corrective',
                    task=action.get('task'),
                    due_date=action.get('due_date'),
                    assigned_to=action.get('assigned_to'),
                    assigned_to_id=action.get('assigned_to_id'),
                    notes=action.get('notes'),
                    status=action.get('status', 'open'),
                    completed_at=action.get('completed_at'),
                    required=True
                )
                db.add(db_action)
        
        # Process preventive actions
        preventive_actions = capa_data.get("preventive_actions", [])
        if isinstance(preventive_actions, str):
            preventive_actions = json.loads(preventive_actions) if preventive_actions and preventive_actions != '[]' else []
        
        for action in preventive_actions:
            if isinstance(action, dict) and action.get('task'):
                db_action = CapaAction(
                    capa_id=db_capa.id,
                    action_type='preventive',
                    task=action.get('task'),
                    due_date=action.get('due_date'),
                    assigned_to=action.get('assigned_to'),
                    assigned_to_id=action.get('assigned_to_id'),
                    notes=action.get('notes'),
                    status=action.get('status', 'open'),
                    completed_at=action.get('completed_at'),
                    required=True
                )
                db.add(db_action)
        
        # Process verification steps
        verification_steps = capa_data.get("verification_steps", [])
        if isinstance(verification_steps, str):
            verification_steps = json.loads(verification_steps) if verification_steps and verification_steps != '[]' else []
        
        for step in verification_steps:
            if isinstance(step, dict) and step.get('step'):
                db_action = CapaAction(
                    capa_id=db_capa.id,
                    action_type='verification',
                    task=step.get('step'),
                    notes=step.get('notes'),
                    status='completed' if step.get('completed') else 'open',
                    completed_at=step.get('completed_at'),
                    completed_by_id=step.get('completed_by_id'),
                    required=step.get('required', True)
                )
                db.add(db_action)
        
        db.commit()
        print(f"✅ Added actions to capa_actions table for CAPA {db_capa.id}")
    except Exception as e:
        print(f"⚠️ Failed to add actions to capa_actions table: {e}")
    
    # Send notifications to department managers
    try:
        from notification_service import get_notification_service
        from crud import get_user_by_id
        
        # Get creator name for notification
        creator = get_user_by_id(db, created_by_id)
        created_by_name = f"{creator.first_name} {creator.last_name}" if creator else "مستخدم غير معروف"
        
        # Get department managers user IDs for notifications
        manager_ids = get_department_manager_ids(db, department)
        
        if manager_ids:
            # Send notification to each manager
            notification_service = get_notification_service(db)
            for manager_id in manager_ids:
                notification_service.send_capa_assignment_notification(
                    capa_id=db_capa.id,
                    capa_title=db_capa.title,
                    capa_department=db_capa.department,
                    assigned_user_id=manager_id,
                    created_by_name=created_by_name
                )
                print(f"📧 Sent CAPA notification to manager ID: {manager_id}")
        else:
            print(f"⚠️ No managers found for department: {department}")
        
    except Exception as e:
        print(f"⚠️ Failed to send CAPA notifications: {e}")
    
    # Create an audit log entry for CAPA creation
    try:
        create_audit_log(db, {
            "user_id": created_by_id,
            "action": "create_capa",
            "entity_type": "capa",
            "entity_id": db_capa.id,
            "new_values": json.dumps({"title": db_capa.title, "department": db_capa.department}, ensure_ascii=False)
        })
    except Exception as e:
        print(f"⚠️ Warning: failed to create audit log for CAPA: {e}")

    return db_capa

def get_capas(db: Session, skip: int = 0, limit: int = 100):
    """Get CAPAs filtered to show only those linked to non-compliant evaluation items"""
    if not EVALUATION_MODELS_AVAILABLE:
        # Fallback: return all CAPAs if evaluation models not available
        return db.query(Capa).options(
            joinedload(Capa.assigned_manager),
            joinedload(Capa.creator)
        ).offset(skip).limit(limit).all()
    
    try:
        from models_updated import EvaluationResult, EvaluationItem
        
        # Get CAPAs that are linked to evaluation items with low scores (non-compliant)
        # This includes CAPAs with evaluation_item_id that corresponds to items with score < 70
        capas_query = db.query(Capa).options(
            joinedload(Capa.assigned_manager),
            joinedload(Capa.creator)
        )
        
        # Filter CAPAs that have evaluation_item_id and are linked to non-compliant results
        filtered_capas = []
        all_capas = capas_query.offset(skip).limit(limit).all()
        
        for capa in all_capas:
            should_include = False
            
            # If CAPA has no evaluation_item_id, it's a manual CAPA - exclude it
            if not capa.evaluation_item_id:
                continue
            
            # Check if this CAPA is linked to a non-compliant evaluation result
            if capa.evaluation_item_id:
                # Find evaluation results for this item that are non-compliant (score < 70)
                non_compliant_results = db.query(EvaluationResult).filter(
                    EvaluationResult.item_id == capa.evaluation_item_id,
                    EvaluationResult.score < 70  # Non-compliant threshold
                ).first()
                
                if non_compliant_results:
                    should_include = True
            
            if should_include:
                filtered_capas.append(capa)
        
        return filtered_capas
        
    except Exception as e:
        print(f"Error filtering CAPAs by evaluation results: {e}")
        # Fallback: return all CAPAs on error
        return db.query(Capa).options(
            joinedload(Capa.assigned_manager),
            joinedload(Capa.creator)
        ).offset(skip).limit(limit).all()

def get_all_capas_unfiltered(db: Session, skip: int = 0, limit: int = 100):
    """Get all CAPAs without filtering - for admin purposes"""
    return db.query(Capa).options(
        joinedload(Capa.assigned_manager),
        joinedload(Capa.creator)
    ).offset(skip).limit(limit).all()

def get_capa_by_id(db: Session, capa_id: int):
    """Get a CAPA by ID with evaluation item details and actions from capa_actions table"""
    capa = db.query(Capa).options(
        joinedload(Capa.assigned_manager),
        joinedload(Capa.creator)
    ).filter(Capa.id == capa_id).first()
    
    if not capa:
        return None
    
    # Add evaluation item details if available
    if capa.evaluation_item_id and EVALUATION_MODELS_AVAILABLE:
        try:
            from models_updated import EvaluationItem
            evaluation_item = db.query(EvaluationItem).filter(EvaluationItem.id == capa.evaluation_item_id).first()
            if evaluation_item:
                # Add evaluation item details to the capa object
                capa.evaluation_item_title = evaluation_item.title
                capa.evaluation_item_code = evaluation_item.code
                capa.evaluation_item_category = evaluation_item.category_name
            else:
                capa.evaluation_item_title = None
                capa.evaluation_item_code = None
                capa.evaluation_item_category = None
        except Exception as e:
            print(f"Error loading evaluation item details: {e}")
            capa.evaluation_item_title = None
            capa.evaluation_item_code = None
            capa.evaluation_item_category = None
    else:
        capa.evaluation_item_title = None
        capa.evaluation_item_code = None
        capa.evaluation_item_category = None
    
    # Load actions from capa_actions table (preferred over JSON)
    try:
        from models_updated import CapaAction
        actions = db.query(CapaAction).filter(CapaAction.capa_id == capa_id).all()
        
        # Group actions by type
        corrective = []
        preventive = []
        verification = []
        
        for action in actions:
            action_dict = {
                'id': action.id,
                'task': action.task,
                'due_date': action.due_date.isoformat() if action.due_date else None,
                'assigned_to': action.assigned_to,
                'assigned_to_id': action.assigned_to_id,
                'notes': action.notes,
                'status': action.status,
                'completed_at': action.completed_at.isoformat() if action.completed_at else None,
                'completed_by_id': action.completed_by_id
            }
            
            if action.action_type == 'corrective':
                corrective.append(action_dict)
            elif action.action_type == 'preventive':
                preventive.append(action_dict)
            elif action.action_type == 'verification':
                action_dict['step'] = action.task  # For compatibility
                action_dict['required'] = action.required
                action_dict['completed'] = action.status == 'completed'
                verification.append(action_dict)
        
        # Override JSON fields with table data if actions found
        if corrective or preventive or verification:
            capa.corrective_actions_from_table = corrective
            capa.preventive_actions_from_table = preventive
            capa.verification_steps_from_table = verification
        
    except Exception as e:
        print(f"⚠️ Error loading actions from capa_actions table: {e}")
    
    return capa

def get_capas_by_department(db: Session, department: str):
    return db.query(Capa).filter(Capa.department == department).all()

def get_capas_by_status(db: Session, status: str):
    return db.query(Capa).filter(Capa.status == status).all()

def update_capa(db: Session, capa_id: int, capa_data: dict, performed_by_id: Optional[int] = None):
    """Update a CAPA by ID"""
    db_capa = db.query(Capa).filter(Capa.id == capa_id).first()
    if not db_capa:
        return None
    # Capture old values for auditing
    old_values = {
        'status': db_capa.status,
        'verification_status': getattr(db_capa, 'verification_status', None)
    }

    # Update basic fields if provided
    if 'title' in capa_data and capa_data['title'] is not None:
        db_capa.title = capa_data['title']
    if 'description' in capa_data and capa_data['description'] is not None:
        db_capa.description = capa_data['description']
    if 'priority' in capa_data and capa_data['priority'] is not None:
        db_capa.priority = capa_data['priority']
    if 'target_date' in capa_data and capa_data['target_date'] is not None:
        db_capa.target_date = capa_data['target_date']
    if 'assigned_to' in capa_data and capa_data['assigned_to'] is not None:
        db_capa.assigned_to = capa_data['assigned_to']
    if 'assigned_to_id' in capa_data and capa_data['assigned_to_id'] is not None:
        db_capa.assigned_to_id = capa_data['assigned_to_id']
    if 'status' in capa_data and capa_data['status'] is not None:
        db_capa.status = capa_data['status']
    
    # Update new CAPA improvement fields
    if 'root_cause' in capa_data and capa_data['root_cause'] is not None:
        db_capa.root_cause = capa_data['root_cause']
    if 'corrective_actions' in capa_data and capa_data['corrective_actions'] is not None:
        db_capa.corrective_actions = json.dumps(capa_data['corrective_actions'], ensure_ascii=False) if not isinstance(capa_data['corrective_actions'], str) else capa_data['corrective_actions']
    if 'preventive_actions' in capa_data and capa_data['preventive_actions'] is not None:
        db_capa.preventive_actions = json.dumps(capa_data['preventive_actions'], ensure_ascii=False) if not isinstance(capa_data['preventive_actions'], str) else capa_data['preventive_actions']
    if 'verification_steps' in capa_data and capa_data['verification_steps'] is not None:
        db_capa.verification_steps = json.dumps(capa_data['verification_steps'], ensure_ascii=False) if not isinstance(capa_data['verification_steps'], str) else capa_data['verification_steps']
    if 'verification_status' in capa_data and capa_data['verification_status'] is not None:
        db_capa.verification_status = capa_data['verification_status']
    if 'severity' in capa_data and capa_data['severity'] is not None:
        db_capa.severity = capa_data['severity']
    if 'estimated_cost' in capa_data and capa_data['estimated_cost'] is not None:
        db_capa.estimated_cost = capa_data['estimated_cost']
    if 'sla_days' in capa_data and capa_data['sla_days'] is not None:
        db_capa.sla_days = capa_data['sla_days']
    if 'escalation_level' in capa_data and capa_data['escalation_level'] is not None:
        db_capa.escalation_level = capa_data['escalation_level']
    if 'closed_at' in capa_data and capa_data['closed_at'] is not None:
        db_capa.closed_at = capa_data['closed_at']
    if 'verified_at' in capa_data and capa_data['verified_at'] is not None:
        db_capa.verified_at = capa_data['verified_at']
    if 'status_history' in capa_data and capa_data['status_history'] is not None:
        db_capa.status_history = capa_data['status_history']
    
    db.commit()
    
    # Write-through: Update actions in capa_actions table
    try:
        from models_updated import CapaAction
        
        # Delete existing actions for this CAPA
        db.query(CapaAction).filter(CapaAction.capa_id == capa_id).delete()
        
        # Re-add actions from updated data
        # Process corrective actions
        if 'corrective_actions' in capa_data and capa_data['corrective_actions'] is not None:
            corrective_actions = capa_data['corrective_actions']
            if isinstance(corrective_actions, str):
                corrective_actions = json.loads(corrective_actions) if corrective_actions and corrective_actions != '[]' else []
            
            for action in corrective_actions:
                if isinstance(action, dict) and action.get('task'):
                    db_action = CapaAction(
                        capa_id=capa_id,
                        action_type='corrective',
                        task=action.get('task'),
                        due_date=action.get('due_date'),
                        assigned_to=action.get('assigned_to'),
                        assigned_to_id=action.get('assigned_to_id'),
                        notes=action.get('notes'),
                        status=action.get('status', 'open'),
                        completed_at=action.get('completed_at'),
                        required=True
                    )
                    db.add(db_action)
        
        # Process preventive actions
        if 'preventive_actions' in capa_data and capa_data['preventive_actions'] is not None:
            preventive_actions = capa_data['preventive_actions']
            if isinstance(preventive_actions, str):
                preventive_actions = json.loads(preventive_actions) if preventive_actions and preventive_actions != '[]' else []
            
            for action in preventive_actions:
                if isinstance(action, dict) and action.get('task'):
                    db_action = CapaAction(
                        capa_id=capa_id,
                        action_type='preventive',
                        task=action.get('task'),
                        due_date=action.get('due_date'),
                        assigned_to=action.get('assigned_to'),
                        assigned_to_id=action.get('assigned_to_id'),
                        notes=action.get('notes'),
                        status=action.get('status', 'open'),
                        completed_at=action.get('completed_at'),
                        required=True
                    )
                    db.add(db_action)
        
        # Process verification steps
        if 'verification_steps' in capa_data and capa_data['verification_steps'] is not None:
            verification_steps = capa_data['verification_steps']
            if isinstance(verification_steps, str):
                verification_steps = json.loads(verification_steps) if verification_steps and verification_steps != '[]' else []
            
            for step in verification_steps:
                if isinstance(step, dict) and step.get('step'):
                    db_action = CapaAction(
                        capa_id=capa_id,
                        action_type='verification',
                        task=step.get('step'),
                        notes=step.get('notes'),
                        status='completed' if step.get('completed') else 'open',
                        completed_at=step.get('completed_at'),
                        completed_by_id=step.get('completed_by_id'),
                        required=step.get('required', True)
                    )
                    db.add(db_action)
        
        db.commit()
        print(f"✅ Updated actions in capa_actions table for CAPA {capa_id}")
    except Exception as e:
        print(f"⚠️ Failed to update actions in capa_actions table: {e}")
    
    db.refresh(db_capa)

    # Create audit log entry if caller provided a user id
    try:
        if performed_by_id is not None:
            create_audit_log(db, {
                'user_id': performed_by_id,
                'action': 'update_capa',
                'entity_type': 'capa',
                'entity_id': capa_id,
                'old_values': json.dumps(old_values, ensure_ascii=False),
                'new_values': json.dumps({'status': db_capa.status, 'verification_status': getattr(db_capa, 'verification_status', None)}, ensure_ascii=False)
            })
    except Exception as e:
        print(f"⚠️ Warning: failed to create audit log in update_capa: {e}")

    # Send notifications to department managers on key status changes
    try:
        # Only notify when status transitioned to IMPLEMENTED or VERIFIED
        new_status = getattr(db_capa, 'status', '')
        notify_on = ['IMPLEMENTED', 'VERIFIED']
        if new_status in notify_on:
            try:
                from notification_service import get_notification_service
                # Creator name
                creator = get_user_by_id(db, performed_by_id) if performed_by_id else None
                created_by_name = f"{creator.first_name} {creator.last_name}" if creator else 'نظام'
                manager_ids = get_department_manager_ids(db, db_capa.department)
                if manager_ids:
                    notification_service = get_notification_service(db)
                    # Try the service helper first
                    try:
                        sent_count = notification_service.send_capa_assignment_notification(
                            capa_id=db_capa.id,
                            capa_title=db_capa.title,
                            capa_department=db_capa.department,
                            assigned_user_id=manager_ids[0],
                            created_by_name=created_by_name
                        )
                    except Exception as ne:
                        print(f"⚠️ Warning: notification service failed: {ne}")
                        sent_count = 0

                    # If service didn't create notifications (or returned 0), fallback to direct creation
                    if not sent_count:
                        for manager_id in manager_ids:
                            try:
                                create_notification(db, {
                                    'user_id': manager_id,
                                    'title': f'خطة تصحيحية محدثة: {db_capa.title}',
                                    'message': f'حالة الخطة التصحيحية "{db_capa.title}" تغيرت إلى {db_capa.status} من قبل {created_by_name}',
                                    'notification_type': 'capa_assigned',
                                    'entity_type': 'CAPA',
                                    'entity_id': db_capa.id
                                })
                            except Exception as ne:
                                print(f"⚠️ Warning: failed to create fallback notification for {manager_id}: {ne}")
            except Exception as ne:
                print(f"⚠️ Warning: notification flow failed: {ne}")
    except Exception:
        pass

    return db_capa

def delete_capa(db: Session, capa_id: int):
    """Delete a CAPA by ID"""
    db_capa = db.query(Capa).filter(Capa.id == capa_id).first()
    if not db_capa:
        return None
    
    db.delete(db_capa)
    db.commit()
    return db_capa

def delete_all_capas(db: Session):
    """Delete all CAPA records"""
    try:
        # Get count before deletion
        count = db.query(Capa).count()
        
        # Delete all CAPAs
        db.query(Capa).delete()
        db.commit()
        
        return count
    except Exception as e:
        db.rollback()
        raise e

# Dashboard statistics
def get_dashboard_stats(db: Session):
    total_rounds = db.query(Round).count()
    completed_rounds = db.query(Round).filter(Round.status == "completed").count()
    pending_rounds = db.query(Round).filter(Round.status.in_(["scheduled", "in_progress"])).count()
    overdue_rounds = db.query(Round).filter(Round.status == "overdue").count()
    
    # Calculate average compliance
    rounds_with_compliance = db.query(Round).filter(Round.compliance_percentage > 0).all()
    average_compliance = 0
    if rounds_with_compliance:
        total_compliance = sum(round.compliance_percentage for round in rounds_with_compliance)
        average_compliance = total_compliance / len(rounds_with_compliance)
    
    total_capa = db.query(Capa).count()
    open_capa = db.query(Capa).filter(Capa.status.in_(["pending", "assigned", "in_progress"])).count()
    closed_capa = db.query(Capa).filter(Capa.status.in_(["implemented", "verified", "closed"])).count()
    overdue_capa = db.query(Capa).filter(Capa.status == "overdue").count()
    
    return {
        "total_rounds": total_rounds,
        "completed_rounds": completed_rounds,
        "pending_rounds": pending_rounds,
        "overdue_rounds": overdue_rounds,
        "average_compliance": round(average_compliance, 2),
        "total_capa": total_capa,
        "open_capa": open_capa,
        "closed_capa": closed_capa,
        "overdue_capa": overdue_capa
    }

# Department CRUD operations
def create_department(db: Session, department: DepartmentCreate):
    # Generate unique department code
    existing_codes = [dept.code for dept in db.query(Department).all()]
    counter = 1
    code = f"DEPT-{counter:03d}"
    
    while code in existing_codes:
        counter += 1
        code = f"DEPT-{counter:03d}"
    
    # Convert managers list to JSON string
    managers_json = json.dumps(department.managers) if department.managers else None
    
    db_department = Department(
        name=department.name,
        name_en=department.name_en,
        code=code,
        floor=department.floor,
        building=department.building,
        managers=managers_json
    )
    db.add(db_department)
    db.commit()
    db.refresh(db_department)
    return convert_department_for_response(db_department)

def get_departments(db: Session, skip: int = 0, limit: int = 100):
    departments = db.query(Department).offset(skip).limit(limit).all()
    return [convert_department_for_response(dept) for dept in departments]

def get_department_by_id(db: Session, department_id: int):
    department = db.query(Department).filter(Department.id == department_id).first()
    return convert_department_for_response(department) if department else None

def convert_department_for_response(department: Department):
    """Convert database department object to response format with parsed managers"""
    if not department:
        return None
    
    # Parse managers from JSON string to list
    managers = []
    if department.managers:
        try:
            managers = json.loads(department.managers)
        except (json.JSONDecodeError, TypeError):
            managers = []
    
    # Create a dict with all department attributes
    dept_dict = {
        'id': department.id,
        'name': department.name,
        'name_en': department.name_en,
        'code': department.code,
        'floor': department.floor,
        'building': department.building,
        'description': getattr(department, 'description', None),
        'managers': managers,
        'is_active': department.is_active,
        'created_at': department.created_at,
        'updated_at': getattr(department, 'updated_at', None)
    }
    
    return dept_dict

def get_department_by_code(db: Session, code: str):
    return db.query(Department).filter(Department.code == code).first()

def update_department(db: Session, department_id: int, department: DepartmentCreate):
    db_department = db.query(Department).filter(Department.id == department_id).first()
    if db_department:
        db_department.name = department.name
        db_department.name_en = department.name_en
        db_department.floor = department.floor
        db_department.building = department.building
        # Convert managers list to JSON string
        managers_json = json.dumps(department.managers) if department.managers else None
        db_department.managers = managers_json
        db.commit()
        db.refresh(db_department)
        return convert_department_for_response(db_department)
    return None

def delete_department(db: Session, department_id: int):
    db_department = db.query(Department).filter(Department.id == department_id).first()
    if db_department:
        db.delete(db_department)
        db.commit()
    return db_department

# Evaluation Categories CRUD operations
def create_evaluation_category(db: Session, category_data: dict):
    if not EVALUATION_MODELS_AVAILABLE:
        return None
    
    db_category = EvaluationCategory(
        name=category_data["name"],
        name_en=category_data.get("name_en"),
        description=category_data.get("description"),
        color=category_data.get("color", "blue"),
        icon=category_data.get("icon", "shield")
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def get_evaluation_categories(db: Session, skip: int = 0, limit: int = 100):
    if not EVALUATION_MODELS_AVAILABLE:
        return []
    return db.query(EvaluationCategory).filter(EvaluationCategory.is_active == True).offset(skip).limit(limit).all()

def get_evaluation_category_by_id(db: Session, category_id: int):
    if not EVALUATION_MODELS_AVAILABLE:
        return None
    return db.query(EvaluationCategory).filter(EvaluationCategory.id == category_id).first()

def update_evaluation_category(db: Session, category_id: int, category_data: dict):
    if not EVALUATION_MODELS_AVAILABLE:
        return None
    
    db_category = db.query(EvaluationCategory).filter(EvaluationCategory.id == category_id).first()
    if db_category:
        for key, value in category_data.items():
            if hasattr(db_category, key):
                setattr(db_category, key, value)
        db.commit()
        db.refresh(db_category)
    return db_category

def delete_evaluation_category(db: Session, category_id: int):
    if not EVALUATION_MODELS_AVAILABLE:
        return None
    
    db_category = db.query(EvaluationCategory).filter(EvaluationCategory.id == category_id).first()
    if db_category:
        # Soft delete - set is_active to False
        db_category.is_active = False
        db.commit()
        db.refresh(db_category)
    return db_category

# Evaluation Items CRUD operations
def create_evaluation_item(db: Session, item_data: dict):
    if not EVALUATION_MODELS_AVAILABLE:
        return None
    
    # Get category info
    category = get_evaluation_category_by_id(db, item_data["category_id"])
    if not category:
        return None
    
    db_item = EvaluationItem(
        code=item_data["code"],
        title=item_data["title"],
        title_en=item_data.get("title_en"),
        description=item_data.get("description"),
        objective=item_data.get("objective"),
        category_id=item_data["category_id"],
        category_name=category.name,
        category_color=category.color,
        is_required=item_data.get("is_required", False),
        weight=item_data.get("weight", 1),
        risk_level=item_data.get("risk_level", "MINOR"),
        evidence_type=item_data.get("evidence_type", "OBSERVATION"),
        guidance_ar=item_data.get("guidance_ar"),
        guidance_en=item_data.get("guidance_en"),
        standard_version=item_data.get("standard_version")
    )
    db.add(db_item)
    db.flush() # Flush to get db_item.id
    
    # Create initial mapping for the M:N relationship source of truth
    from models_updated import EvaluationCategoryMapping
    mapping = EvaluationCategoryMapping(
        category_id=item_data["category_id"],
        item_id=db_item.id,
        sort_order=0,
        is_active=True
    )
    db.add(mapping)
    
    db.commit()
    db.refresh(db_item)
    return db_item


# Category-Item Mapping CRUD operations
def assign_items_to_category(db: Session, category_id: int, item_ids: list[int]):
    """Assign multiple items to a category"""
    if not EVALUATION_MODELS_AVAILABLE:
        return 0
    
    from models_updated import EvaluationCategoryMapping
    
    added_count = 0
    for item_id in item_ids:
        # Check if mapping already exists
        existing = db.query(EvaluationCategoryMapping).filter(
            EvaluationCategoryMapping.category_id == category_id,
            EvaluationCategoryMapping.item_id == item_id
        ).first()
        
        if not existing:
            # Get max sort order to append at end
            max_sort = db.query(func.max(EvaluationCategoryMapping.sort_order)).filter(
                EvaluationCategoryMapping.category_id == category_id
            ).scalar() or 0
            
            mapping = EvaluationCategoryMapping(
                category_id=category_id,
                item_id=item_id,
                sort_order=max_sort + 1,
                is_active=True
            )
            db.add(mapping)
            added_count += 1
            
    db.commit()
    return added_count

def unassign_items_from_category(db: Session, category_id: int, item_ids: list[int]):
    """Remove multiple items from a category"""
    if not EVALUATION_MODELS_AVAILABLE:
        return 0
        
    from models_updated import EvaluationCategoryMapping
    
    deleted = db.query(EvaluationCategoryMapping).filter(
        EvaluationCategoryMapping.category_id == category_id,
        EvaluationCategoryMapping.item_id.in_(item_ids)
    ).delete(synchronize_session=False)
    
    db.commit()
    return deleted

def reorder_category_items(db: Session, category_id: int, ordered_item_ids: list[int]):
    """Update sort order for items in a category"""
    if not EVALUATION_MODELS_AVAILABLE:
        return
        
    from models_updated import EvaluationCategoryMapping
    
    # Update sort_order based on index in the list
    for index, item_id in enumerate(ordered_item_ids):
        db.query(EvaluationCategoryMapping).filter(
            EvaluationCategoryMapping.category_id == category_id,
            EvaluationCategoryMapping.item_id == item_id
        ).update({"sort_order": index})
        
    db.commit()

def get_items_by_category_ordered(db: Session, category_id: int):
    """Get items for a category ordered by sort_order"""
    if not EVALUATION_MODELS_AVAILABLE:
        return []
        
    from models_updated import EvaluationCategoryMapping, EvaluationItem
    
    # Join items with mapping and order by mapping.sort_order
    results = db.query(EvaluationItem).join(
        EvaluationCategoryMapping,
        EvaluationItem.id == EvaluationCategoryMapping.item_id
    ).filter(
        EvaluationCategoryMapping.category_id == category_id,
        EvaluationCategoryMapping.is_active == True,
        EvaluationItem.is_active == True
    ).order_by(EvaluationCategoryMapping.sort_order).all()
    
    return results

def get_evaluation_items_by_category(db: Session, category_id: int, skip: int = 0, limit: int = 100):
    if not EVALUATION_MODELS_AVAILABLE:
        return []
    
    # Use the new mapping logic if available, otherwise fallback
    try:
        from models_updated import EvaluationCategoryMapping
        return get_items_by_category_ordered(db, category_id)
    except Exception:
        # Fallback to old logic
        return db.query(EvaluationItem).filter(
            EvaluationItem.category_id == category_id,
            EvaluationItem.is_active == True
        ).offset(skip).limit(limit).all()

def get_evaluation_items(db: Session, skip: int = 0, limit: int = 100):
    if not EVALUATION_MODELS_AVAILABLE:
        return []
    return db.query(EvaluationItem).options(joinedload(EvaluationItem.category_mappings)).filter(EvaluationItem.is_active == True).offset(skip).limit(limit).all()

def get_evaluation_item_by_id(db: Session, item_id: int):
    if not EVALUATION_MODELS_AVAILABLE:
        return None
    return db.query(EvaluationItem).filter(EvaluationItem.id == item_id).first()

def update_evaluation_item(db: Session, item_id: int, item_data: dict):
    if not EVALUATION_MODELS_AVAILABLE:
        return None
    
    db_item = db.query(EvaluationItem).filter(EvaluationItem.id == item_id).first()
    if db_item:
        # Update category info if category_id changed
        if "category_id" in item_data and item_data["category_id"] != db_item.category_id:
            category = get_evaluation_category_by_id(db, item_data["category_id"])
            if category:
                item_data["category_name"] = category.name
                item_data["category_color"] = category.color
        
        for key, value in item_data.items():
            if hasattr(db_item, key):
                setattr(db_item, key, value)
        db.commit()
        db.refresh(db_item)
    return db_item

def delete_evaluation_item(db: Session, item_id: int):
    if not EVALUATION_MODELS_AVAILABLE:
        return None
    
    db_item = db.query(EvaluationItem).filter(EvaluationItem.id == item_id).first()
    if db_item:
        # Soft delete - set is_active to False
        db_item.is_active = False
        db.commit()
        db.refresh(db_item)
    return db_item

# Get users with assessor role
def get_assessors(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).filter(
        User.role == "assessor",
        User.is_active == True
    ).offset(skip).limit(limit).all()


# Create multiple evaluation results for a round
def create_evaluation_results(db: Session, round_id: int, evaluations: list, evaluator_id: int, finalize: bool = False):
    """Persist evaluation results and update round compliance percentage using weighted average.

    Evaluations: list of { item_id, status, comments?, evidence_files? }
    Status -> score mapping: applied=100, partial=50, not_applied=0, na -> excluded from calculation
    Weighting: uses EvaluationItem.weight for weighted average. NA entries excluded.
    Updates Round.compliance_percentage to weighted average (0-100) and sets status to IN_PROGRESS.
    Also calculates completion_percentage based on how many items have been evaluated.
    """
    if not EVALUATION_MODELS_AVAILABLE:
        return [], None

    from models_updated import EvaluationItem, EvaluationResult, Round, RoundStatus, EvaluationCategory
    created_results = []

    # Scoring breakdown data structures
    category_scores = {}  # {cat_id: {'weighted_sum': 0, 'max_weighted_sum': 0}}
    item_cache = {}

    for ev in evaluations:
        item_id = ev.get('item_id')
        status = ev.get('status')
        comments = ev.get('comments') or (status if status else '')
        evidence = ev.get('evidence_files')

        # Map status to numeric score
        if status == 'applied':
            score = 100
            include_in_calc = True
        elif status == 'partial':
            score = 50
            include_in_calc = True
        elif status == 'not_applied':
            score = 0
            include_in_calc = True
        else:
            # 'na' or unknown statuses -> exclude from compliance calculation
            score = 0
            include_in_calc = False

        # Get item
        item = db.query(EvaluationItem).filter(EvaluationItem.id == item_id).first()
        if not item:
            continue
            
        weight = float(item.weight) if item and getattr(item, 'weight', None) is not None else 1.0
        
        # Track category scores
        if include_in_calc:
            cat_id = item.category_id
            if cat_id not in category_scores:
                category_scores[cat_id] = {'weighted_sum': 0, 'max_weighted_sum': 0}
            
            category_scores[cat_id]['weighted_sum'] += (score * weight)
            # Max possible score for this item is 100 * weight
            category_scores[cat_id]['max_weighted_sum'] += (100.0 * weight)

        # Insert evaluation result (score is required by schema)
        db_result = EvaluationResult(
            round_id=round_id,
            item_id=item_id,
            score=int(score),
            comments=comments,
            evidence_files=json.dumps(evidence) if evidence else None,
            evaluated_by=evaluator_id
        )
        # If evaluator provided a flag/note for CAPA, store it on the evaluation result
        try:
            if isinstance(ev, dict) and ev.get('mark_needs_capa'):
                db_result.needs_capa = True
                db_result.capa_note = ev.get('capa_note') or comments
        except Exception:
            pass
        db.add(db_result)
        created_results.append(db_result)
        
    db.commit()

    # Calculate final weighted score
    final_score = 0.0
    total_cat_weight = 0.0
    score_details = []

    # Get all categories involved or all active categories
    # For accuracy, we should check against active categories' weights
    # But here we only count categories that were actually evaluated or present
   
    for cat_id, stats in category_scores.items():
        cat = db.query(EvaluationCategory).filter(EvaluationCategory.id == cat_id).first()
        if not cat: 
            continue
            
        cat_weight_percent = float(getattr(cat, 'weight_percent', 10.0))
        
        # Calculate category compliance (0-100)
        if stats['max_weighted_sum'] > 0:
            cat_compliance = (stats['weighted_sum'] / stats['max_weighted_sum']) * 100.0
        else:
            cat_compliance = 0.0

        # Contribution to total score
        # We accumulate (compliance * weight) then dived later by total_weight if needed
        # Or if we assume weights sum to 100 (or we normalize them)
        
        score_details.append({
            'category_id': cat_id,
            'category_name': cat.name,
            'category_name_en': cat.name_en,
            'category_weight': cat_weight_percent,
            'score': round(cat_compliance, 1),
            'weighted_contribution': 0 # computed below
        })
        
        # To handle cases where weights don't sum to 100, we do a weighted average of the available categories
        final_score += (cat_compliance * cat_weight_percent)
        total_cat_weight += cat_weight_percent

    # Normalize final score
    if total_cat_weight > 0:
        compliance_result = final_score / total_cat_weight * 100.0 if total_cat_weight != 100 else final_score
        
        # Adjust contribution display
        for detail in score_details:
             # actual contribution to the final number
             detail['weighted_contribution'] = round((detail['score'] * detail['category_weight']) / total_cat_weight, 1)
    else:
        compliance_result = 0.0

    # Update round compliance percentage using weighted average
    db_round = db.query(Round).filter(Round.id == round_id).first()
    if db_round:
        try:
            db_round.score_details = json.dumps(score_details)
            
            # Count how many items have been evaluated (excluding 'na' status)
            evaluated_items = len([ev for ev in evaluations if ev.get('status') != 'na'])
            total_items = len(evaluations)
            
            if total_items > 0:
                completion_percentage = round((evaluated_items / total_items) * 100)
                db_round.completion_percentage = int(completion_percentage)
            else:
                db_round.completion_percentage = 0

            # Set status based on finalize parameter
            if finalize:
                # If finalizing, mark as completed
                db_round.status = RoundStatus.COMPLETED if hasattr(RoundStatus, 'COMPLETED') else 'completed'
            else:
                # If saving as draft, set to in_progress
                db_round.status = RoundStatus.IN_PROGRESS if hasattr(RoundStatus, 'IN_PROGRESS') else 'in_progress'

            db.commit()
            db.refresh(db_round)
        except Exception as e:
            print(f"Error updating round compliance: {e}")

    return created_results, db_round


def get_evaluation_results_by_round(db: Session, round_id: int):
    """Return all EvaluationResult rows for a given round_id"""
    try:
        from models_updated import EvaluationResult
        results = db.query(EvaluationResult).filter(EvaluationResult.round_id == round_id).all()
        return results
    except Exception as e:
        print(f"Error fetching evaluation results for round {round_id}: {e}")
        return []

# Objective Option CRUD operations
def create_objective_option(db: Session, objective_option_data: dict):
    from models_updated import ObjectiveOption
    db_objective_option = ObjectiveOption(
        name=objective_option_data["name"],
        description=objective_option_data.get("description"),
        is_active=objective_option_data.get("is_active", True)
    )
    db.add(db_objective_option)
    db.commit()
    db.refresh(db_objective_option)
    return db_objective_option

def get_objective_options(db: Session, skip: int = 0, limit: int = 100, active_only: bool = False):
    from models_updated import ObjectiveOption
    query = db.query(ObjectiveOption)
    if active_only:
        query = query.filter(ObjectiveOption.is_active == True)
    return query.offset(skip).limit(limit).all()

def get_objective_option(db: Session, objective_option_id: int):
    from models_updated import ObjectiveOption
    return db.query(ObjectiveOption).filter(ObjectiveOption.id == objective_option_id).first()

def update_objective_option(db: Session, objective_option_id: int, objective_option_data: dict):
    from models_updated import ObjectiveOption
    db_objective_option = db.query(ObjectiveOption).filter(ObjectiveOption.id == objective_option_id).first()
    if db_objective_option:
        for key, value in objective_option_data.items():
            if hasattr(db_objective_option, key):
                setattr(db_objective_option, key, value)
        db.commit()
        db.refresh(db_objective_option)
    return db_objective_option

def delete_objective_option(db: Session, objective_option_id: int):
    from models_updated import ObjectiveOption
    db_objective_option = db.query(ObjectiveOption).filter(ObjectiveOption.id == objective_option_id).first()
    if db_objective_option:
        db.delete(db_objective_option)
        db.commit()
    return db_objective_option

# Audit Log CRUD operations
def create_audit_log(db: Session, audit_log_data: dict):
    from models_updated import AuditLog
    db_audit_log = AuditLog(
        user_id=audit_log_data["user_id"],
        action=audit_log_data["action"],
        entity_type=audit_log_data["entity_type"],
        entity_id=audit_log_data.get("entity_id"),
        old_values=audit_log_data.get("old_values"),
        new_values=audit_log_data.get("new_values"),
        ip_address=audit_log_data.get("ip_address"),
        user_agent=audit_log_data.get("user_agent")
    )
    db.add(db_audit_log)
    db.commit()
    db.refresh(db_audit_log)
    return db_audit_log

def get_audit_logs(db: Session, skip: int = 0, limit: int = 100, user_id: Optional[int] = None, entity_type: Optional[str] = None):
    from models_updated import AuditLog
    query = db.query(AuditLog)
    
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    
    return query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

def get_audit_logs_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    from models_updated import AuditLog
    return db.query(AuditLog).filter(AuditLog.user_id == user_id).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

def get_audit_logs_by_entity(db: Session, entity_type: str, entity_id: int, skip: int = 0, limit: int = 100):
    from models_updated import AuditLog
    return db.query(AuditLog).filter(
        AuditLog.entity_type == entity_type,
        AuditLog.entity_id == entity_id
    ).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

# Notification CRUD operations
def create_notification(db: Session, notification_data: dict):
    """Create a new notification"""
    # Normalize notification_type to the NotificationType enum/value expected by the DB
    from models_updated import NotificationType as NotificationTypeEnum

    nt_input = notification_data.get("notification_type")
    nt_value = None

    # Accept either enum member, lowercase value, or uppercase name
    try:
        if nt_input is None:
            raise ValueError("notification_type is required")

        if isinstance(nt_input, NotificationTypeEnum):
            nt_value = nt_input
        elif isinstance(nt_input, str):
            # try direct value (e.g. 'round_assigned')
            try:
                nt_value = NotificationTypeEnum(nt_input)
            except ValueError:
                # try enum name (e.g. 'ROUND_ASSIGNED')
                try:
                    nt_value = NotificationTypeEnum[nt_input]
                except Exception:
                    # fallback: lowercase and replace spaces with underscores
                    normalized = nt_input.strip().lower().replace(' ', '_')
                    nt_value = NotificationTypeEnum(normalized)
        else:
            # unexpected type, coerce to string then to enum
            nt_value = NotificationTypeEnum(str(nt_input))
    except Exception as e:
        # If we cannot coerce, raise a clear error so caller can handle it
        raise

    db_notification = Notification(
        user_id=notification_data["user_id"],
        title=notification_data["title"],
        message=notification_data["message"],
        notification_type=nt_value.value,  # Use the string value, not the enum
        entity_type=notification_data.get("entity_type"),
        entity_id=notification_data.get("entity_id")
    )

    try:
        db.add(db_notification)
        db.commit()
        db.refresh(db_notification)

        # Attempt to send email immediately if the recipient has email notifications enabled
        try:
            # Local imports to avoid circular import issues at module import time
            from crud import get_user_by_id as _get_user_by_id
            from notification_service import get_notification_service as _get_notification_service

            user = _get_user_by_id(db, db_notification.user_id)
            settings = get_user_notification_settings(db, db_notification.user_id)

            # Only attempt sending if user has an email and email notifications enabled (or no settings => default true)
            if user and getattr(user, 'email', None):
                email_enabled = True
                if settings and hasattr(settings, 'email_notifications'):
                    email_enabled = bool(settings.email_notifications)

                if email_enabled:
                    try:
                        svc = _get_notification_service(db)
                        svc._send_email_notification(db_notification)
                    except Exception as e:
                        print(f"⚠️ Warning: failed to send email for notification {db_notification.id}: {e}")

        except Exception as e:
            # Don't fail the DB operation on email errors
            print(f"⚠️ Warning in post-create notification email flow: {e}")

        return db_notification
    except Exception:
        # Rollback to clear the failed transaction so subsequent operations can proceed
        try:
            db.rollback()
        except Exception:
            pass
        raise

def get_notifications_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 50, status: Optional[NotificationStatus] = None):
    """Get notifications for a specific user"""
    query = db.query(Notification).filter(Notification.user_id == user_id)
    
    if status:
        query = query.filter(Notification.status == status)
    
    return query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

def get_unread_notifications_count(db: Session, user_id: int):
    """Get count of unread notifications for a user"""
    return db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.status == NotificationStatus.UNREAD
    ).count()

def mark_notification_as_read(db: Session, notification_id: int, user_id: int):
    """Mark a notification as read"""
    from datetime import datetime
    
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    
    if notification:
        notification.status = NotificationStatus.READ
        notification.read_at = datetime.utcnow()
        db.commit()
        return notification
    return None

def mark_all_notifications_as_read(db: Session, user_id: int):
    """Mark all notifications as read for a user"""
    from datetime import datetime
    
    notifications = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.status == NotificationStatus.UNREAD
    ).all()
    
    for notification in notifications:
        notification.status = NotificationStatus.READ
        notification.read_at = datetime.utcnow()
    
    db.commit()
    return len(notifications)

def delete_notification(db: Session, notification_id: int, user_id: int):
    """Delete a notification"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    
    if notification:
        db.delete(notification)
        db.commit()
        return True
    return False

def update_notification_email_sent(db: Session, notification_id: int):
    """Mark notification as email sent"""
    from datetime import datetime
    
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if notification:
        notification.is_email_sent = True
        notification.email_sent_at = datetime.utcnow()
        db.commit()
        return notification
    return None

# User Notification Settings CRUD operations
def get_user_notification_settings(db: Session, user_id: int):
    """Get notification settings for a user"""
    return db.query(UserNotificationSettings).filter(UserNotificationSettings.user_id == user_id).first()

def create_user_notification_settings(db: Session, user_id: int, settings_data: dict):
    """Create notification settings for a user"""
    db_settings = UserNotificationSettings(
        user_id=user_id,
        **settings_data
    )
    db.add(db_settings)
    db.commit()
    db.refresh(db_settings)
    return db_settings

def update_user_notification_settings(db: Session, user_id: int, settings_data: dict):
    """Update notification settings for a user"""
    from datetime import datetime
    
    settings = db.query(UserNotificationSettings).filter(UserNotificationSettings.user_id == user_id).first()
    
    if not settings:
        # Create new settings if they don't exist
        return create_user_notification_settings(db, user_id, settings_data)
    
    # Update existing settings
    for key, value in settings_data.items():
        if hasattr(settings, key) and value is not None:
            setattr(settings, key, value)
    
    settings.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(settings)
    return settings

def get_users_with_notification_preference(db: Session, notification_type: str):
    """Get users who have enabled notifications for a specific type"""
    settings_map = {
        "round_assigned": "round_assignments",
        "round_reminder": "round_reminders", 
        "round_deadline": "round_deadlines",
        "capa_assigned": "capa_assignments",
        "capa_deadline": "capa_deadlines",
        "system_update": "system_updates"
    }
    
    preference_field = settings_map.get(notification_type)
    if not preference_field:
        return []
    
    # Get users with the specific notification preference enabled
    settings = db.query(UserNotificationSettings).filter(
        getattr(UserNotificationSettings, preference_field) == True
    ).all()
    
    # Get user details for these settings
    user_ids = [setting.user_id for setting in settings]
    users = db.query(User).filter(User.id.in_(user_ids)).all()
    
    return users

# Round Type CRUD operations
def create_round_type(db: Session, round_type_data: dict):
    db_round_type = RoundTypeSettings(**round_type_data)
    db.add(db_round_type)
    db.commit()
    db.refresh(db_round_type)
    return db_round_type

def get_round_types(db: Session, skip: int = 0, limit: int = 100):
    return db.query(RoundTypeSettings).filter(RoundTypeSettings.is_active == True).order_by(RoundTypeSettings.sort_order, RoundTypeSettings.name).offset(skip).limit(limit).all()

def get_round_type_by_id(db: Session, round_type_id: int):
    return db.query(RoundTypeSettings).filter(RoundTypeSettings.id == round_type_id).first()

def update_round_type(db: Session, round_type_id: int, round_type_data: dict):
    db_round_type = db.query(RoundTypeSettings).filter(RoundTypeSettings.id == round_type_id).first()
    if db_round_type:
        for key, value in round_type_data.items():
            if hasattr(db_round_type, key):
                setattr(db_round_type, key, value)
        db.commit()
        db.refresh(db_round_type)
    return db_round_type

def delete_round_type(db: Session, round_type_id: int):
    db_round_type = db.query(RoundTypeSettings).filter(RoundTypeSettings.id == round_type_id).first()
    if db_round_type:
        db.delete(db_round_type)
        db.commit()
    return db_round_type

def get_non_compliant_evaluation_items(db: Session, round_id: int, threshold: int = 70):
    """
    Get evaluation items from a round that scored below the threshold and need CAPA plans.
    Returns items with status 'not_applied' or 'partial' (scores 0-50).
    
    Args:
        round_id: The round ID to analyze
        threshold: Score threshold below which items need CAPA (default 70)
    
    Returns:
        List of evaluation items that need corrective action
    """
    if not EVALUATION_MODELS_AVAILABLE:
        return []
    
    try:
        from models_updated import EvaluationResult, EvaluationItem
        
        # Get evaluation results for this round with scores below threshold
        results = db.query(EvaluationResult).join(EvaluationItem).filter(
            EvaluationResult.round_id == round_id,
            EvaluationResult.score < threshold
        ).all()
        
        non_compliant_items = []
        for result in results:
            # Get the evaluation item details
            item = db.query(EvaluationItem).filter(EvaluationItem.id == result.item_id).first()
            if item:
                non_compliant_items.append({
                    'evaluation_result_id': result.id,
                    'item_id': item.id,
                    'item_code': item.code,
                    'item_title': item.title,
                    'item_description': item.description,
                    'category_name': item.category_name,
                    'category_color': item.category_color,
                    'risk_level': getattr(item, 'risk_level', 'MINOR'),
                    'score': result.score,
                    'comments': result.comments,
                    'evaluated_at': result.evaluated_at,
                    'round_id': round_id
                })
        
        return non_compliant_items
        
    except Exception as e:
        print(f"Error getting non-compliant evaluation items: {e}")
        return []


def get_evaluation_items_needing_capa(db: Session, round_id: int):
    """
    Get evaluation items from a round that are marked as needing CAPA.
    Returns items where needs_capa = True.
    
    Args:
        round_id: The round ID to analyze
    
    Returns:
        List of evaluation items that need CAPA plans
    """
    if not EVALUATION_MODELS_AVAILABLE:
        return []
    
    try:
        from models_updated import EvaluationResult, EvaluationItem
        
        # Get evaluation results for this round where needs_capa is True
        results = db.query(EvaluationResult).join(EvaluationItem).filter(
            EvaluationResult.round_id == round_id,
            EvaluationResult.needs_capa == True
        ).all()
        
        items_needing_capa = []
        for result in results:
            # Get the evaluation item details
            item = db.query(EvaluationItem).filter(EvaluationItem.id == result.item_id).first()
            if item:
                items_needing_capa.append({
                    'evaluation_result_id': result.id,
                    'item_id': item.id,
                    'item_code': item.code,
                    'item_title': item.title,
                    'item_description': item.description,
                    'category_name': item.category_name,
                    'category_color': item.category_color,
                    'risk_level': getattr(item, 'risk_level', 'MINOR'),
                    'score': result.score,
                    'comments': result.comments,
                    'capa_note': result.capa_note,
                    'evaluated_at': result.evaluated_at,
                    'status': 'needs_capa'
                })
        
        return items_needing_capa
        
    except Exception as e:
        print(f"Error getting evaluation items needing CAPA: {e}")
        return []


def create_capa_from_evaluation_item(db: Session, round_id: int, evaluation_item_data: dict, creator_id: int):
    """
    Create a CAPA plan for a specific evaluation item that failed compliance.
    
    Args:
        round_id: The round ID
        evaluation_item_data: Dict containing evaluation item info
        creator_id: User ID creating the CAPA
    
    Returns:
        Created CAPA object or None if failed
    """
    try:
        # Get round details for department and other info
        round_obj = db.query(Round).filter(Round.id == round_id).first()
        if not round_obj:
            return None
        
        # Generate CAPA title and description based on evaluation item
        item_title = evaluation_item_data.get('item_title', 'عنصر تقييم')
        item_code = evaluation_item_data.get('item_code', '')
        score = evaluation_item_data.get('score', 0)
        
        capa_title = f"خطة تصحيحية لعنصر: {item_title}"
        if item_code:
            capa_title += f" ({item_code})"
        
        capa_description = f"""خطة تصحيحية لمعالجة عدم الامتثال في عنصر التقييم:

العنصر: {item_title}
الكود: {item_code}
النتيجة: {score}/100
الجولة: {round_obj.title}
القسم: {round_obj.department}

يتطلب هذا العنصر إجراءات تصحيحية لضمان الامتثال والتحسين المستمر."""

        # Determine priority based on risk level and score
        risk_level = evaluation_item_data.get('risk_level', 'MINOR')
        if risk_level == 'CRITICAL' or score == 0:
            priority = 'urgent'
        elif risk_level == 'MAJOR' or score <= 25:
            priority = 'high'
        elif score <= 50:
            priority = 'medium'
        else:
            priority = 'low'
        
        # Calculate target date (30 days for urgent, 60 for high, 90 for medium/low)
        from datetime import datetime, timedelta
        if priority == 'urgent':
            target_date = datetime.now() + timedelta(days=30)
        elif priority == 'high':
            target_date = datetime.now() + timedelta(days=60)
        else:
            target_date = datetime.now() + timedelta(days=90)
        
        # Create CAPA
        from models_updated import CapaStatus, VerificationStatus
        db_capa = Capa(
            title=capa_title,
            description=capa_description,
            round_id=round_id,
            department=round_obj.department,
            priority=priority,
            status=CapaStatus.PENDING.value,  # MUST be UPPERCASE to satisfy DB check constraint
            evaluation_item_id=evaluation_item_data.get('item_id'),
            target_date=target_date,
            created_by_id=creator_id,
            risk_score=100 - score,  # Higher risk score for lower evaluation scores
            # Ensure defaults for enhanced fields
            verification_status=VerificationStatus.PENDING.value,
            corrective_actions='[]',
            preventive_actions='[]',
            verification_steps='[]',
            status_history='[]',
            severity=3,
            sla_days=14,
            escalation_level=0
        )
        
        db.add(db_capa)
        db.commit()
        db.refresh(db_capa)

        # Send notifications (best-effort) to assigned user and quality managers
        try:
            try:
                from notification_service import get_notification_service
                notification_service = get_notification_service(db)
            except Exception:
                notification_service = None

            creator = get_user_by_id(db, creator_id) if creator_id else None
            creator_name = f"{creator.first_name} {creator.last_name}" if creator else "نظام"

            evaluation_item_title = item_title

            # Get quality manager ids
            try:
                quality_manager_ids = [qm.id for qm in db.query(User).filter(User.role == 'quality_manager').all() if qm.id != creator_id]
            except Exception:
                quality_manager_ids = []

            if notification_service:
                notification_service.send_capa_created_notification(
                    capa_id=db_capa.id,
                    capa_title=db_capa.title,
                    evaluation_item_title=evaluation_item_title,
                    assigned_user_id=db_capa.assigned_to_id,
                    quality_manager_ids=quality_manager_ids,
                    created_by_name=creator_name
                )
        except Exception as e:
            print(f"Warning: failed to send notifications for created CAPA {getattr(db_capa, 'id', None)}: {e}")

        # Audit log
        try:
            create_audit_log(db, {
                "user_id": creator_id,
                "action": "create_capa",
                "entity_type": "capa",
                "entity_id": db_capa.id,
                "new_values": json.dumps({"title": db_capa.title, "department": db_capa.department}, ensure_ascii=False)
            })
        except Exception as e:
            print(f"Warning: failed to create audit log for CAPA {getattr(db_capa, 'id', None)}: {e}")

        return db_capa
        
    except Exception as e:
        print(f"Error creating CAPA from evaluation item: {e}")
        db.rollback()
        return None


def create_capas_for_round_non_compliance(db: Session, round_id: int, creator_id: int, threshold: int = 70):
    """
    Create CAPA plans for all non-compliant evaluation items in a round.
    
    Args:
        round_id: The round ID to process
        creator_id: User ID creating the CAPAs
        threshold: Score threshold below which items need CAPA (default 70)
    
    Returns:
        Dict with created CAPAs and any errors
    """
    try:
        # Get non-compliant items
        non_compliant_items = get_non_compliant_evaluation_items(db, round_id, threshold)
        
        if not non_compliant_items:
            return {
                'success': True,
                'message': 'لا توجد عناصر تحتاج إلى خطط تصحيحية',
                'created_capas': [],
                'total_items': 0
            }
        
        created_capas = []
        errors = []
        
        for item_data in non_compliant_items:
            # Check if CAPA already exists for this evaluation item
            existing_capa = db.query(Capa).filter(
                Capa.round_id == round_id,
                Capa.evaluation_item_id == item_data['item_id']
            ).first()
            
            if existing_capa:
                errors.append(f"خطة تصحيحية موجودة مسبقاً للعنصر: {item_data['item_title']}")
                continue
            
            # Create CAPA for this item
            capa = create_capa_from_evaluation_item(db, round_id, item_data, creator_id)
            if capa:
                created_capas.append({
                    'capa_id': capa.id,
                    'title': capa.title,
                    'item_title': item_data['item_title'],
                    'priority': capa.priority,
                    'target_date': capa.target_date
                })
            else:
                errors.append(f"فشل في إنشاء خطة تصحيحية للعنصر: {item_data['item_title']}")
        
        return {
            'success': True,
            'message': f'تم إنشاء {len(created_capas)} خطة تصحيحية من أصل {len(non_compliant_items)} عنصر غير مطبق',
            'created_capas': created_capas,
            'total_items': len(non_compliant_items),
            'errors': errors
        }
        
    except Exception as e:
        print(f"Error creating CAPAs for round non-compliance: {e}")
        return {
            'success': False,
            'message': f'خطأ في إنشاء خطط التصحيح: {str(e)}',
            'created_capas': [],
            'total_items': 0,
            'errors': [str(e)]
        }


def get_round_capa_summary(db: Session, round_id: int):
    """
    Get summary of CAPA plans related to a specific round.
    
    Args:
        round_id: The round ID
    
    Returns:
        Dict with CAPA summary information
    """
    try:
        # Get round details
        round_obj = db.query(Round).filter(Round.id == round_id).first()
        if not round_obj:
            return None
        
        # Get all CAPAs for this round
        capas = db.query(Capa).filter(Capa.round_id == round_id).all()
        
        # Get evaluation results for this round
        if EVALUATION_MODELS_AVAILABLE:
            from models_updated import EvaluationResult
            total_evaluations = db.query(EvaluationResult).filter(EvaluationResult.round_id == round_id).count()
            non_compliant_evaluations = db.query(EvaluationResult).filter(
                EvaluationResult.round_id == round_id,
                EvaluationResult.score < 70
            ).count()
        else:
            total_evaluations = 0
            non_compliant_evaluations = 0
        
        # Group CAPAs by status
        capa_by_status = {}
        for capa in capas:
            status = capa.status
            if status not in capa_by_status:
                capa_by_status[status] = []
            capa_by_status[status].append({
                'id': capa.id,
                'title': capa.title,
                'priority': capa.priority,
                'target_date': capa.target_date,
                'evaluation_item_id': capa.evaluation_item_id
            })
        
        return {
            'round_id': round_id,
            'round_title': round_obj.title,
            'round_department': round_obj.department,
            'round_compliance_percentage': round_obj.compliance_percentage,
            'total_capas': len(capas),
            'total_evaluations': total_evaluations,
            'non_compliant_evaluations': non_compliant_evaluations,
            'capas_needed': max(0, non_compliant_evaluations - len(capas)),
            'capa_by_status': capa_by_status
        }
        
    except Exception as e:
        print(f"Error getting round CAPA summary: {e}")
        return None
