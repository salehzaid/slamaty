"""
Analytics Pydantic schemas
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class TrendData(BaseModel):
    period: str
    completion_rate: float
    overdue_rate: float
    cost_efficiency: float
    user_satisfaction: float

class Predictions(BaseModel):
    next_month_completion: float
    risk_factors: List[str]
    recommendations: List[str]
    cost_forecast: float

class PerformanceMetrics(BaseModel):
    avg_response_time: float
    escalation_rate: float
    first_time_fix_rate: float
    customer_satisfaction: float

class DepartmentComparison(BaseModel):
    department: str
    efficiency_score: float
    completion_rate: float
    avg_time: float
    cost_per_capa: float

class RiskAnalysis(BaseModel):
    risk_level: str  # low, medium, high, critical
    description: str
    probability: float
    impact: int
    mitigation: str

class AnalyticsData(BaseModel):
    trends: List[TrendData]
    predictions: Predictions
    performance_metrics: PerformanceMetrics
    department_comparison: List[DepartmentComparison]
    risk_analysis: List[RiskAnalysis]
