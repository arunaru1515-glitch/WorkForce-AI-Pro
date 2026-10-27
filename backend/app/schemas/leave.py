from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class LeaveApply(BaseModel):
    employee_id: int
    leave_type: str # Casual, Sick, Annual, Maternity, Unpaid
    start_date: date
    end_date: date
    reason: str

class LeaveReview(BaseModel):
    status: str # Approved, Rejected
    review_comments: Optional[str] = None

class LeaveResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    department_name: Optional[str] = None
    leave_type: str
    start_date: date
    end_date: date
    days_count: int
    reason: str
    status: str
    review_comments: Optional[str] = None
    applied_on: datetime
    reviewed_on: Optional[datetime] = None

    class Config:
        from_attributes = True

class LeaveBalanceResponse(BaseModel):
    employee_id: int
    annual_allowed: int = 18
    annual_used: int = 0
    casual_allowed: int = 12
    casual_used: int = 0
    sick_allowed: int = 10
    sick_used: int = 0
    total_remaining: int = 40
