"""
Enhanced API endpoints for the new CAPA system
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import date, datetime, timedelta
import json

from database import get_db
from auth import get_current_user
from crud_enhanced import (
    create_capa, get_capa, get_capas, update_capa, delete_capa,
    create_corrective_action, get_corrective_actions, update_corrective_action, delete_corrective_action,
    create_preventive_action, get_preventive_actions, update_preventive_action, delete_preventive_action,
    create_verification_step, get_verification_steps, update_verification_step, delete_verification_step,
    get_capa_progress, track_progress,
    get_capa_dashboard_stats, get_overdue_actions, get_upcoming_deadlines, get_department_capa_stats
)
from models_updated import Capa
from schemas_enhanced import (
    CapaCreate, CapaUpdate, CapaResponse,
    CorrectiveActionCreate, CorrectiveActionUpdate, CorrectiveActionResponse,
    PreventiveActionCreate, PreventiveActionUpdate, PreventiveActionResponse,
    VerificationStepCreate, VerificationStepUpdate, VerificationStepResponse,
    ProgressTrackingCreate, ProgressTrackingResponse,
    DashboardStatsResponse, OverdueActionsResponse, UpcomingDeadlinesResponse
)

router = APIRouter()

# ==================== CAPA Endpoints ====================

@router.post("/capas/", response_model=CapaResponse)
def create_capa_endpoint(
    capa: CapaCreate,
    current_user: any = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new CAPA (permission-checked)"""
    # Allow department_head, quality_manager and super_admin to create CAPAs
    try:
        if current_user.role not in ["super_admin", "quality_manager", "department_head"]:
            raise HTTPException(status_code=403, detail="You don't have permission to create CAPA plans")

        capa_data = capa.dict()
        db_capa = create_capa(db, capa_data, current_user.id)
        return db_capa
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/capas/", response_model=List[CapaResponse])
def get_capas_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    department_id: Optional[int] = Query(None),
    assigned_to_id: Optional[int] = Query(None),
    priority: Optional[str] = Query(None),
    overdue_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    """Get CAPAs with filtering options"""
    try:
        capas = get_capas(
            db, skip=skip, limit=limit, status=status,
            department_id=department_id, assigned_to_id=assigned_to_id,
            priority=priority, overdue_only=overdue_only
        )
        return capas
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/capas/{capa_id}", response_model=CapaResponse)
def get_capa_endpoint(capa_id: int, db: Session = Depends(get_db)):
    """Get a specific CAPA by ID"""
    capa = get_capa(db, capa_id)
    if not capa:
        raise HTTPException(status_code=404, detail="CAPA not found")
    return capa

@router.put("/capas/{capa_id}", response_model=CapaResponse)
def update_capa_endpoint(capa_id: int, capa: CapaUpdate, db: Session = Depends(get_db)):
    """Update a CAPA"""
    try:
        capa_data = capa.dict(exclude_unset=True)
        db_capa = update_capa(db, capa_id, capa_data)
        if not db_capa:
            raise HTTPException(status_code=404, detail="CAPA not found")
        return db_capa
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/capas/{capa_id}")
def delete_capa_endpoint(capa_id: int, db: Session = Depends(get_db)):
    """Delete a CAPA"""
    success = delete_capa(db, capa_id)
    if not success:
        raise HTTPException(status_code=404, detail="CAPA not found")
    return {"message": "CAPA deleted successfully"}

# ==================== Corrective Actions Endpoints ====================

@router.post("/capas/{capa_id}/corrective-actions/", response_model=CorrectiveActionResponse)
def create_corrective_action_endpoint(
    capa_id: int, 
    action: CorrectiveActionCreate, 
    db: Session = Depends(get_db)
):
    """Create a new corrective action for a CAPA"""
    try:
        # Verify CAPA exists
        capa = get_capa(db, capa_id)
        if not capa:
            raise HTTPException(status_code=404, detail="CAPA not found")
        
        action_data = action.dict()
        action_data['capa_id'] = capa_id
        db_action = create_corrective_action(db, action_data)
        return db_action
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/capas/{capa_id}/corrective-actions/", response_model=List[CorrectiveActionResponse])
def get_corrective_actions_endpoint(capa_id: int, db: Session = Depends(get_db)):
    """Get all corrective actions for a CAPA"""
    # Verify CAPA exists
    capa = get_capa(db, capa_id)
    if not capa:
        raise HTTPException(status_code=404, detail="CAPA not found")
    
    actions = get_corrective_actions(db, capa_id)
    return actions

@router.put("/corrective-actions/{action_id}", response_model=CorrectiveActionResponse)
def update_corrective_action_endpoint(
    action_id: int, 
    action: CorrectiveActionUpdate, 
    db: Session = Depends(get_db)
):
    """Update a corrective action"""
    try:
        action_data = action.dict(exclude_unset=True)
        db_action = update_corrective_action(db, action_id, action_data)
        if not db_action:
            raise HTTPException(status_code=404, detail="Corrective action not found")
        return db_action
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/corrective-actions/{action_id}")
def delete_corrective_action_endpoint(action_id: int, db: Session = Depends(get_db)):
    """Delete a corrective action"""
    success = delete_corrective_action(db, action_id)
    if not success:
        raise HTTPException(status_code=404, detail="Corrective action not found")
    return {"message": "Corrective action deleted successfully"}

# ==================== Preventive Actions Endpoints ====================

@router.post("/capas/{capa_id}/preventive-actions/", response_model=PreventiveActionResponse)
def create_preventive_action_endpoint(
    capa_id: int, 
    action: PreventiveActionCreate, 
    db: Session = Depends(get_db)
):
    """Create a new preventive action for a CAPA"""
    try:
        # Verify CAPA exists
        capa = get_capa(db, capa_id)
        if not capa:
            raise HTTPException(status_code=404, detail="CAPA not found")
        
        action_data = action.dict()
        action_data['capa_id'] = capa_id
        db_action = create_preventive_action(db, action_data)
        return db_action
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/capas/{capa_id}/preventive-actions/", response_model=List[PreventiveActionResponse])
def get_preventive_actions_endpoint(capa_id: int, db: Session = Depends(get_db)):
    """Get all preventive actions for a CAPA"""
    # Verify CAPA exists
    capa = get_capa(db, capa_id)
    if not capa:
        raise HTTPException(status_code=404, detail="CAPA not found")
    
    actions = get_preventive_actions(db, capa_id)
    return actions

@router.put("/preventive-actions/{action_id}", response_model=PreventiveActionResponse)
def update_preventive_action_endpoint(
    action_id: int, 
    action: PreventiveActionUpdate, 
    db: Session = Depends(get_db)
):
    """Update a preventive action"""
    try:
        action_data = action.dict(exclude_unset=True)
        db_action = update_preventive_action(db, action_id, action_data)
        if not db_action:
            raise HTTPException(status_code=404, detail="Preventive action not found")
        return db_action
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/preventive-actions/{action_id}")
def delete_preventive_action_endpoint(action_id: int, db: Session = Depends(get_db)):
    """Delete a preventive action"""
    success = delete_preventive_action(db, action_id)
    if not success:
        raise HTTPException(status_code=404, detail="Preventive action not found")
    return {"message": "Preventive action deleted successfully"}

# ==================== Verification Steps Endpoints ====================

@router.post("/capas/{capa_id}/verification-steps/", response_model=VerificationStepResponse)
def create_verification_step_endpoint(
    capa_id: int, 
    step: VerificationStepCreate, 
    db: Session = Depends(get_db)
):
    """Create a new verification step for a CAPA"""
    try:
        # Verify CAPA exists
        capa = get_capa(db, capa_id)
        if not capa:
            raise HTTPException(status_code=404, detail="CAPA not found")
        
        step_data = step.dict()
        step_data['capa_id'] = capa_id
        db_step = create_verification_step(db, step_data)
        return db_step
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/capas/{capa_id}/verification-steps/", response_model=List[VerificationStepResponse])
def get_verification_steps_endpoint(capa_id: int, db: Session = Depends(get_db)):
    """Get all verification steps for a CAPA"""
    # Verify CAPA exists
    capa = get_capa(db, capa_id)
    if not capa:
        raise HTTPException(status_code=404, detail="CAPA not found")
    
    steps = get_verification_steps(db, capa_id)
    return steps

@router.put("/verification-steps/{step_id}", response_model=VerificationStepResponse)
def update_verification_step_endpoint(
    step_id: int, 
    step: VerificationStepUpdate, 
    db: Session = Depends(get_db)
):
    """Update a verification step"""
    try:
        step_data = step.dict(exclude_unset=True)
        db_step = update_verification_step(db, step_id, step_data)
        if not db_step:
            raise HTTPException(status_code=404, detail="Verification step not found")
        return db_step
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/verification-steps/{step_id}")
def delete_verification_step_endpoint(step_id: int, db: Session = Depends(get_db)):
    """Delete a verification step"""
    success = delete_verification_step(db, step_id)
    if not success:
        raise HTTPException(status_code=404, detail="Verification step not found")
    return {"message": "Verification step deleted successfully"}

# ==================== Progress Tracking Endpoints ====================

@router.get("/capas/{capa_id}/progress/", response_model=List[ProgressTrackingResponse])
def get_capa_progress_endpoint(capa_id: int, db: Session = Depends(get_db)):
    """Get progress tracking for a CAPA"""
    # Verify CAPA exists
    capa = get_capa(db, capa_id)
    if not capa:
        raise HTTPException(status_code=404, detail="CAPA not found")
    
    progress = get_capa_progress(db, capa_id)
    return progress

@router.post("/capas/{capa_id}/progress/", response_model=ProgressTrackingResponse)
def track_progress_endpoint(
    capa_id: int, 
    progress: ProgressTrackingCreate, 
    db: Session = Depends(get_db)
):
    """Track progress for a CAPA"""
    try:
        # Verify CAPA exists
        capa = get_capa(db, capa_id)
        if not capa:
            raise HTTPException(status_code=404, detail="CAPA not found")
        
        progress_data = progress.dict()
        progress_data['capa_id'] = capa_id
        db_progress = track_progress(db, **progress_data)
        return db_progress
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== Dashboard Endpoints ====================

@router.get("/dashboard/stats/", response_model=DashboardStatsResponse)
def get_dashboard_stats_endpoint(
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics"""
    try:
        stats = get_capa_dashboard_stats(db, user_id)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard/overdue/", response_model=OverdueActionsResponse)
def get_overdue_actions_endpoint(
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get overdue actions"""
    try:
        overdue = get_overdue_actions(db, user_id)
        return overdue
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard/upcoming/", response_model=UpcomingDeadlinesResponse)
def get_upcoming_deadlines_endpoint(
    days_ahead: int = Query(7, ge=1, le=30),
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get upcoming deadlines"""
    try:
        upcoming = get_upcoming_deadlines(db, days_ahead, user_id)
        return upcoming
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== Department Analytics Endpoints ====================

@router.get("/departments/{department_id}/capa-stats/")
def get_department_capa_stats_endpoint(department_id: int, db: Session = Depends(get_db)):
    """Get CAPA statistics for a department"""
    try:
        stats = get_department_capa_stats(db, department_id)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
