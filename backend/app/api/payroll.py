from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
from app.database import get_db
from app.models.payroll import Payroll
from app.models.employee import Employee
from app.models.user import UserRole
from app.schemas.payroll import PayrollGenerate, PayrollResponse
from app.core.deps import get_current_user, require_roles

router = APIRouter(prefix="/payroll", tags=["4. Payroll & Compensation"])

def format_payroll_response(p: Payroll) -> PayrollResponse:
    emp = p.employee
    emp_name = f"{emp.first_name} {emp.last_name}" if emp else "Unknown"
    emp_code = emp.employee_code if emp else "EMP-000"
    dept_name = emp.department.name if emp and emp.department else "Unassigned"
    
    return PayrollResponse(
        id=p.id,
        employee_id=p.employee_id,
        employee_code=emp_code,
        employee_name=emp_name,
        department_name=dept_name,
        month=p.month,
        year=p.year,
        basic_salary=round(p.basic_salary, 2),
        hra=round(p.hra, 2),
        allowances=round(p.allowances, 2),
        bonus=round(p.bonus, 2),
        tax_deduction=round(p.tax_deduction, 2),
        provident_fund=round(p.provident_fund, 2),
        other_deductions=round(p.other_deductions, 2),
        gross_salary=round(p.gross_salary, 2),
        net_salary=round(p.net_salary, 2),
        status=p.status,
        payment_date=p.payment_date,
        created_at=p.created_at
    )

@router.get("/", response_model=List[PayrollResponse])
def get_payrolls(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    employee_id: Optional[int] = Query(None)
):
    """Module 6 & Module 26: Get payroll list with strict RBAC scoping"""
    query = db.query(Payroll)
    
    # RBAC: Regular EMPLOYEE can ONLY view their own payslips
    if current_user.role == UserRole.EMPLOYEE:
        emp = db.query(Employee).filter(
            (Employee.user_id == current_user.id) | (Employee.email == current_user.email)
        ).first()
        if not emp:
            return []
        query = query.filter(Payroll.employee_id == emp.id)
    elif employee_id:
        query = query.filter(Payroll.employee_id == employee_id)

    if month:
        query = query.filter(Payroll.month == month)
    if year:
        query = query.filter(Payroll.year == year)
        
    records = query.order_by(Payroll.year.desc(), Payroll.month.desc(), Payroll.id.desc()).all()
    return [format_payroll_response(r) for r in records]

@router.post("/generate", response_model=PayrollResponse, status_code=status.HTTP_201_CREATED)
def generate_payroll(
    pay_in: PayrollGenerate, 
    db: Session = Depends(get_db), 
    current_user = Depends(require_roles([UserRole.ADMIN, UserRole.HR]))
):
    """Module 6 & Module 26: Generate monthly salary breakdown for an employee (Restricted to ADMIN, HR)"""
    emp = db.query(Employee).filter(Employee.id == pay_in.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    # Check if already generated for this period
    existing = db.query(Payroll).filter(
        Payroll.employee_id == pay_in.employee_id,
        Payroll.month == pay_in.month,
        Payroll.year == pay_in.year
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Payroll already generated for this employee for this period")
        
    base = emp.salary or 50000.0
    basic = round(base * 0.50, 2)
    hra = round(base * 0.30, 2)
    allowances = round(base * 0.20, 2)
    bonus = round(pay_in.bonus or 0.0, 2)
    
    gross = basic + hra + allowances + bonus
    pf = round(basic * 0.12, 2)
    tax = round(gross * 0.10, 2)
    other = round(pay_in.other_deductions or 0.0, 2)
    net = gross - (pf + tax + other)
    
    payroll = Payroll(
        employee_id=emp.id,
        month=pay_in.month,
        year=pay_in.year,
        basic_salary=basic,
        hra=hra,
        allowances=allowances,
        bonus=bonus,
        tax_deduction=tax,
        provident_fund=pf,
        other_deductions=other,
        gross_salary=gross,
        net_salary=net,
        status="Processed"
    )
    db.add(payroll)
    db.commit()
    db.refresh(payroll)
    return format_payroll_response(payroll)

@router.post("/{payroll_id}/pay", response_model=PayrollResponse)
def mark_payroll_paid(
    payroll_id: int, 
    db: Session = Depends(get_db), 
    current_user = Depends(require_roles([UserRole.ADMIN, UserRole.HR]))
):
    """Module 6 & Module 26: Mark payroll as Paid & record payment timestamp (Restricted to ADMIN, HR)"""
    p = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payroll record not found")
        
    p.status = "Paid"
    p.payment_date = datetime.utcnow()
    db.commit()
    db.refresh(p)
    return format_payroll_response(p)

@router.get("/payslip/{payroll_id}", response_model=PayrollResponse)
def get_payslip_detail(payroll_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Module 6 & Module 26: Payslip Generation for print / view with RBAC ownership check"""
    p = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payroll record not found")
        
    # RBAC: Employee can only view their own payslip
    if current_user.role == UserRole.EMPLOYEE:
        emp = db.query(Employee).filter(
            (Employee.user_id == current_user.id) | (Employee.email == current_user.email)
        ).first()
        if not emp or p.employee_id != emp.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Employees can only view their own payslips."
            )
            
    return format_payroll_response(p)
