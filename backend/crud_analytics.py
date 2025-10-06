"""
Analytics CRUD operations
"""

from sqlalchemy.orm import Session
from sqlalchemy import text, func, and_, or_
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json

from models_updated import (
    Capa, User, Department
)

def get_analytics_data(
    db: Session, 
    prediction_period: str = "3m",
    department_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Dict[str, Any]:
    """Get comprehensive analytics data"""
    try:
        # Set default date range if not provided
        if not end_date:
            end_date = datetime.now()
        if not start_date:
            if prediction_period == "1m":
                start_date = end_date - timedelta(days=30)
            elif prediction_period == "3m":
                start_date = end_date - timedelta(days=90)
            elif prediction_period == "6m":
                start_date = end_date - timedelta(days=180)
            else:  # 1y
                start_date = end_date - timedelta(days=365)

        # Build base query
        base_query = db.query(Capa)
        if department_id:
            base_query = base_query.filter(Capa.department_id == department_id)
        if start_date:
            base_query = base_query.filter(Capa.created_at >= start_date)
        if end_date:
            base_query = base_query.filter(Capa.created_at <= end_date)

        # Get trends data
        trends = []
        for i in range(12):  # Last 12 periods
            period_start = end_date - timedelta(days=30 * (i + 1))
            period_end = end_date - timedelta(days=30 * i)
            
            period_capas = base_query.filter(
                and_(
                    Capa.created_at >= period_start,
                    Capa.created_at < period_end
                )
            ).all()
            
            total = len(period_capas)
            completed = len([c for c in period_capas if c.status == 'completed'])
            overdue = len([c for c in period_capas if c.target_date < datetime.now().date() and c.status not in ['completed', 'closed']])
            
            trends.append({
                "period": period_start.strftime("%Y-%m"),
                "completion_rate": (completed / total * 100) if total > 0 else 0,
                "overdue_rate": (overdue / total * 100) if total > 0 else 0,
                "cost_efficiency": 85.0,  # Mock data
                "user_satisfaction": 90.0  # Mock data
            })

        # Get predictions
        predictions = get_predictions(db, prediction_period, department_id)
        
        # Get performance metrics
        performance_metrics = get_performance_metrics(db, department_id, start_date, end_date)
        
        # Get department comparison
        department_comparison = get_department_comparison(db, start_date, end_date)
        
        # Get risk analysis
        risk_analysis = get_risk_analysis(db, department_id, start_date, end_date)

        return {
            "trends": trends,
            "predictions": predictions,
            "performance_metrics": performance_metrics,
            "department_comparison": department_comparison,
            "risk_analysis": risk_analysis
        }
    except Exception as e:
        print(f"Error getting analytics data: {e}")
        return {
            "trends": [],
            "predictions": {
                "next_month_completion": 0,
                "risk_factors": [],
                "recommendations": [],
                "cost_forecast": 0
            },
            "performance_metrics": {
                "avg_response_time": 0,
                "escalation_rate": 0,
                "first_time_fix_rate": 0,
                "customer_satisfaction": 0
            },
            "department_comparison": [],
            "risk_analysis": []
        }

def get_performance_metrics(
    db: Session,
    department_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Dict[str, Any]:
    """Get performance metrics"""
    try:
        # Build base query
        base_query = db.query(Capa)
        if department_id:
            base_query = base_query.filter(Capa.department_id == department_id)
        if start_date:
            base_query = base_query.filter(Capa.created_at >= start_date)
        if end_date:
            base_query = base_query.filter(Capa.created_at <= end_date)

        # Calculate metrics
        total_capas = base_query.count()
        
        # Average response time (mock calculation)
        avg_response_time = 2.5  # hours
        
        # Escalation rate
        escalated_capas = base_query.filter(Capa.escalation_level > 0).count()
        escalation_rate = (escalated_capas / total_capas * 100) if total_capas > 0 else 0
        
        # First time fix rate
        completed_capas = base_query.filter(Capa.status == 'completed').count()
        first_time_fix_rate = 85.0  # Mock data
        
        # Customer satisfaction
        customer_satisfaction = 88.0  # Mock data

        return {
            "avg_response_time": avg_response_time,
            "escalation_rate": escalation_rate,
            "first_time_fix_rate": first_time_fix_rate,
            "customer_satisfaction": customer_satisfaction
        }
    except Exception as e:
        print(f"Error getting performance metrics: {e}")
        return {
            "avg_response_time": 0,
            "escalation_rate": 0,
            "first_time_fix_rate": 0,
            "customer_satisfaction": 0
        }

def get_department_comparison(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> List[Dict[str, Any]]:
    """Get department comparison data"""
    try:
        departments = db.query(Department).all()
        comparison = []
        
        for dept in departments:
            # Build query for this department
            dept_query = db.query(Capa).filter(Capa.department_id == dept.id)
            if start_date:
                dept_query = dept_query.filter(Capa.created_at >= start_date)
            if end_date:
                dept_query = dept_query.filter(Capa.created_at <= end_date)
            
            total_capas = dept_query.count()
            completed_capas = dept_query.filter(Capa.status == 'completed').count()
            
            # Calculate metrics
            completion_rate = (completed_capas / total_capas * 100) if total_capas > 0 else 0
            avg_time = 15.0  # Mock data - average days
            cost_per_capa = 2500.0  # Mock data
            efficiency_score = min(100, completion_rate + 20)  # Mock calculation
            
            comparison.append({
                "department": dept.name,
                "efficiency_score": efficiency_score,
                "completion_rate": completion_rate,
                "avg_time": avg_time,
                "cost_per_capa": cost_per_capa
            })
        
        return comparison
    except Exception as e:
        print(f"Error getting department comparison: {e}")
        return []

def get_risk_analysis(
    db: Session,
    department_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> List[Dict[str, Any]]:
    """Get risk analysis data"""
    try:
        # Build base query
        base_query = db.query(Capa)
        if department_id:
            base_query = base_query.filter(Capa.department_id == department_id)
        if start_date:
            base_query = base_query.filter(Capa.created_at >= start_date)
        if end_date:
            base_query = base_query.filter(Capa.created_at <= end_date)

        # Calculate risk factors
        total_capas = base_query.count()
        overdue_capas = base_query.filter(
            and_(
                Capa.target_date < datetime.now().date(),
                ~Capa.status.in_(['completed', 'closed'])
            )
        ).count()
        
        critical_capas = base_query.filter(Capa.priority == 'critical').count()
        high_priority_capas = base_query.filter(Capa.priority == 'high').count()
        
        risk_analysis = []
        
        # Overdue risk
        if overdue_capas > 0:
            risk_analysis.append({
                "risk_level": "high" if overdue_capas > total_capas * 0.2 else "medium",
                "description": f"تأخير في {overdue_capas} خطة تصحيحية",
                "probability": min(100, (overdue_capas / total_capas * 100) if total_capas > 0 else 0),
                "impact": 7,
                "mitigation": "تسريع معالجة الخطط المتأخرة وتحديث المواعيد النهائية"
            })
        
        # Critical priority risk
        if critical_capas > 0:
            risk_analysis.append({
                "risk_level": "critical" if critical_capas > total_capas * 0.1 else "high",
                "description": f"وجود {critical_capas} خطة ذات أولوية حرجة",
                "probability": min(100, (critical_capas / total_capas * 100) if total_capas > 0 else 0),
                "impact": 9,
                "mitigation": "إعطاء الأولوية القصوى للخطط الحرجة وتخصيص موارد إضافية"
            })
        
        # High priority risk
        if high_priority_capas > 0:
            risk_analysis.append({
                "risk_level": "medium" if high_priority_capas > total_capas * 0.3 else "low",
                "description": f"وجود {high_priority_capas} خطة ذات أولوية عالية",
                "probability": min(100, (high_priority_capas / total_capas * 100) if total_capas > 0 else 0),
                "impact": 6,
                "mitigation": "مراقبة مستمرة للخطط عالية الأولوية"
            })
        
        # Resource constraint risk
        if total_capas > 50:  # Mock threshold
            risk_analysis.append({
                "risk_level": "medium",
                "description": "ضغط على الموارد بسبب كثرة الخطط",
                "probability": 60,
                "impact": 5,
                "mitigation": "توزيع أفضل للموارد وتحديد الأولويات"
            })
        
        return risk_analysis
    except Exception as e:
        print(f"Error getting risk analysis: {e}")
        return []

def get_predictions(
    db: Session,
    prediction_period: str = "3m",
    department_id: Optional[int] = None
) -> Dict[str, Any]:
    """Get predictions data"""
    try:
        # Build base query
        base_query = db.query(Capa)
        if department_id:
            base_query = base_query.filter(Capa.department_id == department_id)
        
        # Get recent completion rate
        recent_capas = base_query.filter(
            Capa.created_at >= datetime.now() - timedelta(days=90)
        ).all()
        
        total_recent = len(recent_capas)
        completed_recent = len([c for c in recent_capas if c.status == 'completed'])
        recent_completion_rate = (completed_recent / total_recent * 100) if total_recent > 0 else 0
        
        # Predict next month completion
        next_month_completion = min(100, recent_completion_rate + 5)  # Slight improvement
        
        # Risk factors
        risk_factors = []
        if recent_completion_rate < 70:
            risk_factors.append("انخفاض معدل الإنجاز")
        if total_recent > 30:
            risk_factors.append("كثرة الخطط المطلوبة")
        
        # Recommendations
        recommendations = []
        if recent_completion_rate < 80:
            recommendations.append("تحسين عملية التخطيط والتنفيذ")
        if total_recent > 25:
            recommendations.append("زيادة الموارد المخصصة للخطط")
        recommendations.append("تطبيق نظام مراقبة أفضل")
        
        # Cost forecast
        avg_cost = 3000.0  # Mock data
        predicted_volume = max(10, total_recent)  # Predict similar volume
        cost_forecast = avg_cost * predicted_volume
        
        return {
            "next_month_completion": next_month_completion,
            "risk_factors": risk_factors,
            "recommendations": recommendations,
            "cost_forecast": cost_forecast
        }
    except Exception as e:
        print(f"Error getting predictions: {e}")
        return {
            "next_month_completion": 0,
            "risk_factors": [],
            "recommendations": [],
            "cost_forecast": 0
        }
