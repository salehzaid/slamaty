"""
Real-time Notifications API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import json

from database import get_db
from crud_notifications import (
    get_user_notifications,
    mark_notification_as_read,
    mark_all_notifications_read,
    delete_notification,
    create_notification
)
from schemas_notifications import (
    Notification,
    NotificationCreate,
    NotificationUpdate
)

router = APIRouter()

@router.get("/notifications/", response_model=List[Notification])
async def get_notifications(
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    unread_only: bool = Query(False, description="Show only unread notifications"),
    limit: int = Query(50, description="Maximum number of notifications to return"),
    db: Session = Depends(get_db)
):
    """Get user notifications"""
    try:
        notifications = get_user_notifications(db, user_id, unread_only, limit)
        return notifications
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/notifications/", response_model=Notification)
async def create_notification_endpoint(
    notification: NotificationCreate,
    db: Session = Depends(get_db)
):
    """Create a new notification"""
    try:
        new_notification = create_notification(db, notification)
        return new_notification
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/notifications/{notification_id}/read")
async def mark_notification_read_endpoint(
    notification_id: int,
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    try:
        result = mark_notification_as_read(db, notification_id)
        if result:
            return {"status": "success", "message": "Notification marked as read"}
        else:
            raise HTTPException(status_code=404, detail="Notification not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/notifications/mark-all-read")
async def mark_all_notifications_read_endpoint(
    user_id: Optional[int] = Query(None, description="User ID to mark notifications for"),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for a user"""
    try:
        result = mark_all_notifications_read(db, user_id)
        return {"status": "success", "message": f"Marked {result} notifications as read"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/notifications/{notification_id}")
async def delete_notification_endpoint(
    notification_id: int,
    db: Session = Depends(get_db)
):
    """Delete a notification"""
    try:
        result = delete_notification(db, notification_id)
        if result:
            return {"status": "success", "message": "Notification deleted"}
        else:
            raise HTTPException(status_code=404, detail="Notification not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/notifications/unread-count/")
async def get_unread_count(
    user_id: Optional[int] = Query(None, description="User ID to count unread notifications for"),
    db: Session = Depends(get_db)
):
    """Get unread notification count for a user"""
    try:
        notifications = get_user_notifications(db, user_id, unread_only=True, limit=1000)
        count = len(notifications)
        return {"unread_count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
