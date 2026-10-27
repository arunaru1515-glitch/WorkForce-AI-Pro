from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class AttendanceCheckIn(BaseModel):
    employee_id: Optional[int] = None
    shift_type: Optional[str] = "Morning (9 AM - 5 PM)"
    notes: Optional[str] = None

class AttendanceCheckOut(BaseModel):
    attendance_id: int
    notes: Optional[str] = None

class AttendanceCreate(BaseModel):
    employee_id: int
    date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    shift_type: Optional[str] = "Morning (9 AM - 5 PM)"
    working_hours: Optional[float] = 8.0
    overtime_hours: Optional[float] = 0.0
    status: Optional[str] = "Present"
    notes: Optional[str] = None

class AttendanceResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    shift_type: str
    working_hours: float
    overtime_hours: float
    status: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
