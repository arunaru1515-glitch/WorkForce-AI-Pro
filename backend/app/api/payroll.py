from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
from app.database import get_db
from app.models.payroll import Payroll
from app.models.employee import Employee
from app.schemas.payroll import PayrollGenerate, PayrollResponse
from app.core.deps import get_current_user

router = APIRouter(prefix="/payroll", tags=["Payroll Management System"])

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
    """Module 6: Get payroll list with period filters"""
    query = db.query(Payroll)
    if month:
        query = query.filter(Payroll.month == month)
    if year:
        query = query.filter(Payroll.year == year)
    if employee_id:
        query = query.filter(Payroll.employee_id == employee_id)
        
    records = query.order_by(Payroll.year.desc(), Payroll.month.desc(), Payroll.id.desc()).all()
    return [format_payroll_response(r) for r in records]

@router.post("/generate", response_model=PayrollResponse, status_code=status.HTTP_201_CREATED)
def generate_payroll(pay_in: PayrollGenerate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Module 6: Generate monthly salary breakdown for an employee"""
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
def mark_payroll_paid(payroll_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Module 6: Mark payroll as Paid & record payment timestamp"""
    p = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payroll record not found")
        
    p.status = "Paid"
    p.payment_date = datetime.utcnow()
    db.commit()
    db.refresh(p)
    return format_payroll_response(p)

@router.get("/payslip/{payroll_id}")
def get_payslip_detail(payroll_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Module 6: Payslip Generation for print / view"""
    p = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    return format_payroll_response(p)
