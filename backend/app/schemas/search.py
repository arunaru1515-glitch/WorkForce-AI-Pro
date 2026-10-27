from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class SearchFilterParams(BaseModel):
    query: Optional[str] = None
    department_id: Optional[int] = None
    risk_level: Optional[str] = None  # LOW, MEDIUM, HIGH, CRITICAL
    employment_type: Optional[str] = None
    status: Optional[str] = None
    min_salary: Optional[float] = None
    max_salary: Optional[float] = None

class SearchResultItem(BaseModel):
    id: int
    employee_code: str
    full_name: str
    email: str
    department_id: Optional[int] = None
    department_name: str
    job_title: str
    salary: float
    employment_type: str
    status: str
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    primary_driver: Optional[str] = None
    attendance_rate: Optional[float] = None

class GlobalSearchResponse(BaseModel):
    total_matches: int
    results: List[SearchResultItem]
    filters_applied: Dict[str, Any]
