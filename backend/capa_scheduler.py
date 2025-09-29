"""
CAPA Scheduler - Automated CAPA management tasks
Handles daily checks for overdue CAPAs, escalation, and notifications
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import SessionLocal
from models_updated import Capa, User, VerificationStatus
from crud import create_audit_log, get_users_with_notification_preference
from notification_service import get_notification_service
from email_service import send_email

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CapaScheduler:
    def __init__(self):
        self.db = SessionLocal()
        self.notification_service = get_notification_service(self.db)
    
    def __del__(self):
        if hasattr(self, 'db'):
            self.db.close()
    
    def check_overdue_capas(self) -> List[Dict[str, Any]]:
        """
        Check for CAPAs that are overdue and need escalation
        Returns list of overdue CAPAs with days overdue
        """
        try:
            # Get overdue CAPAs using the database function
            result = self.db.execute(text("SELECT * FROM check_overdue_capas()")).fetchall()
            
            overdue_capas = []
            for row in result:
                capa_id, days_overdue = row
                overdue_capas.append({
                    'capa_id': capa_id,
                    'days_overdue': days_overdue
                })
            
            logger.info(f"Found {len(overdue_capas)} overdue CAPAs")
            return overdue_capas
            
        except Exception as e:
            logger.error(f"Error checking overdue CAPAs: {e}")
            return []
    
    def escalate_capa(self, capa_id: int, days_overdue: int) -> bool:
        """
        Escalate a CAPA by incrementing escalation level and sending notifications
        """
        try:
            # Get CAPA details
            capa = self.db.query(Capa).filter(Capa.id == capa_id).first()
            if not capa:
                logger.warning(f"CAPA {capa_id} not found for escalation")
                return False
            
            # Increment escalation level (max 3)
            new_escalation_level = min(capa.escalation_level + 1, 3)
            
            # Update CAPA
            capa.escalation_level = new_escalation_level
            self.db.commit()
            
            # Create audit log
            create_audit_log(self.db, {
                "user_id": 1,  # System user
                "action": "escalate_capa",
                "entity_type": "capa",
                "entity_id": capa_id,
                "new_values": f'{{"escalation_level": {new_escalation_level}, "days_overdue": {days_overdue}}}'
            })
            
            # Send notifications
            self._send_escalation_notifications(capa, new_escalation_level, days_overdue)
            
            logger.info(f"Escalated CAPA {capa_id} to level {new_escalation_level}")
            return True
            
        except Exception as e:
            logger.error(f"Error escalating CAPA {capa_id}: {e}")
            self.db.rollback()
            return False
    
    def _send_escalation_notifications(self, capa: Capa, escalation_level: int, days_overdue: int):
        """
        Send escalation notifications to relevant users
        """
        try:
            # Get department managers
            from crud import get_department_manager_ids
            manager_ids = get_department_manager_ids(self.db, capa.department)
            
            # Get quality managers and super admins
            quality_managers = self.db.query(User).filter(
                User.role.in_(["quality_manager", "super_admin"])
            ).all()
            
            # Combine all recipients
            recipient_ids = manager_ids + [user.id for user in quality_managers]
            
            # Create notification message
            escalation_messages = {
                1: "تحذير أول: خطة التصحيح متأخرة",
                2: "تحذير ثاني: خطة التصحيح متأخرة جداً",
                3: "تحذير نهائي: خطة التصحيح متأخرة بشكل حرج"
            }
            
            message = f"""
            {escalation_messages.get(escalation_level, "تحذير: خطة التصحيح متأخرة")}
            
            تفاصيل الخطة:
            - العنوان: {capa.title}
            - القسم: {capa.department}
            - مستوى التصعيد: {escalation_level}/3
            - الأيام المتأخرة: {days_overdue}
            - التاريخ المستهدف: {capa.target_date.strftime('%Y-%m-%d') if capa.target_date else 'غير محدد'}
            
            يرجى مراجعة الخطة واتخاذ الإجراءات اللازمة.
            """
            
            # Send notifications
            for user_id in recipient_ids:
                try:
                    self.notification_service.send_notification(
                        user_id=user_id,
                        title=escalation_messages.get(escalation_level, "تحذير خطة التصحيح"),
                        message=message,
                        notification_type="capa_escalation",
                        entity_type="capa",
                        entity_id=capa.id
                    )
                except Exception as e:
                    logger.error(f"Failed to send notification to user {user_id}: {e}")
            
            # Send email notifications to users who have email notifications enabled
            email_users = get_users_with_notification_preference(self.db, "capa_deadline")
            for user in email_users:
                if user.id in recipient_ids:
                    try:
                        send_email(
                            to_email=user.email,
                            subject=f"تحذير تصعيد خطة التصحيح - {capa.title}",
                            body=message
                        )
                    except Exception as e:
                        logger.error(f"Failed to send email to {user.email}: {e}")
            
        except Exception as e:
            logger.error(f"Error sending escalation notifications: {e}")
    
    def check_verification_reminders(self) -> int:
        """
        Check for CAPAs approaching verification deadline and send reminders
        Returns number of reminders sent
        """
        try:
            # Get CAPAs that are approaching verification deadline (within 2 days)
            reminder_date = datetime.now() + timedelta(days=2)
            
            capas_approaching_deadline = self.db.query(Capa).filter(
                Capa.verification_status == VerificationStatus.PENDING,
                Capa.target_date <= reminder_date,
                Capa.target_date > datetime.now()
            ).all()
            
            reminders_sent = 0
            
            for capa in capas_approaching_deadline:
                try:
                    # Send reminder to assigned user
                    if capa.assigned_to_id:
                        self.notification_service.send_notification(
                            user_id=capa.assigned_to_id,
                            title="تذكير: موعد التحقق من خطة التصحيح قريب",
                            message=f"""
                            تذكير: خطة التصحيح '{capa.title}' تحتاج إلى مراجعة قريباً.
                            
                            التاريخ المستهدف: {capa.target_date.strftime('%Y-%m-%d')}
                            القسم: {capa.department}
                            
                            يرجى مراجعة الخطة وإتمام خطوات التحقق المطلوبة.
                            """,
                            notification_type="capa_reminder",
                            entity_type="capa",
                            entity_id=capa.id
                        )
                        reminders_sent += 1
                    
                    # Send reminder to department managers
                    from crud import get_department_manager_ids
                    manager_ids = get_department_manager_ids(self.db, capa.department)
                    
                    for manager_id in manager_ids:
                        if manager_id != capa.assigned_to_id:  # Don't duplicate
                            self.notification_service.send_notification(
                                user_id=manager_id,
                                title="تذكير: موعد التحقق من خطة التصحيح قريب",
                                message=f"""
                                تذكير: خطة التصحيح '{capa.title}' في قسمكم تحتاج إلى مراجعة قريباً.
                                
                                التاريخ المستهدف: {capa.target_date.strftime('%Y-%m-%d')}
                                المكلف: {capa.assigned_to or 'غير محدد'}
                                
                                يرجى متابعة الخطة مع المكلف.
                                """,
                                notification_type="capa_reminder",
                                entity_type="capa",
                                entity_id=capa.id
                            )
                            reminders_sent += 1
                
                except Exception as e:
                    logger.error(f"Error sending reminder for CAPA {capa.id}: {e}")
            
            logger.info(f"Sent {reminders_sent} verification reminders")
            return reminders_sent
            
        except Exception as e:
            logger.error(f"Error checking verification reminders: {e}")
            return 0
    
    def auto_create_capa_on_noncompliant(self, evaluation_result_id: int, risk_level: int) -> bool:
        """
        Automatically create CAPA for non-compliant evaluation results
        """
        try:
            from crud import get_non_compliant_evaluation_items, create_capa_from_evaluation_item
            
            # Get evaluation result details
            from models_updated import EvaluationResult
            result = self.db.query(EvaluationResult).filter(
                EvaluationResult.id == evaluation_result_id
            ).first()
            
            if not result:
                logger.warning(f"Evaluation result {evaluation_result_id} not found")
                return False
            
            # Check if risk level is high enough for auto CAPA creation
            if risk_level < 3:
                logger.info(f"Risk level {risk_level} too low for auto CAPA creation")
                return False
            
            # Get evaluation item details
            from models_updated import EvaluationItem
            item = self.db.query(EvaluationItem).filter(
                EvaluationItem.id == result.item_id
            ).first()
            
            if not item:
                logger.warning(f"Evaluation item {result.item_id} not found")
                return False
            
            # Prepare evaluation item data
            evaluation_item_data = {
                'item_id': item.id,
                'item_code': item.code,
                'item_title': item.title,
                'item_description': item.description,
                'category_name': item.category_name,
                'category_color': item.category_color,
                'risk_level': getattr(item, 'risk_level', 'MINOR'),
                'score': result.score,
                'comments': result.comments,
                'evaluated_at': result.evaluated_at,
                'round_id': result.round_id
            }
            
            # Create CAPA
            capa = create_capa_from_evaluation_item(
                self.db, 
                result.round_id, 
                evaluation_item_data, 
                1  # System user
            )
            
            if capa:
                logger.info(f"Auto-created CAPA {capa.id} for evaluation item {item.code}")
                return True
            else:
                logger.error(f"Failed to auto-create CAPA for evaluation item {item.code}")
                return False
                
        except Exception as e:
            logger.error(f"Error auto-creating CAPA for evaluation result {evaluation_result_id}: {e}")
            return False
    
    def update_status_history(self, capa_id: int, user_id: int, from_status: str, to_status: str, note: str = None):
        """
        Update CAPA status history
        """
        try:
            capa = self.db.query(Capa).filter(Capa.id == capa_id).first()
            if not capa:
                logger.warning(f"CAPA {capa_id} not found for status history update")
                return False
            
            # Get current status history
            import json
            try:
                status_history = json.loads(capa.status_history) if capa.status_history else []
            except (json.JSONDecodeError, TypeError):
                status_history = []
            
            # Add new status change
            new_entry = {
                "timestamp": datetime.now().isoformat(),
                "user_id": user_id,
                "from_status": from_status,
                "to_status": to_status,
                "note": note or "Status updated"
            }
            
            status_history.append(new_entry)
            
            # Update CAPA
            capa.status_history = json.dumps(status_history)
            self.db.commit()
            
            logger.info(f"Updated status history for CAPA {capa_id}: {from_status} -> {to_status}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating status history for CAPA {capa_id}: {e}")
            self.db.rollback()
            return False
    
    def run_daily_tasks(self):
        """
        Run all daily CAPA management tasks
        """
        logger.info("Starting daily CAPA management tasks")
        
        try:
            # 1. Check for overdue CAPAs and escalate
            overdue_capas = self.check_overdue_capas()
            escalated_count = 0
            
            for overdue_capa in overdue_capas:
                if self.escalate_capa(overdue_capa['capa_id'], overdue_capa['days_overdue']):
                    escalated_count += 1
            
            # 2. Send verification reminders
            reminders_sent = self.check_verification_reminders()
            
            # 3. Log summary
            logger.info(f"Daily tasks completed: {escalated_count} CAPAs escalated, {reminders_sent} reminders sent")
            
            return {
                "overdue_capas": len(overdue_capas),
                "escalated_capas": escalated_count,
                "reminders_sent": reminders_sent
            }
            
        except Exception as e:
            logger.error(f"Error running daily CAPA tasks: {e}")
            return {"error": str(e)}
        finally:
            self.db.close()

# Standalone functions for external use
def run_daily_capa_tasks():
    """Run daily CAPA tasks - can be called from cron or scheduler"""
    scheduler = CapaScheduler()
    return scheduler.run_daily_tasks()

def check_and_escalate_overdue_capas():
    """Check and escalate overdue CAPAs"""
    scheduler = CapaScheduler()
    overdue_capas = scheduler.check_overdue_capas()
    
    escalated_count = 0
    for overdue_capa in overdue_capas:
        if scheduler.escalate_capa(overdue_capa['capa_id'], overdue_capa['days_overdue']):
            escalated_count += 1
    
    return {
        "overdue_capas": len(overdue_capas),
        "escalated_capas": escalated_count
    }

def update_capa_status_history(capa_id: int, user_id: int, from_status: str, to_status: str, note: str = None):
    """Update CAPA status history"""
    scheduler = CapaScheduler()
    return scheduler.update_status_history(capa_id, user_id, from_status, to_status, note)

def auto_create_capa_on_noncompliant(evaluation_result_id: int, risk_level: int):
    """Auto-create CAPA for non-compliant evaluation result"""
    scheduler = CapaScheduler()
    return scheduler.auto_create_capa_on_noncompliant(evaluation_result_id, risk_level)

if __name__ == "__main__":
    # Run daily tasks when script is executed directly
    result = run_daily_capa_tasks()
    print(f"Daily CAPA tasks result: {result}")
