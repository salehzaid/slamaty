from pydantic import BaseModel
from typing import List, Optional, Any, Dict


class DashboardStats(BaseModel):
    total_capas: int = 0
    open_capas: int = 0
    closed_capas: int = 0


class OverdueActions(BaseModel):
    overdue_count: int = 0
    actions: List[Dict[str, Any]] = []


class UpcomingDeadlines(BaseModel):
    upcoming: List[Dict[str, Any]] = []


class TimelineEvent(BaseModel):
    id: int
    title: str
    date: Optional[str] = None


class Alert(BaseModel):
    id: int
    message: str
    read: bool = False


class BasicReportData(BaseModel):
    report: Dict[str, Any] = {}


__all__ = [
    "DashboardStats",
    "OverdueActions",
    "UpcomingDeadlines",
    "TimelineEvent",
    "Alert",
    "BasicReportData",
]


