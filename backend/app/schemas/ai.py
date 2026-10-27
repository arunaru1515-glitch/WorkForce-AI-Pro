from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any
from app.schemas.base import ORMBaseModel

class PredictRequest(BaseModel):
    employee_id: Optional[int] = None
    age: Optional[int] = 35
    department: Optional[str] = "Research & Development"
    job_role: Optional[str] = "Research Scientist"
    monthly_income: Optional[float] = 6000.0
    overtime: Optional[str] = "No"
    distance_from_home: Optional[int] = 8
    job_satisfaction: Optional[int] = 3
    work_life_balance: Optional[int] = 3
    years_at_company: Optional[int] = 4
    years_in_current_role: Optional[int] = 2
    years_since_last_promotion: Optional[int] = 1
    stock_option_level: Optional[int] = 1

class FlightFactor(BaseModel):
    factor: str
    impact: float
    type: str

class Recommendation(BaseModel):
    strategy: str
    action: str
    priority: str

class PredictionResponse(BaseModel):
    employee_id: Optional[int] = None
    employee_name: Optional[str] = None
    risk_score: float
    risk_level: str
    confidence: float
    primary_driver: str
    contributing_factors: List[FlightFactor]
    recommendations: List[Recommendation]
    assessed_at: str

class RiskAssessmentResponse(ORMBaseModel):
    id: int
    employee_id: int
    employee_name: str
    department_name: str
    job_title: str
    risk_score: float
    risk_level: str
    confidence: float
    primary_driver: Optional[str]
    contributing_factors: Optional[str]
    trigger_event: str
    assessed_at: datetime

class ModelInfoResponse(BaseModel):
    model_type: str
    dataset_used: str
    total_records: int
    trained_at: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    confusion_matrix: List[List[int]]
    top_features: List[Dict[str, Any]]
    n_features: int

class AttritionOverviewResponse(BaseModel):
    total_analyzed: int
    avg_attrition_risk: float
    high_risk_count: int
    critical_risk_count: int
    primary_flight_driver: str
    projected_6m_exits: int
    high_risk_employees: List[Dict[str, Any]]
    department_risk_summary: List[Dict[str, Any]]
