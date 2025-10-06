"""
Enhanced CAPA Dashboard CRUD operations
"""

from sqlalchemy.orm import Session
from sqlalchemy import text, func, and_, or_
from typing import List, Optional
from datetime import datetime, timedelta
import json

from models_updated import (
    Capa, User, Department
)

def get_capa_stats(db: Session) -> dict:
    """Get dashboard statistics"""
    try:
        # Total CAPAs
        total_capas = db.query(Capa).count()
        
        # Overdue CAPAs (target_date < today and status not completed/closed)
        today = datetime.now().date()
        overdue_capas = db.query(Capa).filter(
            and_(
                Capa.target_date < today,
                ~Capa.status.in_(['completed', 'closed'])
            )
        ).count()
        
        # Completed this month
        start_of_month = datetime.now().replace(day=1).date()
        completed_this_month = db.query(Capa).filter(
            and_(
                Capa.status == 'completed',
                Capa.actual_completion_date >= start_of_month
            )
        ).count()
        
        # Critical pending
        critical_pending = db.query(Capa).filter(
            and_(
                Capa.priority == 'critical',
                Capa.status.in_(['pending', 'in_progress'])
            )
        ).count()
        
        # Average completion time (in days)
        completed_capas = db.query(Capa).filter(
            and_(
                Capa.status == 'completed',
                Capa.actual_completion_date.isnot(None)
            )
        ).all()
        
        if completed_capas:
            total_days = sum([
                (capa.actual_completion_date - capa.created_at.date()).days 
                for capa in completed_capas
            ])
            average_completion_time = round(total_days / len(completed_capas))
        else:
            average_completion_time = 0
        
        # Cost savings (sum of estimated_cost for completed CAPAs)
        cost_savings = db.query(func.sum(Capa.estimated_cost)).filter(
            Capa.status == 'completed'
        ).scalar() or 0
        
        return {
            "total_capas": total_capas,
            "overdue_capas": overdue_capas,
            "completed_this_month": completed_this_month,
            "critical_pending": critical_pending,
            "average_completion_time": average_completion_time,
            "cost_savings": float(cost_savings)
        }
    except Exception as e:
        print(f"Error getting CAPA stats: {e}")
        return {
            "total_capas": 0,
            "overdue_capas": 0,
            "completed_this_month": 0,
            "critical_pending": 0,
            "average_completion_time": 0,
            "cost_savings": 0
        }

def get_overdue_actions(db: Session) -> dict:
    """Get overdue CAPAs (simplified for models_updated)"""
    try:
        today = datetime.now().date()
        
        # Get overdue CAPAs
        overdue_capas = db.query(Capa).filter(
            and_(
                Capa.target_date < today,
                ~Capa.status.in_(['completed', 'closed'])
            )
        ).all()
        
        overdue_actions = []
        for capa in overdue_capas:
            overdue_actions.append({
                "id": capa.id,
                "task": capa.title,
                "due_date": capa.target_date.isoformat() if capa.target_date else None,
                "status": capa.status,
                "capa_id": capa.id,
                "capa_title": capa.title,
                "assigned_to": capa.assigned_to if hasattr(capa, 'assigned_to') else None
            })
        
        return {
            "corrective_actions": overdue_actions,
            "preventive_actions": [],
            "verification_steps": []
        }
    except Exception as e:
        print(f"Error getting overdue actions: {e}")
        return {
            "corrective_actions": [],
            "preventive_actions": [],
            "verification_steps": []
        }

def get_upcoming_deadlines(db: Session, days: int = 7) -> dict:
    """Get upcoming CAPA deadlines (simplified for models_updated)"""
    try:
        today = datetime.now().date()
        future_date = today + timedelta(days=days)
        
        # Get upcoming CAPAs
        upcoming_capas = db.query(Capa).filter(
            and_(
                Capa.target_date >= today,
                Capa.target_date <= future_date,
                ~Capa.status.in_(['completed', 'closed'])
            )
        ).all()
        
        upcoming_actions = []
        for capa in upcoming_capas:
            upcoming_actions.append({
                "id": capa.id,
                "task": capa.title,
                "due_date": capa.target_date.isoformat() if capa.target_date else None,
                "status": capa.status,
                "capa_id": capa.id,
                "capa_title": capa.title,
                "assigned_to": capa.assigned_to if hasattr(capa, 'assigned_to') else None
            })
        
        return {
            "corrective_actions": upcoming_actions,
            "preventive_actions": [],
            "verification_steps": []
        }
    except Exception as e:
        print(f"Error getting upcoming deadlines: {e}")
        return {
            "corrective_actions": [],
            "preventive_actions": [],
            "verification_steps": []
        }

def get_timeline_events(
    db: Session, 
    capa_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> List[dict]:
    """Get timeline events"""
    try:
        events = []
        
        # CAPA creation events
        capa_query = db.query(Capa, User).join(User, Capa.created_by_id == User.id)
        if capa_id:
            capa_query = capa_query.filter(Capa.id == capa_id)
        if start_date:
            capa_query = capa_query.filter(Capa.created_at >= start_date)
        if end_date:
            capa_query = capa_query.filter(Capa.created_at <= end_date)
        
        capas = capa_query.all()
        for capa, user in capas:
            events.append({
                "id": f"capa_created_{capa.id}",
                "type": "capa_created",
                "title": f"تم إنشاء خطة جديدة: {capa.title}",
                "description": f"تم إنشاء خطة تصحيحية جديدة",
                "timestamp": capa.created_at.isoformat(),
                "user_name": user.name,
                "capa_id": capa.id,
                "capa_title": capa.title
            })
        
        # For models_updated, we only have CAPA events
        
        # Sort events by timestamp
        events.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return events
    except Exception as e:
        print(f"Error getting timeline events: {e}")
        return []

def get_user_alerts(
    db: Session,
    user_id: Optional[int] = None,
    filter_type: str = "all",
    priority: str = "all"
) -> List[dict]:
    """Get user alerts"""
    try:
        alerts = []
        
        # Overdue alerts
        if filter_type in ["all", "overdue"]:
            today = datetime.now().date()
            
            # Overdue CAPAs
            overdue_capas = db.query(Capa).filter(
                and_(
                    Capa.target_date < today,
                    ~Capa.status.in_(['completed', 'closed'])
                )
            ).all()
            
            for capa in overdue_capas:
                days_overdue = (today - capa.target_date).days if capa.target_date else 0
                alerts.append({
                    "id": f"overdue_capa_{capa.id}",
                    "type": "overdue",
                    "title": f"خطة متأخرة: {capa.title}",
                    "message": f"الخطة التصحيحية متأخرة عن الموعد المحدد بـ {days_overdue} يوم",
                    "priority": "high" if days_overdue > 7 else "medium",
                    "created_at": datetime.now().isoformat(),
                    "read": False,
                    "action_required": True,
                    "capa_id": capa.id,
                    "capa_title": capa.title,
                    "due_date": capa.target_date.isoformat() if capa.target_date else None,
                    "days_until_due": -days_overdue
                })
        
        # Upcoming deadlines
        if filter_type in ["all", "upcoming"]:
            future_date = datetime.now().date() + timedelta(days=3)
            
            # Upcoming CAPAs
            upcoming_capas = db.query(Capa).filter(
                and_(
                    Capa.target_date >= datetime.now().date(),
                    Capa.target_date <= future_date,
                    ~Capa.status.in_(['completed', 'closed'])
                )
            ).all()
            
            for capa in upcoming_capas:
                days_until = (capa.target_date - datetime.now().date()).days if capa.target_date else 0
                alerts.append({
                    "id": f"upcoming_capa_{capa.id}",
                    "type": "upcoming",
                    "title": f"موعد نهائي قادم: {capa.title}",
                    "message": f"الموعد النهائي للخطة التصحيحية خلال {days_until} يوم",
                    "priority": "medium" if days_until > 1 else "high",
                    "created_at": datetime.now().isoformat(),
                    "read": False,
                    "action_required": True,
                    "capa_id": capa.id,
                    "capa_title": capa.title,
                    "due_date": capa.target_date.isoformat() if capa.target_date else None,
                    "days_until_due": days_until
                })
        
        # Filter by priority
        if priority != "all":
            alerts = [alert for alert in alerts if alert["priority"] == priority]
        
        # Sort by priority and creation date
        priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        alerts.sort(key=lambda x: (priority_order.get(x["priority"], 4), x["created_at"]))
        
        return alerts
    except Exception as e:
        print(f"Error getting user alerts: {e}")
        return []

def get_basic_report_data(
    db: Session,
    period: str = "month",
    department_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> dict:
    """Get basic report data"""
    try:
        # Set date range based on period
        if not start_date or not end_date:
            if period == "week":
                end_date = datetime.now()
                start_date = end_date - timedelta(days=7)
            elif period == "month":
                end_date = datetime.now()
                start_date = end_date - timedelta(days=30)
            elif period == "quarter":
                end_date = datetime.now()
                start_date = end_date - timedelta(days=90)
            elif period == "year":
                end_date = datetime.now()
                start_date = end_date - timedelta(days=365)
        
        # Base query
        query = db.query(Capa)
        if department_id:
            query = query.filter(Capa.department_id == department_id)
        if start_date:
            query = query.filter(Capa.created_at >= start_date)
        if end_date:
            query = query.filter(Capa.created_at <= end_date)
        
        # Total CAPAs
        total_capas = query.count()
        
        # Completed CAPAs
        completed_capas = query.filter(Capa.status == 'completed').count()
        
        # Overdue CAPAs
        today = datetime.now().date()
        overdue_capas = query.filter(
            and_(
                Capa.target_date < today,
                ~Capa.status.in_(['completed', 'closed'])
            )
        ).count()
        
        # Average completion time
        completed_capas_with_dates = query.filter(
            and_(
                Capa.status == 'completed',
                Capa.actual_completion_date.isnot(None)
            )
        ).all()
        
        if completed_capas_with_dates:
            total_days = sum([
                (capa.actual_completion_date - capa.created_at.date()).days 
                for capa in completed_capas_with_dates
            ])
            average_completion_time = round(total_days / len(completed_capas_with_dates))
        else:
            average_completion_time = 0
        
        # Cost savings
        cost_savings = query.filter(Capa.status == 'completed').with_entities(
            func.sum(Capa.estimated_cost)
        ).scalar() or 0
        
        # Department stats
        department_stats = []
        departments = db.query(Department).all()
        for dept in departments:
            dept_query = query.filter(Capa.department_id == dept.id)
            dept_total = dept_query.count()
            dept_completed = dept_query.filter(Capa.status == 'completed').count()
            dept_overdue = dept_query.filter(
                and_(
                    Capa.target_date < today,
                    ~Capa.status.in_(['completed', 'closed'])
                )
            ).count()
            
            dept_completed_with_dates = dept_query.filter(
                and_(
                    Capa.status == 'completed',
                    Capa.actual_completion_date.isnot(None)
                )
            ).all()
            
            if dept_completed_with_dates:
                dept_total_days = sum([
                    (capa.actual_completion_date - capa.created_at.date()).days 
                    for capa in dept_completed_with_dates
                ])
                dept_avg_time = round(dept_total_days / len(dept_completed_with_dates))
            else:
                dept_avg_time = 0
            
            department_stats.append({
                "department": dept.name,
                "total_capas": dept_total,
                "completed_capas": dept_completed,
                "overdue_capas": dept_overdue,
                "average_completion_time": dept_avg_time
            })
        
        # Priority breakdown
        priority_breakdown = {
            "low": query.filter(Capa.priority == 'low').count(),
            "medium": query.filter(Capa.priority == 'medium').count(),
            "high": query.filter(Capa.priority == 'high').count(),
            "critical": query.filter(Capa.priority == 'critical').count()
        }
        
        # Status breakdown
        status_breakdown = {
            "pending": query.filter(Capa.status == 'pending').count(),
            "in_progress": query.filter(Capa.status == 'in_progress').count(),
            "completed": query.filter(Capa.status == 'completed').count(),
            "closed": query.filter(Capa.status == 'closed').count()
        }
        
        # Monthly trends (simplified)
        monthly_trends = []
        for i in range(6):  # Last 6 months
            month_start = datetime.now().replace(day=1) - timedelta(days=30*i)
            month_end = month_start + timedelta(days=30)
            
            month_query = query.filter(
                and_(
                    Capa.created_at >= month_start,
                    Capa.created_at < month_end
                )
            )
            
            monthly_trends.append({
                "month": month_start.strftime("%Y-%m"),
                "created": month_query.count(),
                "completed": month_query.filter(Capa.status == 'completed').count(),
                "overdue": month_query.filter(
                    and_(
                        Capa.target_date < today,
                        ~Capa.status.in_(['completed', 'closed'])
                    )
                ).count()
            })
        
        return {
            "period": period,
            "total_capas": total_capas,
            "completed_capas": completed_capas,
            "overdue_capas": overdue_capas,
            "average_completion_time": average_completion_time,
            "cost_savings": float(cost_savings),
            "department_stats": department_stats,
            "priority_breakdown": priority_breakdown,
            "status_breakdown": status_breakdown,
            "monthly_trends": monthly_trends
        }
    except Exception as e:
        print(f"Error getting basic report data: {e}")
        return {
            "period": period,
            "total_capas": 0,
            "completed_capas": 0,
            "overdue_capas": 0,
            "average_completion_time": 0,
            "cost_savings": 0,
            "department_stats": [],
            "priority_breakdown": {"low": 0, "medium": 0, "high": 0, "critical": 0},
            "status_breakdown": {"pending": 0, "in_progress": 0, "completed": 0, "closed": 0},
            "monthly_trends": []
        }
