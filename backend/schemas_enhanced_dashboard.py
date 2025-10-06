"""
Enhanced CAPA Dashboard Pydantic schemas
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from enum import Enum

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

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

class AlertType(str, Enum):
    OVERDUE = "overdue"
    UPCOMING = "upcoming"
    ESCALATION = "escalation"
    COMPLETION = "completion"
    SYSTEM = "system"

class AlertPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class TimelineEventType(str, Enum):
    CAPA_CREATED = "capa_created"
    ACTION_STARTED = "action_started"
    ACTION_COMPLETED = "action_completed"
    VERIFICATION_STEP = "verification_step"
    STATUS_CHANGE = "status_change"

# Dashboard Stats Schema
class DashboardStats(BaseModel):
    total_capas: int
    overdue_capas: int
    completed_this_month: int
    critical_pending: int
    average_completion_time: int
    cost_savings: float

# Action Schemas
class ActionItem(BaseModel):
    id: int
    task: str
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: date
    status: ActionStatus
    completion_percentage: int
    capa_id: int
    capa_title: str
    type: ActionType
    notes: Optional[str] = None

class OverdueAction(BaseModel):
    id: int
    task: str
    due_date: date
    status: ActionStatus
    capa_id: int
    capa_title: str
    assigned_to: Optional[str] = None

class UpcomingDeadline(BaseModel):
    id: int
    task: str
    due_date: date
    status: ActionStatus
    capa_id: int
    capa_title: str
    assigned_to: Optional[str] = None

class OverdueActions(BaseModel):
    corrective_actions: List[OverdueAction]
    preventive_actions: List[OverdueAction]
    verification_steps: List[OverdueAction]

class UpcomingDeadlines(BaseModel):
    corrective_actions: List[UpcomingDeadline]
    preventive_actions: List[UpcomingDeadline]
    verification_steps: List[UpcomingDeadline]

# Timeline Schemas
class TimelineEvent(BaseModel):
    id: str
    type: TimelineEventType
    title: str
    description: str
    timestamp: datetime
    user_name: Optional[str] = None
    capa_id: int
    capa_title: str
    action_id: Optional[int] = None
    action_type: Optional[ActionType] = None
    status: Optional[str] = None
    progress_percentage: Optional[int] = None

# Alert Schemas
class Alert(BaseModel):
    id: str
    type: AlertType
    title: str
    message: str
    priority: AlertPriority
    created_at: datetime
    read: bool
    action_required: bool
    capa_id: Optional[int] = None
    capa_title: Optional[str] = None
    action_id: Optional[int] = None
    due_date: Optional[date] = None
    days_until_due: Optional[int] = None

# Report Schemas
class DepartmentStats(BaseModel):
    department: str
    total_capas: int
    completed_capas: int
    overdue_capas: int
    average_completion_time: int

class PriorityBreakdown(BaseModel):
    low: int
    medium: int
    high: int
    critical: int

class StatusBreakdown(BaseModel):
    pending: int
    in_progress: int
    completed: int
    closed: int

class MonthlyTrend(BaseModel):
    month: str
    created: int
    completed: int
    overdue: int

class BasicReportData(BaseModel):
    period: str
    total_capas: int
    completed_capas: int
    overdue_capas: int
    average_completion_time: int
    cost_savings: float
    department_stats: List[DepartmentStats]
    priority_breakdown: PriorityBreakdown
    status_breakdown: StatusBreakdown
    monthly_trends: List[MonthlyTrend]

# API Request/Response Schemas
class ActionUpdateRequest(BaseModel):
    status: Optional[ActionStatus] = None
    completion_percentage: Optional[int] = None
    notes: Optional[str] = None

class ActionUpdateResponse(BaseModel):
    status: str
    message: str
    action: Optional[ActionItem] = None

class AlertMarkReadResponse(BaseModel):
    status: str
    message: str

class AlertDeleteResponse(BaseModel):
    status: str
    message: str

class ReportExportResponse(BaseModel):
    status: str
    message: str
    download_url: Optional[str] = None

# Filter Schemas
class DashboardFilters(BaseModel):
    date_range: Optional[Dict[str, datetime]] = None
    department_id: Optional[int] = None
    user_id: Optional[int] = None
    priority: Optional[Priority] = None
    status: Optional[ActionStatus] = None

class ReportFilters(BaseModel):
    period: str = "month"
    department_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    format: str = "pdf"

# Dashboard Summary Schema
class DashboardSummary(BaseModel):
    stats: DashboardStats
    overdue_actions: OverdueActions
    upcoming_deadlines: UpcomingDeadlines
    recent_events: List[TimelineEvent]
    unread_alerts: int
    critical_alerts: int

# Performance Metrics Schema
class PerformanceMetrics(BaseModel):
    completion_rate: float
    overdue_rate: float
    average_response_time: float
    cost_efficiency: float
    user_satisfaction: Optional[float] = None

# Dashboard Widget Schema
class DashboardWidget(BaseModel):
    id: str
    type: str
    title: str
    data: Dict[str, Any]
    position: Dict[str, int]
    size: Dict[str, int]
    visible: bool = True

# User Dashboard Preferences Schema
class DashboardPreferences(BaseModel):
    user_id: int
    widgets: List[DashboardWidget]
    layout: Dict[str, Any]
    refresh_interval: int = 30
    notifications_enabled: bool = True
    email_notifications: bool = False
