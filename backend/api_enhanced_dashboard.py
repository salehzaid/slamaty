"""
Enhanced CAPA Dashboard API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import json

from database import get_db
from crud_enhanced_dashboard import (
    get_capa_stats,
    get_overdue_actions,
    get_upcoming_deadlines,
    get_timeline_events,
    get_user_alerts,
    get_basic_report_data
)
from schemas_enhanced_dashboard import (
    DashboardStats,
    OverdueActions,
    UpcomingDeadlines,
    TimelineEvent,
    Alert,
    BasicReportData
)

router = APIRouter()

@router.get("/dashboard/stats/", response_model=DashboardStats)
async def get_dashboard_stats(
    db: Session = Depends(get_db)
):
    """Get dashboard statistics"""
    try:
        stats = get_capa_stats(db)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard/overdue/", response_model=OverdueActions)
async def get_dashboard_overdue(
    db: Session = Depends(get_db)
):
    """Get overdue actions for dashboard"""
    try:
        overdue = get_overdue_actions(db)
        return overdue
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard/upcoming/", response_model=UpcomingDeadlines)
async def get_dashboard_upcoming(
    days: int = Query(7, description="Number of days to look ahead"),
    db: Session = Depends(get_db)
):
    """Get upcoming deadlines for dashboard"""
    try:
        upcoming = get_upcoming_deadlines(db, days)
        return upcoming
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/timeline/events/", response_model=List[TimelineEvent])
async def get_timeline_events_endpoint(
    capa_id: Optional[int] = Query(None, description="Filter by CAPA ID"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    db: Session = Depends(get_db)
):
    """Get timeline events"""
    try:
        events = get_timeline_events(db, capa_id, start_date, end_date)
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts/", response_model=List[Alert])
async def get_alerts(
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    filter_type: Optional[str] = Query("all", description="Filter type: all, unread, overdue, upcoming"),
    priority: Optional[str] = Query("all", description="Priority filter: all, low, medium, high, critical"),
    db: Session = Depends(get_db)
):
    """Get user alerts"""
    try:
        alerts = get_user_alerts(db, user_id, filter_type, priority)
        return alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/alerts/{alert_id}/read")
async def mark_alert_as_read(
    alert_id: int,
    db: Session = Depends(get_db)
):
    """Mark alert as read"""
    try:
        # Update alert status in database
        # This would be implemented in crud_enhanced.py
        return {"status": "success", "message": "Alert marked as read"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/alerts/mark-all-read")
async def mark_all_alerts_read(
    user_id: Optional[int] = Query(None, description="User ID to mark alerts for"),
    db: Session = Depends(get_db)
):
    """Mark all alerts as read for a user"""
    try:
        # Update all alerts status in database
        # This would be implemented in crud_enhanced.py
        return {"status": "success", "message": "All alerts marked as read"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/alerts/{alert_id}")
async def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):
    """Delete an alert"""
    try:
        # Delete alert from database
        # This would be implemented in crud_enhanced.py
        return {"status": "success", "message": "Alert deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/actions/", response_model=List[dict])
async def get_actions(
    capa_id: Optional[int] = Query(None, description="Filter by CAPA ID"),
    type: Optional[str] = Query(None, description="Action type: corrective, preventive, verification"),
    assigned_to_id: Optional[int] = Query(None, description="Filter by assigned user ID"),
    db: Session = Depends(get_db)
):
    """Get actions for progress tracking"""
    try:
        # This would be implemented in crud_enhanced.py
        # For now, return empty list
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/actions/{action_id}")
async def update_action(
    action_id: int,
    action_data: dict,
    db: Session = Depends(get_db)
):
    """Update action status and progress"""
    try:
        # Update action in database
        # This would be implemented in crud_enhanced.py
        return {"status": "success", "message": "Action updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/basic/", response_model=BasicReportData)
async def get_basic_report(
    period: str = Query("month", description="Report period: week, month, quarter, year"),
    department_id: Optional[int] = Query(None, description="Filter by department ID"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    db: Session = Depends(get_db)
):
    """Get basic report data"""
    try:
        report_data = get_basic_report_data(db, period, department_id, start_date, end_date)
        return report_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/export/{format}/")
async def export_report(
    format: str,
    period: str = Query("month", description="Report period"),
    department_id: Optional[int] = Query(None, description="Filter by department ID"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    db: Session = Depends(get_db)
):
    """Export report in specified format"""
    try:
        if format not in ["pdf", "excel"]:
            raise HTTPException(status_code=400, detail="Invalid format. Use 'pdf' or 'excel'")
        
        # Generate and return report file
        # This would be implemented with report generation logic
        return {"status": "success", "message": f"Report exported as {format}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
