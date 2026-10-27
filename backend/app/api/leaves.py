from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import List, Optional
from app.database import get_db
from app.models.leave import Leave
from app.models.employee import Employee
from app.models.notification import Notification
from app.models.user import UserRole
from app.schemas.leave import LeaveApply, LeaveReview, LeaveResponse, LeaveBalanceResponse
from app.core.deps import get_current_user, require_roles

router = APIRouter(prefix="/leaves", tags=["3. Attendance & Leaves"])

def format_leave_response(l: Leave) -> LeaveResponse:
    emp_name = f"{l.employee.first_name} {l.employee.last_name}" if l.employee else "Unknown"
    dept_name = l.employee.department.name if l.employee and l.employee.department else "Unassigned"
    return LeaveResponse(
        id=l.id,
        employee_id=l.employee_id,
        employee_name=emp_name,
        department_name=dept_name,
        leave_type=l.leave_type,
        start_date=l.start_date,
        end_date=l.end_date,
        days_count=l.days_count,
        reason=l.reason,
        status=l.status,
        review_comments=l.review_comments,
        applied_on=l.applied_on,
        reviewed_on=l.reviewed_on
    )

@router.get("/", response_model=List[LeaveResponse])
def get_leaves(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    status: Optional[str] = Query(None, description="Filter by Pending, Approved, Rejected"),
    employee_id: Optional[int] = Query(None)
):
    """Module 5 & Module 26: List leaves with RBAC enforcement"""
    query = db.query(Leave)
    
    # RBAC: Regular EMPLOYEE can ONLY see their own leave requests
    if current_user.role == UserRole.EMPLOYEE:
        emp = db.query(Employee).filter(
            (Employee.user_id == current_user.id) | (Employee.email == current_user.email)
        ).first()
        if not emp:
            return []
        query = query.filter(Leave.employee_id == emp.id)
    elif employee_id:
        query = query.filter(Leave.employee_id == employee_id)

    if status:
        query = query.filter(Leave.status == status)
        
    leaves = query.order_by(Leave.id.desc()).all()
    return [format_leave_response(l) for l in leaves]

@router.post("/apply", response_model=LeaveResponse, status_code=status.HTTP_201_CREATED)
def apply_leave(leave_in: LeaveApply, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Module 5: Apply for Leave"""
    # RBAC: If standard employee, always apply for their own employee profile
    if current_user.role == UserRole.EMPLOYEE:
        emp = db.query(Employee).filter(
            (Employee.user_id == current_user.id) | (Employee.email == current_user.email)
        ).first()
        if not emp:
            raise HTTPException(status_code=400, detail="Employee profile not found for current user")
        target_emp_id = emp.id
    else:
        emp = db.query(Employee).filter(Employee.id == leave_in.employee_id).first()
        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found")
        target_emp_id = leave_in.employee_id
        
    if leave_in.end_date < leave_in.start_date:
        raise HTTPException(status_code=400, detail="End date cannot be earlier than start date")
        
    days = (leave_in.end_date - leave_in.start_date).days + 1
    
    new_leave = Leave(
        employee_id=target_emp_id,
        leave_type=leave_in.leave_type,
        start_date=leave_in.start_date,
        end_date=leave_in.end_date,
        days_count=days,
        reason=leave_in.reason,
        status="Pending"
    )
    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)
    
    # Trigger HR notification
    hr_alert = Notification(
        user_id=current_user.id,
        title=f"New Leave Application: {emp.first_name} {emp.last_name}",
        message=f"{emp.first_name} applied for {days} day(s) of {leave_in.leave_type} leave from {leave_in.start_date}.",
        type="INFO"
    )
    db.add(hr_alert)
    db.commit()
    
    return format_leave_response(new_leave)

@router.put("/{leave_id}/review", response_model=LeaveResponse)
def review_leave(
    leave_id: int,
    review_in: LeaveReview,
    db: Session = Depends(get_db),
    current_user = Depends(require_roles([UserRole.ADMIN, UserRole.HR, UserRole.MANAGER]))
):
    """Module 5 & Module 26: Leave Approval Workflow (Approve / Reject) - Restricted to ADMIN, HR, and MANAGER"""
    leave = db.query(Leave).filter(Leave.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
        
    if review_in.status not in ["Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Status must be 'Approved' or 'Rejected'")
        
    leave.status = review_in.status
    leave.review_comments = review_in.review_comments
    leave.reviewed_by = current_user.id
    leave.reviewed_on = datetime.utcnow()
    
    # Notify employee of the decision
    if leave.employee and leave.employee.user_id:
        decision_notif = Notification(
            user_id=leave.employee.user_id,
            title=f"Leave Request {review_in.status}",
            message=f"Your {leave.leave_type} leave request ({leave.start_date} to {leave.end_date}) was {review_in.status.lower()} by {current_user.full_name}. Note: {review_in.review_comments or 'No notes provided.'}",
            type="SUCCESS" if review_in.status == "Approved" else "WARNING"
        )
        db.add(decision_notif)

    db.commit()
    db.refresh(leave)
    return format_leave_response(leave)

@router.delete("/{leave_id}", response_model=dict)
def cancel_leave(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Module 5 & Module 26: Cancel a Pending Leave Request"""
    leave = db.query(Leave).filter(Leave.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    if leave.status != "Pending":
        raise HTTPException(status_code=400, detail="Only pending leave requests can be cancelled.")

    # Employees can only cancel their own leave
    if current_user.role == UserRole.EMPLOYEE:
        emp = db.query(Employee).filter(
            (Employee.user_id == current_user.id) | (Employee.email == current_user.email)
        ).first()
        if not emp or leave.employee_id != emp.id:
            raise HTTPException(status_code=403, detail="You can only cancel your own leave requests.")

    db.delete(leave)
    db.commit()
    return {"message": "Leave request cancelled successfully"}


@router.get("/balance/{employee_id}", response_model=LeaveBalanceResponse)
def get_leave_balance(employee_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Module 5: Dynamic Leave Balance Calculation"""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    approved_leaves = db.query(Leave).filter(
        Leave.employee_id == employee_id,
        Leave.status == "Approved"
    ).all()
    
    annual_used = sum(l.days_count for l in approved_leaves if l.leave_type == "Annual")
    casual_used = sum(l.days_count for l in approved_leaves if l.leave_type == "Casual")
    sick_used = sum(l.days_count for l in approved_leaves if l.leave_type == "Sick")
    
    annual_allowed = 18
    casual_allowed = 12
    sick_allowed = 10
    total_allowed = annual_allowed + casual_allowed + sick_allowed
    total_used = annual_used + casual_used + sick_used
    
    return LeaveBalanceResponse(
        employee_id=employee_id,
        annual_allowed=annual_allowed,
        annual_used=annual_used,
        casual_allowed=casual_allowed,
        casual_used=casual_used,
        sick_allowed=sick_allowed,
        sick_used=sick_used,
        total_remaining=max(0, total_allowed - total_used)
    )
