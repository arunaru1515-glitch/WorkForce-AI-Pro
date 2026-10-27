from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.department import Department
from app.models.employee import Employee
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse
from app.core.deps import get_current_user

router = APIRouter(prefix="/departments", tags=["Department & Role Management"])

@router.get("/", response_model=List[DepartmentResponse])
def get_departments(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Module 3: List all departments with dynamic employee count"""
    departments = db.query(Department).all()
    result = []
    for dept in departments:
        emp_count = db.query(Employee).filter(Employee.department_id == dept.id).count()
        dept_data = DepartmentResponse(
            id=dept.id,
            name=dept.name,
            code=dept.code,
            description=dept.description,
            location=dept.location,
            employee_count=emp_count,
            created_at=dept.created_at
        )
        result.append(dept_data)
    return result

@router.get("/{department_id}", response_model=DepartmentResponse)
def get_department(department_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Module 3: Get department details"""
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    emp_count = db.query(Employee).filter(Employee.department_id == dept.id).count()
    return DepartmentResponse(
        id=dept.id,
        name=dept.name,
        code=dept.code,
        description=dept.description,
        location=dept.location,
        employee_count=emp_count,
        created_at=dept.created_at
    )

@router.post("/", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(dept_in: DepartmentCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Module 3: Create a new department"""
    existing = db.query(Department).filter(
        (Department.name == dept_in.name) | (Department.code == dept_in.code)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department name or code already exists")
    
    new_dept = Department(
        name=dept_in.name,
        code=dept_in.code.upper(),
        description=dept_in.description,
        location=dept_in.location or "Headquarters"
    )
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    return DepartmentResponse(
        id=new_dept.id,
        name=new_dept.name,
        code=new_dept.code,
        description=new_dept.description,
        location=new_dept.location,
        employee_count=0,
        created_at=new_dept.created_at
    )

@router.put("/{department_id}", response_model=DepartmentResponse)
def update_department(department_id: int, dept_in: DepartmentUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Module 3: Update department information"""
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    if dept_in.name:
        dept.name = dept_in.name
    if dept_in.code:
        dept.code = dept_in.code.upper()
    if dept_in.description is not None:
        dept.description = dept_in.description
    if dept_in.location:
        dept.location = dept_in.location
        
    db.commit()
    db.refresh(dept)
    emp_count = db.query(Employee).filter(Employee.department_id == dept.id).count()
    return DepartmentResponse(
        id=dept.id,
        name=dept.name,
        code=dept.code,
        description=dept.description,
        location=dept.location,
        employee_count=emp_count,
        created_at=dept.created_at
    )

@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(department_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Module 3: Delete department"""
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept)
    db.commit()
    return None
