"""
Stub helpers for notification-related CRUD used during development.
This prevents import errors when the full module isn't implemented yet.
"""
from typing import List

def get_users_with_notification_preference(db, preference_type: str) -> List[int]:
    """Return user IDs for users who would receive a given notification preference.

    This is a stub: it returns an empty list if database access is not available.
    Replace with actual implementation when user settings storage is finalized.
    """
    try:
        from models_updated import UserNotificationSettings, User
        users = db.query(UserNotificationSettings).filter(getattr(UserNotificationSettings, preference_type) == True).all()
        return [u.user_id for u in users]
    except Exception:
        return []

def update_notification_email_sent(db, notification_id: int):
    """Mark notification email as sent (stub).
    """
    try:
        from models_updated import Notification
        notif = db.query(Notification).filter(Notification.id == notification_id).first()
        if notif:
            notif.is_email_sent = True
            db.commit()
            return True
    except Exception:
        pass
    return False

"""
Stubbed notification CRUD helpers.

This module provides minimal implementations so the application can import
`crud_notifications` in environments where the full notification backend
is not required. The real implementations live elsewhere in production.
"""
from typing import Any, Dict, List, Optional

def create_notification(db, notification_data: Dict[str, Any]):
    """Create a notification record (stub).

    Returns a simple dict-like object with an `id` for compatibility.
    """
    # Minimal stub: return a simple object
    class _N:
        def __init__(self):
            self.id = -1
    return _N()

def get_notifications_by_user(db, user_id: int, limit: int = 50):
    return []

def get_unread_notifications_count(db, user_id: int) -> int:
    return 0

def mark_notification_as_read(db, notification_id: int) -> bool:
    return True

def mark_all_notifications_as_read(db, user_id: int) -> int:
    return 0

def delete_notification(db, notification_id: int) -> bool:
    return True

def get_user_notification_settings(db, user_id: int) -> Dict[str, Any]:
    return {}

def create_user_notification_settings(db, user_id: int, settings: Dict[str, Any]):
    return {}

def update_notification_email_sent(db, notification_id: int):
    return True

"""
Notifications CRUD operations
"""

from sqlalchemy.orm import Session
from sqlalchemy import text, func, and_, or_
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json

from models_updated import User
from schemas_notifications import NotificationCreate, NotificationUpdate

# Mock notification model for now
class Notification:
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)

def get_user_notifications(
    db: Session,
    user_id: Optional[int] = None,
    unread_only: bool = False,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """Get user notifications"""
    try:
        # Mock notifications for now
        notifications = [
            {
                "id": "1",
                "type": "info",
                "title": "خطة تصحيحية جديدة",
                "message": "تم إنشاء خطة تصحيحية جديدة تحتاج إلى مراجعة",
                "timestamp": datetime.now() - timedelta(hours=2),
                "read": False,
                "priority": "medium",
                "category": "capa",
                "action_required": True,
                "data": {"capa_id": 1}
            },
            {
                "id": "2",
                "type": "warning",
                "title": "موعد نهائي قريب",
                "message": "خطة تصحيحية #123 تنتهي خلال 3 أيام",
                "timestamp": datetime.now() - timedelta(hours=5),
                "read": False,
                "priority": "high",
                "category": "deadline",
                "action_required": True,
                "data": {"capa_id": 123, "deadline": "2024-01-15"}
            },
            {
                "id": "3",
                "type": "success",
                "title": "تم إنجاز الخطة",
                "message": "تم إنجاز الخطة التصحيحية #456 بنجاح",
                "timestamp": datetime.now() - timedelta(days=1),
                "read": True,
                "priority": "low",
                "category": "capa",
                "action_required": False,
                "data": {"capa_id": 456}
            }
        ]
        
        # Filter by user if specified
        if user_id:
            # In real implementation, filter by user_id
            pass
        
        # Filter unread only if requested
        if unread_only:
            notifications = [n for n in notifications if not n["read"]]
        
        # Apply limit
        notifications = notifications[:limit]
        
        return notifications
    except Exception as e:
        print(f"Error getting user notifications: {e}")
        return []

def mark_notification_as_read(
    db: Session,
    notification_id: int
) -> bool:
    """Mark a notification as read"""
    try:
        # Mock implementation
        # In real implementation, update the notification in database
        print(f"Marking notification {notification_id} as read")
        return True
    except Exception as e:
        print(f"Error marking notification as read: {e}")
        return False

def mark_all_notifications_read(
    db: Session,
    user_id: Optional[int] = None
) -> int:
    """Mark all notifications as read for a user"""
    try:
        # Mock implementation
        # In real implementation, update all notifications for user
        print(f"Marking all notifications as read for user {user_id}")
        return 3  # Mock count
    except Exception as e:
        print(f"Error marking all notifications as read: {e}")
        return 0

def delete_notification(
    db: Session,
    notification_id: int
) -> bool:
    """Delete a notification"""
    try:
        # Mock implementation
        # In real implementation, delete the notification from database
        print(f"Deleting notification {notification_id}")
        return True
    except Exception as e:
        print(f"Error deleting notification: {e}")
        return False

def create_notification(
    db: Session,
    notification: NotificationCreate
) -> Dict[str, Any]:
    """Create a new notification"""
    try:
        # Mock implementation
        new_notification = {
            "id": str(datetime.now().timestamp()),
            "type": notification.type,
            "title": notification.title,
            "message": notification.message,
            "timestamp": datetime.now(),
            "read": False,
            "priority": notification.priority,
            "category": notification.category,
            "action_required": notification.action_required,
            "data": notification.data
        }
        
        # In real implementation, save to database
        print(f"Creating notification: {new_notification['title']}")
        
        return new_notification
    except Exception as e:
        print(f"Error creating notification: {e}")
        raise e
