from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.employee import EmploymentType, EmployeeStatus
from app.schemas.base import ORMBaseModel

class EmployeeBase(ORMBaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    department_id: int
    job_title: str
    employment_type: Optional[str] = EmploymentType.FULL_TIME.value
    salary: Optional[float] = 50000.0
    status: Optional[str] = EmployeeStatus.ACTIVE.value
    emergency_contact: Optional[str] = None
    address: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    employee_code: Optional[str] = None
    role: Optional[str] = "EMPLOYEE"
    password: Optional[str] = None

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    department_id: Optional[int] = None
    job_title: Optional[str] = None
    employment_type: Optional[str] = None
    salary: Optional[float] = None
    status: Optional[str] = None
    emergency_contact: Optional[str] = None
    address: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None

class EmployeeResponse(EmployeeBase):
    id: int
    employee_code: str
    hire_date: Optional[datetime] = None
    department_name: Optional[str] = None
    role: Optional[str] = "EMPLOYEE"
    created_at: Optional[datetime] = None
