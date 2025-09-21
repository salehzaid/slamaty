from fastapi import FastAPI, Depends, HTTPException, status, Form, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import uvicorn
from typing import List, Optional
from datetime import datetime, timedelta

from database import get_db, engine
from models_updated import Base, UserRole, User
from schemas import (
    UserCreate, UserUpdate, UserResponse, RoundCreate, RoundResponse, CapaCreate, CapaResponse, 
    DepartmentCreate, DepartmentResponse, EvaluationCategoryCreate, EvaluationCategoryResponse,
    EvaluationItemCreate, EvaluationItemResponse, ObjectiveOptionCreate, ObjectiveOptionResponse,
    ObjectiveOptionUpdate, AuditLogCreate, AuditLogResponse, EvaluationResultResponse,
    NotificationCreate, NotificationResponse, NotificationUpdate,
    UserNotificationSettingsCreate, UserNotificationSettingsResponse, UserNotificationSettingsUpdate,
    RoundTypeCreate, RoundTypeUpdate, RoundTypeResponse
)
from auth import get_current_user, create_access_token, verify_password, get_password_hash
from notification_service import get_notification_service
from crud import (
    create_user, get_user_by_email, get_user_by_username, get_user_by_id, get_users, update_user_data, delete_user_data,
    create_round, get_rounds, get_rounds_by_user, get_round_by_id, update_round, delete_round, create_capa, get_capas, get_all_capas_unfiltered, delete_capa, delete_all_capas, create_department, get_departments, 
    get_department_by_id, update_department, delete_department,
    create_evaluation_category, get_evaluation_categories, get_evaluation_category_by_id,
    update_evaluation_category, delete_evaluation_category,
    create_evaluation_item, get_evaluation_items, get_evaluation_item_by_id,
    get_evaluation_items_by_category, update_evaluation_item, delete_evaluation_item,
    get_assessors, create_objective_option, get_objective_options, get_objective_option,
    update_objective_option, delete_objective_option,
    create_audit_log, get_audit_logs, get_audit_logs_by_user, get_audit_logs_by_entity,
    create_evaluation_results, get_evaluation_results_by_round,
    create_notification, get_notifications_by_user, get_unread_notifications_count,
    mark_notification_as_read, mark_all_notifications_as_read, delete_notification,
    get_user_notification_settings, create_user_notification_settings, update_user_notification_settings,
    create_round_type, get_round_types, get_round_type_by_id, update_round_type, delete_round_type,
    # New CAPA-evaluation integration functions
    get_non_compliant_evaluation_items, create_capa_from_evaluation_item,
    create_capas_for_round_non_compliance, get_round_capa_summary
)
from reminder_service import get_reminder_service

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="نظام سلامتي",
    description="نظام إدارة جولات الجودة وسلامة المرضى",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    # During development allow localhost origins. In production restrict this to your frontends.
    allow_origins=["*"],  # Frontend URLs (dev-only wildcard)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

@app.get("/")
async def root():
    return {"message": "مرحباً بك في نظام سلامتي API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/test-login")
async def test_login(data: dict = Body(...)):
    return {"received": data, "message": "Test endpoint working"}

# Authentication endpoints
@app.post("/auth/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="المستخدم موجود بالفعل"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = create_user(db, user, hashed_password)
    
    return db_user

@app.post("/auth/signin")
async def signin(login_request: dict = Body(...), db: Session = Depends(get_db)):
    try:
        # دعم كل من username و email
        username = login_request.get("username")
        email = login_request.get("email")
        password = login_request.get("password")
        
        # البحث بـ username أولاً، ثم email
        user = None
        if username:
            user = get_user_by_username(db, username=username)
        elif email:
            user = get_user_by_email(db, email=email)
            
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="خطأ في اسم المستخدم أو كلمة المرور",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token = create_access_token(data={"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer", "user": user}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"خطأ في معالجة الطلب: {str(e)}"
        )

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)):
    return current_user

# Rounds endpoints
@app.post("/rounds", response_model=RoundResponse)
async def create_new_round(round: RoundCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Check if user has permission to create rounds (super_admin or quality_manager only)
    if current_user.role not in ["super_admin", "quality_manager"]:
        raise HTTPException(
            status_code=403,
            detail="ليس لديك صلاحية لإنشاء جولات جديدة. هذه الصلاحية محصورة على مدير النظام ومدير الجودة فقط."
        )
    
    # Create the round
    created_round = create_round(db, round, current_user.id)
    
    # Send notifications to assigned users
    if created_round and round.assigned_to:
        try:
            notification_service = get_notification_service(db)
            creator_name = f"{current_user.first_name} {current_user.last_name}"
            
            # Convert user names to user IDs for notifications
            assigned_user_ids = []
            if isinstance(round.assigned_to, list):
                for user_name in round.assigned_to:
                    # Find user by name
                    user = db.query(User).filter(
                        db.func.concat(User.first_name, ' ', User.last_name) == user_name
                    ).first()
                    if user:
                        assigned_user_ids.append(user.id)
            
            # Send notifications to all assigned users
            if assigned_user_ids:
                notification_service.send_round_assignment_notification(
                    round_id=created_round.id,
                    round_title=created_round.title,
                    round_department=created_round.department,
                    assigned_user_ids=assigned_user_ids,
                    created_by_name=creator_name
                )
        except Exception as e:
            # Log error but don't fail the round creation
            print(f"Error sending round assignment notifications: {str(e)}")
    
    return created_round

@app.get("/rounds", response_model=List[RoundResponse])
async def get_all_rounds(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    rounds = get_rounds(db, skip=skip, limit=limit)
    return rounds

@app.get("/rounds/my", response_model=List[RoundResponse])
async def get_my_rounds(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Get rounds assigned to the current user"""
    print(f"🔍 API: Getting rounds for user ID: {current_user.id}")
    rounds = get_rounds_by_user(db, current_user.id, skip=skip, limit=limit)
    print(f"📊 API: Returning {len(rounds)} rounds")
    return rounds

@app.get("/rounds/{round_id}", response_model=RoundResponse)
async def get_round_endpoint(round_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Get a specific round by ID"""
    round_data = get_round_by_id(db, round_id)
    if not round_data:
        raise HTTPException(status_code=404, detail="Round not found")
    return round_data

@app.put("/rounds/{round_id}", response_model=RoundResponse)
async def update_round_endpoint(round_id: int, round_data: dict = Body(...), db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Update an existing round"""
    updated_round = update_round(db, round_id, round_data)
    if not updated_round:
        raise HTTPException(status_code=404, detail="Round not found")
    return updated_round

@app.delete("/rounds/{round_id}")
async def delete_round_endpoint(round_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Delete a round - Only super_admin and quality_manager can delete rounds"""
    # Check if user has permission to delete rounds (super_admin or quality_manager only)
    if current_user.role not in ["super_admin", "quality_manager"]:
        raise HTTPException(
            status_code=403, 
            detail="ليس لديك صلاحية لحذف الجولات. هذه الصلاحية محصورة على مدير النظام ومدير الجودة فقط."
        )
    
    deleted_round = delete_round(db, round_id)
    if not deleted_round:
        raise HTTPException(status_code=404, detail="الجولة غير موجودة")
    
    return {"message": "تم حذف الجولة بنجاح"}

# Endpoint to submit evaluation results for a round
@app.post("/rounds/{round_id}/evaluations")
async def submit_evaluations_endpoint(round_id: int, payload: dict = Body(...), db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Accepts payload: { evaluations: [{item_id, status, comments?, evidence_files?}], notes? }
    Stores evaluation_results rows and updates round compliance percentage.
    """
    try:
        evaluations = payload.get('evaluations') or []
        created, updated_round = create_evaluation_results(db, round_id, evaluations, current_user.id)
        if updated_round is None:
            raise HTTPException(status_code=400, detail="Evaluation models unavailable or round not found")
        return {"created": len(created), "round_id": updated_round.id, "compliance_percentage": updated_round.compliance_percentage, "completion_percentage": updated_round.completion_percentage}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in submit_evaluations_endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint to save partial evaluation (draft)
@app.post("/rounds/{round_id}/evaluations/draft")
async def save_evaluation_draft_endpoint(round_id: int, payload: dict = Body(...), db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Save partial evaluation as draft without changing round status to completed.
    Accepts payload: { evaluations: [{item_id, status, comments?, evidence_files?}], notes? }
    """
    try:
        evaluations = payload.get('evaluations') or []
        created, updated_round = create_evaluation_results(db, round_id, evaluations, current_user.id, finalize=False)
        if updated_round is None:
            raise HTTPException(status_code=400, detail="Evaluation models unavailable or round not found")
        return {"created": len(created), "round_id": updated_round.id, "compliance_percentage": updated_round.compliance_percentage, "completion_percentage": updated_round.completion_percentage}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in save_evaluation_draft_endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/rounds/{round_id}/evaluations", response_model=List[EvaluationResultResponse])
async def get_round_evaluations_endpoint(round_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Return saved evaluation results for a round"""
    try:
        results = get_evaluation_results_by_round(db, round_id)
        return results
    except Exception as e:
        print(f"Error in get_round_evaluations_endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint to finalize evaluation (mark as completed)
@app.post("/rounds/{round_id}/evaluations/finalize")
async def finalize_evaluation_endpoint(round_id: int, payload: dict = Body(...), db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Finalize evaluation and mark round as completed.
    Accepts payload: { evaluations: [{item_id, status, comments?, evidence_files?}], notes? }
    """
    try:
        evaluations = payload.get('evaluations') or []
        created, updated_round = create_evaluation_results(db, round_id, evaluations, current_user.id, finalize=True)
        if updated_round is None:
            raise HTTPException(status_code=400, detail="Evaluation models unavailable or round not found")
        
        # Create CAPA items for any evaluations that are not fully applied
        from models_updated import EvaluationItem
        created_capas = []
        try:
            for ev in evaluations:
                status = ev.get('status')
                # create CAPA for not_applied or partial items
                if status in ('not_applied', 'partial'):
                    item_id = ev.get('item_id')
                    item = db.query(EvaluationItem).filter(EvaluationItem.id == item_id).first()
                    if not item:
                        print(f"Evaluation item {item_id} not found, skipping CAPA creation")
                        continue
                    
                    item_title = item.title
                    comment = ev.get('comments') or ''
                    
                    # Get department managers for automatic assignment
                    from crud import get_department_manager_ids
                    manager_ids = get_department_manager_ids(db, updated_round.department)
                    assigned_to_id = manager_ids[0] if manager_ids else None  # Assign to first manager

                    # Calculate target date based on risk level (7-30 days)
                    risk_days = {
                        'CRITICAL': 7,
                        'MAJOR': 14,
                        'MINOR': 30
                    }
                    target_days = risk_days.get(item.risk_level, 14)
                    target_date = datetime.utcnow() + timedelta(days=target_days)
                    
                    # Determine priority based on risk level
                    priority_map = {
                        'CRITICAL': 'urgent',
                        'MAJOR': 'high',
                        'MINOR': 'medium'
                    }
                    priority = priority_map.get(item.risk_level, 'medium')
                    
                    # Build CAPA payload
                    capa_payload = CapaCreate(
                        title=f"عدم الامتثال: {item_title}",
                        description=f"الجولة: {updated_round.title}\nرمز العنصر: {item.code}\nالعنوان: {item_title}\nوصف العنصر: {item.description or 'لا يوجد وصف'}\nملاحظات التقييم: {comment}\n\nمطلوب: تطوير خطة تصحيحية لضمان الامتثال الكامل لهذا العنصر.",
                        round_id=round_id,
                        department=updated_round.department,
                        priority=priority,
                        assigned_to=None,  # Will be set by create_capa based on assigned_to_id
                        assigned_to_id=assigned_to_id,
                        evaluation_item_id=item_id,
                        target_date=target_date,
                        risk_score=8 if item.risk_level == 'CRITICAL' else (5 if item.risk_level == 'MAJOR' else 3)
                    )
                    try:
                        db_capa = create_capa(db, capa_payload, current_user.id)
                        created_capas.append({
                            'capa_id': db_capa.id,
                            'item_id': item_id,
                            'item_title': item_title,
                            'assigned_to_id': assigned_to_id
                        })
                        print(f"✅ Created CAPA {db_capa.id} for evaluation item {item_id}: {item_title}")
                    except Exception as e:
                        print(f"❌ Failed to create CAPA for item {item_id}: {e}")
        except Exception as e:
            print(f"❌ Error while creating CAPAs: {e}")

        # Round status is already set to completed by create_evaluation_results
        
        return {"created": len(created), "round_id": updated_round.id, "compliance_percentage": updated_round.compliance_percentage, "completion_percentage": updated_round.completion_percentage, "status": updated_round.status, "created_capas": created_capas}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in finalize_evaluation_endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# CAPA endpoints
@app.post("/capa", response_model=CapaResponse)
async def create_new_capa(capa: CapaCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Create the CAPA
    created_capa = create_capa(db, capa, current_user.id)
    
    # Send notification to assigned user
    if created_capa and capa.assigned_to:
        try:
            notification_service = get_notification_service(db)
            creator_name = f"{current_user.first_name} {current_user.last_name}"
            
            # Get assigned user ID (assuming assigned_to is a user ID)
            assigned_user_id = int(capa.assigned_to) if capa.assigned_to.isdigit() else None
            
            if assigned_user_id:
                notification_service.send_capa_assignment_notification(
                    capa_id=created_capa.id,
                    capa_title=created_capa.title,
                    capa_department=created_capa.department,
                    assigned_user_id=assigned_user_id,
                    created_by_name=creator_name
                )
        except Exception as e:
            # Log error but don't fail the CAPA creation
            print(f"Error sending CAPA assignment notification: {str(e)}")
    
    return created_capa

@app.get("/capa", response_model=List[CapaResponse])
async def get_all_capas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Get CAPAs filtered to show only those linked to non-compliant evaluation items"""
    capas = get_capas(db, skip=skip, limit=limit)
    return capas

@app.get("/capa/all", response_model=List[CapaResponse])
async def get_all_capas_unfiltered_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Get all CAPAs without filtering - for admin purposes only"""
    if current_user.role not in ["super_admin", "quality_manager"]:
        raise HTTPException(status_code=403, detail="ليس لديك صلاحية لعرض جميع خطط التصحيح")
    
    capas = get_all_capas_unfiltered(db, skip=skip, limit=limit)
    return capas

@app.delete("/capa/all")
async def delete_all_capas_endpoint(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Delete all CAPAs - Only super_admin can delete all CAPAs"""
    # Check if user has permission to delete all CAPAs (super_admin only)
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=403,
            detail="ليس لديك صلاحية لحذف جميع خطط التحسين. هذه الصلاحية محصورة على مدير النظام فقط."
        )
    
    try:
        deleted_count = delete_all_capas(db)
        return {
            "message": f"تم حذف جميع خطط التحسين بنجاح",
            "deleted_count": deleted_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء حذف خطط التحسين: {str(e)}")

@app.delete("/capa/{capa_id}")
async def delete_capa_endpoint(capa_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Delete a CAPA - Only super_admin and quality_manager can delete CAPAs"""
    # Check if user has permission to delete CAPAs (super_admin or quality_manager only)
    if current_user.role not in ["super_admin", "quality_manager"]:
        raise HTTPException(
            status_code=403,
            detail="ليس لديك صلاحية لحذف خطط التحسين. هذه الصلاحية محصورة على مدير النظام ومدير الجودة فقط."
        )
    
    deleted_capa = delete_capa(db, capa_id)
    if deleted_capa is None:
        raise HTTPException(status_code=404, detail="خطة التحسين غير موجودة")
    
    return {"message": "تم حذف خطة التحسين بنجاح", "deleted_capa_id": capa_id}

# User endpoints
@app.get("/users", response_model=List[UserResponse])
async def get_all_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Check if user has permission to view users (super_admin or quality_manager only)
    if current_user.role not in ["super_admin", "quality_manager"]:
        raise HTTPException(
            status_code=403,
            detail="ليس لديك صلاحية لعرض المستخدمين. هذه الصلاحية محصورة على مدير النظام ومدير الجودة فقط."
        )
    users = get_users(db, skip=skip, limit=limit)
    return users

@app.post("/users", response_model=UserResponse)
async def create_new_user(user: UserCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Check if user has permission to create users (super_admin or quality_manager only)
    if current_user.role not in ["super_admin", "quality_manager"]:
        raise HTTPException(
            status_code=403,
            detail="ليس لديك صلاحية لإنشاء مستخدمين جدد. هذه الصلاحية محصورة على مدير النظام ومدير الجودة فقط."
        )
    # Check if user already exists
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="المستخدم موجود بالفعل"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = create_user(db, user, hashed_password)
    return db_user

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Check if user has permission to view users (super_admin or quality_manager only)
    if current_user.role not in ["super_admin", "quality_manager"]:
        raise HTTPException(
            status_code=403,
            detail="ليس لديك صلاحية لعرض المستخدمين. هذه الصلاحية محصورة على مدير النظام ومدير الجودة فقط."
        )
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    return user

@app.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user: dict = Body(...), db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Check if user has permission to update users (super_admin or quality_manager only)
    if current_user.role not in ["super_admin", "quality_manager"]:
        raise HTTPException(
            status_code=403,
            detail="ليس لديك صلاحية لتعديل المستخدمين. هذه الصلاحية محصورة على مدير النظام ومدير الجودة فقط."
        )
    # Check if user exists
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    print(f"🔍 Backend - Updating user {user_id} with data: {user}")
    print(f"🔍 Backend - Photo URL in request: {user.get('photo_url')}")
    
    # Update user
    hashed_password = get_password_hash(user.get('password')) if user.get('password') else db_user.hashed_password
    updated_user = update_user_data(db, user_id, user, hashed_password)
    
    print(f"✅ Backend - Updated user photo_url: {updated_user.photo_url}")
    return updated_user

@app.delete("/users/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Check if user has permission to delete users (super_admin or quality_manager only)
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.QUALITY_MANAGER]:
        raise HTTPException(
            status_code=403, 
            detail="ليس لديك صلاحية لحذف المستخدمين. هذه الصلاحية محصورة على مدير النظام ومدير الجودة فقط."
        )
    
    # Prevent self-deletion
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="لا يمكن حذف حسابك الخاص")
    
    # Check if user exists
    user_to_delete = get_user_by_id(db, user_id)
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    # Prevent deletion of other super admins
    if user_to_delete.role == UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=400, 
            detail="لا يمكن حذف مدير نظام آخر. يمكن فقط لمدير النظام حذف المستخدمين العاديين."
        )
    
    deleted_user = delete_user_data(db, user_id)
    if not deleted_user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    return {"message": f"تم حذف المستخدم {user_to_delete.first_name} {user_to_delete.last_name} بنجاح"}

@app.post("/users/{user_id}/send-welcome-email")
async def send_welcome_email(user_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """إرسال إيميل ترحيبي للمستخدم"""
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    # TODO: Implement actual email sending functionality
    # For now, just return success message
    return {"message": f"تم إرسال إيميل ترحيبي إلى {user.email}"}

# Department endpoints
@app.post("/departments", response_model=DepartmentResponse)
async def create_new_department(department: DepartmentCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return create_department(db, department)

@app.get("/departments", response_model=List[DepartmentResponse])
async def get_all_departments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    departments = get_departments(db, skip=skip, limit=limit)
    return departments

@app.get("/departments/{department_id}", response_model=DepartmentResponse)
async def get_department(department_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    department = get_department_by_id(db, department_id)
    if not department:
        raise HTTPException(status_code=404, detail="القسم غير موجود")
    return department

@app.put("/departments/{department_id}", response_model=DepartmentResponse)
async def update_department_endpoint(department_id: int, department: dict = Body(...), db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    print(f"🔧 Updating department {department_id} with data: {department}")
    
    # Convert dict to DepartmentCreate schema
    try:
        department_data = DepartmentCreate(**department)
        print(f"✅ Department data validated: {department_data}")
    except Exception as e:
        print(f"❌ Department validation error: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid department data: {str(e)}")
    
    updated_department = update_department(db, department_id, department_data)
    if not updated_department:
        print(f"❌ Department {department_id} not found")
        raise HTTPException(status_code=404, detail="القسم غير موجود")
    
    print(f"✅ Department {department_id} updated successfully")
    return updated_department

@app.delete("/departments/{department_id}")
async def delete_department_endpoint(department_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    deleted_department = delete_department(db, department_id)
    if not deleted_department:
        raise HTTPException(status_code=404, detail="القسم غير موجود")
    return {"message": "تم حذف القسم بنجاح"}

# Evaluation Categories endpoints
@app.post("/evaluation-categories", response_model=EvaluationCategoryResponse)
async def create_evaluation_category_endpoint(category: EvaluationCategoryCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    category_data = category.dict()
    return create_evaluation_category(db, category_data)

@app.get("/evaluation-categories", response_model=List[EvaluationCategoryResponse])
async def get_evaluation_categories_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    categories = get_evaluation_categories(db, skip=skip, limit=limit)
    return categories

@app.get("/evaluation-categories/{category_id}", response_model=EvaluationCategoryResponse)
async def get_evaluation_category_endpoint(category_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    category = get_evaluation_category_by_id(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="تصنيف التقييم غير موجود")
    return category

@app.put("/evaluation-categories/{category_id}", response_model=EvaluationCategoryResponse)
async def update_evaluation_category_endpoint(category_id: int, category: EvaluationCategoryCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    category_data = category.dict()
    updated_category = update_evaluation_category(db, category_id, category_data)
    if not updated_category:
        raise HTTPException(status_code=404, detail="تصنيف التقييم غير موجود")
    return updated_category

@app.delete("/evaluation-categories/{category_id}")
async def delete_evaluation_category_endpoint(category_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    deleted_category = delete_evaluation_category(db, category_id)
    if not deleted_category:
        raise HTTPException(status_code=404, detail="تصنيف التقييم غير موجود")
    return {"message": "تم حذف تصنيف التقييم بنجاح"}

# Evaluation Items endpoints
@app.post("/evaluation-items", response_model=EvaluationItemResponse)
async def create_evaluation_item_endpoint(item: EvaluationItemCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    item_data = item.dict()
    return create_evaluation_item(db, item_data)

@app.get("/evaluation-items", response_model=List[EvaluationItemResponse])
async def get_evaluation_items_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    items = get_evaluation_items(db, skip=skip, limit=limit)
    return items

@app.get("/evaluation-items/{item_id}", response_model=EvaluationItemResponse)
async def get_evaluation_item_endpoint(item_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    item = get_evaluation_item_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="عنصر التقييم غير موجود")
    return item

@app.put("/evaluation-items/{item_id}", response_model=EvaluationItemResponse)
async def update_evaluation_item_endpoint(item_id: int, item: EvaluationItemCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    item_data = item.dict()
    updated_item = update_evaluation_item(db, item_id, item_data)
    if not updated_item:
        raise HTTPException(status_code=404, detail="عنصر التقييم غير موجود")
    return updated_item

@app.delete("/evaluation-items/{item_id}")
async def delete_evaluation_item_endpoint(item_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    deleted_item = delete_evaluation_item(db, item_id)
    if not deleted_item:
        raise HTTPException(status_code=404, detail="عنصر التقييم غير موجود")
    return {"message": "تم حذف عنصر التقييم بنجاح"}

@app.get("/evaluation-items/category/{category_id}", response_model=List[EvaluationItemResponse])
async def get_evaluation_items_by_category_endpoint(category_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    items = get_evaluation_items_by_category(db, category_id, skip=skip, limit=limit)
    return items

# Assessors endpoints
@app.get("/assessors")
async def get_assessors_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    assessors = get_assessors(db, skip=skip, limit=limit)
    return assessors

# Objective Options endpoints
@app.post("/objective-options", response_model=ObjectiveOptionResponse)
async def create_objective_option_endpoint(
    objective_option: ObjectiveOptionCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    """إنشاء خيار ارتباط جديد"""
    db_objective_option = create_objective_option(db, objective_option.dict())
    return db_objective_option

@app.get("/objective-options", response_model=List[ObjectiveOptionResponse])
async def get_objective_options_endpoint(
    skip: int = 0, 
    limit: int = 100, 
    active_only: bool = False,
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    """الحصول على قائمة خيارات الارتباط"""
    objective_options = get_objective_options(db, skip=skip, limit=limit, active_only=active_only)
    return objective_options

@app.get("/objective-options/{objective_option_id}", response_model=ObjectiveOptionResponse)
async def get_objective_option_endpoint(
    objective_option_id: int, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    """الحصول على خيار ارتباط محدد"""
    objective_option = get_objective_option(db, objective_option_id)
    if not objective_option:
        raise HTTPException(status_code=404, detail="خيار الارتباط غير موجود")
    return objective_option

@app.put("/objective-options/{objective_option_id}", response_model=ObjectiveOptionResponse)
async def update_objective_option_endpoint(
    objective_option_id: int, 
    objective_option: ObjectiveOptionUpdate, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    """تحديث خيار ارتباط"""
    db_objective_option = update_objective_option(db, objective_option_id, objective_option.dict(exclude_unset=True))
    if not db_objective_option:
        raise HTTPException(status_code=404, detail="خيار الارتباط غير موجود")
    return db_objective_option

@app.delete("/objective-options/{objective_option_id}")
async def delete_objective_option_endpoint(
    objective_option_id: int, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    """حذف خيار ارتباط"""
    db_objective_option = delete_objective_option(db, objective_option_id)
    if not db_objective_option:
        raise HTTPException(status_code=404, detail="خيار الارتباط غير موجود")
    return {"message": "تم حذف خيار الارتباط بنجاح"}

# Audit Log endpoints
@app.get("/audit-logs", response_model=List[AuditLogResponse])
async def get_audit_logs_endpoint(
    skip: int = 0, 
    limit: int = 100, 
    user_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    """الحصول على سجل الأنشطة"""
    audit_logs = get_audit_logs(db, skip=skip, limit=limit, user_id=user_id, entity_type=entity_type)
    return audit_logs

@app.get("/audit-logs/user/{user_id}", response_model=List[AuditLogResponse])
async def get_user_audit_logs_endpoint(
    user_id: int,
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    """الحصول على سجل أنشطة مستخدم محدد"""
    audit_logs = get_audit_logs_by_user(db, user_id, skip=skip, limit=limit)
    return audit_logs

@app.get("/audit-logs/entity/{entity_type}/{entity_id}", response_model=List[AuditLogResponse])
async def get_entity_audit_logs_endpoint(
    entity_type: str,
    entity_id: int,
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    """الحصول على سجل أنشطة كيان محدد"""
    audit_logs = get_audit_logs_by_entity(db, entity_type, entity_id, skip=skip, limit=limit)
    return audit_logs

# Notification endpoints
@app.get("/notifications", response_model=List[NotificationResponse])
async def get_user_notifications(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """الحصول على إشعارات المستخدم"""
    from models_updated import NotificationStatus
    status_filter = NotificationStatus(status) if status else None
    notifications = get_notifications_by_user(db, current_user.id, skip=skip, limit=limit, status=status_filter)
    return notifications

@app.get("/notifications/unread-count")
async def get_unread_notifications_count(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """الحصول على عدد الإشعارات غير المقروءة"""
    count = get_unread_notifications_count(db, current_user.id)
    return {"unread_count": count}

@app.put("/notifications/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """تحديد إشعار كمقروء"""
    notification = mark_notification_as_read(db, notification_id, current_user.id)
    if not notification:
        raise HTTPException(status_code=404, detail="الإشعار غير موجود")
    return {"message": "تم تحديد الإشعار كمقروء"}

@app.put("/notifications/mark-all-read")
async def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """تحديد جميع الإشعارات كمقروءة"""
    count = mark_all_notifications_as_read(db, current_user.id)
    return {"message": f"تم تحديد {count} إشعار كمقروء"}

@app.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """حذف إشعار"""
    success = delete_notification(db, notification_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="الإشعار غير موجود")
    return {"message": "تم حذف الإشعار"}

# User Notification Settings endpoints
@app.get("/notification-settings", response_model=UserNotificationSettingsResponse)
async def get_user_notification_settings_endpoint(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """الحصول على إعدادات الإشعارات للمستخدم"""
    settings = get_user_notification_settings(db, current_user.id)
    if not settings:
        # Create default settings if they don't exist
        default_settings = {
            "email_notifications": True,
            "sms_notifications": False,
            "round_assignments": True,
            "round_reminders": True,
            "round_deadlines": True,
            "capa_assignments": True,
            "capa_deadlines": True,
            "system_updates": False,
            "weekly_reports": True
        }
        settings = create_user_notification_settings(db, current_user.id, default_settings)
    return settings

@app.put("/notification-settings", response_model=UserNotificationSettingsResponse)
async def update_user_notification_settings_endpoint(
    settings_update: UserNotificationSettingsUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """تحديث إعدادات الإشعارات للمستخدم"""
    settings_data = settings_update.dict(exclude_unset=True)
    settings = update_user_notification_settings(db, current_user.id, settings_data)
    return settings

# Round Type endpoints
@app.get("/round-types", response_model=List[RoundTypeResponse])
async def get_round_types_endpoint(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """الحصول على قائمة أنواع الجولات"""
    return get_round_types(db, skip=skip, limit=limit)

@app.post("/round-types", response_model=RoundTypeResponse)
async def create_round_type_endpoint(
    round_type: RoundTypeCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """إنشاء نوع جولة جديد"""
    if current_user.role not in ["super_admin", "quality_manager"]:
        raise HTTPException(status_code=403, detail="ليس لديك صلاحية لإنشاء أنواع الجولات")
    
    round_type_data = round_type.dict()
    return create_round_type(db, round_type_data)

@app.get("/round-types/{round_type_id}", response_model=RoundTypeResponse)
async def get_round_type_endpoint(
    round_type_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """الحصول على نوع جولة محدد"""
    round_type = get_round_type_by_id(db, round_type_id)
    if not round_type:
        raise HTTPException(status_code=404, detail="نوع الجولة غير موجود")
    return round_type

@app.put("/round-types/{round_type_id}", response_model=RoundTypeResponse)
async def update_round_type_endpoint(
    round_type_id: int,
    round_type_update: RoundTypeUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """تحديث نوع جولة"""
    if current_user.role not in ["super_admin", "quality_manager"]:
        raise HTTPException(status_code=403, detail="ليس لديك صلاحية لتحديث أنواع الجولات")
    
    round_type_data = round_type_update.dict(exclude_unset=True)
    round_type = update_round_type(db, round_type_id, round_type_data)
    if not round_type:
        raise HTTPException(status_code=404, detail="نوع الجولة غير موجود")
    return round_type

@app.delete("/round-types/{round_type_id}")
async def delete_round_type_endpoint(
    round_type_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """حذف نوع جولة"""
    if current_user.role not in ["super_admin", "quality_manager"]:
        raise HTTPException(status_code=403, detail="ليس لديك صلاحية لحذف أنواع الجولات")
    
    round_type = delete_round_type(db, round_type_id)
    if not round_type:
        raise HTTPException(status_code=404, detail="نوع الجولة غير موجود")
    return {"message": "تم حذف نوع الجولة بنجاح"}

@app.post("/notifications/send-reminders")
async def send_reminders(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Send deadline reminders - Only super_admin and quality_manager can trigger"""
    if current_user.role not in ["super_admin", "quality_manager"]:
        raise HTTPException(
            status_code=403,
            detail="ليس لديك صلاحية لإرسال التذكيرات"
        )
    
    try:
        reminder_service = get_reminder_service(db)
        reminder_service.check_round_deadlines()
        reminder_service.check_capa_deadlines()
        
        return {"message": "تم إرسال التذكيرات بنجاح"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء إرسال التذكيرات: {str(e)}")

# New CAPA-Evaluation Integration Endpoints

@app.get("/rounds/{round_id}/non-compliant-items")
async def get_round_non_compliant_items(
    round_id: int,
    threshold: int = 70,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get evaluation items from a round that need CAPA plans (scored below threshold)"""
    try:
        non_compliant_items = get_non_compliant_evaluation_items(db, round_id, threshold)
        return {
            "round_id": round_id,
            "threshold": threshold,
            "total_items": len(non_compliant_items),
            "items": non_compliant_items
        }
    except Exception as e:
        print(f"Error getting non-compliant items: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/rounds/{round_id}/create-capas")
async def create_capas_for_round(
    round_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create CAPA plans for all non-compliant evaluation items in a round"""
    if current_user.role not in ["super_admin", "quality_manager", "department_manager"]:
        raise HTTPException(status_code=403, detail="ليس لديك صلاحية لإنشاء خطط التصحيح")
    
    try:
        threshold = payload.get('threshold', 70)
        result = create_capas_for_round_non_compliance(db, round_id, current_user.id, threshold)
        return result
    except Exception as e:
        print(f"Error creating CAPAs for round: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/rounds/{round_id}/create-capa-for-item")
async def create_capa_for_evaluation_item(
    round_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a CAPA plan for a specific evaluation item"""
    if current_user.role not in ["super_admin", "quality_manager", "department_manager"]:
        raise HTTPException(status_code=403, detail="ليس لديك صلاحية لإنشاء خطط التصحيح")
    
    try:
        evaluation_item_data = payload.get('evaluation_item_data')
        if not evaluation_item_data:
            raise HTTPException(status_code=400, detail="بيانات عنصر التقييم مطلوبة")
        
        capa = create_capa_from_evaluation_item(db, round_id, evaluation_item_data, current_user.id)
        if not capa:
            raise HTTPException(status_code=400, detail="فشل في إنشاء خطة التصحيح")
        
        return {
            "success": True,
            "message": "تم إنشاء خطة التصحيح بنجاح",
            "capa_id": capa.id,
            "title": capa.title,
            "priority": capa.priority,
            "target_date": capa.target_date
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating CAPA for evaluation item: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/rounds/{round_id}/capa-summary")
async def get_round_capa_summary_endpoint(
    round_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get summary of CAPA plans related to a specific round"""
    try:
        summary = get_round_capa_summary(db, round_id)
        if not summary:
            raise HTTPException(status_code=404, detail="الجولة غير موجودة")
        
        return summary
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting round CAPA summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
