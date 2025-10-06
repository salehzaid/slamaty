"""
Advanced Analytics API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import json

from database import get_db
from crud_analytics import (
    get_analytics_data,
    get_performance_metrics,
    get_department_comparison,
    get_risk_analysis,
    get_predictions
)
from schemas_analytics import (
    AnalyticsData,
    PerformanceMetrics,
    DepartmentComparison,
    RiskAnalysis,
    Predictions
)

router = APIRouter()

@router.get("/analytics/advanced/", response_model=AnalyticsData)
async def get_advanced_analytics(
    prediction_period: str = Query("3m", description="Prediction period: 1m, 3m, 6m, 1y"),
    department_id: Optional[int] = Query(None, description="Filter by department ID"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    db: Session = Depends(get_db)
):
    """Get advanced analytics data"""
    try:
        analytics_data = get_analytics_data(
            db, prediction_period, department_id, start_date, end_date
        )
        return analytics_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/performance/", response_model=PerformanceMetrics)
async def get_performance_metrics_endpoint(
    department_id: Optional[int] = Query(None, description="Filter by department ID"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    db: Session = Depends(get_db)
):
    """Get performance metrics"""
    try:
        metrics = get_performance_metrics(db, department_id, start_date, end_date)
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/departments/", response_model=List[DepartmentComparison])
async def get_department_comparison_endpoint(
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    db: Session = Depends(get_db)
):
    """Get department comparison data"""
    try:
        comparison = get_department_comparison(db, start_date, end_date)
        return comparison
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/risk/", response_model=List[RiskAnalysis])
async def get_risk_analysis_endpoint(
    department_id: Optional[int] = Query(None, description="Filter by department ID"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    db: Session = Depends(get_db)
):
    """Get risk analysis data"""
    try:
        risk_analysis = get_risk_analysis(db, department_id, start_date, end_date)
        return risk_analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/predictions/", response_model=Predictions)
async def get_predictions_endpoint(
    prediction_period: str = Query("3m", description="Prediction period: 1m, 3m, 6m, 1y"),
    department_id: Optional[int] = Query(None, description="Filter by department ID"),
    db: Session = Depends(get_db)
):
    """Get predictions data"""
    try:
        predictions = get_predictions(db, prediction_period, department_id)
        return predictions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/export/{format}/")
async def export_analytics(
    format: str,
    prediction_period: str = Query("3m", description="Prediction period"),
    department_id: Optional[int] = Query(None, description="Filter by department ID"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    db: Session = Depends(get_db)
):
    """Export analytics in specified format"""
    try:
        if format not in ["pdf", "excel"]:
            raise HTTPException(status_code=400, detail="Invalid format. Use 'pdf' or 'excel'")
        
        # Generate and return analytics report file
        # This would be implemented with report generation logic
        return {"status": "success", "message": f"Analytics exported as {format}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
