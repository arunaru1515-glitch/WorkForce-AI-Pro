from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any
from app.schemas.base import ORMBaseModel

class GoalItem(BaseModel):
    title: str
    target: str
    status: str = "IN_PROGRESS"  # NOT_STARTED, IN_PROGRESS, ACHIEVED, DELAYED
    progress_percentage: int = 50

class PerformanceReviewBase(ORMBaseModel):
    employee_id: int
    review_cycle: str = "Annual Review 2026"
    rating: float = Field(..., ge=1.0, le=5.0, description="Rating from 1.0 to 5.0")
    goals_json: Optional[str] = None
    achievements: Optional[str] = None
    improvement_areas: Optional[str] = None
    feedback: Optional[str] = None
    status: Optional[str] = "Completed"

class PerformanceReviewCreate(PerformanceReviewBase):
    pass

class PerformanceReviewUpdate(BaseModel):
    review_cycle: Optional[str] = None
    rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    goals_json: Optional[str] = None
    achievements: Optional[str] = None
    improvement_areas: Optional[str] = None
    feedback: Optional[str] = None
    status: Optional[str] = None

class PerformanceReviewResponse(PerformanceReviewBase):
    id: int
    reviewer_id: int
    reviewer_name: Optional[str] = None
    employee_name: Optional[str] = None
    department_name: Optional[str] = None
    job_title: Optional[str] = None
    reviewed_at: datetime

class PerformanceStatsResponse(BaseModel):
    total_reviews: int
    average_rating: float
    high_performers_count: int
    needs_improvement_count: int
    rating_distribution: Dict[str, int]
    top_performers: List[Dict[str, Any]]
