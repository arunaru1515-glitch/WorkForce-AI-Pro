from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
import random
from app.database import get_db
from app.models.employee import Employee
from app.models.department import Department
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse
from app.core.deps import get_current_user

router = APIRouter(prefix="/employees", tags=["Employee Management System"])

def format_employee_response(emp: Employee) -> EmployeeResponse:
    dept_name = emp.department.name if emp.department else "Unassigned"
    emp_role = emp.user.role.value if (emp.user and hasattr(emp.user.role, 'value')) else (str(emp.user.role) if emp.user else "EMPLOYEE")
    return EmployeeResponse(
        id=emp.id,
        employee_code=emp.employee_code,
        first_name=emp.first_name,
        last_name=emp.last_name,
        email=emp.email,
        phone=emp.phone,
        department_id=emp.department_id,
        department_name=dept_name,
        job_title=emp.job_title,
        hire_date=emp.hire_date,
        employment_type=emp.employment_type,
        salary=emp.salary,
        status=emp.status,
        emergency_contact=emp.emergency_contact,
        address=emp.address,
        role=emp_role,
        created_at=emp.created_at
    )

@router.get("/", response_model=List[EmployeeResponse])
def get_employees(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    search: Optional[str] = Query(None, description="Search by name, code, or email"),
    department_id: Optional[int] = Query(None, description="Filter by department"),
    status: Optional[str] = Query(None, description="Filter by employment status"),
    employment_type: Optional[str] = Query(None, description="Filter by type (Full-Time, Contract, etc.)")
):
    """Module 2: Employee list with search & multi-attribute filters"""
    query = db.query(Employee)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Employee.first_name.ilike(search_filter),
                Employee.last_name.ilike(search_filter),
                Employee.email.ilike(search_filter),
                Employee.employee_code.ilike(search_filter),
                Employee.job_title.ilike(search_filter)
            )
        )
    
    if department_id:
        query = query.filter(Employee.department_id == department_id)
        
    if status:
        query = query.filter(Employee.status == status)
        
    if employment_type:
        query = query.filter(Employee.employment_type == employment_type)
        
    employees = query.order_by(Employee.id.desc()).all()
    return [format_employee_response(e) for e in employees]

@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Module 2: Get specific employee profile"""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return format_employee_response(emp)

@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(emp_in: EmployeeCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Module 2: Create new employee"""
    # Verify email uniqueness
    if db.query(Employee).filter(Employee.email == emp_in.email).first():
        raise HTTPException(status_code=400, detail="Employee with this email already exists")
    
    # Verify department exists
    dept = db.query(Department).filter(Department.id == emp_in.department_id).first()
    if not dept:
        raise HTTPException(status_code=400, detail="Invalid department ID")
        
    # Generate employee code if not provided
    code = emp_in.employee_code
    if not code:
        code = f"WF-{random.randint(1000, 9999)}"
        while db.query(Employee).filter(Employee.employee_code == code).first():
            code = f"WF-{random.randint(1000, 9999)}"

    # Auto-provision or update User login account for seamless employee portal access
    user_account = db.query(User).filter(User.email == emp_in.email).first()
    user_role_str = (emp_in.role or "EMPLOYEE").upper()
    role_enum = getattr(UserRole, user_role_str, UserRole.EMPLOYEE)
    raw_password = emp_in.password if emp_in.password else "Employee@123"

    if not user_account:
        user_account = User(
            email=emp_in.email,
            full_name=f"{emp_in.first_name} {emp_in.last_name}",
            hashed_password=get_password_hash(raw_password),
            role=role_enum,
            is_active=True
        )
        db.add(user_account)
        db.flush()
    else:
        user_account.role = role_enum
        if emp_in.password:
            user_account.hashed_password = get_password_hash(raw_password)
        db.flush()

    new_emp = Employee(
        employee_code=code,
        user_id=user_account.id if user_account else None,
        first_name=emp_in.first_name,
        last_name=emp_in.last_name,
        email=emp_in.email,
        phone=emp_in.phone,
        department_id=emp_in.department_id,
        job_title=emp_in.job_title,
        employment_type=emp_in.employment_type or "Full-Time",
        salary=emp_in.salary or 50000.0,
        status=emp_in.status or "Active",
        emergency_contact=emp_in.emergency_contact,
        address=emp_in.address
    )
    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)
    return format_employee_response(new_emp)

@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(employee_id: int, emp_in: EmployeeUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Module 2: Update employee profile"""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    for field, val in emp_in.model_dump(exclude_unset=True).items():
        if field not in ["role", "password"]:
            setattr(emp, field, val)

    # Sync role or password if updated
    if not emp.user:
        existing_user = db.query(User).filter(User.email == emp.email).first()
        if existing_user:
            emp.user = existing_user
            emp.user_id = existing_user.id
        elif emp_in.password or emp_in.role:
            user_account = User(
                email=emp.email,
                full_name=f"{emp.first_name} {emp.last_name}",
                hashed_password=get_password_hash(emp_in.password or "Employee@123"),
                role=getattr(UserRole, (emp_in.role or "EMPLOYEE").upper(), UserRole.EMPLOYEE),
                is_active=True
            )
            db.add(user_account)
            db.flush()
            emp.user = user_account
            emp.user_id = user_account.id

    if emp.user:
        if emp_in.role:
            emp.user.role = getattr(UserRole, emp_in.role.upper(), emp.user.role)
        if emp_in.password:
            emp.user.hashed_password = get_password_hash(emp_in.password)
        
    db.commit()
    db.refresh(emp)
    return format_employee_response(emp)

@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Module 2: Delete employee"""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    db.delete(emp)
    db.commit()
    return None
