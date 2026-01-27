from pydantic import BaseModel
from typing import Any, Dict, List, Optional


class AnalyticsData(BaseModel):
    overview: Dict[str, Any] = {}
    trends: List[Dict[str, Any]] = []


class PerformanceMetrics(BaseModel):
    uptime: Optional[float] = None
    completion_rate: Optional[float] = None


class DepartmentComparison(BaseModel):
    department: str
    score: float


class RiskAnalysis(BaseModel):
    risk_level: str
    count: int


class Predictions(BaseModel):
    forecast: List[Dict[str, Any]] = []


__all__ = [
    "AnalyticsData",
    "PerformanceMetrics",
    "DepartmentComparison",
    "RiskAnalysis",
    "Predictions",
]


