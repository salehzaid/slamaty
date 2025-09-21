from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum as SQLEnum
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
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    IMPLEMENTED = "implemented"
    VERIFICATION = "verification"
    VERIFIED = "verified"
    REJECTED = "rejected"
    CLOSED = "closed"

class User(Base):
    __tablename__ = "users"
    
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

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    name_en = Column(String)
    code = Column(String, unique=True, nullable=False)
    floor = Column(String)
    building = Column(String)
    managers = Column(Text)  # JSON string of user IDs for department managers
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Round(Base):
    __tablename__ = "rounds"
    
    id = Column(Integer, primary_key=True, index=True)
    round_code = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    round_type = Column(SQLEnum(RoundType), nullable=False)
    department = Column(String, nullable=False)
    assigned_to = Column(Text)  # JSON string of user IDs
    scheduled_date = Column(DateTime(timezone=True), nullable=False)
    # deadline = Column(DateTime(timezone=True), nullable=True)  # Deadline for round completion - commented out for now
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

class Capa(Base):
    __tablename__ = "capas"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    round_id = Column(Integer, ForeignKey("rounds.id"))
    department = Column(String, nullable=False)
    priority = Column(String, default="medium")  # low, medium, high, urgent
    status = Column(SQLEnum(CapaStatus), default=CapaStatus.PENDING)
    assigned_to = Column(String)  # User name or ID
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # User ID of assigned manager
    evaluation_item_id = Column(Integer, ForeignKey("evaluation_items.id"), nullable=True)  # Link to evaluation item
    target_date = Column(DateTime(timezone=True), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    risk_score = Column(Integer)
    
    # Relationships
    round = relationship("Round", back_populates="capas")
    creator = relationship("User", back_populates="capas_created", foreign_keys=[created_by_id])
    assigned_user = relationship("User", foreign_keys=[assigned_to_id])
    evaluation_item = relationship("EvaluationItem")

class EvaluationCategory(Base):
    __tablename__ = "evaluation_categories"
    
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
    
    id = Column(Integer, primary_key=True, index=True)
    round_id = Column(Integer, ForeignKey("rounds.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("evaluation_items.id"), nullable=False)
    score = Column(Integer, nullable=False)
    comments = Column(Text)
    evidence_files = Column(Text)  # JSON array of file paths
    evaluated_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    evaluated_at = Column(DateTime(timezone=True), server_default=func.now())
