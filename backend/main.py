from fastapi import FastAPI, Depends, HTTPException, status, Form, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func, text
import uvicorn
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse, JSONResponse
from fastapi.exception_handlers import http_exception_handler
from typing import List, Optional
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('env.local')

from database import get_db, engine
from models_updated import Base, UserRole, User, Round, Capa, Department
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
    create_round, get_rounds, get_rounds_by_user, get_round_by_id, update_round, delete_round, create_capa, get_capas, get_capa_by_id, update_capa, get_all_capas_unfiltered, delete_capa, delete_all_capas, create_department, get_departments, 
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

# Create database tables (lazy, don't block startup on failure)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"[Startup] Skipping create_all due to error: {e}")

app = FastAPI(
    title="نظام سلامتي",
    description="نظام إدارة جولات الجودة وسلامة المرضى",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware - Must be added immediately after creating the app
# Allow all localhost origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+|http://127\.0\.0\.1:\d+",  # Allow any localhost port
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

print(f"✅ CORS enabled for all localhost origins")

# Temporary diagnostic endpoint to list registered routes (hidden from docs)
@app.get("/__routes", include_in_schema=False)
async def _list_routes():
    return {"routes": sorted({route.path for route in app.routes})}

# Simple health check endpoint (no authentication required)
@app.get("/health", include_in_schema=False)
async def health_check():
    """Simple health check endpoint"""
    return {"status": "ok", "message": "Server is running"}

# Test rounds endpoint (no authentication required for debugging)
@app.get("/api/test/rounds", include_in_schema=False)
async def test_rounds_endpoint():
    """Test rounds endpoint without authentication"""
    try:
        from sqlalchemy import text
        
        db = next(get_db())
        
        try:
            # Use raw SQL to avoid schema issues
            query = text("""
                SELECT id, round_code, title, description, round_type, 
                       department, status, priority, scheduled_date, created_at
                FROM rounds 
                ORDER BY created_at DESC 
                LIMIT 10
            """)
            
            result = db.execute(query)
            rounds_data = []
            
            for row in result.fetchall():
                rounds_data.append({
                    "id": row[0],
                    "round_code": row[1],
                    "title": row[2],
                    "description": row[3],
                    "round_type": row[4],
                    "department": row[5],
                    "status": row[6],
                    "priority": row[7],
                    "scheduled_date": row[8].isoformat() if row[8] else None,
                    "created_at": row[9].isoformat() if row[9] else None
                })
            
            return {
                "status": "success",
                "count": len(rounds_data),
                "rounds": rounds_data
            }
            
        finally:
            db.close()
            
    except Exception as e:
        return {"status": "error", "error": str(e)}

# Emergency endpoint to create test data (no authentication required)
@app.post("/api/emergency/create-test-round", include_in_schema=False)
async def create_emergency_test_round():
    """Create a test round without authentication for debugging"""
    try:
        from datetime import datetime, timedelta
        from sqlalchemy import text
        
        # Get database session directly
        db = next(get_db())
        
        try:
            # Get or create admin user using raw SQL
            user_query = text("SELECT id FROM users WHERE email = 'testadmin@salamaty.com'")
            result = db.execute(user_query)
            user_row = result.fetchone()
            
            if user_row:
                admin_user_id = user_row[0]
                print("✅ Admin user already exists")
            else:
                # Create admin user using raw SQL
                from auth import get_password_hash
                
                insert_user_query = text("""
                    INSERT INTO users (
                        username, email, first_name, last_name, hashed_password,
                        role, department, position, phone, is_active
                    ) VALUES (
                        'testadmin', 'testadmin@salamaty.com', 'مدير', 'النظام',
                        :hashed_password, 'super_admin', 'الإدارة العامة',
                        'مدير النظام', '+966500000000', true
                    ) RETURNING id
                """)
                
                result = db.execute(insert_user_query, {
                    'hashed_password': get_password_hash("test123")
                })
                admin_user_id = result.scalar()
                db.commit()
                print("✅ Created admin user")
            
            # Create test round using raw SQL
            round_code = f"TEST{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            insert_round_query = text("""
                INSERT INTO rounds (
                    round_code, title, description, round_type, department, 
                    assigned_to, scheduled_date, status, priority, created_by_id
                ) VALUES (
                    :round_code, :title, :description, :round_type, :department,
                    :assigned_to, :scheduled_date, :status, :priority, :created_by_id
                ) RETURNING id
            """)
            
            result = db.execute(insert_round_query, {
                'round_code': round_code,
                'title': 'جولة تجريبية - اختبار النظام',
                'description': 'جولة تجريبية لاختبار عمل النظام',
                'round_type': 'PATIENT_SAFETY',
                'department': 'الطوارئ',
                'assigned_to': f'[{admin_user_id}]',
                'scheduled_date': datetime.now() + timedelta(hours=1),
                'status': 'SCHEDULED',
                'priority': 'medium',
                'created_by_id': admin_user_id
            })
            
            round_id = result.scalar()
            db.commit()
            
            return {
                "message": "تم إنشاء جولة تجريبية بنجاح",
                "round_id": round_id,
                "round_code": round_code,
                "admin_user_id": admin_user_id
            }
            
        finally:
            db.close()
        
    except Exception as e:
        print(f"❌ Error creating emergency test round: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e), "message": "فشل في إنشاء الجولة التجريبية"}

# Test rounds with authentication (for debugging)
@app.get("/api/test/auth/rounds", include_in_schema=False)
async def test_rounds_with_auth(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Test rounds endpoint with authentication"""
    try:
        from sqlalchemy import text
        
        print(f"🔍 [TEST-AUTH] User: {current_user.email}")
        
        query = text("""
            SELECT id, round_code, title, description, round_type, 
                   department, status, priority, scheduled_date, created_at
            FROM rounds 
            ORDER BY created_at DESC 
            LIMIT 10
        """)
        
        result = db.execute(query)
        rounds_data = []
        
        for row in result.fetchall():
            rounds_data.append({
                "id": row[0],
                "round_code": row[1],
                "title": row[2],
                "description": row[3],
                "round_type": row[4],
                "department": row[5],
                "status": row[6],
                "priority": row[7],
                "scheduled_date": row[8].isoformat() if row[8] else None,
                "created_at": row[9].isoformat() if row[9] else None
            })
        
        return {
            "status": "success",
            "user": current_user.email,
            "count": len(rounds_data),
            "rounds": rounds_data
        }
        
    except Exception as e:
        return {"status": "error", "error": str(e)}

# Simple test round creation (no constraints)
@app.post("/api/emergency/create-simple-round", include_in_schema=False)
async def create_simple_test_round():
    """Create a very simple test round"""
    try:
        from datetime import datetime, timedelta
        
        db = next(get_db())
        
        # Get or create a simple user
        admin_user = db.query(User).filter(User.email == "testadmin@salamaty.com").first()
        if not admin_user:
            from auth import get_password_hash
            from models_updated import UserRole
            
            admin_user = User(
                username="testadmin",
                email="testadmin@salamaty.com",
                first_name="مدير",
                last_name="النظام",
                hashed_password=get_password_hash("test123"),
                role=UserRole.SUPER_ADMIN,
                department="الإدارة العامة",
                position="مدير النظام",
                phone="+966500000000",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
        
        # Create simple round using raw SQL to avoid constraints
        from sqlalchemy import text
        
        round_code = f"TEST{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        insert_query = text("""
            INSERT INTO rounds (
                round_code, title, description, round_type, department, 
                assigned_to, scheduled_date, status, priority, created_by_id
            ) VALUES (
                :round_code, :title, :description, :round_type, :department,
                :assigned_to, :scheduled_date, :status, :priority, :created_by_id
            ) RETURNING id
        """)
        
        result = db.execute(insert_query, {
            'round_code': round_code,
            'title': 'جولة تجريبية بسيطة',
            'description': 'جولة للاختبار',
            'round_type': 'patient_safety',
            'department': 'الطوارئ',
            'assigned_to': f'[{admin_user.id}]',
            'scheduled_date': datetime.now() + timedelta(hours=1),
            'status': 'scheduled',
            'priority': 'medium',
            'created_by_id': admin_user.id
        })
        
        round_id = result.scalar()
        db.commit()
        db.close()
        
        return {
            "message": "تم إنشاء جولة تجريبية بسيطة بنجاح",
            "round_id": round_id,
            "round_code": round_code,
            "admin_user_id": admin_user.id
        }
        
    except Exception as e:
        print(f"❌ Error creating simple test round: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e), "message": "فشل في إنشاء الجولة التجريبية البسيطة"}

# Debug constraints endpoint
@app.get("/api/debug/constraints", include_in_schema=False)
async def debug_constraints():
    """Debug database constraints"""
    try:
        db = next(get_db())
        
        # Get round status constraints
        constraints_query = text("""
            SELECT conname, pg_get_constraintdef(oid) 
            FROM pg_constraint 
            WHERE conrelid = 'rounds'::regclass 
            AND contype = 'c'
        """)
        
        result = db.execute(constraints_query)
        constraints = [{"name": row[0], "definition": row[1]} for row in result.fetchall()]
        
        # Get enum values for round status
        enum_query = text("""
            SELECT enumlabel 
            FROM pg_enum 
            WHERE enumtypid = (
                SELECT oid 
                FROM pg_type 
                WHERE typname = 'roundstatus'
            )
        """)
        
        result = db.execute(enum_query)
        enum_values = [row[0] for row in result.fetchall()]
        
        db.close()
        
        return {
            "constraints": constraints,
            "round_status_enum": enum_values
        }
        
    except Exception as e:
        return {"error": str(e)}


# Version / deployment diagnostic endpoint
@app.get("/api/health/version", include_in_schema=False)
async def deployment_version_info():
    """Return simple deployment metadata to verify frontend build/version on the server."""
    try:
        info = {}
        # Try to read build commit from env
        import os
        info['build_commit'] = os.getenv('BUILD_COMMIT') or os.getenv('GIT_COMMIT') or None

        # If dist exists, try to parse the main script filename
        dist_index = os.path.join(DIST_DIR, 'index.html') if 'DIST_DIR' in globals() else os.path.join('dist', 'index.html')
        if os.path.exists(dist_index):
            try:
                with open(dist_index, 'r', encoding='utf-8') as f:
                    html = f.read()
                # find the first script src under /assets
                import re
                m = re.search(r"<script[^>]+src=\"(/assets/[^\"]+)\"", html)
                if m:
                    script_path = m.group(1)
                    info['frontend_main_script'] = script_path
                    asset_file = os.path.join('dist', script_path.lstrip('/'))
                    if os.path.exists(asset_file):
                        info['frontend_asset_mtime'] = os.path.getmtime(asset_file)
                # also include presence of dist folder
                info['dist_exists'] = True
            except Exception as err:
                info['dist_error'] = str(err)
        else:
            info['dist_exists'] = False

        # Add server timestamp
        import time
        info['server_time'] = time.time()

        return info
    except Exception as e:
        return {"error": str(e)}

# Database diagnostic endpoint
@app.get("/api/health/database", include_in_schema=False)
async def check_database_health(db: Session = Depends(get_db)):
    """Check database connection and table existence"""
    try:
        print("🔍 [HEALTH] Starting database health check...")
        
        # Test basic connection
        db.execute(text("SELECT 1"))
        print("✅ [HEALTH] Basic connection test passed")
        
        # Check if tables exist
        tables_query = text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        result = db.execute(tables_query)
        tables = [row[0] for row in result.fetchall()]
        print(f"📋 [HEALTH] Found tables: {tables}")
        
        # Check if rounds table has data
        rounds_count = 0
        try:
            count_result = db.execute(text("SELECT COUNT(*) FROM rounds"))
            rounds_count = count_result.scalar()
            print(f"📊 [HEALTH] Rounds count: {rounds_count}")
        except Exception as e:
            print(f"❌ [HEALTH] Error counting rounds: {e}")
        
        # Check users table
        users_count = 0
        try:
            count_result = db.execute(text("SELECT COUNT(*) FROM users"))
            users_count = count_result.scalar()
            print(f"👥 [HEALTH] Users count: {users_count}")
        except Exception as e:
            print(f"❌ [HEALTH] Error counting users: {e}")
        
        return {
            "status": "healthy",
            "connection": "ok",
            "tables": tables,
            "rounds_count": rounds_count,
            "users_count": users_count,
            "database_url": os.getenv("DATABASE_URL", "not_set")[:50] + "..." if os.getenv("DATABASE_URL") else "not_set"
        }
    except Exception as e:
        print(f"❌ [HEALTH] Database health check failed: {e}")
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "connection": "failed",
            "error": str(e),
            "database_url": os.getenv("DATABASE_URL", "not_set")[:50] + "..." if os.getenv("DATABASE_URL") else "not_set"
        }

# Create sample data endpoint
@app.post("/api/admin/create-sample-data", include_in_schema=False)
async def create_sample_data(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Create sample rounds for testing"""
    try:
        # Check if user is admin
        if current_user.role not in ['super_admin', 'quality_manager']:
            raise HTTPException(status_code=403, detail="غير مصرح بالوصول")
        
        from datetime import datetime, timedelta
        import json
        
        # Get admin user ID
        admin_user = db.query(User).filter(User.email == "testadmin@salamaty.com").first()
        if not admin_user:
            raise HTTPException(status_code=404, detail="Admin user not found")
        
        # Sample rounds data
        sample_rounds = [
            {
                "round_code": "R001",
                "title": "جولة روتينية - الطوارئ",
                "description": "جولة تفتيشية روتينية لقسم الطوارئ",
                "round_type": "patient_safety",
                "department": "الطوارئ",
                "assigned_to": json.dumps([admin_user.id]),
                "scheduled_date": datetime.now() + timedelta(days=1),
                "status": "scheduled",
                "priority": "medium",
                "created_by_id": admin_user.id
            },
            {
                "round_code": "R002", 
                "title": "جولة مكافحة العدوى",
                "description": "جولة للتحقق من إجراءات مكافحة العدوى",
                "round_type": "infection_control",
                "department": "العناية المركزة",
                "assigned_to": json.dumps([admin_user.id]),
                "scheduled_date": datetime.now() + timedelta(days=2),
                "status": "scheduled",
                "priority": "high",
                "created_by_id": admin_user.id
            }
        ]
        
        created_count = 0
        for round_data in sample_rounds:
            existing = db.query(Round).filter(Round.round_code == round_data["round_code"]).first()
            if not existing:
                new_round = Round(**round_data)
                db.add(new_round)
                created_count += 1
        
        db.commit()
        
        return {
            "message": f"تم إنشاء {created_count} جولة تجريبية",
            "created_count": created_count
        }
        
    except Exception as e:
        db.rollback()
        print(f"Error creating sample data: {e}")
        raise HTTPException(status_code=500, detail=f"خطأ في إنشاء البيانات التجريبية: {str(e)}")


# Custom 404 handler: return SPA index for non-API GET requests so client-side routing works
@app.exception_handler(HTTPException)
async def spa_http_exception_handler(request: Request, exc: HTTPException):
    try:
        # Only intercept 404 for GET requests that are not API routes
        if exc.status_code == 404 and request.method == "GET" and not request.url.path.startswith("/api"):
            index_path = os.path.join(DIST_DIR, "index.html")
            if os.path.exists(index_path):
                return FileResponse(index_path)
    except Exception:
        pass
    # Fallback to default handler
    return await http_exception_handler(request, exc)

security = HTTPBearer()

# Serve built frontend at root if available
# Resolve dist directory relative to this file so it works in Docker
DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dist"))

# Serve index.html at root explicitly (highest priority) to avoid proxy/route ordering issues
@app.get("/", include_in_schema=False)
async def _serve_root_index():
    index_path = os.path.join(DIST_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    raise HTTPException(status_code=404, detail="Not Found")
if os.path.exists(DIST_DIR):
    # Serve entire dist (optional) and assets under their expected path
    app.mount("/static", StaticFiles(directory=DIST_DIR), name="static")
    assets_dir = os.path.join(DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/api")
async def root():
    return {"message": "مرحباً بك في نظام سلامتي API"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


# Public health endpoint for platform health checks (Railway expects `/health`)
@app.get("/health")
async def public_health_check():
    """Return simple 200 OK payload for external load balancers/healthchecks."""
    return {"status": "healthy"}

@app.post("/api/test-login")
async def test_login(data: dict = Body(...)):
    return {"received": data, "message": "Test endpoint working"}

# Authentication endpoints
@app.post("/api/auth/register", response_model=UserResponse)
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

@app.post("/api/auth/signin")
async def signin(login_request: dict = Body(...), db: Session = Depends(get_db)):
    try:
        # دعم كل من username و email
        username = login_request.get("username")
        email = login_request.get("email")
        password = login_request.get("password")

        # Ensure search_path to public (defensive - some deployments may not set it)
        try:
            db.execute(text("SET search_path TO public;"))
        except Exception:
            pass

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
    except HTTPException:
        # Preserve intended HTTP errors like 401
        raise
    except Exception as e:
        # Unexpected error -> 500 rather than masking as 400
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

# Google Sign-In endpoint removed

@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)):
    return current_user

# Rounds endpoints
@app.post("/api/rounds", response_model=RoundResponse)
async def create_new_round(round: RoundCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Check if user has permission to create rounds (super_admin or quality_manager only)
    if current_user.role not in ["super_admin", "quality_manager"]:
        raise HTTPException(
            status_code=403,
            detail="ليس لديك صلاحية لإنشاء جولات جديدة. هذه الصلاحية محصورة على مدير النظام ومدير الجودة فقط."
        )
    
    # Create the round with error handling
    try:
        created_round = create_round(db, round, current_user.id)
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"❌ Error creating round: {str(e)}")
        print(f"Stack trace:\n{error_details}")
        raise HTTPException(
            status_code=500,
            detail=f"فشل في إنشاء الجولة: {str(e)}"
        )
    
    # Send notifications to assigned users
    if created_round and round.assigned_to:
        try:
            # Get creator user from DB to ensure it's attached to session
            creator = db.query(User).filter(User.id == current_user.id).first()
            creator_name = f"{creator.first_name} {creator.last_name}" if creator else "المستخدم"
            
            notification_service = get_notification_service(db)
            
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
            print(f"⚠️ Error sending round assignment notifications: {str(e)}")
    
    return created_round


# Debug endpoint: create round without authentication (development only)
@app.post("/api/debug/rounds-noauth", response_model=RoundResponse, include_in_schema=False)
async def create_round_noauth(round: RoundCreate, db: Session = Depends(get_db)):
    """Development helper: create a round without authentication. Uses user id 1 as creator.
    Only enabled in local/dev environments and hidden from OpenAPI (include_in_schema=False).
    """
    try:
        # Use created_by_id = 1 by default. If user 1 doesn't exist, fallback to first user in DB.
        try:
            creator = db.query(User).filter(User.id == 1).first()
            created_by_id = creator.id if creator else None
        except Exception:
            created_by_id = None

        if not created_by_id:
            first_user = db.query(User).first()
            if first_user:
                created_by_id = first_user.id
            else:
                raise HTTPException(status_code=500, detail="No users in DB to assign as creator")

        created_round = create_round(db, round, created_by_id)
        return created_round
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [DEBUG ENDPOINT] Error creating round without auth: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/rounds", response_model=List[RoundResponse])
async def get_all_rounds(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        print(f"🔍 [API] Fetching rounds from database for user {current_user.id}")
        print(f"🔍 [API] Database session: {db}")
        
        # Test database connection first
        try:
            db.execute(text("SELECT 1"))
            print("✅ [API] Database connection test successful")
        except Exception as conn_error:
            print(f"❌ [API] Database connection test failed: {conn_error}")
            raise HTTPException(status_code=500, detail=f"خطأ في الاتصال بقاعدة البيانات: {str(conn_error)}")
        
        # Get rounds from database using raw SQL to avoid schema issues
        query = text("""
            SELECT id, round_code, title, description, round_type, 
                   department, status, priority, scheduled_date, created_at,
                   assigned_to, created_by_id, compliance_percentage, completion_percentage,
                   selected_categories, evaluation_items, assigned_to_ids,
                   deadline, end_date, notes
            FROM rounds 
            ORDER BY created_at DESC 
            LIMIT :limit OFFSET :offset
        """)
        
        result = db.execute(query, {'limit': limit, 'offset': skip})
        rounds_data = []
        
        import json, traceback
        for row in result.fetchall():
            try:
                # Normalize assigned_to to a JSON string
                raw_assigned = row[10]
                if raw_assigned is None:
                    assigned_to_str = '[]'
                elif isinstance(raw_assigned, (list, dict)):
                    assigned_to_str = json.dumps(raw_assigned, ensure_ascii=False)
                else:
                    # Try to parse if it's a JSON string already
                    try:
                        parsed = json.loads(raw_assigned)
                        assigned_to_str = json.dumps(parsed, ensure_ascii=False)
                    except Exception:
                        assigned_to_str = str(raw_assigned)

                # Safely format dates
                try:
                    scheduled_iso = row[8].isoformat() if row[8] else None
                except Exception:
                    scheduled_iso = None
                try:
                    created_iso = row[9].isoformat() if row[9] else None
                except Exception:
                    created_iso = None

                # Handle JSONB fields (selected_categories, evaluation_items, assigned_to_ids)
                selected_categories = row[14] if row[14] is not None else []
                evaluation_items = row[15] if row[15] is not None else []
                assigned_to_ids = row[16] if row[16] is not None else []
                
                # Format deadline and end_date
                try:
                    deadline_iso = row[17].isoformat() if row[17] else None
                except Exception:
                    deadline_iso = None
                try:
                    end_date_iso = row[18].isoformat() if row[18] else None
                except Exception:
                    end_date_iso = None

                rounds_data.append({
                    "id": row[0],
                    "round_code": str(row[1]) if row[1] is not None else None,
                    "title": str(row[2]) if row[2] is not None else None,
                    "description": str(row[3]) if row[3] is not None else None,
                    "round_type": str(row[4]) if row[4] is not None else None,
                    "department": str(row[5]) if row[5] is not None else None,
                    "status": str(row[6]) if row[6] is not None else None,
                    "priority": str(row[7]) if row[7] is not None else None,
                    "scheduled_date": scheduled_iso,
                    "created_at": created_iso,
                    "assigned_to": assigned_to_str,
                    "created_by_id": row[11],
                    "compliance_percentage": row[12] if row[12] is not None else 0,
                    "completion_percentage": row[13] if row[13] is not None else 0,
                    "selected_categories": selected_categories,
                    "evaluation_items": evaluation_items,
                    "assigned_to_ids": assigned_to_ids,
                    "deadline": deadline_iso,
                    "end_date": end_date_iso,
                    "notes": str(row[19]) if row[19] is not None else None
                })
            except Exception as e:
                # Log per-row error and continue with placeholder so the API doesn't 500
                print(f"❌ [API] Error serializing round id={row[0] if row is not None else 'unknown'}: {e}")
                traceback.print_exc()
                rounds_data.append({
                    "id": row[0] if row is not None else None,
                    "round_code": row[1] if row is not None else None,
                    "title": None,
                    "description": None,
                    "round_type": None,
                    "department": None,
                    "status": None,
                    "priority": None,
                    "scheduled_date": None,
                    "created_at": None,
                    "assigned_to": '[]',
                    "created_by_id": row[11] if row is not None else None,
                    "_error": str(e)
                })
        
        print(f"✅ [API] Successfully fetched {len(rounds_data)} rounds")
        
        # Log first few rounds for debugging
        if rounds_data:
            print(f"📋 [API] First round: ID={rounds_data[0]['id']}, Title={rounds_data[0]['title']}")
        
        # Return raw JSONResponse to avoid pydantic response_model validation errors
        return JSONResponse(content=rounds_data)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [API] Error fetching rounds: {str(e)}")
        print(f"❌ [API] Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"خطأ في تحميل الجولات من قاعدة البيانات: {str(e)}")

@app.get("/api/rounds/my", response_model=List[RoundResponse])
async def get_my_rounds(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Get rounds assigned to the current user"""
    print(f"🔍 API: Getting rounds for user ID: {current_user.id}")
    rounds = get_rounds_by_user(db, current_user.id, skip=skip, limit=limit)
    print(f"📊 API: Returning {len(rounds)} rounds")
    return rounds


@app.get("/api/rounds/my/stats")
async def get_my_rounds_stats(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Get comprehensive statistics for rounds assigned to the current user"""
    try:
        print(f"📊 API: Getting stats for user ID: {current_user.id}")
        
        # Get all rounds for the user (without pagination to get full stats)
        rounds = get_rounds_by_user(db, current_user.id, skip=0, limit=1000)
        
        if not rounds:
            return {
                "total": 0,
                "completed": 0,
                "in_progress": 0,
                "overdue": 0,
                "scheduled": 0,
                "avg_completion": 0,
                "avg_compliance": 0,
                "high_priority": 0
            }
        
        # حساب الإحصائيات الأساسية
        completed = [r for r in rounds if r.status == 'completed']
        in_progress = [r for r in rounds if r.status == 'in_progress']
        overdue = [r for r in rounds if r.status == 'overdue']
        scheduled = [r for r in rounds if r.status == 'scheduled']
        high_priority = [r for r in rounds if r.priority in ['urgent', 'high']]
        
        # حساب المتوسطات
        avg_completion = round(
            sum(r.completion_percentage or 0 for r in rounds) / len(rounds)
        ) if rounds else 0
        
        # حساب متوسط الامتثال للجولات المكتملة فقط
        completed_with_compliance = [r for r in completed if r.compliance_percentage is not None]
        avg_compliance = round(
            sum(r.compliance_percentage for r in completed_with_compliance) / len(completed_with_compliance)
        ) if completed_with_compliance else 0
        
        stats = {
            "total": len(rounds),
            "completed": len(completed),
            "in_progress": len(in_progress),
            "overdue": len(overdue),
            "scheduled": len(scheduled),
            "avg_completion": avg_completion,
            "avg_compliance": avg_compliance,
            "high_priority": len(high_priority)
        }
        # Additional CAPA-related counts
        try:
            from models_updated import EvaluationResult, Capa
            round_ids = [r.id for r in rounds]
            needs_capa_count = 0
            open_capa_count = 0
            if round_ids:
                needs_capa_count = db.query(EvaluationResult).filter(
                    EvaluationResult.round_id.in_(round_ids),
                    EvaluationResult.needs_capa == True
                ).count()

                open_capa_count = db.query(Capa).filter(
                    Capa.round_id.in_(round_ids),
                    Capa.status.in_(['pending', 'in_progress', 'assigned'])
                ).count()

            stats["needs_capa_count"] = int(needs_capa_count)
            stats["open_capa_count"] = int(open_capa_count)
        except Exception as e:
            print(f"Warning calculating CAPA stats: {e}")
            stats["needs_capa_count"] = 0
            stats["open_capa_count"] = 0
        
        print(f"✅ Stats calculated: {stats}")
        return stats
        
    except Exception as e:
        print(f"❌ Error calculating stats: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"خطأ في حساب الإحصائيات: {str(e)}")


# Round types endpoints
@app.get("/api/round_types", response_model=List[RoundTypeResponse])
async def list_round_types(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        types = get_round_types(db, skip=skip, limit=limit)
        return types
    except Exception as e:
        print(f"❌ [API] Error fetching round types: {e}")
        raise HTTPException(status_code=500, detail="فشل في جلب أنواع الجولات")


@app.post("/api/round_types", response_model=RoundTypeResponse)
async def create_round_type_endpoint(payload: dict = Body(...), db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Only allow super_admin or quality_manager to create types
    if current_user.role not in ["super_admin", "quality_manager"]:
        raise HTTPException(status_code=403, detail="ليس لديك صلاحية لإضافة نوع جولة")
    try:
        rt = create_round_type(db, payload)
        return rt
    except Exception as e:
        print(f"❌ [API] Error creating round type: {e}")
        raise HTTPException(status_code=500, detail="فشل في إنشاء نوع الجولة")


@app.put("/api/round_types/{type_id}", response_model=RoundTypeResponse)
async def update_round_type_endpoint(type_id: int, payload: dict = Body(...), db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role not in ["super_admin", "quality_manager"]:
        raise HTTPException(status_code=403, detail="ليس لديك صلاحية لتعديل نوع الجولة")
    try:
        rt = update_round_type(db, type_id, payload)
        if not rt:
            raise HTTPException(status_code=404, detail="نوع الجولة غير موجود")
        return rt
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [API] Error updating round type: {e}")
        raise HTTPException(status_code=500, detail="فشل في تحديث نوع الجولة")


@app.delete("/api/round_types/{type_id}")
async def delete_round_type_endpoint(type_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role not in ["super_admin", "quality_manager"]:
        raise HTTPException(status_code=403, detail="ليس لديك صلاحية لحذف نوع الجولة")
    try:
        rt = delete_round_type(db, type_id)
        if not rt:
            raise HTTPException(status_code=404, detail="نوع الجولة غير موجود")
        return {"status": "success", "message": "تم حذف نوع الجولة"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [API] Error deleting round type: {e}")
        raise HTTPException(status_code=500, detail="فشل في حذف نوع الجولة")

@app.get("/api/rounds/{round_id}", response_model=RoundResponse)
async def get_round_endpoint(round_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Get a specific round by ID"""
    round_data = get_round_by_id(db, round_id)
    if not round_data:
        raise HTTPException(status_code=404, detail="Round not found")
    return round_data

@app.put("/api/rounds/{round_id}", response_model=RoundResponse)
async def update_round_endpoint(round_id: int, round_data: dict = Body(...), db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Update an existing round"""
    updated_round = update_round(db, round_id, round_data)
    if not updated_round:
        raise HTTPException(status_code=404, detail="Round not found")
    return updated_round

@app.delete("/api/rounds/{round_id}")
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
@app.post("/api/rounds/{round_id}/evaluations")
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
@app.post("/api/rounds/{round_id}/evaluations/draft")
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


@app.get("/api/rounds/{round_id}/evaluations", response_model=List[EvaluationResultResponse])
async def get_round_evaluations_endpoint(round_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Return saved evaluation results for a round"""
    try:
        results = get_evaluation_results_by_round(db, round_id)
        return results
    except Exception as e:
        print(f"Error in get_round_evaluations_endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint to finalize evaluation (mark as completed)
@app.post("/api/rounds/{round_id}/evaluations/finalize")
async def finalize_evaluation_endpoint(round_id: int, payload: dict = Body(...), db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Finalize evaluation and mark round as completed.
    Accepts payload: { evaluations: [{item_id, status, comments?, evidence_files?}], notes? }
    """
    try:
        evaluations = payload.get('evaluations') or []
        created, updated_round = create_evaluation_results(db, round_id, evaluations, current_user.id, finalize=True)
        if updated_round is None:
            raise HTTPException(status_code=400, detail="Evaluation models unavailable or round not found")
        
        # Create CAPA items in DB for evaluations not fully applied
        created_capas = []
        try:
            from crud import create_capas_for_round_non_compliance
            capa_result = create_capas_for_round_non_compliance(db, round_id, current_user.id, threshold=70)
            if capa_result and capa_result.get('created_capas'):
                created_capas = capa_result['created_capas']
        except Exception as e:
            print(f"❌ Error while creating CAPAs on finalize: {e}")

        # Round status is already set to completed by create_evaluation_results
        
        return {"created": len(created), "round_id": updated_round.id, "compliance_percentage": updated_round.compliance_percentage, "completion_percentage": updated_round.completion_percentage, "status": updated_round.status, "created_capas": created_capas}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in finalize_evaluation_endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# CAPA endpoints
@app.post("/api/capa", response_model=CapaResponse)
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

@app.get("/api/capa", response_model=List[CapaResponse])
async def get_all_capas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Get CAPAs filtered to show only those linked to non-compliant evaluation items"""
    capas = get_capas(db, skip=skip, limit=limit)
    return capas

@app.get("/api/capa/all", response_model=List[CapaResponse])
async def get_all_capas_unfiltered_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Get all CAPAs without filtering - for admin purposes only"""
    if current_user.role not in ["super_admin", "quality_manager"]:
        raise HTTPException(status_code=403, detail="ليس لديك صلاحية لعرض جميع خطط التصحيح")
    
    capas = get_all_capas_unfiltered(db, skip=skip, limit=limit)
    return capas

@app.get("/api/capa/{capa_id}", response_model=CapaResponse)
async def get_capa_by_id_endpoint(capa_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Get a single CAPA by ID with evaluation item details"""
    capa = get_capa_by_id(db, capa_id)
    if not capa:
        raise HTTPException(status_code=404, detail="خطة التصحيح غير موجودة")
    
    return capa

@app.patch("/capa/{capa_id}", response_model=CapaResponse)
async def update_capa_endpoint(capa_id: int, capa_data: CapaCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Update a CAPA by ID"""
    # Check if CAPA exists
    existing_capa = get_capa_by_id(db, capa_id)
    if not existing_capa:
        raise HTTPException(status_code=404, detail="خطة التصحيح غير موجودة")
    
    # Update the CAPA
    updated_capa = update_capa(db, capa_id, capa_data)
    if not updated_capa:
        raise HTTPException(status_code=500, detail="فشل في تحديث خطة التصحيح")
    
    return updated_capa

@app.delete("/api/capa/all")
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

@app.delete("/api/capa/{capa_id}")
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
@app.get("/api/users", response_model=List[UserResponse])
async def get_all_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Check if user has permission to view users (super_admin or quality_manager only)
    if current_user.role not in ["super_admin", "quality_manager"]:
        raise HTTPException(
            status_code=403,
            detail="ليس لديك صلاحية لعرض المستخدمين. هذه الصلاحية محصورة على مدير النظام ومدير الجودة فقط."
        )
    users = get_users(db, skip=skip, limit=limit)
    return users

@app.post("/api/users", response_model=UserResponse)
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

@app.get("/api/users/{user_id}", response_model=UserResponse)
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

@app.put("/api/users/{user_id}", response_model=UserResponse)
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

@app.delete("/api/users/{user_id}")
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

@app.post("/api/users/{user_id}/send-welcome-email")
async def send_welcome_email(user_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """إرسال إيميل ترحيبي للمستخدم"""
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    # TODO: Implement actual email sending functionality
    # For now, just return success message
    return {"message": f"تم إرسال إيميل ترحيبي إلى {user.email}"}

# Department endpoints
@app.post("/api/departments", response_model=DepartmentResponse)
async def create_new_department(department: DepartmentCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return create_department(db, department)

@app.get("/api/departments", response_model=List[DepartmentResponse])
async def get_all_departments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    departments = get_departments(db, skip=skip, limit=limit)
    return departments

@app.get("/api/departments/{department_id}", response_model=DepartmentResponse)
async def get_department(department_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    department = get_department_by_id(db, department_id)
    if not department:
        raise HTTPException(status_code=404, detail="القسم غير موجود")
    return department

@app.put("/api/departments/{department_id}", response_model=DepartmentResponse)
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

@app.delete("/api/departments/{department_id}")
async def delete_department_endpoint(department_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    deleted_department = delete_department(db, department_id)
    if not deleted_department:
        raise HTTPException(status_code=404, detail="القسم غير موجود")
    return {"message": "تم حذف القسم بنجاح"}

# Evaluation Categories endpoints
@app.post("/api/evaluation-categories", response_model=EvaluationCategoryResponse)
async def create_evaluation_category_endpoint(category: EvaluationCategoryCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    category_data = category.dict()
    return create_evaluation_category(db, category_data)

@app.get("/api/evaluation-categories", response_model=List[EvaluationCategoryResponse])
async def get_evaluation_categories_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    categories = get_evaluation_categories(db, skip=skip, limit=limit)
    return categories

@app.get("/api/evaluation-categories/{category_id}", response_model=EvaluationCategoryResponse)
async def get_evaluation_category_endpoint(category_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    category = get_evaluation_category_by_id(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="تصنيف التقييم غير موجود")
    return category

@app.put("/api/evaluation-categories/{category_id}", response_model=EvaluationCategoryResponse)
async def update_evaluation_category_endpoint(category_id: int, category: EvaluationCategoryCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    category_data = category.dict()
    updated_category = update_evaluation_category(db, category_id, category_data)
    if not updated_category:
        raise HTTPException(status_code=404, detail="تصنيف التقييم غير موجود")
    return updated_category

@app.delete("/api/evaluation-categories/{category_id}")
async def delete_evaluation_category_endpoint(category_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    deleted_category = delete_evaluation_category(db, category_id)
    if not deleted_category:
        raise HTTPException(status_code=404, detail="تصنيف التقييم غير موجود")
    return {"message": "تم حذف تصنيف التقييم بنجاح"}

# Evaluation Items endpoints
@app.post("/api/evaluation-items", response_model=EvaluationItemResponse)
async def create_evaluation_item_endpoint(item: EvaluationItemCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    item_data = item.dict()
    return create_evaluation_item(db, item_data)

@app.get("/api/evaluation-items", response_model=List[EvaluationItemResponse])
async def get_evaluation_items_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    items = get_evaluation_items(db, skip=skip, limit=limit)
    return items

@app.get("/api/evaluation-items/{item_id}", response_model=EvaluationItemResponse)
async def get_evaluation_item_endpoint(item_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    item = get_evaluation_item_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="عنصر التقييم غير موجود")
    return item

@app.put("/api/evaluation-items/{item_id}", response_model=EvaluationItemResponse)
async def update_evaluation_item_endpoint(item_id: int, item: EvaluationItemCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    item_data = item.dict()
    updated_item = update_evaluation_item(db, item_id, item_data)
    if not updated_item:
        raise HTTPException(status_code=404, detail="عنصر التقييم غير موجود")
    return updated_item

@app.delete("/api/evaluation-items/{item_id}")
async def delete_evaluation_item_endpoint(item_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    deleted_item = delete_evaluation_item(db, item_id)
    if not deleted_item:
        raise HTTPException(status_code=404, detail="عنصر التقييم غير موجود")
    return {"message": "تم حذف عنصر التقييم بنجاح"}

@app.get("/api/evaluation-items/category/{category_id}", response_model=List[EvaluationItemResponse])
async def get_evaluation_items_by_category_endpoint(category_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    items = get_evaluation_items_by_category(db, category_id, skip=skip, limit=limit)
    return items

# Assessors endpoints
@app.get("/api/assessors")
async def get_assessors_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    assessors = get_assessors(db, skip=skip, limit=limit)
    return assessors

# Objective Options endpoints
@app.post("/api/objective-options", response_model=ObjectiveOptionResponse)
async def create_objective_option_endpoint(
    objective_option: ObjectiveOptionCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    """إنشاء خيار ارتباط جديد"""
    db_objective_option = create_objective_option(db, objective_option.dict())
    return db_objective_option

@app.get("/api/objective-options", response_model=List[ObjectiveOptionResponse])
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

@app.get("/api/objective-options/{objective_option_id}", response_model=ObjectiveOptionResponse)
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

@app.put("/api/objective-options/{objective_option_id}", response_model=ObjectiveOptionResponse)
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

@app.delete("/api/objective-options/{objective_option_id}")
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
@app.get("/api/audit-logs", response_model=List[AuditLogResponse])
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

@app.get("/api/audit-logs/user/{user_id}", response_model=List[AuditLogResponse])
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

@app.get("/api/audit-logs/entity/{entity_type}/{entity_id}", response_model=List[AuditLogResponse])
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
@app.get("/api/notifications", response_model=List[NotificationResponse])
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

@app.get("/api/notifications/unread-count")
async def get_unread_notifications_count(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """الحصول على عدد الإشعارات غير المقروءة"""
    count = get_unread_notifications_count(db, current_user.id)
    return {"unread_count": count}

@app.put("/api/notifications/{notification_id}/read")
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

@app.put("/api/notifications/mark-all-read")
async def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """تحديد جميع الإشعارات كمقروءة"""
    count = mark_all_notifications_as_read(db, current_user.id)
    return {"message": f"تم تحديد {count} إشعار كمقروء"}

@app.delete("/api/notifications/{notification_id}")
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
@app.get("/api/notification-settings", response_model=UserNotificationSettingsResponse)
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

@app.put("/api/notification-settings", response_model=UserNotificationSettingsResponse)
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
@app.get("/api/round-types", response_model=List[RoundTypeResponse])
async def get_round_types_endpoint(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """الحصول على قائمة أنواع الجولات (علني - لا يتطلب مصادقة)"""
    try:
        return get_round_types(db, skip=skip, limit=limit)
    except Exception as e:
        print(f"❌ [API] Error listing round types: {e}")
        raise HTTPException(status_code=500, detail="فشل في جلب أنواع الجولات")

@app.post("/api/round-types", response_model=RoundTypeResponse)
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

@app.get("/api/round-types/{round_type_id}", response_model=RoundTypeResponse)
async def get_round_type_endpoint(
    round_type_id: int,
    db: Session = Depends(get_db),
):
    """الحصول على نوع جولة محدد (علني - لا يتطلب مصادقة)"""
    try:
        round_type = get_round_type_by_id(db, round_type_id)
        if not round_type:
            raise HTTPException(status_code=404, detail="نوع الجولة غير موجود")
        return round_type
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [API] Error fetching round type id={round_type_id}: {e}")
        raise HTTPException(status_code=500, detail="فشل في جلب نوع الجولة")

@app.put("/api/round-types/{round_type_id}", response_model=RoundTypeResponse)
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

@app.delete("/api/round-types/{round_type_id}")
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


# Enhanced CAPA endpoints with new features
@app.post("/api/capas", response_model=dict)
async def create_enhanced_capa(
    capa: CapaCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new enhanced CAPA plan"""
    # Check permissions - only quality managers and super admins can create CAPAs
    if current_user.role not in ["quality_manager", "super_admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only quality managers and super admins can create CAPA plans"
        )
    
    # Convert Pydantic models to JSON strings for database storage
    import json
    import datetime

    def safe_serialize_actions(actions):
        out = []
        for a in actions:
            if hasattr(a, 'dict'):
                item = a.dict()
            elif hasattr(a, 'model_dump'):
                item = a.model_dump()
            else:
                item = dict(a) if isinstance(a, (list, tuple)) else a

            # Convert datetime objects to isoformat
            for k, v in list(item.items()):
                if isinstance(v, datetime.datetime):
                    item[k] = v.isoformat()
            out.append(item)
        return json.dumps(out)

    corrective_actions_json = safe_serialize_actions(capa.corrective_actions or [])
    preventive_actions_json = safe_serialize_actions(capa.preventive_actions or [])
    verification_steps_json = safe_serialize_actions(capa.verification_steps or [])
    
    # Create CAPA data dict
    capa_data = {
        "title": capa.title,
        "description": capa.description,
        "round_id": capa.round_id,
        "department": capa.department,
        "assigned_to_id": capa.assigned_to_id,
        "root_cause": capa.root_cause,
        "corrective_actions": corrective_actions_json,
        "preventive_actions": preventive_actions_json,
        "verification_steps": verification_steps_json,
        "severity": capa.severity,
        "estimated_cost": capa.estimated_cost,
        "sla_days": capa.sla_days,
    }
    
    # Create CAPA in database
    db_capa = create_capa(db, capa_data, current_user.id)
    
    # Create audit log
    create_audit_log(db, {
        "user_id": current_user.id,
        "action": "create_capa",
        "entity_type": "capa",
        "entity_id": db_capa.id,
        "new_values": json.dumps({"title": db_capa.title, "department": db_capa.department})
    })
    
    return {
        "status": "success",
        "message": "CAPA plan created successfully",
        "capa_id": db_capa.id,
        "capa": {
            "id": db_capa.id,
            "title": db_capa.title,
            "description": db_capa.description,
            "department": db_capa.department,
            "severity": db_capa.severity,
            "verification_status": db_capa.verification_status,
            "created_at": db_capa.created_at
        }
    }

@app.put("/api/capas/{capa_id}")
async def update_enhanced_capa(
    capa_id: int,
    capa_update: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing enhanced CAPA plan"""
    # Check permissions - only quality managers and super admins can update CAPAs
    if current_user.role not in ["quality_manager", "super_admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only quality managers and super admins can update CAPA plans"
        )
    
    # Get existing CAPA
    existing_capa = get_capa_by_id(db, capa_id)
    if not existing_capa:
        raise HTTPException(status_code=404, detail="CAPA plan not found")
    
    # Convert Pydantic models to JSON strings for database storage
    import json
    import datetime

    def safe_serialize_actions(actions):
        if not actions:
            return "[]"
        out = []
        for a in actions:
            if hasattr(a, 'dict'):
                item = a.dict()
            elif hasattr(a, 'model_dump'):
                item = a.model_dump()
            else:
                item = dict(a) if isinstance(a, (list, tuple)) else a
            out.append(item)
        return json.dumps(out, ensure_ascii=False)

    # Prepare data for database
    db_data = {
        "title": capa_update.get("title", existing_capa.title),
        "description": capa_update.get("description", existing_capa.description),
        "department": capa_update.get("department", existing_capa.department),
        "priority": capa_update.get("priority", existing_capa.priority),
        "status": capa_update.get("status", existing_capa.status),
        "assigned_to": capa_update.get("assigned_to", existing_capa.assigned_to),
        "assigned_to_id": capa_update.get("assigned_to_id", existing_capa.assigned_to_id),
        "evaluation_item_id": capa_update.get("evaluation_item_id", existing_capa.evaluation_item_id),
        "target_date": capa_update.get("target_date", existing_capa.target_date),
        "root_cause": capa_update.get("root_cause", existing_capa.root_cause),
        "corrective_actions": safe_serialize_actions(capa_update.get("corrective_actions", [])),
        "preventive_actions": safe_serialize_actions(capa_update.get("preventive_actions", [])),
        "verification_steps": safe_serialize_actions(capa_update.get("verification_steps", [])),
        "verification_status": capa_update.get("verification_status", existing_capa.verification_status),
        "severity": capa_update.get("severity", existing_capa.severity),
        "estimated_cost": capa_update.get("estimated_cost", existing_capa.estimated_cost),
        "sla_days": capa_update.get("sla_days", existing_capa.sla_days),
        "escalation_level": capa_update.get("escalation_level", existing_capa.escalation_level)
    }

    # Update CAPA in database
    try:
        updated_capa = update_capa(db, capa_id, db_data)
        if not updated_capa:
            raise HTTPException(status_code=404, detail="CAPA plan not found")
        
        return {
            "status": "success",
            "message": "CAPA plan updated successfully",
            "capa_id": updated_capa.id,
            "capa": {
                "id": updated_capa.id,
                "title": updated_capa.title,
                "description": updated_capa.description,
                "department": updated_capa.department,
                "severity": updated_capa.severity,
                "verification_status": updated_capa.verification_status
            }
        }
    except Exception as e:
        print(f"Error updating CAPA: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update CAPA: {str(e)}")

@app.get("/api/capas/{capa_id}", response_model=dict)
async def get_enhanced_capa(
    capa_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific enhanced CAPA plan by ID"""
    capa = get_capa_by_id(db, capa_id)
    if not capa:
        raise HTTPException(status_code=404, detail="CAPA plan not found")
    
    # Serialize JSON fields - prefer table data over JSON if available
    import json
    
    # Check if actions were loaded from table
    corrective_actions = getattr(capa, 'corrective_actions_from_table', None)
    if corrective_actions is None:
        try:
            corrective_actions = json.loads(capa.corrective_actions) if capa.corrective_actions else []
        except (json.JSONDecodeError, TypeError):
            corrective_actions = []
    
    preventive_actions = getattr(capa, 'preventive_actions_from_table', None)
    if preventive_actions is None:
        try:
            preventive_actions = json.loads(capa.preventive_actions) if capa.preventive_actions else []
        except (json.JSONDecodeError, TypeError):
            preventive_actions = []
    
    verification_steps = getattr(capa, 'verification_steps_from_table', None)
    if verification_steps is None:
        try:
            verification_steps = json.loads(capa.verification_steps) if capa.verification_steps else []
        except (json.JSONDecodeError, TypeError):
            verification_steps = []
    
    try:
        status_history = json.loads(capa.status_history) if capa.status_history else []
    except (json.JSONDecodeError, TypeError):
        status_history = []
    
    return {
        "status": "success",
        "capa": {
            "id": capa.id,
            "title": capa.title,
            "description": capa.description,
            "round_id": capa.round_id,
            "department": capa.department,
            "priority": capa.priority,
            "status": capa.status,
            "assigned_to": capa.assigned_to,
            "assigned_to_id": capa.assigned_to_id,
            "evaluation_item_id": capa.evaluation_item_id,
            "target_date": capa.target_date,
            "risk_score": capa.risk_score,
            "root_cause": capa.root_cause,
            "corrective_actions": corrective_actions,
            "preventive_actions": preventive_actions,
            "verification_steps": verification_steps,
            "verification_status": capa.verification_status,
            "severity": capa.severity,
            "estimated_cost": float(capa.estimated_cost) if capa.estimated_cost else None,
            "sla_days": capa.sla_days,
            "escalation_level": capa.escalation_level,
            "closed_at": capa.closed_at,
                "verified_at": getattr(capa, 'verified_at', None),
            "status_history": status_history,
            "created_by_id": capa.created_by_id,
            "created_at": capa.created_at,
        }
    }

@app.get("/api/capas", response_model=dict)
async def get_enhanced_capas(
    skip: int = 0,
    limit: int = 100,
    department: Optional[str] = None,
    status: Optional[str] = None,
    severity: Optional[int] = None,
    verification_status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get enhanced CAPA plans with optional filtering"""
    # Build query
    from models_updated import Capa
    query = db.query(Capa)
    
    # Apply filters
    if department:
        query = query.filter(Capa.department == department)
    if status:
        query = query.filter(Capa.status == status)
    if severity:
        query = query.filter(Capa.severity == severity)
    if verification_status:
        query = query.filter(Capa.verification_status == verification_status)
    
    # Get total count
    total_count = query.count()
    
    # Apply pagination
    capas = query.offset(skip).limit(limit).all()
    
    # Serialize results
    import json
    serialized_capas = []
    for capa in capas:
        try:
            corrective_actions = json.loads(capa.corrective_actions) if capa.corrective_actions else []
        except (json.JSONDecodeError, TypeError):
            corrective_actions = []
        
        try:
            preventive_actions = json.loads(capa.preventive_actions) if capa.preventive_actions else []
        except (json.JSONDecodeError, TypeError):
            preventive_actions = []
        
        try:
            verification_steps = json.loads(capa.verification_steps) if capa.verification_steps else []
        except (json.JSONDecodeError, TypeError):
            verification_steps = []
        
        serialized_capas.append({
            "id": capa.id,
            "title": capa.title,
            "description": capa.description,
            "department": capa.department,
            "priority": capa.priority,
            "status": capa.status,
            "verification_status": capa.verification_status,
            "severity": capa.severity,
            "target_date": capa.target_date,
            "escalation_level": capa.escalation_level,
            "corrective_actions": corrective_actions,
            "preventive_actions": preventive_actions,
            "verification_steps": verification_steps,
            "created_at": capa.created_at,
        })
    
    return {
        "status": "success",
        "capas": serialized_capas,
        "total_count": total_count,
        "skip": skip,
        "limit": limit
    }

@app.get("/api/capas/dashboard/stats", response_model=dict)
async def get_capa_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get CAPA dashboard statistics"""
    # Execute the view query
    result = db.execute("SELECT * FROM capa_dashboard_stats").fetchone()
    
    if not result:
        return {
            "status": "success",
            "stats": {
                "total_capas": 0,
                "pending_capas": 0,
                "in_review_capas": 0,
                "verified_capas": 0,
                "rejected_capas": 0,
                "overdue_capas": 0,
                "escalated_capas": 0,
                "avg_severity": 0,
                "avg_escalation_level": 0
            }
        }
    
    return {
        "status": "success",
        "stats": {
            "total_capas": result[0],
            "pending_capas": result[1],
            "in_review_capas": result[2],
            "verified_capas": result[3],
            "rejected_capas": result[4],
            "low_severity_capas": result[5],
            "medium_low_severity_capas": result[6],
            "medium_severity_capas": result[7],
            "high_severity_capas": result[8],
            "critical_severity_capas": result[9],
            "overdue_capas": result[10],
            "escalated_capas": result[11],
            "avg_severity": float(result[12]) if result[12] else 0,
            "avg_escalation_level": float(result[13]) if result[13] else 0
        }
    }

# Reports endpoints
@app.get("/api/reports/dashboard/stats", response_model=dict)
async def get_reports_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive dashboard statistics for reports"""
    try:
        # Get rounds statistics
        total_rounds = db.query(Round).count()
        completed_rounds = db.query(Round).filter(Round.status == "completed").count()
        in_progress_rounds = db.query(Round).filter(Round.status == "in_progress").count()
        pending_rounds = db.query(Round).filter(Round.status == "pending_review").count()
        overdue_rounds = db.query(Round).filter(Round.status == "overdue").count()
        
        # Get CAPA statistics
        total_capas = db.query(Capa).count()
        pending_capas = db.query(Capa).filter(Capa.status == "pending").count()
        in_progress_capas = db.query(Capa).filter(Capa.status == "in_progress").count()
        implemented_capas = db.query(Capa).filter(Capa.status == "implemented").count()
        
        # Get departments statistics
        total_departments = db.query(Department).count()
        active_departments = db.query(Department).filter(Department.is_active == True).count()
        
        # Get users statistics
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.is_active == True).count()
        
        # Calculate compliance rate (based on completed rounds with compliance percentage)
        completed_rounds_with_compliance = db.query(Round).filter(
            Round.status == "completed",
            Round.compliance_percentage.isnot(None)
        ).all()
        
        if completed_rounds_with_compliance:
            avg_compliance = sum(round.compliance_percentage for round in completed_rounds_with_compliance) / len(completed_rounds_with_compliance)
        else:
            avg_compliance = 0
        
        return {
            "rounds": {
                "total": total_rounds,
                "completed": completed_rounds,
                "in_progress": in_progress_rounds,
                "pending": pending_rounds,
                "overdue": overdue_rounds
            },
            "capas": {
                "total": total_capas,
                "pending": pending_capas,
                "in_progress": in_progress_capas,
                "implemented": implemented_capas
            },
            "departments": {
                "total": total_departments,
                "active": active_departments
            },
            "users": {
                "total": total_users,
                "active": active_users
            },
            "compliance_rate": round(avg_compliance, 2)
        }
    except Exception as e:
        print(f"Error getting reports dashboard stats: {e}")
        raise HTTPException(status_code=500, detail=f"خطأ في جلب إحصائيات التقارير: {str(e)}")

# =====================================================
# CAPA Dashboard Endpoints
# =====================================================

@app.get("/api/dashboard/stats/")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get CAPA dashboard statistics"""
    try:
        # Query the view for dashboard stats
        result = db.execute(text("SELECT * FROM capa_dashboard_stats")).fetchone()
        
        if not result:
            return {
                "total_capas": 0,
                "overdue_capas": 0,
                "completed_this_month": 0,
                "critical_pending": 0,
                "average_completion_time": 0,
                "cost_savings": 0
            }
        
        return {
            "total_capas": result[0] or 0,
            "overdue_capas": result[1] or 0,
            "completed_this_month": result[2] or 0,
            "critical_pending": result[3] or 0,
            "average_completion_time": float(result[4]) if result[4] else 0,
            "cost_savings": result[5] or 0
        }
    except Exception as e:
        print(f"Error getting dashboard stats: {e}")
        raise HTTPException(status_code=500, detail=f"خطأ في جلب إحصائيات الداشبورد: {str(e)}")

@app.get("/api/dashboard/overdue/")
async def get_overdue_actions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get overdue CAPA actions"""
    try:
        # Query overdue actions
        query = text("""
            SELECT 
                ca.id,
                ca.task,
                ca.due_date,
                ca.status,
                ca.capa_id,
                c.title as capa_title,
                ca.assigned_to,
                ca.action_type
            FROM capa_actions ca
            JOIN capas c ON c.id = ca.capa_id
            WHERE ca.due_date < NOW()
            AND ca.status NOT IN ('completed', 'cancelled')
            ORDER BY ca.due_date ASC
        """)
        
        results = db.execute(query).fetchall()
        
        # Organize by action type
        corrective_actions = []
        preventive_actions = []
        verification_steps = []
        
        for row in results:
            action_data = {
                "id": row[0],
                "task": row[1],
                "due_date": row[2].isoformat() if row[2] else None,
                "status": row[3],
                "capa_id": row[4],
                "capa_title": row[5],
                "assigned_to": row[6]
            }
            
            if row[7] == 'corrective':
                corrective_actions.append(action_data)
            elif row[7] == 'preventive':
                preventive_actions.append(action_data)
            elif row[7] == 'verification':
                verification_steps.append(action_data)
        
        return {
            "corrective_actions": corrective_actions,
            "preventive_actions": preventive_actions,
            "verification_steps": verification_steps
        }
    except Exception as e:
        print(f"Error getting overdue actions: {e}")
        raise HTTPException(status_code=500, detail=f"خطأ في جلب الإجراءات المتأخرة: {str(e)}")

@app.get("/api/dashboard/upcoming/")
async def get_upcoming_deadlines(
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get upcoming deadlines within specified days"""
    try:
        query = text("""
            SELECT 
                ca.id,
                ca.task,
                ca.due_date,
                ca.status,
                ca.capa_id,
                c.title as capa_title,
                ca.assigned_to,
                ca.action_type
            FROM capa_actions ca
            JOIN capas c ON c.id = ca.capa_id
            WHERE ca.due_date BETWEEN NOW() AND NOW() + INTERVAL ':days days'
            AND ca.status NOT IN ('completed', 'cancelled')
            ORDER BY ca.due_date ASC
        """.replace(':days', str(days)))
        
        results = db.execute(query).fetchall()
        
        # Organize by action type
        corrective_actions = []
        preventive_actions = []
        verification_steps = []
        
        for row in results:
            action_data = {
                "id": row[0],
                "task": row[1],
                "due_date": row[2].isoformat() if row[2] else None,
                "status": row[3],
                "capa_id": row[4],
                "capa_title": row[5],
                "assigned_to": row[6]
            }
            
            if row[7] == 'corrective':
                corrective_actions.append(action_data)
            elif row[7] == 'preventive':
                preventive_actions.append(action_data)
            elif row[7] == 'verification':
                verification_steps.append(action_data)
        
        return {
            "corrective_actions": corrective_actions,
            "preventive_actions": preventive_actions,
            "verification_steps": verification_steps
        }
    except Exception as e:
        print(f"Error getting upcoming deadlines: {e}")
        raise HTTPException(status_code=500, detail=f"خطأ في جلب المواعيد القادمة: {str(e)}")

# =====================================================
# Actions Endpoints
# =====================================================

@app.get("/api/actions/")
async def get_actions(
    capa_id: Optional[int] = None,
    action_type: Optional[str] = None,
    assigned_to_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get actions with optional filters"""
    try:
        # Build query with filters
        where_clauses = []
        params = {}
        
        if capa_id:
            where_clauses.append("ca.capa_id = :capa_id")
            params['capa_id'] = capa_id
        
        if action_type:
            where_clauses.append("ca.action_type = :action_type")
            params['action_type'] = action_type
        
        if assigned_to_id:
            where_clauses.append("ca.assigned_to_id = :assigned_to_id")
            params['assigned_to_id'] = assigned_to_id
        
        where_clause = " AND " + " AND ".join(where_clauses) if where_clauses else ""
        
        query = text(f"""
            SELECT 
                ca.id,
                ca.task,
                ca.description,
                ca.assigned_to,
                ca.due_date,
                ca.status,
                ca.completion_percentage,
                ca.capa_id,
                c.title as capa_title,
                ca.action_type,
                ca.notes
            FROM capa_actions ca
            JOIN capas c ON c.id = ca.capa_id
            {where_clause}
            ORDER BY ca.due_date ASC
        """)
        
        results = db.execute(query, params).fetchall()
        
        actions = []
        for row in results:
            actions.append({
                "id": row[0],
                "task": row[1],
                "description": row[2],
                "assigned_to": row[3],
                "due_date": row[4].isoformat() if row[4] else None,
                "status": row[5],
                "completion_percentage": row[6] or 0,
                "capa_id": row[7],
                "capa_title": row[8],
                "type": row[9],
                "notes": row[10]
            })
        
        return actions
    except Exception as e:
        print(f"Error getting actions: {e}")
        raise HTTPException(status_code=500, detail=f"خطأ في جلب الإجراءات: {str(e)}")

@app.put("/api/actions/{action_id}")
async def update_action(
    action_id: int,
    data: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update action status and progress"""
    try:
        # Build update query
        update_fields = []
        params = {"action_id": action_id}
        
        if "status" in data:
            update_fields.append("status = :status")
            params['status'] = data['status']
        
        if "completion_percentage" in data:
            update_fields.append("completion_percentage = :completion_percentage")
            params['completion_percentage'] = data['completion_percentage']
        
        if "notes" in data:
            update_fields.append("notes = :notes")
            params['notes'] = data['notes']
        
        if data.get('status') == 'completed':
            update_fields.append("completed_at = NOW()")
            update_fields.append("completed_by_id = :user_id")
            params['user_id'] = current_user.id
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="لا توجد حقول للتحديث")
        
        update_query = text(f"""
            UPDATE capa_actions
            SET {', '.join(update_fields)}
            WHERE id = :action_id
            RETURNING id
        """)
        
        result = db.execute(update_query, params)
        db.commit()
        
        if not result.fetchone():
            raise HTTPException(status_code=404, detail="الإجراء غير موجود")
        
        return {"success": True, "message": "تم تحديث الإجراء بنجاح"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating action: {e}")
        raise HTTPException(status_code=500, detail=f"خطأ في تحديث الإجراء: {str(e)}")

# =====================================================
# Timeline Endpoints
# =====================================================

@app.get("/api/timeline/events/")
async def get_timeline_events(
    capa_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get timeline events with optional filters"""
    try:
        where_clauses = []
        params = {}
        
        if capa_id:
            where_clauses.append("te.capa_id = :capa_id")
            params['capa_id'] = capa_id
        
        if start_date:
            where_clauses.append("te.created_at >= :start_date")
            params['start_date'] = start_date
        
        if end_date:
            where_clauses.append("te.created_at <= :end_date")
            params['end_date'] = end_date
        
        where_clause = " AND " + " AND ".join(where_clauses) if where_clauses else ""
        
        query = text(f"""
            SELECT 
                te.id,
                te.event_type,
                te.title,
                te.description,
                te.created_at,
                te.user_name,
                te.capa_id,
                c.title as capa_title,
                te.action_id,
                te.new_status,
                te.progress_percentage
            FROM timeline_events te
            JOIN capas c ON c.id = te.capa_id
            {where_clause}
            ORDER BY te.created_at DESC
            LIMIT 100
        """)
        
        results = db.execute(query, params).fetchall()
        
        events = []
        for row in results:
            events.append({
                "id": row[0],
                "type": row[1],
                "title": row[2],
                "description": row[3],
                "timestamp": row[4].isoformat() if row[4] else None,
                "user_name": row[5],
                "capa_id": row[6],
                "capa_title": row[7],
                "action_id": row[8],
                "status": row[9],
                "progress_percentage": row[10]
            })
        
        return events
    except Exception as e:
        print(f"Error getting timeline events: {e}")
        raise HTTPException(status_code=500, detail=f"خطأ في جلب أحداث الجدول الزمني: {str(e)}")

# =====================================================
# Alerts Endpoints
# =====================================================

@app.get("/api/alerts/")
async def get_alerts(
    user_id: Optional[int] = None,
    filter_type: str = 'all',
    priority: str = 'all',
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get alerts with optional filters"""
    try:
        where_clauses = []
        params = {}
        
        if user_id:
            where_clauses.append("user_id = :user_id")
            params['user_id'] = user_id
        
        if filter_type != 'all':
            if filter_type == 'unread':
                where_clauses.append("read = FALSE")
            elif filter_type in ['overdue', 'upcoming', 'escalation', 'completion', 'system']:
                where_clauses.append("alert_type = :alert_type")
                params['alert_type'] = filter_type
        
        if priority != 'all':
            where_clauses.append("priority = :priority")
            params['priority'] = priority
        
        where_clause = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""
        
        query = text(f"""
            SELECT 
                id,
                alert_type,
                title,
                message,
                priority,
                created_at,
                read,
                action_required,
                capa_id,
                capa_title,
                action_id,
                due_date,
                days_until_due
            FROM capa_alerts
            {where_clause}
            ORDER BY 
                CASE priority 
                    WHEN 'critical' THEN 1 
                    WHEN 'high' THEN 2 
                    WHEN 'medium' THEN 3 
                    ELSE 4 
                END,
                created_at DESC
            LIMIT 50
        """)
        
        results = db.execute(query, params).fetchall()
        
        alerts = []
        for row in results:
            alerts.append({
                "id": row[0],
                "type": row[1],
                "title": row[2],
                "message": row[3],
                "priority": row[4],
                "created_at": row[5].isoformat() if row[5] else None,
                "read": row[6],
                "action_required": row[7],
                "capa_id": row[8],
                "capa_title": row[9],
                "action_id": row[10],
                "due_date": row[11].isoformat() if row[11] else None,
                "days_until_due": row[12]
            })
        
        return alerts
    except Exception as e:
        print(f"Error getting alerts: {e}")
        raise HTTPException(status_code=500, detail=f"خطأ في جلب التنبيهات: {str(e)}")

@app.put("/api/alerts/{alert_id}/read")
async def mark_alert_as_read(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark alert as read"""
    try:
        query = text("""
            UPDATE capa_alerts
            SET read = TRUE, read_at = NOW()
            WHERE id = :alert_id
            RETURNING id
        """)
        
        result = db.execute(query, {"alert_id": alert_id})
        db.commit()
        
        if not result.fetchone():
            raise HTTPException(status_code=404, detail="التنبيه غير موجود")
        
        return {"success": True, "message": "تم تعليم التنبيه كمقروء"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error marking alert as read: {e}")
        raise HTTPException(status_code=500, detail=f"خطأ في تحديث التنبيه: {str(e)}")

# =====================================================
# Reports Endpoints
# =====================================================

@app.get("/api/reports/basic/")
async def get_basic_reports(
    period: str = 'month',
    department_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get basic CAPA reports"""
    try:
        # Determine date range based on period
        if not start_date or not end_date:
            from datetime import datetime, timedelta
            end = datetime.now()
            if period == 'week':
                start = end - timedelta(days=7)
            elif period == 'month':
                start = end - timedelta(days=30)
            elif period == 'quarter':
                start = end - timedelta(days=90)
            else:  # year
                start = end - timedelta(days=365)
            
            start_date = start.isoformat()
            end_date = end.isoformat()
        
        # Build department filter
        dept_filter = ""
        params = {"start_date": start_date, "end_date": end_date}
        
        if department_id and department_id != 'all':
            dept_filter = "AND department = :department"
            params['department'] = department_id
        
        # Get overall stats
        stats_query = text(f"""
            SELECT 
                COUNT(*) as total_capas,
                COUNT(*) FILTER (WHERE status IN ('verified', 'closed')) as completed_capas,
                COUNT(*) FILTER (WHERE target_date < NOW() AND status NOT IN ('verified', 'closed')) as overdue_capas,
                COALESCE(AVG(EXTRACT(DAY FROM (NOW() - created_at))) FILTER (WHERE status IN ('verified', 'closed')), 0) as avg_completion_time
            FROM capas
            WHERE created_at BETWEEN :start_date AND :end_date
            {dept_filter}
        """)
        
        stats_result = db.execute(stats_query, params).fetchone()
        
        # Get priority breakdown
        priority_query = text(f"""
            SELECT 
                priority,
                COUNT(*) as count
            FROM capas
            WHERE created_at BETWEEN :start_date AND :end_date
            {dept_filter}
            GROUP BY priority
        """)
        
        priority_results = db.execute(priority_query, params).fetchall()
        priority_breakdown = {row[0]: row[1] for row in priority_results}
        
        # Get status breakdown
        status_query = text(f"""
            SELECT 
                status,
                COUNT(*) as count
            FROM capas
            WHERE created_at BETWEEN :start_date AND :end_date
            {dept_filter}
            GROUP BY status
        """)
        
        status_results = db.execute(status_query, params).fetchall()
        status_breakdown = {row[0]: row[1] for row in status_results}
        
        # Get department stats
        dept_query = text(f"""
            SELECT 
                department,
                COUNT(*) as total_capas,
                COUNT(*) FILTER (WHERE status IN ('verified', 'closed')) as completed_capas,
                COUNT(*) FILTER (WHERE target_date < NOW() AND status NOT IN ('verified', 'closed')) as overdue_capas,
                COALESCE(AVG(EXTRACT(DAY FROM (NOW() - created_at))) FILTER (WHERE status IN ('verified', 'closed')), 0) as avg_completion_time
            FROM capas
            WHERE created_at BETWEEN :start_date AND :end_date
            {dept_filter}
            GROUP BY department
            ORDER BY total_capas DESC
        """)
        
        dept_results = db.execute(dept_query, params).fetchall()
        department_stats = []
        for row in dept_results:
            department_stats.append({
                "department": row[0],
                "total_capas": row[1],
                "completed_capas": row[2],
                "overdue_capas": row[3],
                "average_completion_time": float(row[4])
            })
        
        return {
            "period": period,
            "total_capas": stats_result[0] or 0,
            "completed_capas": stats_result[1] or 0,
            "overdue_capas": stats_result[2] or 0,
            "average_completion_time": float(stats_result[3]) if stats_result[3] else 0,
            "cost_savings": 0,
            "department_stats": department_stats,
            "priority_breakdown": {
                "low": priority_breakdown.get('low', 0),
                "medium": priority_breakdown.get('medium', 0),
                "high": priority_breakdown.get('high', 0),
                "critical": priority_breakdown.get('urgent', 0)
            },
            "status_breakdown": {
                "pending": status_breakdown.get('pending', 0),
                "in_progress": status_breakdown.get('in_progress', 0),
                "completed": status_breakdown.get('verified', 0) + status_breakdown.get('closed', 0),
                "closed": status_breakdown.get('closed', 0)
            },
            "monthly_trends": []
        }
    except Exception as e:
        print(f"Error getting basic reports: {e}")
        raise HTTPException(status_code=500, detail=f"خطأ في جلب التقارير: {str(e)}")

@app.get("/api/reports/compliance-trends", response_model=dict)
async def get_compliance_trends(
    months: int = 6,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get compliance trends over time"""
    try:
        from datetime import datetime, timedelta
        from sqlalchemy import extract
        
        # Get data for the last N months
        end_date = datetime.now()
        start_date = end_date - timedelta(days=months * 30)
        
        # Get completed rounds with compliance data grouped by month
        monthly_data = db.query(
            extract('year', Round.created_at).label('year'),
            extract('month', Round.created_at).label('month'),
            func.avg(Round.compliance_percentage).label('avg_compliance'),
            func.count(Round.id).label('rounds_count')
        ).filter(
            Round.status == "completed",
            Round.compliance_percentage.isnot(None),
            Round.created_at >= start_date
        ).group_by(
            extract('year', Round.created_at),
            extract('month', Round.created_at)
        ).order_by(
            extract('year', Round.created_at),
            extract('month', Round.created_at)
        ).all()
        
        # Format data for frontend
        trends_data = []
        month_names = [
            "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
            "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
        ]
        
        for data in monthly_data:
            trends_data.append({
                "month": month_names[int(data.month) - 1],
                "compliance": round(float(data.avg_compliance), 2),
                "rounds": int(data.rounds_count)
            })
        
        return {"trends": trends_data}
    except Exception as e:
        print(f"Error getting compliance trends: {e}")
        raise HTTPException(status_code=500, detail=f"خطأ في جلب اتجاهات الامتثال: {str(e)}")

@app.get("/api/reports/department-performance", response_model=dict)
async def get_department_performance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get department performance statistics"""
    try:
        # Get rounds by department with compliance data
        dept_performance = db.query(
            Round.department,
            func.avg(Round.compliance_percentage).label('avg_compliance'),
            func.count(Round.id).label('rounds_count'),
            func.count(Capa.id).label('capas_count')
        ).outerjoin(Capa, Round.id == Capa.round_id).filter(
            Round.status == "completed",
            Round.compliance_percentage.isnot(None)
        ).group_by(Round.department).all()
        
        # Format data for frontend
        performance_data = []
        for dept in dept_performance:
            performance_data.append({
                "name": dept.department,
                "compliance": round(float(dept.avg_compliance), 2),
                "rounds": int(dept.rounds_count),
                "capa": int(dept.capas_count)
            })
        
        return {"departments": performance_data}
    except Exception as e:
        print(f"Error getting department performance: {e}")
        raise HTTPException(status_code=500, detail=f"خطأ في جلب أداء الأقسام: {str(e)}")

@app.get("/api/reports/rounds-by-type", response_model=dict)
async def get_rounds_by_type(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get rounds distribution by type"""
    try:
        # Get rounds by type
        rounds_by_type = db.query(
            Round.round_type,
            func.count(Round.id).label('count')
        ).group_by(Round.round_type).all()
        
        # Map round types to Arabic names
        type_mapping = {
            "patient_safety": "سلامة المرضى",
            "infection_control": "مكافحة العدوى",
            "hygiene": "النظافة",
            "medication_safety": "سلامة الأدوية",
            "equipment_safety": "سلامة المعدات",
            "environmental": "البيئة",
            "general": "عام"
        }
        
        # Define colors for each type
        colors = {
            "patient_safety": "#3b82f6",
            "infection_control": "#ef4444",
            "hygiene": "#10b981",
            "medication_safety": "#f59e0b",
            "equipment_safety": "#8b5cf6",
            "environmental": "#06b6d4",
            "general": "#6b7280"
        }
        
        # Format data for frontend
        type_data = []
        for round_type, count in rounds_by_type:
            type_data.append({
                "name": type_mapping.get(round_type, round_type),
                "value": int(count),
                "color": colors.get(round_type, "#6b7280")
            })
        
        return {"round_types": type_data}
    except Exception as e:
        print(f"Error getting rounds by type: {e}")
        raise HTTPException(status_code=500, detail=f"خطأ في جلب توزيع الجولات: {str(e)}")

@app.get("/api/reports/capa-status-distribution", response_model=dict)
async def get_capa_status_distribution(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get CAPA status distribution"""
    try:
        # Get CAPAs by status
        capa_status = db.query(
            Capa.status,
            func.count(Capa.id).label('count')
        ).group_by(Capa.status).all()
        
        # Map status to Arabic names and colors
        status_mapping = {
            "pending": "معلقة",
            "assigned": "مخصصة",
            "in_progress": "قيد التنفيذ",
            "implemented": "منفذة",
            "verification": "قيد التحقق",
            "verified": "محققة",
            "rejected": "مرفوضة",
            "closed": "مغلقة"
        }
        
        colors = {
            "pending": "#f59e0b",
            "assigned": "#3b82f6",
            "in_progress": "#3b82f6",
            "implemented": "#10b981",
            "verification": "#8b5cf6",
            "verified": "#10b981",
            "rejected": "#ef4444",
            "closed": "#6b7280"
        }
        
        # Format data for frontend
        status_data = []
        for status, count in capa_status:
            status_data.append({
                "name": status_mapping.get(status, status),
                "value": int(count),
                "color": colors.get(status, "#6b7280")
            })
        
        return {"capa_status": status_data}
    except Exception as e:
        print(f"Error getting CAPA status distribution: {e}")
        raise HTTPException(status_code=500, detail=f"خطأ في جلب توزيع الخطط التصحيحية: {str(e)}")

@app.get("/api/reports/monthly-rounds", response_model=dict)
async def get_monthly_rounds(
    months: int = 6,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get monthly rounds statistics"""
    try:
        from datetime import datetime, timedelta
        from sqlalchemy import extract, case
        
        # Get data for the last N months
        end_date = datetime.now()
        start_date = end_date - timedelta(days=months * 30)
        
        # Get monthly rounds data
        monthly_data = db.query(
            extract('year', Round.created_at).label('year'),
            extract('month', Round.created_at).label('month'),
            func.count(Round.id).label('scheduled'),
            func.sum(case((Round.status == "completed", 1), else_=0)).label('completed'),
            func.sum(case((Round.status == "overdue", 1), else_=0)).label('overdue')
        ).filter(
            Round.created_at >= start_date
        ).group_by(
            extract('year', Round.created_at),
            extract('month', Round.created_at)
        ).order_by(
            extract('year', Round.created_at),
            extract('month', Round.created_at)
        ).all()
        
        # Format data for frontend
        month_names = [
            "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
            "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
        ]
        
        monthly_rounds = []
        for data in monthly_data:
            monthly_rounds.append({
                "month": month_names[int(data.month) - 1],
                "scheduled": int(data.scheduled),
                "completed": int(data.completed),
                "overdue": int(data.overdue)
            })
        
        return {"monthly_rounds": monthly_rounds}
    except Exception as e:
        print(f"Error getting monthly rounds: {e}")
        raise HTTPException(status_code=500, detail=f"خطأ في جلب الجولات الشهرية: {str(e)}")




# Enhanced CAPA Dashboard API
from api_enhanced_dashboard import router as dashboard_router
app.include_router(dashboard_router, prefix="/api", tags=["dashboard"])

# CAPA Actions API
from api_capa_actions import router as capa_actions_router
app.include_router(capa_actions_router, tags=["capa-actions"])

# Analytics API
from api_analytics import router as analytics_router
app.include_router(analytics_router, prefix="/api", tags=["analytics"])

# Notifications API
from api_notifications import router as notifications_router
app.include_router(notifications_router, prefix="/api", tags=["notifications"])

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Resolve dist directory relative to this file so it works in Docker
DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dist"))

# Mount static files if built. Mounting at root after API routes lets FastAPI serve
# API endpoints under /api/ while the StaticFiles handler returns the SPA for
# any other unmatched path (including root).
if os.path.exists(DIST_DIR):
    # Internal assets still available under /static
    app.mount("/static", StaticFiles(directory=DIST_DIR), name="static")
    
    # Serve index.html for root and any other routes (SPA support)
    @app.get("/")
    async def serve_frontend():
        index_file = os.path.join(DIST_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"message": "Frontend not built yet"}
    
    # Catch-all route to serve SPA for any unmatched paths
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept API routes
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="Not found")
        
        # Try to serve the requested file if it exists
        file_path = os.path.join(DIST_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # Otherwise, serve index.html for SPA routing
        index_file = os.path.join(DIST_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        
        raise HTTPException(status_code=404, detail="Frontend not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
