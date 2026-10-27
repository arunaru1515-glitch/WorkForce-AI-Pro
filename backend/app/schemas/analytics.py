from pydantic import BaseModel
from typing import List, Dict, Any

class DepartmentStats(BaseModel):
    department_id: int
    department_name: str
    employee_count: int
    total_payroll: float

class AttendanceSummary(BaseModel):
    total_expected: int
    present_today: int
    late_today: int
    on_leave_today: int
    attendance_rate: float

class PayrollOverview(BaseModel):
    total_monthly_spend: float
    total_employees_paid: int
    average_salary: float

class DashboardOverview(BaseModel):
    total_employees: int
    active_employees: int
    total_departments: int
    pending_leaves: int
    attendance: AttendanceSummary
    payroll: PayrollOverview
    department_distribution: List[DepartmentStats]
    recent_activities: List[Dict[str, Any]]
