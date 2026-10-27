from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class DepartmentBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    location: Optional[str] = "Headquarters"

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None

class DepartmentResponse(DepartmentBase):
    id: int
    employee_count: Optional[int] = 0
    created_at: datetime

    class Config:
        from_attributes = True
