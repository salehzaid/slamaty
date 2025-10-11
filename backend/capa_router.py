from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json

from database import get_db
from models import User, Capa, VerificationStatus, CapaStatus
from schemas import (
    CapaCreate, CapaUpdate, CapaResponse, CapaVerify, 
    ActionItem, VerificationStep, StatusHistoryItem
)
from auth import get_current_user
from crud import (
    create_capa, get_capas, get_capa_by_id, update_capa, delete_capa,
    create_audit_log, get_department_manager_ids
)

router = APIRouter(prefix="/api/capas", tags=["CAPA"])

def serialize_json_fields(capa: Capa) -> dict:
    """Convert CAPA object to dict with parsed JSON fields"""
    result = {
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
        "verification_status": capa.verification_status,
        "severity": capa.severity,
        "estimated_cost": float(capa.estimated_cost) if capa.estimated_cost else None,
        "sla_days": capa.sla_days,
        "escalation_level": capa.escalation_level,
        "closed_at": capa.closed_at,
        "verified_at": capa.verified_at,
        "created_by_id": capa.created_by_id,
        "created_at": capa.created_at,
    }
    
    # Parse JSON fields
    try:
        result["corrective_actions"] = json.loads(capa.corrective_actions) if capa.corrective_actions else []
    except (json.JSONDecodeError, TypeError):
        result["corrective_actions"] = []
    
    try:
        result["preventive_actions"] = json.loads(capa.preventive_actions) if capa.preventive_actions else []
    except (json.JSONDecodeError, TypeError):
        result["preventive_actions"] = []
    
    try:
        result["verification_steps"] = json.loads(capa.verification_steps) if capa.verification_steps else []
    except (json.JSONDecodeError, TypeError):
        result["verification_steps"] = []
    
    try:
        result["status_history"] = json.loads(capa.status_history) if capa.status_history else []
    except (json.JSONDecodeError, TypeError):
        result["status_history"] = []
    
    return result

@router.post("/", response_model=dict)
async def create_capa_endpoint(
    capa: CapaCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new CAPA plan (permission enforced)

    Allowed roles: super_admin, quality_manager, department_head
    """
    # Permission check
    if current_user.role not in ["super_admin", "quality_manager", "department_head"]:
        raise HTTPException(status_code=403, detail="You don't have permission to create CAPA plans")

    # Convert Pydantic models to JSON strings for database storage
    corrective_actions_json = json.dumps([action.dict() for action in capa.corrective_actions])
    preventive_actions_json = json.dumps([action.dict() for action in capa.preventive_actions])
    verification_steps_json = json.dumps([step.dict() for step in capa.verification_steps])

    # Create CAPA data dict
    capa_data = {
        "title": capa.title,
        "description": capa.description,
        "round_id": capa.round_id,
        "department": capa.department,
        "evaluation_item_id": getattr(capa, 'evaluation_item_id', None),
        "assigned_to_id": capa.assigned_to_id,
        "root_cause": capa.root_cause,
        "corrective_actions": corrective_actions_json,
        "preventive_actions": preventive_actions_json,
        "verification_steps": verification_steps_json,
        "severity": capa.severity,
        "estimated_cost": capa.estimated_cost,
        "sla_days": capa.sla_days,
    }

    # Create CAPA in database with audit log
    db_capa = create_capa(db, capa_data, current_user.id)
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
        "capa": serialize_json_fields(db_capa)
    }

@router.get("/{capa_id}", response_model=dict)
async def get_capa_endpoint(
    capa_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific CAPA plan by ID"""
    capa = get_capa_by_id(db, capa_id)
    if not capa:
        raise HTTPException(status_code=404, detail="CAPA plan not found")
    
    return {
        "status": "success",
        "capa": serialize_json_fields(capa)
    }

@router.get("/", response_model=dict)
async def get_capas_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    severity: Optional[int] = Query(None, ge=1, le=5),
    verification_status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get CAPA plans with optional filtering"""
    # Build query
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
    serialized_capas = [serialize_json_fields(capa) for capa in capas]
    
    return {
        "status": "success",
        "capas": serialized_capas,
        "total_count": total_count,
        "skip": skip,
        "limit": limit
    }

@router.patch("/{capa_id}", response_model=dict)
async def update_capa_endpoint(
    capa_id: int,
    capa_update: CapaUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a CAPA plan"""
    # Check if CAPA exists
    existing_capa = get_capa_by_id(db, capa_id)
    if not existing_capa:
        raise HTTPException(status_code=404, detail="CAPA plan not found")
    
    # Check permissions - only assigned user, quality managers, or super admins can update
    if (current_user.role not in ["quality_manager", "super_admin"] and 
        existing_capa.assigned_to_id != current_user.id):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to update this CAPA plan"
        )
    
    # Prepare update data
    update_data = {}
    
    # Convert Pydantic models to JSON strings if provided
    if capa_update.corrective_actions is not None:
        update_data["corrective_actions"] = json.dumps([action.dict() for action in capa_update.corrective_actions])
    
    if capa_update.preventive_actions is not None:
        update_data["preventive_actions"] = json.dumps([action.dict() for action in capa_update.preventive_actions])
    
    if capa_update.verification_steps is not None:
        update_data["verification_steps"] = json.dumps([step.dict() for step in capa_update.verification_steps])
    
    # Add other fields
    for field, value in capa_update.dict(exclude_unset=True, exclude={"corrective_actions", "preventive_actions", "verification_steps"}).items():
        if value is not None:
            update_data[field] = value
    
    # Update CAPA
    updated_capa = update_capa(db, capa_id, update_data)
    
    # Create audit log
    create_audit_log(db, {
        "user_id": current_user.id,
        "action": "update_capa",
        "entity_type": "capa",
        "entity_id": capa_id,
        "old_values": json.dumps({"title": existing_capa.title, "status": existing_capa.status}),
        "new_values": json.dumps({"title": updated_capa.title, "status": updated_capa.status})
    })
    
    return {
        "status": "success",
        "message": "CAPA plan updated successfully",
        "capa": serialize_json_fields(updated_capa)
    }

@router.post("/{capa_id}/verify", response_model=dict)
async def verify_capa_endpoint(
    capa_id: int,
    verification_data: CapaVerify,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify a CAPA plan"""
    # Check if CAPA exists
    capa = get_capa_by_id(db, capa_id)
    if not capa:
        raise HTTPException(status_code=404, detail="CAPA plan not found")
    
    # Check permissions - only quality managers and super admins can verify
    if current_user.role not in ["quality_manager", "super_admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only quality managers and super admins can verify CAPA plans"
        )
    
    # Check if all required verification steps are completed
    required_steps = [step for step in verification_data.verification_steps if step.required]
    completed_required_steps = [step for step in required_steps if step.completed]
    
    if len(completed_required_steps) != len(required_steps):
        raise HTTPException(
            status_code=400,
            detail="All required verification steps must be completed before verification"
        )
    
    # Update verification status and steps
    update_data = {
        "verification_steps": json.dumps([step.dict() for step in verification_data.verification_steps]),
        "verification_status": VerificationStatus.VERIFIED.value,
        "verified_at": datetime.utcnow()
    }
    
    # If all verification steps are completed, mark as verified
    if all(step.completed for step in verification_data.verification_steps):
        update_data["status"] = CapaStatus.VERIFIED.value
        update_data["closed_at"] = datetime.utcnow()
    
    updated_capa = update_capa(db, capa_id, update_data)
    
    # Create audit log
    create_audit_log(db, {
        "user_id": current_user.id,
        "action": "verify_capa",
        "entity_type": "capa",
        "entity_id": capa_id,
        "new_values": json.dumps({"verification_status": "verified", "verified_at": datetime.utcnow().isoformat()})
    })
    
    return {
        "status": "success",
        "message": "CAPA plan verified successfully",
        "capa": serialize_json_fields(updated_capa)
    }

@router.delete("/{capa_id}", response_model=dict)
async def delete_capa_endpoint(
    capa_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a CAPA plan"""
    # Check permissions - only super admins can delete
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Only super admins can delete CAPA plans"
        )
    
    # Check if CAPA exists
    capa = get_capa_by_id(db, capa_id)
    if not capa:
        raise HTTPException(status_code=404, detail="CAPA plan not found")
    
    # Delete CAPA
    deleted_capa = delete_capa(db, capa_id)
    
    # Create audit log
    create_audit_log(db, {
        "user_id": current_user.id,
        "action": "delete_capa",
        "entity_type": "capa",
        "entity_id": capa_id,
        "old_values": json.dumps({"title": deleted_capa.title, "department": deleted_capa.department})
    })
    
    return {
        "status": "success",
        "message": "CAPA plan deleted successfully"
    }

@router.get("/dashboard/stats", response_model=dict)
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
