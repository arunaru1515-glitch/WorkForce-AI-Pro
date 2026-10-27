from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ReportsSummaryResponse(BaseModel):
    total_employees: int
    active_employees: int
    avg_salary: float
    total_monthly_payroll: float
    attendance_rate: float
    avg_attrition_risk: float
    high_risk_employee_count: int
    pending_leaves_count: int
    active_tasks_count: int

class EmployeeReportItem(BaseModel):
    id: int
    employee_code: str
    name: str
    email: str
    department: str
    job_title: str
    salary: float
    employment_type: str
    status: str
    hire_date: Optional[str] = None
    risk_level: Optional[str] = "LOW"

class AttritionReportItem(BaseModel):
    employee_id: int
    employee_code: str
    name: str
    department: str
    job_title: str
    risk_score: float
    risk_level: str
    primary_driver: str
    tenure_years: float
    last_assessment_date: str

class PayrollReportItem(BaseModel):
    id: int
    employee_name: str
    department: str
    month_year: str
    basic_salary: float
    allowances: float
    bonus: float
    tax_deduction: float
    provident_fund: float
    net_salary: float
    status: str

class AttendanceReportItem(BaseModel):
    employee_name: str
    department: str
    date: str
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    shift_type: str
    working_hours: float
    overtime_hours: float
    status: str
