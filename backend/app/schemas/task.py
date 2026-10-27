from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to: int
    priority: Optional[str] = "MEDIUM"  # LOW, MEDIUM, HIGH, URGENT
    status: Optional[str] = "TODO"      # TODO, IN_PROGRESS, REVIEW, COMPLETED
    category: Optional[str] = "HR Operations"  # Onboarding, Compliance, Retention, Operations
    due_date: date

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[int] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    due_date: Optional[date] = None

class TaskStatusUpdate(BaseModel):
    status: str

class TaskResponse(TaskBase):
    id: int
    created_by: int
    assignee_name: Optional[str] = None
    creator_name: Optional[str] = None
    department_name: Optional[str] = None
    employee_code: Optional[str] = None
    is_overdue: Optional[bool] = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TaskStatsResponse(BaseModel):
    total_tasks: int
    todo_count: int
    in_progress_count: int
    review_count: int
    completed_count: int
    overdue_count: int
    high_priority_count: int
