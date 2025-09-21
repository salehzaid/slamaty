from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
import logging

from crud import get_rounds, get_capas, get_user_by_id
from notification_service import get_notification_service
from models_updated import RoundStatus, CapaStatus

logger = logging.getLogger(__name__)

class ReminderService:
    def __init__(self, db: Session):
        self.db = db
        self.notification_service = get_notification_service(db)
    
    def check_round_deadlines(self):
        """Check for round deadlines and send reminders"""
        try:
            # Get all active rounds
            rounds = get_rounds(self.db, skip=0, limit=1000)
            today = datetime.now()
            
            for round_data in rounds:
                if round_data.deadline and round_data.status in [RoundStatus.SCHEDULED, RoundStatus.IN_PROGRESS]:
                    # Check if deadline is today
                    if round_data.deadline.date() == today.date():
                        self._send_round_deadline_notification(round_data)
                    # Check if deadline is in 3 days
                    elif round_data.deadline.date() == (today + timedelta(days=3)).date():
                        self._send_round_reminder_notification(round_data, 3)
                    # Check if deadline is in 7 days
                    elif round_data.deadline.date() == (today + timedelta(days=7)).date():
                        self._send_round_reminder_notification(round_data, 7)
                        
        except Exception as e:
            logger.error(f"Error checking round deadlines: {str(e)}")
    
    def check_capa_deadlines(self):
        """Check for CAPA deadlines and send reminders"""
        try:
            # Get all active CAPAs
            capas = get_capas(self.db, skip=0, limit=1000)
            today = datetime.now()
            
            for capa in capas:
                if capa.target_date and capa.status in [CapaStatus.PENDING, CapaStatus.ASSIGNED, CapaStatus.IN_PROGRESS]:
                    # Check if deadline is today
                    if capa.target_date.date() == today.date():
                        self._send_capa_deadline_notification(capa)
                    # Check if deadline is in 3 days
                    elif capa.target_date.date() == (today + timedelta(days=3)).date():
                        self._send_capa_reminder_notification(capa, 3)
                    # Check if deadline is in 7 days
                    elif capa.target_date.date() == (today + timedelta(days=7)).date():
                        self._send_capa_reminder_notification(capa, 7)
                        
        except Exception as e:
            logger.error(f"Error checking CAPA deadlines: {str(e)}")
    
    def _send_round_deadline_notification(self, round_data):
        """Send deadline notification for a round"""
        try:
            # Parse assigned users
            if round_data.assigned_to:
                import json
                assigned_user_ids = json.loads(round_data.assigned_to)
                
                for user_id in assigned_user_ids:
                    self.notification_service.send_round_deadline_notification(
                        round_id=round_data.id,
                        round_title=round_data.title,
                        round_department=round_data.department,
                        user_id=user_id
                    )
        except Exception as e:
            logger.error(f"Error sending round deadline notification: {str(e)}")
    
    def _send_round_reminder_notification(self, round_data, days_until_deadline):
        """Send reminder notification for a round"""
        try:
            # Parse assigned users
            if round_data.assigned_to:
                import json
                assigned_user_ids = json.loads(round_data.assigned_to)
                
                for user_id in assigned_user_ids:
                    self.notification_service.send_round_reminder_notification(
                        round_id=round_data.id,
                        round_title=round_data.title,
                        round_department=round_data.department,
                        user_id=user_id,
                        days_until_deadline=days_until_deadline
                    )
        except Exception as e:
            logger.error(f"Error sending round reminder notification: {str(e)}")
    
    def _send_capa_deadline_notification(self, capa):
        """Send deadline notification for a CAPA"""
        try:
            if capa.assigned_to:
                assigned_user_id = int(capa.assigned_to) if capa.assigned_to.isdigit() else None
                if assigned_user_id:
                    self.notification_service.send_capa_deadline_notification(
                        capa_id=capa.id,
                        capa_title=capa.title,
                        capa_department=capa.department,
                        user_id=assigned_user_id
                    )
        except Exception as e:
            logger.error(f"Error sending CAPA deadline notification: {str(e)}")
    
    def _send_capa_reminder_notification(self, capa, days_until_deadline):
        """Send reminder notification for a CAPA"""
        try:
            if capa.assigned_to:
                assigned_user_id = int(capa.assigned_to) if capa.assigned_to.isdigit() else None
                if assigned_user_id:
                    # Create custom reminder notification
                    title = f"تذكير بخطة تصحيحية"
                    message = f"تذكير: خطة '{capa.title}' في قسم {capa.department} - متبقى {days_until_deadline} يوم"
                    
                    self.notification_service.send_notification(
                        user_id=assigned_user_id,
                        title=title,
                        message=message,
                        notification_type="capa_reminder",
                        entity_type="CAPA",
                        entity_id=capa.id
                    )
        except Exception as e:
            logger.error(f"Error sending CAPA reminder notification: {str(e)}")

def get_reminder_service(db: Session) -> ReminderService:
    return ReminderService(db)
