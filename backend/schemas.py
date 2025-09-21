from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models_updated import UserRole, RoundStatus, RoundType, CapaStatus, NotificationType, NotificationStatus

# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRole = UserRole.VIEWER
    department: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    photo_url: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRole] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    photo_url: Optional[str] = None
    password: Optional[str] = None
    
    class Config:
        from_attributes = True
        extra = "ignore"

class UserResponse(UserBase):
    id: int
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Round schemas
class RoundBase(BaseModel):
    title: str
    description: Optional[str] = None
    round_type: RoundType
    department: str
    assigned_to: List[int] = []  # Changed to List[int] for user IDs
    scheduled_date: datetime
    deadline: Optional[datetime] = None  # Deadline for round completion
    priority: str = "medium"
    notes: Optional[str] = None
    evaluation_items: Optional[List[int]] = []  # Added evaluation items

class RoundCreate(RoundBase):
    round_code: Optional[str] = None  # Auto-generated

class RoundResponse(RoundBase):
    id: int
    round_code: str
    status: RoundStatus
    compliance_percentage: int
    created_by_id: int
    created_at: datetime
    assigned_to: str  # JSON string in database for display
    evaluation_items: Optional[str] = None  # JSON string of evaluation item IDs
    
    class Config:
        from_attributes = True

# CAPA schemas
class CapaBase(BaseModel):
    title: str
    description: str

class CapaCreate(CapaBase):
    round_id: Optional[int] = None

class CapaResponse(CapaBase):
    id: int
    round_id: Optional[int] = None
    department: str
    priority: str = "medium"
    assigned_to: Optional[str] = None
    assigned_to_id: Optional[int] = None
    evaluation_item_id: Optional[int] = None
    target_date: datetime
    risk_score: Optional[int] = None
    status: CapaStatus
    created_by_id: int
    created_at: datetime
    assigned_manager: Optional[UserResponse] = None  # Details of the assigned manager
    creator: Optional[UserResponse] = None  # Details of the creator
    
    class Config:
        from_attributes = True

# Department schemas
class DepartmentBase(BaseModel):
    name: str
    name_en: Optional[str] = None
    code: str
    floor: Optional[str] = None
    building: Optional[str] = None
    description: Optional[str] = None
    managers: Optional[List[int]] = []  # List of user IDs for department managers

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    # managers inherited from DepartmentBase as List[int]
    
    class Config:
        from_attributes = True

# Evaluation Category schemas
class EvaluationCategoryBase(BaseModel):
    name: str
    name_en: Optional[str] = None
    description: Optional[str] = None
    color: str = "blue"
    icon: str = "shield"

class EvaluationCategoryCreate(EvaluationCategoryBase):
    pass

class EvaluationCategoryResponse(EvaluationCategoryBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Evaluation Item schemas
class EvaluationItemBase(BaseModel):
    code: str
    title: str
    title_en: Optional[str] = None
    description: Optional[str] = None
    objective: Optional[str] = None
    category_id: int
    is_required: bool = False
    weight: int = 1
    risk_level: str = "MINOR"
    evidence_type: str = "OBSERVATION"
    guidance_ar: Optional[str] = None
    guidance_en: Optional[str] = None
    standard_version: Optional[str] = None

class EvaluationItemCreate(EvaluationItemBase):
    pass

class EvaluationItemResponse(EvaluationItemBase):
    id: int
    category_name: str
    category_color: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Evaluation Result schemas
class EvaluationResultCreate(BaseModel):
    item_id: int
    status: str  # expected: 'applied'|'not_applied'|'partial'|'na'
    comments: Optional[str] = None
    evidence_files: Optional[List[str]] = None


class EvaluationsPayload(BaseModel):
    evaluations: List[EvaluationResultCreate]
    notes: Optional[str] = None


class EvaluationResultResponse(BaseModel):
    id: int
    round_id: int
    item_id: int
    score: int
    comments: Optional[str] = None
    evidence_files: Optional[str] = None
    evaluated_by: int
    evaluated_at: datetime
    
    class Config:
        from_attributes = True

# Objective Option schemas
class ObjectiveOptionBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True

class ObjectiveOptionCreate(ObjectiveOptionBase):
    pass

class ObjectiveOptionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class ObjectiveOptionResponse(ObjectiveOptionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Dashboard schemas
class DashboardStats(BaseModel):
    total_rounds: int
    completed_rounds: int
    pending_rounds: int
    overdue_rounds: int
    average_compliance: float
    total_capa: int
    open_capa: int
    closed_capa: int
    overdue_capa: int

# Audit Log schemas
class AuditLogBase(BaseModel):
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    old_values: Optional[str] = None
    new_values: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class AuditLogCreate(AuditLogBase):
    user_id: int

class AuditLogResponse(AuditLogBase):
    id: int
    user_id: int
    created_at: datetime
    user_name: Optional[str] = None
    
    class Config:
        from_attributes = True

# Notification schemas
class NotificationBase(BaseModel):
    title: str
    message: str
    notification_type: NotificationType
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None

class NotificationCreate(NotificationBase):
    user_id: int

class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    status: NotificationStatus
    is_email_sent: bool
    email_sent_at: Optional[datetime] = None
    created_at: datetime
    read_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class NotificationUpdate(BaseModel):
    status: Optional[NotificationStatus] = None
    read_at: Optional[datetime] = None

# User Notification Settings schemas
class UserNotificationSettingsBase(BaseModel):
    email_notifications: bool = True
    sms_notifications: bool = False
    round_assignments: bool = True
    round_reminders: bool = True
    round_deadlines: bool = True
    capa_assignments: bool = True
    capa_deadlines: bool = True
    system_updates: bool = False
    weekly_reports: bool = True

class UserNotificationSettingsCreate(UserNotificationSettingsBase):
    user_id: int

class UserNotificationSettingsUpdate(BaseModel):
    email_notifications: Optional[bool] = None
    sms_notifications: Optional[bool] = None
    round_assignments: Optional[bool] = None
    round_reminders: Optional[bool] = None
    round_deadlines: Optional[bool] = None
    capa_assignments: Optional[bool] = None
    capa_deadlines: Optional[bool] = None
    system_updates: Optional[bool] = None
    weekly_reports: Optional[bool] = None

class UserNotificationSettingsResponse(UserNotificationSettingsBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Round Type schemas
class RoundTypeBase(BaseModel):
    name: str
    name_en: Optional[str] = None
    description: Optional[str] = None
    color: str = "blue"
    icon: str = "shield"
    is_active: bool = True
    sort_order: int = 0

class RoundTypeCreate(RoundTypeBase):
    pass

class RoundTypeUpdate(BaseModel):
    name: Optional[str] = None
    name_en: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None
    
    class Config:
        from_attributes = True
        extra = "ignore"

class RoundTypeResponse(RoundTypeBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
