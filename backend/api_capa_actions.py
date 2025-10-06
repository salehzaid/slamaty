"""
API endpoints for CAPA Actions
واجهات برمجية لإدارة إجراءات الخطط التصحيحية
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from database import get_db
from auth import get_current_user
from models_updated import User, CapaAction
from crud_capa_actions import (
    get_capa_actions,
    get_capa_action_by_id,
    create_capa_action,
    update_capa_action,
    delete_capa_action,
    get_overdue_actions,
    get_upcoming_actions,
    get_actions_by_assignee,
    get_action_statistics
)

router = APIRouter()

@router.get("/api/capa-actions", response_model=dict)
async def list_capa_actions(
    capa_id: Optional[int] = Query(None),
    action_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    assigned_to_id: Optional[int] = Query(None),
    due_before: Optional[str] = Query(None),
    skip: int = Query(0),
    limit: int = Query(100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of CAPA actions with optional filters"""
    
    due_before_dt = None
    if due_before:
        try:
            due_before_dt = datetime.fromisoformat(due_before)
        except:
            pass
    
    actions = get_capa_actions(
        db=db,
        capa_id=capa_id,
        action_type=action_type,
        status=status,
        assigned_to_id=assigned_to_id,
        due_before=due_before_dt,
        skip=skip,
        limit=limit
    )
    
    return {
        "status": "success",
        "actions": [
            {
                "id": action.id,
                "capa_id": action.capa_id,
                "action_type": action.action_type,
                "task": action.task,
                "due_date": action.due_date.isoformat() if action.due_date else None,
                "assigned_to": action.assigned_to,
                "assigned_to_id": action.assigned_to_id,
                "notes": action.notes,
                "status": action.status,
                "completed_at": action.completed_at.isoformat() if action.completed_at else None,
                "completed_by_id": action.completed_by_id,
                "required": action.required,
                "created_at": action.created_at.isoformat() if action.created_at else None,
                "updated_at": action.updated_at.isoformat() if action.updated_at else None
            }
            for action in actions
        ],
        "total": len(actions),
        "skip": skip,
        "limit": limit
    }

@router.get("/api/capa-actions/{action_id}", response_model=dict)
async def get_action(
    action_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific CAPA action by ID"""
    
    action = get_capa_action_by_id(db, action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    
    return {
        "status": "success",
        "action": {
            "id": action.id,
            "capa_id": action.capa_id,
            "action_type": action.action_type,
            "task": action.task,
            "due_date": action.due_date.isoformat() if action.due_date else None,
            "assigned_to": action.assigned_to,
            "assigned_to_id": action.assigned_to_id,
            "notes": action.notes,
            "status": action.status,
            "completed_at": action.completed_at.isoformat() if action.completed_at else None,
            "completed_by_id": action.completed_by_id,
            "required": action.required,
            "created_at": action.created_at.isoformat() if action.created_at else None,
            "updated_at": action.updated_at.isoformat() if action.updated_at else None
        }
    }

@router.post("/api/capa-actions", response_model=dict)
async def create_action(
    action_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new CAPA action"""
    
    # Check permissions
    if current_user.role not in ["quality_manager", "super_admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    action = create_capa_action(db, action_data)
    
    return {
        "status": "success",
        "message": "Action created successfully",
        "action_id": action.id
    }

@router.put("/api/capa-actions/{action_id}", response_model=dict)
async def update_action(
    action_id: int,
    action_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a CAPA action"""
    
    # Check permissions
    if current_user.role not in ["quality_manager", "super_admin", "department_head"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    action = update_capa_action(db, action_id, action_data)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    
    return {
        "status": "success",
        "message": "Action updated successfully",
        "action_id": action.id
    }

@router.delete("/api/capa-actions/{action_id}", response_model=dict)
async def delete_action(
    action_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a CAPA action"""
    
    # Check permissions
    if current_user.role not in ["quality_manager", "super_admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    success = delete_capa_action(db, action_id)
    if not success:
        raise HTTPException(status_code=404, detail="Action not found")
    
    return {
        "status": "success",
        "message": "Action deleted successfully"
    }

@router.get("/api/capa-actions/overdue/list", response_model=dict)
async def list_overdue_actions(
    action_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of overdue actions"""
    
    actions = get_overdue_actions(db, action_type)
    
    return {
        "status": "success",
        "actions": [
            {
                "id": action.id,
                "capa_id": action.capa_id,
                "action_type": action.action_type,
                "task": action.task,
                "due_date": action.due_date.isoformat() if action.due_date else None,
                "assigned_to": action.assigned_to,
                "days_overdue": (datetime.now() - action.due_date).days if action.due_date else 0
            }
            for action in actions
        ],
        "total": len(actions)
    }

@router.get("/api/capa-actions/upcoming/list", response_model=dict)
async def list_upcoming_actions(
    days: int = Query(7),
    action_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of upcoming actions (due within next N days)"""
    
    actions = get_upcoming_actions(db, days, action_type)
    
    return {
        "status": "success",
        "actions": [
            {
                "id": action.id,
                "capa_id": action.capa_id,
                "action_type": action.action_type,
                "task": action.task,
                "due_date": action.due_date.isoformat() if action.due_date else None,
                "assigned_to": action.assigned_to,
                "days_until_due": (action.due_date - datetime.now()).days if action.due_date else 0
            }
            for action in actions
        ],
        "total": len(actions)
    }

@router.get("/api/capa-actions/my-actions", response_model=dict)
async def get_my_actions(
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get actions assigned to current user"""
    
    actions = get_actions_by_assignee(db, current_user.id, status)
    
    return {
        "status": "success",
        "actions": [
            {
                "id": action.id,
                "capa_id": action.capa_id,
                "action_type": action.action_type,
                "task": action.task,
                "due_date": action.due_date.isoformat() if action.due_date else None,
                "status": action.status,
                "notes": action.notes
            }
            for action in actions
        ],
        "total": len(actions)
    }

@router.get("/api/capa-actions/statistics", response_model=dict)
async def get_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get statistics about CAPA actions"""
    
    stats = get_action_statistics(db)
    
    return {
        "status": "success",
        "statistics": stats
    }

