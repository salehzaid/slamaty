from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum as SQLEnum, SmallInteger, Numeric, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    QUALITY_MANAGER = "quality_manager"
    DEPARTMENT_HEAD = "department_head"
    ASSESSOR = "assessor"
    VIEWER = "viewer"

class RoundStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    PENDING_REVIEW = "pending_review"
    UNDER_REVIEW = "under_review"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    ON_HOLD = "on_hold"
    OVERDUE = "overdue"

class RoundType(str, enum.Enum):
    PATIENT_SAFETY = "patient_safety"
    INFECTION_CONTROL = "infection_control"
    HYGIENE = "hygiene"
    MEDICATION_SAFETY = "medication_safety"
    EQUIPMENT_SAFETY = "equipment_safety"
    ENVIRONMENTAL = "environmental"
    GENERAL = "general"

class CapaStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    IMPLEMENTED = "implemented"
    VERIFICATION = "verification"
    VERIFIED = "verified"
    REJECTED = "rejected"
    CLOSED = "closed"

class VerificationStatus(str, enum.Enum):
    PENDING = "pending"
    IN_REVIEW = "in_review"
    VERIFIED = "verified"
    REJECTED = "rejected"

class ActionStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

class ActionType(str, enum.Enum):
    CORRECTIVE = "corrective"
    PREVENTIVE = "preventive"
    VERIFICATION = "verification"

class Priority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class User(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.VIEWER)
    department = Column(String)
    phone = Column(String)
    position = Column(String)
    photo_url = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    rounds_created = relationship("Round", back_populates="creator")
    capas_created = relationship("Capa", back_populates="creator", foreign_keys="Capa.created_by_id")
    capas_assigned = relationship("Capa", back_populates="assigned_user", foreign_keys="Capa.assigned_to_id")
    corrective_actions_assigned = relationship("CorrectiveAction", back_populates="assigned_user")
    preventive_actions_assigned = relationship("PreventiveAction", back_populates="assigned_user")
    verification_steps_assigned = relationship("VerificationStep", back_populates="assigned_user")
    progress_updates = relationship("CapaProgressTracking", back_populates="updated_by")

class Department(Base):
    __tablename__ = "departments"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    name_en = Column(String)
    code = Column(String, unique=True, nullable=False)
    floor = Column(String)
    building = Column(String)
    managers = Column(Text)  # JSON string of user IDs for department managers
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    capas = relationship("Capa", back_populates="department_obj")

class Round(Base):
    __tablename__ = "rounds"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    round_code = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    round_type = Column(SQLEnum(RoundType), nullable=False)
    department = Column(String, nullable=False)
    assigned_to = Column(Text)  # JSON string of user IDs
    scheduled_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(SQLEnum(RoundStatus), default=RoundStatus.SCHEDULED)
    priority = Column(String, default="medium")  # low, medium, high, urgent
    compliance_percentage = Column(Integer, default=0)
    completion_percentage = Column(Integer, default=0)  # Percentage of evaluation items completed
    notes = Column(Text)
    evaluation_items = Column(Text)  # JSON string of evaluation item IDs
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    creator = relationship("User", back_populates="rounds_created")
    capas = relationship("Capa", back_populates="round")
    evaluation_results = relationship("EvaluationResult", back_populates="round")

class Capa(Base):
    __tablename__ = "capas"
    __table_args__ = {'extend_existing': True}
    __mapper_args__ = {
        'exclude_properties': ['corrective_actions', 'preventive_actions', 'verification_steps']
    }
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    round_id = Column(Integer, ForeignKey("rounds.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    department = Column(String, nullable=False)  # Keep for backward compatibility
    priority = Column(SQLEnum(Priority), default=Priority.MEDIUM)
    status = Column(SQLEnum(CapaStatus), default=CapaStatus.PENDING)
    verification_status = Column(SQLEnum(VerificationStatus), default=VerificationStatus.PENDING)
    severity = Column(SmallInteger, default=3)  # 1-5 scale
    target_date = Column(Date, nullable=False)
    actual_completion_date = Column(Date, nullable=True)
    escalation_level = Column(Integer, default=0)
    root_cause = Column(Text, nullable=True)
    estimated_cost = Column(Numeric(10, 2), nullable=True)
    actual_cost = Column(Numeric(10, 2), nullable=True)
    sla_days = Column(Integer, default=30)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    evaluation_item_id = Column(Integer, ForeignKey("evaluation_items.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    closed_at = Column(DateTime(timezone=True), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # JSON columns for backward compatibility
    corrective_actions_json = Column(Text, default='[]')  # JSONB stored as text
    preventive_actions_json = Column(Text, default='[]')  # JSONB stored as text
    verification_steps_json = Column(Text, default='[]')  # JSONB stored as text
    
    # Relationships
    round = relationship("Round", back_populates="capas")
    department_obj = relationship("Department", back_populates="capas")
    creator = relationship("User", back_populates="capas_created", foreign_keys=[created_by_id])
    assigned_user = relationship("User", back_populates="capas_assigned", foreign_keys=[assigned_to_id])
    evaluation_item = relationship("EvaluationItem")
    corrective_actions = relationship("CorrectiveAction", back_populates="capa", cascade="all, delete-orphan")
    preventive_actions = relationship("PreventiveAction", back_populates="capa", cascade="all, delete-orphan")
    verification_steps = relationship("VerificationStep", back_populates="capa", cascade="all, delete-orphan")
    progress_tracking = relationship("CapaProgressTracking", back_populates="capa", cascade="all, delete-orphan")

class CorrectiveAction(Base):
    __tablename__ = "corrective_actions"
    
    id = Column(Integer, primary_key=True, index=True)
    capa_id = Column(Integer, ForeignKey("capas.id", ondelete="CASCADE"), nullable=False)
    task = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    due_date = Column(Date, nullable=True)
    completed_date = Column(Date, nullable=True)
    status = Column(SQLEnum(ActionStatus), default=ActionStatus.PENDING)
    completion_percentage = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    capa = relationship("Capa", back_populates="corrective_actions")
    assigned_user = relationship("User", back_populates="corrective_actions_assigned")

class PreventiveAction(Base):
    __tablename__ = "preventive_actions"
    
    id = Column(Integer, primary_key=True, index=True)
    capa_id = Column(Integer, ForeignKey("capas.id", ondelete="CASCADE"), nullable=False)
    task = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    due_date = Column(Date, nullable=True)
    completed_date = Column(Date, nullable=True)
    status = Column(SQLEnum(ActionStatus), default=ActionStatus.PENDING)
    completion_percentage = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    capa = relationship("Capa", back_populates="preventive_actions")
    assigned_user = relationship("User", back_populates="preventive_actions_assigned")

class VerificationStep(Base):
    __tablename__ = "verification_steps"
    
    id = Column(Integer, primary_key=True, index=True)
    capa_id = Column(Integer, ForeignKey("capas.id", ondelete="CASCADE"), nullable=False)
    step = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    required = Column(Boolean, default=True)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    due_date = Column(Date, nullable=True)
    completed_date = Column(Date, nullable=True)
    completed = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    capa = relationship("Capa", back_populates="verification_steps")
    assigned_user = relationship("User", back_populates="verification_steps_assigned")

class CapaProgressTracking(Base):
    __tablename__ = "capa_progress_tracking"
    
    id = Column(Integer, primary_key=True, index=True)
    capa_id = Column(Integer, ForeignKey("capas.id", ondelete="CASCADE"), nullable=False)
    action_type = Column(SQLEnum(ActionType), nullable=False)
    action_id = Column(Integer, nullable=True)  # ID of the specific action/step
    progress_percentage = Column(Integer, nullable=True)
    status_change = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    updated_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    capa = relationship("Capa", back_populates="progress_tracking")
    updated_by = relationship("User", back_populates="progress_updates")

class EvaluationCategory(Base):
    __tablename__ = "evaluation_categories"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    name_en = Column(String)
    description = Column(Text)
    color = Column(String, default="blue")
    icon = Column(String, default="shield")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

class EvaluationItem(Base):
    __tablename__ = "evaluation_items"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    title_en = Column(String)
    description = Column(Text)
    objective = Column(Text)
    category_id = Column(Integer, ForeignKey("evaluation_categories.id"), nullable=False)
    category_name = Column(String, nullable=False)
    category_color = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_required = Column(Boolean, default=False)
    weight = Column(Integer, default=1)
    risk_level = Column(String, default="MINOR")
    evidence_type = Column(String, default="OBSERVATION")
    guidance_ar = Column(Text)
    guidance_en = Column(Text)
    standard_version = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

class RoundTypeSettings(Base):
    __tablename__ = "round_types"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    name_en = Column(String)
    description = Column(Text)
    color = Column(String, default="blue")
    icon = Column(String, default="shield")
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

class EvaluationResult(Base):
    __tablename__ = "evaluation_results"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    round_id = Column(Integer, ForeignKey("rounds.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("evaluation_items.id"), nullable=False)
    score = Column(Integer, nullable=False)
    comments = Column(Text)
    evidence_files = Column(Text)  # JSON array of file paths
    evaluated_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    evaluated_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    round = relationship("Round", back_populates="evaluation_results")
