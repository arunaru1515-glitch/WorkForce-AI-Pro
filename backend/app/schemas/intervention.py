from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any

class InterventionCreate(BaseModel):
    employee_id: int
    action_title: str
    strategy_type: str = "Compensation"
    description: str
    priority: str = "HIGH"
    expected_impact: Optional[str] = "Reduce flight risk by ~30%"

class InterventionUpdate(BaseModel):
    status: str
    outcome_notes: Optional[str] = None

class InterventionResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: str
    department_name: str
    action_title: str
    strategy_type: str
    description: str
    priority: str
    status: str
    assigned_to: Optional[int]
    assignee_name: Optional[str]
    expected_impact: Optional[str]
    outcome_notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
