"""
Enhanced Pydantic schemas for the new CAPA system
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from enum import Enum

# ==================== Enums ====================

class CapaStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    IMPLEMENTED = "implemented"
    VERIFICATION = "verification"
    VERIFIED = "verified"
    REJECTED = "rejected"
    CLOSED = "closed"

class VerificationStatus(str, Enum):
    PENDING = "pending"
    IN_REVIEW = "in_review"
    VERIFIED = "verified"
    REJECTED = "rejected"

class ActionStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

class ActionType(str, Enum):
    CORRECTIVE = "corrective"
    PREVENTIVE = "preventive"
    VERIFICATION = "verification"

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

# ==================== CAPA Schemas ====================

class CapaBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    round_id: Optional[int] = None
    department_id: Optional[int] = None
    department: str = Field(..., min_length=1)
    priority: Priority = Priority.MEDIUM
    status: CapaStatus = CapaStatus.PENDING
    verification_status: VerificationStatus = VerificationStatus.PENDING
    severity: int = Field(3, ge=1, le=5)
    target_date: date
    escalation_level: int = Field(0, ge=0)
    root_cause: Optional[str] = None
    estimated_cost: Optional[float] = Field(None, ge=0)
    sla_days: int = Field(30, ge=1)
    assigned_to_id: Optional[int] = None
    evaluation_item_id: Optional[int] = None

class CapaCreate(CapaBase):
    created_by_id: int

class CapaUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, min_length=1)
    round_id: Optional[int] = None
    department_id: Optional[int] = None
    department: Optional[str] = Field(None, min_length=1)
    priority: Optional[Priority] = None
    status: Optional[CapaStatus] = None
    verification_status: Optional[VerificationStatus] = None
    severity: Optional[int] = Field(None, ge=1, le=5)
    target_date: Optional[date] = None
    actual_completion_date: Optional[date] = None
    escalation_level: Optional[int] = Field(None, ge=0)
    root_cause: Optional[str] = None
    estimated_cost: Optional[float] = Field(None, ge=0)
    actual_cost: Optional[float] = Field(None, ge=0)
    sla_days: Optional[int] = Field(None, ge=1)
    assigned_to_id: Optional[int] = None
    evaluation_item_id: Optional[int] = None

class CapaResponse(CapaBase):
    id: int
    actual_completion_date: Optional[date] = None
    actual_cost: Optional[float] = None
    created_by_id: int
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    
    # Related data
    corrective_actions: List['CorrectiveActionResponse'] = []
    preventive_actions: List['PreventiveActionResponse'] = []
    verification_steps: List['VerificationStepResponse'] = []
    progress_tracking: List['ProgressTrackingResponse'] = []
    
    class Config:
        from_attributes = True

# ==================== Corrective Action Schemas ====================

class CorrectiveActionBase(BaseModel):
    task: str = Field(..., min_length=1)
    description: Optional[str] = None
    assigned_to_id: Optional[int] = None
    due_date: Optional[date] = None
    status: ActionStatus = ActionStatus.PENDING
    completion_percentage: int = Field(0, ge=0, le=100)
    notes: Optional[str] = None

class CorrectiveActionCreate(CorrectiveActionBase):
    pass

class CorrectiveActionUpdate(BaseModel):
    task: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    assigned_to_id: Optional[int] = None
    due_date: Optional[date] = None
    completed_date: Optional[date] = None
    status: Optional[ActionStatus] = None
    completion_percentage: Optional[int] = Field(None, ge=0, le=100)
    notes: Optional[str] = None

class CorrectiveActionResponse(CorrectiveActionBase):
    id: int
    capa_id: int
    completed_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ==================== Preventive Action Schemas ====================

class PreventiveActionBase(BaseModel):
    task: str = Field(..., min_length=1)
    description: Optional[str] = None
    assigned_to_id: Optional[int] = None
    due_date: Optional[date] = None
    status: ActionStatus = ActionStatus.PENDING
    completion_percentage: int = Field(0, ge=0, le=100)
    notes: Optional[str] = None

class PreventiveActionCreate(PreventiveActionBase):
    pass

class PreventiveActionUpdate(BaseModel):
    task: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    assigned_to_id: Optional[int] = None
    due_date: Optional[date] = None
    completed_date: Optional[date] = None
    status: Optional[ActionStatus] = None
    completion_percentage: Optional[int] = Field(None, ge=0, le=100)
    notes: Optional[str] = None

class PreventiveActionResponse(PreventiveActionBase):
    id: int
    capa_id: int
    completed_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ==================== Verification Step Schemas ====================

class VerificationStepBase(BaseModel):
    step: str = Field(..., min_length=1)
    description: Optional[str] = None
    required: bool = True
    assigned_to_id: Optional[int] = None
    due_date: Optional[date] = None
    completed: bool = False
    notes: Optional[str] = None

class VerificationStepCreate(VerificationStepBase):
    pass

class VerificationStepUpdate(BaseModel):
    step: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    required: Optional[bool] = None
    assigned_to_id: Optional[int] = None
    due_date: Optional[date] = None
    completed_date: Optional[date] = None
    completed: Optional[bool] = None
    notes: Optional[str] = None

class VerificationStepResponse(VerificationStepBase):
    id: int
    capa_id: int
    completed_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ==================== Progress Tracking Schemas ====================

class ProgressTrackingBase(BaseModel):
    action_type: ActionType
    action_id: Optional[int] = None
    progress_percentage: Optional[int] = Field(None, ge=0, le=100)
    status_change: str = Field(..., min_length=1, max_length=50)
    notes: Optional[str] = None
    updated_by_id: int

class ProgressTrackingCreate(ProgressTrackingBase):
    pass

class ProgressTrackingResponse(ProgressTrackingBase):
    id: int
    capa_id: int
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ==================== Dashboard Schemas ====================

class DashboardStatsResponse(BaseModel):
    total_capas: int
    overdue_capas: int
    completed_this_month: int
    critical_pending: int
    average_completion_time: float
    cost_savings: float

class OverdueActionsResponse(BaseModel):
    corrective_actions: List[CorrectiveActionResponse]
    preventive_actions: List[PreventiveActionResponse]
    verification_steps: List[VerificationStepResponse]

class UpcomingDeadlinesResponse(BaseModel):
    corrective_actions: List[CorrectiveActionResponse]
    preventive_actions: List[PreventiveActionResponse]
    verification_steps: List[VerificationStepResponse]

# ==================== Department Analytics Schemas ====================

class DepartmentCapaStatsResponse(BaseModel):
    total_capas: int
    status_breakdown: Dict[str, int]
    priority_breakdown: Dict[str, int]
    average_completion_time: float

# ==================== Update forward references ====================

CapaResponse.model_rebuild()
CorrectiveActionResponse.model_rebuild()
PreventiveActionResponse.model_rebuild()
VerificationStepResponse.model_rebuild()
ProgressTrackingResponse.model_rebuild()
