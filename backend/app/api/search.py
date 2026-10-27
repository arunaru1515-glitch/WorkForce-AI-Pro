from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List, Dict, Any

from app.database import get_db
from app.models.employee import Employee
from app.models.department import Department
from app.models.attendance import Attendance
from app.models.payroll import Payroll
from app.models.risk import RiskAssessment
from app.models.user import User, UserRole
from app.schemas.search import GlobalSearchResponse, SearchResultItem
from app.core.deps import get_current_user

router = APIRouter(prefix="/search", tags=["8. Reports & Analytics"])

@router.get("/global", response_model=GlobalSearchResponse)
def global_multi_filter_search(
    query: Optional[str] = Query(None, description="Keyword search in name, code, email, title"),
    department_id: Optional[int] = Query(None, description="Filter by department"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level (LOW, MEDIUM, HIGH, CRITICAL)"),
    employment_type: Optional[str] = Query(None, description="Filter by employment type (Full-Time, Contract, Part-Time)"),
    status: Optional[str] = Query(None, description="Filter by status (Active, Inactive, On-Leave)"),
    min_salary: Optional[float] = Query(None, description="Minimum salary filter"),
    max_salary: Optional[float] = Query(None, description="Maximum salary filter"),
    min_attendance_rate: Optional[float] = Query(None, description="Minimum attendance compliance rate %"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Module 24: Advanced Multi-Filter Search Engine across employee profiles, department, risk, attendance, and payroll"""
    db_query = db.query(Employee).options(joinedload(Employee.department))

    if query:
        q_fmt = f"%{query}%"
        db_query = db_query.filter(
            (Employee.first_name.ilike(q_fmt)) |
            (Employee.last_name.ilike(q_fmt)) |
            (Employee.employee_code.ilike(q_fmt)) |
            (Employee.email.ilike(q_fmt)) |
            (Employee.job_title.ilike(q_fmt))
        )

    if department_id:
        db_query = db_query.filter(Employee.department_id == department_id)
    if status:
        db_query = db_query.filter(Employee.status == status)
    if employment_type:
        db_query = db_query.filter(Employee.employment_type == employment_type)
    if min_salary is not None:
        db_query = db_query.filter(Employee.salary >= min_salary)
    if max_salary is not None:
        db_query = db_query.filter(Employee.salary <= max_salary)

    employees = db_query.all()

    # Preload latest risk assessments
    latest_risks = {}
    for r in db.query(RiskAssessment).order_by(RiskAssessment.id.asc()).all():
        latest_risks[r.employee_id] = r

    # Precalculate attendance rates
    att_stats = {}
    for emp in employees:
        atts = db.query(Attendance).filter(Attendance.employee_id == emp.id).all()
        if atts:
            present = sum(1 for a in atts if a.status in ["Present", "Late"])
            rate = round((present / len(atts)) * 100, 1)
        else:
            rate = 95.0
        att_stats[emp.id] = rate

    results = []
    for emp in employees:
        risk_obj = latest_risks.get(emp.id)
        r_score = risk_obj.risk_score if risk_obj else 20.0
        r_level = risk_obj.risk_level if risk_obj else "LOW"
        r_driver = risk_obj.primary_driver if risk_obj else "Stable Baseline"
        rate = att_stats.get(emp.id, 95.0)

        # Risk level filter
        if risk_level and r_level != risk_level:
            continue

        # Attendance rate filter
        if min_attendance_rate is not None and rate < min_attendance_rate:
            continue

        results.append(SearchResultItem(
            id=emp.id,
            employee_code=emp.employee_code,
            full_name=f"{emp.first_name} {emp.last_name}",
            email=emp.email,
            department_id=emp.department_id,
            department_name=emp.department.name if emp.department else "Unassigned",
            job_title=emp.job_title,
            salary=emp.salary,
            employment_type=emp.employment_type,
            status=emp.status,
            risk_score=r_score,
            risk_level=r_level,
            primary_driver=r_driver,
            attendance_rate=rate
        ))

    filters_applied = {
        "query": query,
        "department_id": department_id,
        "risk_level": risk_level,
        "employment_type": employment_type,
        "status": status,
        "min_salary": min_salary,
        "max_salary": max_salary,
        "min_attendance_rate": min_attendance_rate
    }

    return GlobalSearchResponse(
        total_matches=len(results),
        results=results,
        filters_applied=filters_applied
    )
