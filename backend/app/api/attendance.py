from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.attendance import Attendance
from app.models.employee import Employee
from app.models.user import UserRole
from app.schemas.attendance import AttendanceCheckIn, AttendanceCheckOut, AttendanceCreate, AttendanceResponse
from app.core.deps import get_current_user

router = APIRouter(prefix="/attendance", tags=["3. Attendance & Leaves"])

class ShiftAssignmentRequest(BaseModel):
    employee_id: int
    shift_type: str

def format_attendance_response(att: Attendance) -> AttendanceResponse:
    emp_name = f"{att.employee.first_name} {att.employee.last_name}" if att.employee else "Unknown"
    return AttendanceResponse(
        id=att.id,
        employee_id=att.employee_id,
        employee_name=emp_name,
        date=att.date,
        check_in=att.check_in,
        check_out=att.check_out,
        shift_type=att.shift_type,
        working_hours=round(att.working_hours, 2),
        overtime_hours=round(att.overtime_hours, 2),
        status=att.status,
        notes=att.notes,
        created_at=att.created_at
    )

def get_or_create_user_employee(db: Session, user) -> Employee:
    """Finds or links the employee profile associated with the logged-in user account."""
    user_emp = db.query(Employee).filter(
        (Employee.user_id == user.id) | (Employee.email == user.email)
    ).first()
    
    if not user_emp:
        # Check if first_name / last_name can be split from full_name
        name_parts = (user.full_name or "Staff Member").split(" ", 1)
        f_name = name_parts[0]
        l_name = name_parts[1] if len(name_parts) > 1 else "User"
        
        user_emp = Employee(
            employee_code=f"WF-AUTH-{user.id}",
            user_id=user.id,
            first_name=f_name,
            last_name=l_name,
            email=user.email,
            department_id=1,
            job_title=f"{user.role.value if hasattr(user.role, 'value') else str(user.role)} Member",
            employment_type="Full-Time",
            salary=70000.0,
            status="Active"
        )
        db.add(user_emp)
        db.commit()
        db.refresh(user_emp)
    elif not user_emp.user_id:
        user_emp.user_id = user.id
        db.commit()
        db.refresh(user_emp)
        
    return user_emp

@router.get("/today-status")
def get_today_status(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Module 4: Get today's attendance status & assigned shift for the logged-in user's own profile"""
    user_emp = get_or_create_user_employee(db, current_user)

    today = date.today()
    record = db.query(Attendance).filter(
        Attendance.employee_id == user_emp.id,
        Attendance.date == today
    ).first()

    # Determine assigned shift from recent attendance or default
    last_shift = db.query(Attendance).filter(
        Attendance.employee_id == user_emp.id
    ).order_by(Attendance.id.desc()).first()

    assigned_shift = last_shift.shift_type if (last_shift and last_shift.shift_type) else "Morning (9 AM - 5 PM)"

    return {
        "has_employee_profile": True,
        "employee_id": user_emp.id,
        "employee_name": f"{user_emp.first_name} {user_emp.last_name}",
        "assigned_shift": assigned_shift,
        "record": format_attendance_response(record) if record else None
    }

@router.get("/", response_model=List[AttendanceResponse])
def get_attendance_records(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    employee_id: Optional[int] = Query(None),
    target_date: Optional[date] = Query(None)
):
    """Module 4: Get attendance logs & reports with strict role-based scoping"""
    query = db.query(Attendance)
    
    # If standard EMPLOYEE, strictly limit view to their own personal records
    if current_user.role == UserRole.EMPLOYEE:
        user_emp = db.query(Employee).filter(
            (Employee.user_id == current_user.id) | (Employee.email == current_user.email)
        ).first()
        if user_emp:
            query = query.filter(Attendance.employee_id == user_emp.id)
        else:
            return []
    elif employee_id:
        query = query.filter(Attendance.employee_id == employee_id)
        
    if target_date:
        query = query.filter(Attendance.date == target_date)
        
    records = query.order_by(Attendance.date.desc(), Attendance.id.desc()).limit(150).all()
    return [format_attendance_response(r) for r in records]

@router.post("/check-in", response_model=AttendanceResponse)
def check_in(checkin_in: AttendanceCheckIn, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Module 4: Personal Employee Check-In (strictly restricted to the logged-in user's own account)"""
    user_emp = get_or_create_user_employee(db, current_user)
    target_emp_id = user_emp.id

    today = date.today()
    existing = db.query(Attendance).filter(
        Attendance.employee_id == target_emp_id,
        Attendance.date == today
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="You have already registered your check-in for today.")

    # Retain the employee's assigned shift schedule
    last_att = db.query(Attendance).filter(
        Attendance.employee_id == target_emp_id
    ).order_by(Attendance.id.desc()).first()
    shift_schedule = last_att.shift_type if (last_att and last_att.shift_type) else "Morning (9 AM - 5 PM)"

    now = datetime.utcnow()
    status_str = "Late" if now.hour >= 10 else "Present"
    
    att = Attendance(
        employee_id=target_emp_id,
        date=today,
        check_in=now,
        shift_type=shift_schedule,
        status=status_str,
        notes=checkin_in.notes or "Personal arrival registered via portal."
    )
    db.add(att)
    db.commit()
    db.refresh(att)
    return format_attendance_response(att)

@router.post("/check-out", response_model=AttendanceResponse)
def check_out(checkout_in: AttendanceCheckOut, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Module 4: Personal Employee Check-Out (each user can ONLY check out their own account)"""
    user_emp = get_or_create_user_employee(db, current_user)
    
    att = db.query(Attendance).filter(Attendance.id == checkout_in.attendance_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attendance record not found")
        
    # Strictly enforce that attendance belongs to the logged-in user!
    if att.employee_id != user_emp.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Forbidden: You can only check out your own personal attendance. Each employee, HR, or manager must log into their own account to check out."
        )

    if att.check_out is not None:
        raise HTTPException(status_code=400, detail="You have already completed your check-out for today.")
        
    now = datetime.utcnow()
    att.check_out = now
    
    # Calculate working hours and overtime
    if att.check_in:
        delta = now - att.check_in
        hours = delta.total_seconds() / 3600.0
        att.working_hours = round(hours, 2)
        if hours > 8.0:
            att.overtime_hours = round(hours - 8.0, 2)
        else:
            att.overtime_hours = 0.0
            
    if checkout_in.notes:
        att.notes = f"{att.notes or ''} | {checkout_in.notes}"
        
    db.commit()
    db.refresh(att)
    return format_attendance_response(att)

@router.post("/assign-shift")
def assign_employee_shift(
    req: ShiftAssignmentRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Module 4: HR/Admin Exclusive - Assign or change an employee's shift schedule"""
    if current_user.role not in [UserRole.ADMIN, UserRole.HR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Shift management is restricted. Only HR and Admin administrators can assign or alter employee shift schedules."
        )

    emp = db.query(Employee).filter(Employee.id == req.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    today = date.today()
    # If employee has an active/today attendance record, update its shift schedule
    today_att = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.date == today
    ).first()

    if today_att:
        today_att.shift_type = req.shift_type
        db.commit()
        db.refresh(today_att)
    else:
        # Create a pre-allocated shift record or dummy entry for the new shift
        latest_att = db.query(Attendance).filter(Attendance.employee_id == emp.id).order_by(Attendance.id.desc()).first()
        if latest_att:
            latest_att.shift_type = req.shift_type
            db.commit()

    return {
        "success": True,
        "message": f"Shift schedule for {emp.first_name} {emp.last_name} updated to {req.shift_type}.",
        "employee_id": emp.id,
        "new_shift": req.shift_type
    }

@router.put("/{attendance_id}/shift", response_model=AttendanceResponse)
def update_attendance_shift(
    attendance_id: int,
    shift_type: str = Query(..., description="Target Shift Type: Morning, Evening, Night"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Module 4: HR/Admin Exclusive - Update shift schedule on an existing attendance record"""
    if current_user.role not in [UserRole.ADMIN, UserRole.HR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Shift change authority restricted. Only HR and Admin administrators can change shift schedules."
        )

    att = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    att.shift_type = shift_type
    db.commit()
    db.refresh(att)
    return format_attendance_response(att)

@router.post("/reset-today")
def reset_today_attendance(
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    """Module 4: Reset today's attendance record for the logged-in user so they can test Clock In & Out"""
    user_emp = get_or_create_user_employee(db, current_user)
    today = date.today()
    record = db.query(Attendance).filter(
        Attendance.employee_id == user_emp.id,
        Attendance.date == today
    ).first()
    if record:
        db.delete(record)
        db.commit()
    return {"success": True, "message": "Today's clock reset successfully. You can now register Clock In."}

