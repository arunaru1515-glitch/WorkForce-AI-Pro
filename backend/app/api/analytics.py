from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date
from app.database import get_db
from app.models.employee import Employee
from app.models.department import Department
from app.models.attendance import Attendance
from app.models.leave import Leave
from app.models.payroll import Payroll
from app.models.user import UserRole
from app.schemas.analytics import DashboardOverview, DepartmentStats, AttendanceSummary, PayrollOverview
from app.core.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["8. Reports & Analytics"])

@router.get("/dashboard", response_model=DashboardOverview)
def get_dashboard_analytics(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Module 10 & Module 26: Aggregated real-time workforce statistics & KPI metrics with RBAC privacy"""
    total_emp = db.query(Employee).count()
    active_emp = db.query(Employee).filter(Employee.status == "Active").count()
    total_depts = db.query(Department).count()

    user_emp = None
    if current_user.role == UserRole.EMPLOYEE:
        user_emp = db.query(Employee).filter(
            (Employee.user_id == current_user.id) | (Employee.email == current_user.email)
        ).first()
        pending_leaves = db.query(Leave).filter(
            Leave.employee_id == user_emp.id,
            Leave.status == "Pending"
        ).count() if user_emp else 0
    else:
        pending_leaves = db.query(Leave).filter(Leave.status == "Pending").count()
    
    # Attendance for today
    today = date.today()
    attendances_today = db.query(Attendance).filter(Attendance.date == today).all()
    present_count = len([a for a in attendances_today if a.status in ["Present", "Late"]])
    late_count = len([a for a in attendances_today if a.status == "Late"])
    on_leave_today = db.query(Leave).filter(
        Leave.start_date <= today,
        Leave.end_date >= today,
        Leave.status == "Approved"
    ).count()
    
    att_rate = round((present_count / max(1, total_emp)) * 100, 1)
    
    # Payroll Overview (Current Month / Year) - RBAC confidentiality
    if current_user.role == UserRole.EMPLOYEE and user_emp:
        emp_payrolls = db.query(Payroll).filter(Payroll.employee_id == user_emp.id).all()
        total_spend = sum(p.net_salary for p in emp_payrolls)
        paid_count = len(emp_payrolls)
        avg_salary = round(total_spend / max(1, paid_count), 2) if paid_count > 0 else (user_emp.salary or 0.0)
    else:
        payrolls = db.query(Payroll).all()
        total_spend = sum(p.net_salary for p in payrolls)
        paid_count = len(payrolls)
        avg_salary = round(total_spend / max(1, paid_count), 2) if paid_count > 0 else 0.0
    
    # Department Distribution
    departments = db.query(Department).all()
    dept_distribution = []
    for d in departments:
        d_emps = db.query(Employee).filter(Employee.department_id == d.id).all()
        d_count = len(d_emps)
        d_payroll = sum(e.salary or 0 for e in d_emps) if current_user.role != UserRole.EMPLOYEE else 0.0
        dept_distribution.append(DepartmentStats(
            department_id=d.id,
            department_name=d.name,
            employee_count=d_count,
            total_payroll=round(d_payroll, 2)
        ))
        
    # Recent Activities - Scoped to employee if EMPLOYEE
    if current_user.role == UserRole.EMPLOYEE and user_emp:
        recent_leaves = db.query(Leave).filter(Leave.employee_id == user_emp.id).order_by(Leave.id.desc()).limit(3).all()
    else:
        recent_leaves = db.query(Leave).order_by(Leave.id.desc()).limit(3).all()

    recent_activities = []
    for l in recent_leaves:
        emp_name = f"{l.employee.first_name} {l.employee.last_name}" if l.employee else "Employee"
        recent_activities.append({
            "type": "LEAVE",
            "title": f"Leave Request - {l.leave_type}",
            "description": f"{emp_name} requested {l.days_count} day(s) ({l.status})",
            "time": l.applied_on.strftime("%Y-%m-%d %H:%M")
        })

    return DashboardOverview(
        total_employees=total_emp,
        active_employees=active_emp,
        total_departments=total_depts,
        pending_leaves=pending_leaves,
        attendance=AttendanceSummary(
            total_expected=total_emp,
            present_today=present_count,
            late_today=late_count,
            on_leave_today=on_leave_today,
            attendance_rate=att_rate
        ),
        payroll=PayrollOverview(
            total_monthly_spend=round(total_spend, 2),
            total_employees_paid=paid_count,
            average_salary=avg_salary
        ),
        department_distribution=dept_distribution,
        recent_activities=recent_activities
    )
