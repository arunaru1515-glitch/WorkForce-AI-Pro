from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.base import ORMBaseModel

class PayrollGenerate(BaseModel):
    employee_id: int
    month: int
    year: int
    bonus: Optional[float] = 0.0
    other_deductions: Optional[float] = 0.0

class PayrollResponse(ORMBaseModel):
    id: int
    employee_id: int
    employee_code: Optional[str] = None
    employee_name: Optional[str] = None
    department_name: Optional[str] = None
    month: int
    year: int
    basic_salary: float
    hra: float
    allowances: float
    bonus: float
    tax_deduction: float
    provident_fund: float
    other_deductions: float
    gross_salary: float
    net_salary: float
    status: str
    payment_date: Optional[datetime] = None
    created_at: datetime
