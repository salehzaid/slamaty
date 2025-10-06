"""
Notifications Pydantic schemas
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class NotificationBase(BaseModel):
    type: str  # info, warning, error, success
    title: str
    message: str
    priority: str  # low, medium, high, critical
    category: str  # capa, round, system, deadline, escalation
    action_required: bool = False
    data: Optional[Dict[str, Any]] = None

class NotificationCreate(NotificationBase):
    user_id: Optional[int] = None

class NotificationUpdate(BaseModel):
    read: Optional[bool] = None
    title: Optional[str] = None
    message: Optional[str] = None

class Notification(NotificationBase):
    id: str
    timestamp: datetime
    read: bool
    
    class Config:
        from_attributes = True
