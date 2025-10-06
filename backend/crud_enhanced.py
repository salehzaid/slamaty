"""
Enhanced CRUD operations for the new CAPA system
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc, asc
from typing import List, Optional, Dict, Any
from datetime import date, datetime, timedelta
import json

from models_updated import (
    Capa, User, Department
)

# ==================== CAPA CRUD Operations ====================

def create_capa(db: Session, capa_data: dict) -> Capa:
    """Create a new CAPA"""
    db_capa = Capa(**capa_data)
    db.add(db_capa)
    db.commit()
    db.refresh(db_capa)
    return db_capa

def get_capa(db: Session, capa_id: int) -> Optional[Capa]:
    """Get a CAPA by ID with all related data"""
    return db.query(Capa).filter(Capa.id == capa_id).first()

def get_capas(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    status: Optional[str] = None,
    department_id: Optional[int] = None,
    assigned_to_id: Optional[int] = None,
    priority: Optional[str] = None,
    overdue_only: bool = False
) -> List[Capa]:
    """Get CAPAs with filtering options"""
    query = db.query(Capa)
    
    if status:
        query = query.filter(Capa.status == status)
    
    if department_id:
        query = query.filter(Capa.department_id == department_id)
    
    if assigned_to_id:
        query = query.filter(Capa.assigned_to_id == assigned_to_id)
    
    if priority:
        query = query.filter(Capa.priority == priority)
    
    if overdue_only:
        today = date.today()
        query = query.filter(
            and_(
                Capa.target_date < today,
                Capa.status.notin_(['completed', 'closed', 'verified'])
            )
        )
    
    return query.offset(skip).limit(limit).all()

def update_capa(db: Session, capa_id: int, capa_data: dict) -> Optional[Capa]:
    """Update a CAPA"""
    db_capa = db.query(Capa).filter(Capa.id == capa_id).first()
    if db_capa:
        for key, value in capa_data.items():
            setattr(db_capa, key, value)
        db.commit()
        db.refresh(db_capa)
    return db_capa

def delete_capa(db: Session, capa_id: int) -> bool:
    """Delete a CAPA"""
    db_capa = db.query(Capa).filter(Capa.id == capa_id).first()
    if db_capa:
        db.delete(db_capa)
        db.commit()
        return True
    return False

# ==================== Corrective Actions CRUD ====================

def create_corrective_action(db: Session, action_data: dict) -> CorrectiveAction:
    """Create a new corrective action"""
    db_action = CorrectiveAction(**action_data)
    db.add(db_action)
    db.commit()
    db.refresh(db_action)
    
    # Track progress
    track_progress(db, action_data['capa_id'], ActionType.CORRECTIVE, db_action.id, 0, "created")
    
    return db_action

def get_corrective_actions(db: Session, capa_id: int) -> List[CorrectiveAction]:
    """Get all corrective actions for a CAPA"""
    return db.query(CorrectiveAction).filter(CorrectiveAction.capa_id == capa_id).all()

def update_corrective_action(db: Session, action_id: int, action_data: dict) -> Optional[CorrectiveAction]:
    """Update a corrective action"""
    db_action = db.query(CorrectiveAction).filter(CorrectiveAction.id == action_id).first()
    if db_action:
        old_status = db_action.status
        old_progress = db_action.completion_percentage
        
        for key, value in action_data.items():
            setattr(db_action, key, value)
        
        db.commit()
        db.refresh(db_action)
        
        # Track progress if status or completion changed
        if old_status != db_action.status or old_progress != db_action.completion_percentage:
            track_progress(
                db, 
                db_action.capa_id, 
                ActionType.CORRECTIVE, 
                action_id, 
                db_action.completion_percentage,
                f"status_changed_to_{db_action.status}"
            )
    
    return db_action

def delete_corrective_action(db: Session, action_id: int) -> bool:
    """Delete a corrective action"""
    db_action = db.query(CorrectiveAction).filter(CorrectiveAction.id == action_id).first()
    if db_action:
        capa_id = db_action.capa_id
        db.delete(db_action)
        db.commit()
        
        # Track progress
        track_progress(db, capa_id, ActionType.CORRECTIVE, action_id, None, "deleted")
        return True
    return False

# ==================== Preventive Actions CRUD ====================

def create_preventive_action(db: Session, action_data: dict) -> PreventiveAction:
    """Create a new preventive action"""
    db_action = PreventiveAction(**action_data)
    db.add(db_action)
    db.commit()
    db.refresh(db_action)
    
    # Track progress
    track_progress(db, action_data['capa_id'], ActionType.PREVENTIVE, db_action.id, 0, "created")
    
    return db_action

def get_preventive_actions(db: Session, capa_id: int) -> List[PreventiveAction]:
    """Get all preventive actions for a CAPA"""
    return db.query(PreventiveAction).filter(PreventiveAction.capa_id == capa_id).all()

def update_preventive_action(db: Session, action_id: int, action_data: dict) -> Optional[PreventiveAction]:
    """Update a preventive action"""
    db_action = db.query(PreventiveAction).filter(PreventiveAction.id == action_id).first()
    if db_action:
        old_status = db_action.status
        old_progress = db_action.completion_percentage
        
        for key, value in action_data.items():
            setattr(db_action, key, value)
        
        db.commit()
        db.refresh(db_action)
        
        # Track progress if status or completion changed
        if old_status != db_action.status or old_progress != db_action.completion_percentage:
            track_progress(
                db, 
                db_action.capa_id, 
                ActionType.PREVENTIVE, 
                action_id, 
                db_action.completion_percentage,
                f"status_changed_to_{db_action.status}"
            )
    
    return db_action

def delete_preventive_action(db: Session, action_id: int) -> bool:
    """Delete a preventive action"""
    db_action = db.query(PreventiveAction).filter(PreventiveAction.id == action_id).first()
    if db_action:
        capa_id = db_action.capa_id
        db.delete(db_action)
        db.commit()
        
        # Track progress
        track_progress(db, capa_id, ActionType.PREVENTIVE, action_id, None, "deleted")
        return True
    return False

# ==================== Verification Steps CRUD ====================

def create_verification_step(db: Session, step_data: dict) -> VerificationStep:
    """Create a new verification step"""
    db_step = VerificationStep(**step_data)
    db.add(db_step)
    db.commit()
    db.refresh(db_step)
    
    # Track progress
    track_progress(db, step_data['capa_id'], ActionType.VERIFICATION, db_step.id, 0, "created")
    
    return db_step

def get_verification_steps(db: Session, capa_id: int) -> List[VerificationStep]:
    """Get all verification steps for a CAPA"""
    return db.query(VerificationStep).filter(VerificationStep.capa_id == capa_id).all()

def update_verification_step(db: Session, step_id: int, step_data: dict) -> Optional[VerificationStep]:
    """Update a verification step"""
    db_step = db.query(VerificationStep).filter(VerificationStep.id == step_id).first()
    if db_step:
        old_completed = db_step.completed
        
        for key, value in step_data.items():
            setattr(db_step, key, value)
        
        db.commit()
        db.refresh(db_step)
        
        # Track progress if completion status changed
        if old_completed != db_step.completed:
            progress = 100 if db_step.completed else 0
            track_progress(
                db, 
                db_step.capa_id, 
                ActionType.VERIFICATION, 
                step_id, 
                progress,
                "completed" if db_step.completed else "uncompleted"
            )
    
    return db_step

def delete_verification_step(db: Session, step_id: int) -> bool:
    """Delete a verification step"""
    db_step = db.query(VerificationStep).filter(VerificationStep.id == step_id).first()
    if db_step:
        capa_id = db_step.capa_id
        db.delete(db_step)
        db.commit()
        
        # Track progress
        track_progress(db, capa_id, ActionType.VERIFICATION, step_id, None, "deleted")
        return True
    return False

# ==================== Progress Tracking ====================

def track_progress(
    db: Session, 
    capa_id: int, 
    action_type: ActionType, 
    action_id: int, 
    progress_percentage: Optional[int], 
    status_change: str,
    notes: Optional[str] = None,
    updated_by_id: int = 1  # Default to system user
) -> CapaProgressTracking:
    """Track progress changes for CAPA actions"""
    progress_entry = CapaProgressTracking(
        capa_id=capa_id,
        action_type=action_type,
        action_id=action_id,
        progress_percentage=progress_percentage,
        status_change=status_change,
        notes=notes,
        updated_by_id=updated_by_id
    )
    db.add(progress_entry)
    db.commit()
    db.refresh(progress_entry)
    return progress_entry

def get_capa_progress(db: Session, capa_id: int) -> List[CapaProgressTracking]:
    """Get all progress tracking entries for a CAPA"""
    return db.query(CapaProgressTracking).filter(
        CapaProgressTracking.capa_id == capa_id
    ).order_by(desc(CapaProgressTracking.updated_at)).all()

# ==================== Dashboard Analytics ====================

def get_capa_dashboard_stats(db: Session, user_id: Optional[int] = None) -> Dict[str, Any]:
    """Get dashboard statistics for CAPAs"""
    today = date.today()
    
    # Base query
    base_query = db.query(Capa)
    if user_id:
        base_query = base_query.filter(Capa.assigned_to_id == user_id)
    
    # Total CAPAs
    total_capas = base_query.count()
    
    # Overdue CAPAs
    overdue_capas = base_query.filter(
        and_(
            Capa.target_date < today,
            Capa.status.notin_(['completed', 'closed', 'verified'])
        )
    ).count()
    
    # Completed this month
    month_start = today.replace(day=1)
    completed_this_month = base_query.filter(
        and_(
            Capa.actual_completion_date >= month_start,
            Capa.actual_completion_date <= today
        )
    ).count()
    
    # Critical pending
    critical_pending = base_query.filter(
        and_(
            Capa.priority == 'critical',
            Capa.status.in_(['pending', 'in_progress'])
        )
    ).count()
    
    # Average completion time (in days)
    completed_capas = base_query.filter(
        and_(
            Capa.actual_completion_date.isnot(None),
            Capa.created_at.isnot(None)
        )
    ).all()
    
    avg_completion_time = 0
    if completed_capas:
        total_days = sum([
            (capa.actual_completion_date - capa.created_at.date()).days 
            for capa in completed_capas
        ])
        avg_completion_time = total_days / len(completed_capas)
    
    # Cost savings (estimated vs actual)
    cost_savings = 0
    cost_data = base_query.filter(
        and_(
            Capa.estimated_cost.isnot(None),
            Capa.actual_cost.isnot(None)
        )
    ).all()
    
    if cost_data:
        total_estimated = sum([float(capa.estimated_cost) for capa in cost_data])
        total_actual = sum([float(capa.actual_cost) for capa in cost_data])
        cost_savings = total_estimated - total_actual
    
    return {
        'total_capas': total_capas,
        'overdue_capas': overdue_capas,
        'completed_this_month': completed_this_month,
        'critical_pending': critical_pending,
        'average_completion_time': round(avg_completion_time, 1),
        'cost_savings': round(cost_savings, 2)
    }

def get_overdue_actions(db: Session, user_id: Optional[int] = None) -> Dict[str, List]:
    """Get overdue actions by type"""
    today = date.today()
    
    # Overdue corrective actions
    corrective_query = db.query(CorrectiveAction).join(Capa).filter(
        and_(
            CorrectiveAction.due_date < today,
            CorrectiveAction.status.in_(['pending', 'in_progress'])
        )
    )
    if user_id:
        corrective_query = corrective_query.filter(CorrectiveAction.assigned_to_id == user_id)
    
    overdue_corrective = corrective_query.all()
    
    # Overdue preventive actions
    preventive_query = db.query(PreventiveAction).join(Capa).filter(
        and_(
            PreventiveAction.due_date < today,
            PreventiveAction.status.in_(['pending', 'in_progress'])
        )
    )
    if user_id:
        preventive_query = preventive_query.filter(PreventiveAction.assigned_to_id == user_id)
    
    overdue_preventive = preventive_query.all()
    
    # Overdue verification steps
    verification_query = db.query(VerificationStep).join(Capa).filter(
        and_(
            VerificationStep.due_date < today,
            VerificationStep.completed == False
        )
    )
    if user_id:
        verification_query = verification_query.filter(VerificationStep.assigned_to_id == user_id)
    
    overdue_verification = verification_query.all()
    
    return {
        'corrective_actions': overdue_corrective,
        'preventive_actions': overdue_preventive,
        'verification_steps': overdue_verification
    }

def get_upcoming_deadlines(db: Session, days_ahead: int = 7, user_id: Optional[int] = None) -> Dict[str, List]:
    """Get upcoming deadlines within specified days"""
    today = date.today()
    future_date = today + timedelta(days=days_ahead)
    
    # Upcoming corrective actions
    corrective_query = db.query(CorrectiveAction).join(Capa).filter(
        and_(
            CorrectiveAction.due_date >= today,
            CorrectiveAction.due_date <= future_date,
            CorrectiveAction.status.in_(['pending', 'in_progress'])
        )
    )
    if user_id:
        corrective_query = corrective_query.filter(CorrectiveAction.assigned_to_id == user_id)
    
    upcoming_corrective = corrective_query.all()
    
    # Upcoming preventive actions
    preventive_query = db.query(PreventiveAction).join(Capa).filter(
        and_(
            PreventiveAction.due_date >= today,
            PreventiveAction.due_date <= future_date,
            PreventiveAction.status.in_(['pending', 'in_progress'])
        )
    )
    if user_id:
        preventive_query = preventive_query.filter(PreventiveAction.assigned_to_id == user_id)
    
    upcoming_preventive = preventive_query.all()
    
    # Upcoming verification steps
    verification_query = db.query(VerificationStep).join(Capa).filter(
        and_(
            VerificationStep.due_date >= today,
            VerificationStep.due_date <= future_date,
            VerificationStep.completed == False
        )
    )
    if user_id:
        verification_query = verification_query.filter(VerificationStep.assigned_to_id == user_id)
    
    upcoming_verification = verification_query.all()
    
    return {
        'corrective_actions': upcoming_corrective,
        'preventive_actions': upcoming_preventive,
        'verification_steps': upcoming_verification
    }

# ==================== Department Analytics ====================

def get_department_capa_stats(db: Session, department_id: int) -> Dict[str, Any]:
    """Get CAPA statistics for a specific department"""
    base_query = db.query(Capa).filter(Capa.department_id == department_id)
    
    total_capas = base_query.count()
    
    # Status breakdown
    status_breakdown = {}
    for status in ['pending', 'in_progress', 'completed', 'closed']:
        count = base_query.filter(Capa.status == status).count()
        status_breakdown[status] = count
    
    # Priority breakdown
    priority_breakdown = {}
    for priority in ['low', 'medium', 'high', 'critical']:
        count = base_query.filter(Capa.priority == priority).count()
        priority_breakdown[priority] = count
    
    # Average completion time
    completed_capas = base_query.filter(
        and_(
            Capa.actual_completion_date.isnot(None),
            Capa.created_at.isnot(None)
        )
    ).all()
    
    avg_completion_time = 0
    if completed_capas:
        total_days = sum([
            (capa.actual_completion_date - capa.created_at.date()).days 
            for capa in completed_capas
        ])
        avg_completion_time = total_days / len(completed_capas)
    
    return {
        'total_capas': total_capas,
        'status_breakdown': status_breakdown,
        'priority_breakdown': priority_breakdown,
        'average_completion_time': round(avg_completion_time, 1)
    }
