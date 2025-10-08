from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum as SQLEnum, SmallInteger, Numeric
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
    PENDING = "PENDING"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    IMPLEMENTED = "IMPLEMENTED"
    VERIFICATION = "VERIFICATION"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    CLOSED = "CLOSED"

class VerificationStatus(str, enum.Enum):
    PENDING = "pending"
    IN_REVIEW = "in_review"
    VERIFIED = "verified"
    REJECTED = "rejected"

class RiskLevel(str, enum.Enum):
    MINOR = "MINOR"
    MAJOR = "MAJOR"
    CRITICAL = "CRITICAL"

class EvidenceType(str, enum.Enum):
    OBSERVATION = "OBSERVATION"
    DOCUMENT = "DOCUMENT"
    INTERVIEW = "INTERVIEW"
    MEASUREMENT = "MEASUREMENT"

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
    evaluation_results = relationship("EvaluationResult", back_populates="evaluator")

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    name_en = Column(String)
    code = Column(String, unique=True, nullable=False)
    description = Column(Text)
    location = Column(String)
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
    deadline = Column(DateTime(timezone=True), nullable=True)  # Deadline for round completion
    end_date = Column(DateTime(timezone=True), nullable=True)  # Calculated end date (scheduled_date + deadline days)
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
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    round_id = Column(Integer, ForeignKey("rounds.id"))
    department = Column(String, nullable=False)
    priority = Column(String, default="medium")  # low, medium, high, urgent
    status = Column(String, default="pending")
    assigned_to = Column(String)  # User name or ID
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # User ID of assigned manager
    evaluation_item_id = Column(Integer, ForeignKey("evaluation_items.id"), nullable=True)  # Link to evaluation item
    target_date = Column(DateTime(timezone=True), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    risk_score = Column(Integer)
    
    # New CAPA improvement fields
    root_cause = Column(Text, nullable=True)
    corrective_actions = Column(Text, default='[]')  # JSONB stored as text
    preventive_actions = Column(Text, default='[]')  # JSONB stored as text
    verification_steps = Column(Text, default='[]')  # JSONB stored as text
    # Store verification_status as plain string to avoid mismatches between
    # Python enum members and the DB enum type created earlier. Values are
    # normalized to lowercase (e.g. 'pending', 'in_review').
    verification_status = Column(String, default=VerificationStatus.PENDING.value)
    severity = Column(SmallInteger, default=3)  # 1-5 scale
    estimated_cost = Column(Numeric, nullable=True)
    status_history = Column(Text, default='[]')  # JSONB stored as text
    sla_days = Column(Integer, default=14)
    escalation_level = Column(Integer, default=0)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    # verified_at = Column(DateTime(timezone=True), nullable=True)  # Column doesn't exist in DB
    
    # Relationships
    round = relationship("Round", back_populates="capas")
    creator = relationship("User", back_populates="capas_created", foreign_keys=[created_by_id])
    assigned_manager = relationship("User", foreign_keys=[assigned_to_id])
    evaluation_item = relationship("EvaluationItem")
    actions = relationship("CapaAction", back_populates="capa", cascade="all, delete-orphan")

class CapaAction(Base):
    """جدول الإجراءات المرتبطة بالخطط التصحيحية
    
    يخزن الإجراءات التصحيحية والوقائية وخطوات التحقق في صفوف منفصلة
    لتسهيل الاستعلام والتقارير والمتابعة الفردية
    """
    __tablename__ = "capa_actions"
    
    id = Column(Integer, primary_key=True, index=True)
    capa_id = Column(Integer, ForeignKey("capas.id", ondelete="CASCADE"), nullable=False, index=True)
    action_type = Column(String, nullable=False, index=True)  # 'corrective' | 'preventive' | 'verification'
    task = Column(Text, nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=True, index=True)
    assigned_to = Column(String, nullable=True)  # نص احتياطي لاسم المسؤول
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    notes = Column(Text, nullable=True)
    status = Column(String, default="open", index=True)  # open | in_progress | completed | cancelled
    completed_at = Column(DateTime(timezone=True), nullable=True)
    completed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    # verification-specific fields
    required = Column(Boolean, default=True)  # لخطوات التحقق: إلزامية أم لا
    # metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    capa = relationship("Capa", back_populates="actions")
    assigned_user = relationship("User", foreign_keys=[assigned_to_id])
    completed_by = relationship("User", foreign_keys=[completed_by_id])

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
    
    # Relationships
    evaluation_items = relationship("EvaluationItem", back_populates="category")

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
    risk_level = Column(SQLEnum(RiskLevel), default=RiskLevel.MINOR)
    evidence_type = Column(Text, default="OBSERVATION")  # يمكن أن تكون قيم متعددة مفصولة بفاصلة
    guidance_ar = Column(Text)
    guidance_en = Column(Text)
    standard_version = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    category = relationship("EvaluationCategory", back_populates="evaluation_items")
    evaluation_results = relationship("EvaluationResult", back_populates="item")

class ObjectiveOption(Base):
    __tablename__ = "objective_options"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class EvaluationResult(Base):
    __tablename__ = "evaluation_results"
    
    id = Column(Integer, primary_key=True, index=True)
    round_id = Column(Integer, ForeignKey("rounds.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("evaluation_items.id"), nullable=False)
    score = Column(Integer, nullable=False)  # 0-100
    comments = Column(Text)
    evidence_files = Column(Text)  # JSON array of file paths
    evaluated_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    evaluated_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    round = relationship("Round", back_populates="evaluation_results")
    item = relationship("EvaluationItem", back_populates="evaluation_results")
    evaluator = relationship("User", back_populates="evaluation_results")

class NotificationType(str, enum.Enum):
    ROUND_ASSIGNED = "round_assigned"
    ROUND_REMINDER = "round_reminder"
    ROUND_DEADLINE = "round_deadline"
    CAPA_ASSIGNED = "capa_assigned"
    CAPA_DEADLINE = "capa_deadline"
    SYSTEM_UPDATE = "system_update"
    GENERAL = "general"

class NotificationStatus(str, enum.Enum):
    UNREAD = "unread"
    READ = "read"
    ARCHIVED = "archived"

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String, nullable=False)
    status = Column(String, default="unread")
    entity_type = Column(String)  # ROUND, CAPA, etc.
    entity_id = Column(Integer)  # ID of the related entity
    is_email_sent = Column(Boolean, default=False)
    email_sent_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User")

class UserNotificationSettings(Base):
    __tablename__ = "user_notification_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    email_notifications = Column(Boolean, default=True)
    sms_notifications = Column(Boolean, default=False)
    round_assignments = Column(Boolean, default=True)
    round_reminders = Column(Boolean, default=True)
    round_deadlines = Column(Boolean, default=True)
    capa_assignments = Column(Boolean, default=True)
    capa_deadlines = Column(Boolean, default=True)
    system_updates = Column(Boolean, default=False)
    weekly_reports = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)  # CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    entity_type = Column(String, nullable=False)  # USER, ROUND, CAPA, etc.
    entity_id = Column(Integer)  # ID of the affected entity
    old_values = Column(Text)  # JSON string of old values
    new_values = Column(Text)  # JSON string of new values
    ip_address = Column(String)
    user_agent = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")

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
