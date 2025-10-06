"""
CRUD operations for CAPA Actions
عمليات قاعدة البيانات لإجراءات الخطط التصحيحية
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from models_updated import CapaAction, Capa, User
from datetime import datetime, timedelta
import json

def get_capa_actions(
    db: Session,
    capa_id: Optional[int] = None,
    action_type: Optional[str] = None,
    status: Optional[str] = None,
    assigned_to_id: Optional[int] = None,
    due_before: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100
) -> List[CapaAction]:
    """Get CAPA actions with optional filtering"""
    
    query = db.query(CapaAction)
    
    # Apply filters
    if capa_id:
        query = query.filter(CapaAction.capa_id == capa_id)
    if action_type:
        query = query.filter(CapaAction.action_type == action_type)
    if status:
        query = query.filter(CapaAction.status == status)
    if assigned_to_id:
        query = query.filter(CapaAction.assigned_to_id == assigned_to_id)
    if due_before:
        query = query.filter(CapaAction.due_date < due_before)
    
    # Order by due date (nulls last) and created date
    query = query.order_by(CapaAction.due_date.asc().nullslast(), CapaAction.created_at.desc())
    
    return query.offset(skip).limit(limit).all()

def get_capa_action_by_id(db: Session, action_id: int) -> Optional[CapaAction]:
    """Get a specific CAPA action by ID"""
    return db.query(CapaAction).filter(CapaAction.id == action_id).first()

def create_capa_action(db: Session, action_data: dict) -> CapaAction:
    """Create a new CAPA action"""
    
    db_action = CapaAction(
        capa_id=action_data['capa_id'],
        action_type=action_data['action_type'],
        task=action_data['task'],
        due_date=action_data.get('due_date'),
        assigned_to=action_data.get('assigned_to'),
        assigned_to_id=action_data.get('assigned_to_id'),
        notes=action_data.get('notes'),
        status=action_data.get('status', 'open'),
        required=action_data.get('required', True)
    )
    
    db.add(db_action)
    db.commit()
    db.refresh(db_action)
    return db_action

def update_capa_action(db: Session, action_id: int, action_data: dict) -> Optional[CapaAction]:
    """Update a CAPA action"""
    
    db_action = db.query(CapaAction).filter(CapaAction.id == action_id).first()
    if not db_action:
        return None
    
    # Update fields if provided
    if 'task' in action_data:
        db_action.task = action_data['task']
    if 'due_date' in action_data:
        db_action.due_date = action_data['due_date']
    if 'assigned_to' in action_data:
        db_action.assigned_to = action_data['assigned_to']
    if 'assigned_to_id' in action_data:
        db_action.assigned_to_id = action_data['assigned_to_id']
    if 'notes' in action_data:
        db_action.notes = action_data['notes']
    if 'status' in action_data:
        db_action.status = action_data['status']
        # If marking as completed, set completed_at
        if action_data['status'] == 'completed' and not db_action.completed_at:
            db_action.completed_at = datetime.now()
    if 'completed_at' in action_data:
        db_action.completed_at = action_data['completed_at']
    if 'completed_by_id' in action_data:
        db_action.completed_by_id = action_data['completed_by_id']
    if 'required' in action_data:
        db_action.required = action_data['required']
    
    db.commit()
    db.refresh(db_action)
    return db_action

def delete_capa_action(db: Session, action_id: int) -> bool:
    """Delete a CAPA action"""
    
    db_action = db.query(CapaAction).filter(CapaAction.id == action_id).first()
    if not db_action:
        return False
    
    db.delete(db_action)
    db.commit()
    return True

def get_overdue_actions(db: Session, action_type: Optional[str] = None) -> List[CapaAction]:
    """Get overdue actions (due_date < now and status not completed/cancelled)"""
    
    query = db.query(CapaAction).filter(
        and_(
            CapaAction.due_date < datetime.now(),
            ~CapaAction.status.in_(['completed', 'cancelled'])
        )
    )
    
    if action_type:
        query = query.filter(CapaAction.action_type == action_type)
    
    return query.order_by(CapaAction.due_date.asc()).all()

def get_upcoming_actions(db: Session, days: int = 7, action_type: Optional[str] = None) -> List[CapaAction]:
    """Get upcoming actions (due within next N days)"""
    
    now = datetime.now()
    future = now + timedelta(days=days)
    
    query = db.query(CapaAction).filter(
        and_(
            CapaAction.due_date >= now,
            CapaAction.due_date <= future,
            ~CapaAction.status.in_(['completed', 'cancelled'])
        )
    )
    
    if action_type:
        query = query.filter(CapaAction.action_type == action_type)
    
    return query.order_by(CapaAction.due_date.asc()).all()

def get_actions_by_assignee(db: Session, assigned_to_id: int, status: Optional[str] = None) -> List[CapaAction]:
    """Get actions assigned to a specific user"""
    
    query = db.query(CapaAction).filter(CapaAction.assigned_to_id == assigned_to_id)
    
    if status:
        query = query.filter(CapaAction.status == status)
    
    return query.order_by(CapaAction.due_date.asc().nullslast()).all()

def get_action_statistics(db: Session) -> dict:
    """Get statistics about CAPA actions for dashboard"""
    
    total = db.query(CapaAction).count()
    
    # By status
    by_status = db.query(
        CapaAction.status,
        func.count(CapaAction.id)
    ).group_by(CapaAction.status).all()
    
    status_counts = {status: count for status, count in by_status}
    
    # By type
    by_type = db.query(
        CapaAction.action_type,
        func.count(CapaAction.id)
    ).group_by(CapaAction.action_type).all()
    
    type_counts = {action_type: count for action_type, count in by_type}
    
    # Overdue
    overdue = db.query(CapaAction).filter(
        and_(
            CapaAction.due_date < datetime.now(),
            ~CapaAction.status.in_(['completed', 'cancelled'])
        )
    ).count()
    
    # Completion rate
    completed = status_counts.get('completed', 0)
    completion_rate = round((completed / total * 100) if total > 0 else 0, 2)
    
    return {
        'total': total,
        'by_status': status_counts,
        'by_type': type_counts,
        'overdue': overdue,
        'completed': completed,
        'completion_rate': completion_rate
    }

