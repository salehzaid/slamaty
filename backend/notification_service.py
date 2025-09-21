from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import logging

from crud import (
    create_notification, 
    get_user_notification_settings, 
    get_users_with_notification_preference,
    update_notification_email_sent
)
from email_service import email_service
from models_updated import NotificationType, NotificationStatus

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self, db: Session):
        self.db = db
    
    def send_notification(
        self,
        user_id: int,
        title: str,
        message: str,
        notification_type: NotificationType,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
        send_email: bool = True
    ) -> bool:
        """
        Send notification to a specific user
        """
        try:
            # Check if user has notifications enabled for this type
            if not self._should_send_notification(user_id, notification_type):
                logger.info(f"User {user_id} has disabled {notification_type} notifications")
                return False
            
            # Create in-app notification
            notification_data = {
                "user_id": user_id,
                "title": title,
                "message": message,
                "notification_type": notification_type.value if hasattr(notification_type, 'value') else notification_type,
                "entity_type": entity_type,
                "entity_id": entity_id
            }
            
            notification = create_notification(self.db, notification_data)
            logger.info(f"Created notification {notification.id} for user {user_id}")
            
            # Send email if enabled
            if send_email:
                self._send_email_notification(notification)
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to send notification to user {user_id}: {str(e)}")
            return False
    
    def send_bulk_notification(
        self,
        user_ids: List[int],
        title: str,
        message: str,
        notification_type: NotificationType,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
        send_email: bool = True
    ) -> int:
        """
        Send notification to multiple users
        """
        success_count = 0
        
        for user_id in user_ids:
            if self.send_notification(
                user_id, title, message, notification_type, 
                entity_type, entity_id, send_email
            ):
                success_count += 1
        
        logger.info(f"Sent notifications to {success_count}/{len(user_ids)} users")
        return success_count
    
    def send_round_assignment_notification(
        self,
        round_id: int,
        round_title: str,
        round_department: str,
        assigned_user_ids: List[int],
        created_by_name: str
    ) -> int:
        """
        Send notification when a round is assigned to users
        """
        title = "جولة جديدة مطلوبة"
        message = f"تم تعيين جولة '{round_title}' في قسم {round_department} من قبل {created_by_name}"
        
        return self.send_bulk_notification(
            user_ids=assigned_user_ids,
            title=title,
            message=message,
            notification_type=NotificationType.ROUND_ASSIGNED,
            entity_type="ROUND",
            entity_id=round_id
        )
    
    def send_round_reminder_notification(
        self,
        round_id: int,
        round_title: str,
        round_department: str,
        user_id: int,
        days_until_deadline: int
    ) -> bool:
        """
        Send reminder notification for a round
        """
        title = "تذكير بجولة"
        message = f"تذكير: جولة '{round_title}' في قسم {round_department} - متبقى {days_until_deadline} يوم"
        
        return self.send_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=NotificationType.ROUND_REMINDER,
            entity_type="ROUND",
            entity_id=round_id
        )
    
    def send_round_deadline_notification(
        self,
        round_id: int,
        round_title: str,
        round_department: str,
        user_id: int
    ) -> bool:
        """
        Send deadline notification for a round
        """
        title = "موعد نهائي للجولة"
        message = f"تحذير: موعد تسليم جولة '{round_title}' في قسم {round_department} ينتهي اليوم"
        
        return self.send_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=NotificationType.ROUND_DEADLINE,
            entity_type="ROUND",
            entity_id=round_id
        )
    
    def send_capa_assignment_notification(
        self,
        capa_id: int,
        capa_title: str,
        capa_department: str,
        assigned_user_id: int,
        created_by_name: str
    ) -> bool:
        """
        Send notification when a CAPA is assigned
        """
        title = "خطة تصحيحية جديدة"
        message = f"تم تعيين خطة تصحيحية '{capa_title}' في قسم {capa_department} من قبل {created_by_name}"
        
        return self.send_notification(
            user_id=assigned_user_id,
            title=title,
            message=message,
            notification_type=NotificationType.CAPA_ASSIGNED,
            entity_type="CAPA",
            entity_id=capa_id
        )
    
    def send_capa_deadline_notification(
        self,
        capa_id: int,
        capa_title: str,
        capa_department: str,
        user_id: int
    ) -> bool:
        """
        Send deadline notification for a CAPA
        """
        title = "موعد نهائي للخطة التصحيحية"
        message = f"تحذير: موعد تسليم خطة '{capa_title}' في قسم {capa_department} ينتهي اليوم"
        
        return self.send_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=NotificationType.CAPA_DEADLINE,
            entity_type="CAPA",
            entity_id=capa_id
        )
    
    def send_system_update_notification(
        self,
        title: str,
        message: str,
        user_ids: Optional[List[int]] = None
    ) -> int:
        """
        Send system update notification
        """
        if user_ids is None:
            # Send to all users who have system updates enabled
            users = get_users_with_notification_preference(self.db, "system_update")
            user_ids = [user.id for user in users]
        
        return self.send_bulk_notification(
            user_ids=user_ids,
            title=title,
            message=message,
            notification_type=NotificationType.SYSTEM_UPDATE,
            send_email=True
        )
    
    def _should_send_notification(self, user_id: int, notification_type: NotificationType) -> bool:
        """
        Check if user has notifications enabled for this type
        """
        settings = get_user_notification_settings(self.db, user_id)
        
        if not settings:
            # Default to True if no settings found
            return True
        
        # Map notification types to setting fields
        type_mapping = {
            NotificationType.ROUND_ASSIGNED: settings.round_assignments,
            NotificationType.ROUND_REMINDER: settings.round_reminders,
            NotificationType.ROUND_DEADLINE: settings.round_deadlines,
            NotificationType.CAPA_ASSIGNED: settings.capa_assignments,
            NotificationType.CAPA_DEADLINE: settings.capa_deadlines,
            NotificationType.SYSTEM_UPDATE: settings.system_updates,
            NotificationType.GENERAL: True  # Always send general notifications
        }
        
        return type_mapping.get(notification_type, True)
    
    def _send_email_notification(self, notification) -> bool:
        """
        Send email notification
        """
        try:
            # Get user details
            from crud import get_user_by_id
            user = get_user_by_id(self.db, notification.user_id)
            
            if not user:
                logger.error(f"User {notification.user_id} not found for email notification")
                return False
            
            # Check if user has email notifications enabled
            settings = get_user_notification_settings(self.db, notification.user_id)
            if settings and not settings.email_notifications:
                logger.info(f"User {notification.user_id} has email notifications disabled")
                return False
            
            # Send email
            success = email_service.send_notification_email(
                to_email=user.email,
                to_name=f"{user.first_name} {user.last_name}",
                title=notification.title,
                message=notification.message,
                notification_type=notification.notification_type,  # Now it's already a string
                entity_type=notification.entity_type,
                entity_id=notification.entity_id
            )
            
            if success:
                # Mark email as sent
                update_notification_email_sent(self.db, notification.id)
                logger.info(f"Email sent for notification {notification.id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to send email for notification {notification.id}: {str(e)}")
            return False

# Global notification service instance
def get_notification_service(db: Session) -> NotificationService:
    return NotificationService(db)
