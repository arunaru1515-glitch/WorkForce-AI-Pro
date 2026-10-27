from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, date

from app.database import get_db
from app.models.task import Task
from app.models.employee import Employee
from app.models.user import User, UserRole
from app.schemas.task import TaskCreate, TaskUpdate, TaskStatusUpdate, TaskResponse, TaskStatsResponse
from app.core.deps import get_current_user, require_roles
from app.core.audit import log_audit_event

router = APIRouter(prefix="/tasks", tags=["6. Tasks & Performance"])

def format_task_response(task: Task) -> TaskResponse:
    today = date.today()
    is_overdue = task.status != "COMPLETED" and task.due_date < today
    assignee_name = f"{task.assignee.first_name} {task.assignee.last_name}" if task.assignee else "Unassigned"
    creator_name = task.creator.full_name if task.creator else "System Admin"
    dept_name = task.assignee.department.name if (task.assignee and task.assignee.department) else "Operations"
    emp_code = task.assignee.employee_code if task.assignee else "N/A"

    return TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        assigned_to=task.assigned_to,
        priority=task.priority,
        status=task.status,
        category=task.category,
        due_date=task.due_date,
        created_by=task.created_by,
        assignee_name=assignee_name,
        creator_name=creator_name,
        department_name=dept_name,
        employee_code=emp_code,
        is_overdue=is_overdue,
        created_at=task.created_at,
        updated_at=task.updated_at
    )

@router.get("/", response_model=List[TaskResponse])
def get_all_tasks(
    status: Optional[str] = Query(None, description="Filter by status (TODO, IN_PROGRESS, REVIEW, COMPLETED)"),
    priority: Optional[str] = Query(None, description="Filter by priority (LOW, MEDIUM, HIGH, URGENT)"),
    category: Optional[str] = Query(None, description="Filter by category (Onboarding, Retention, Compliance, Operations)"),
    assigned_to: Optional[int] = Query(None, description="Filter by assigned employee ID"),
    overdue_only: Optional[bool] = Query(False, description="Filter only overdue tasks"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Module 21: Retrieve workflow task lists with multi-status and due-date monitoring filters"""
    query = db.query(Task).options(
        joinedload(Task.assignee).joinedload(Employee.department),
        joinedload(Task.creator)
    )

    # RBAC: Regular employee only sees tasks assigned to their linked employee profile
    if current_user.role == UserRole.EMPLOYEE:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if emp:
            query = query.filter(Task.assigned_to == emp.id)
        else:
            return []
    elif assigned_to:
        query = query.filter(Task.assigned_to == assigned_to)

    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if category:
        query = query.filter(Task.category == category)
    if overdue_only:
        query = query.filter(Task.due_date < date.today(), Task.status != "COMPLETED")

    tasks = query.order_by(Task.due_date.asc(), Task.id.desc()).all()
    return [format_task_response(t) for t in tasks]

@router.get("/stats", response_model=TaskStatsResponse)
def get_task_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Module 21: Workflow tracking summary metrics and due date compliance monitoring"""
    today = date.today()
    all_tasks = db.query(Task).all()

    # RBAC filter for employee
    if current_user.role == UserRole.EMPLOYEE:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        all_tasks = [t for t in all_tasks if emp and t.assigned_to == emp.id]

    total = len(all_tasks)
    todo = sum(1 for t in all_tasks if t.status == "TODO")
    in_progress = sum(1 for t in all_tasks if t.status == "IN_PROGRESS")
    review = sum(1 for t in all_tasks if t.status == "REVIEW")
    completed = sum(1 for t in all_tasks if t.status == "COMPLETED")
    overdue = sum(1 for t in all_tasks if t.status != "COMPLETED" and t.due_date < today)
    high_priority = sum(1 for t in all_tasks if t.priority in ["HIGH", "URGENT"] and t.status != "COMPLETED")

    return TaskStatsResponse(
        total_tasks=total,
        todo_count=todo,
        in_progress_count=in_progress,
        review_count=review,
        completed_count=completed,
        overdue_count=overdue,
        high_priority_count=high_priority
    )

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR, UserRole.MANAGER]))
):
    """Module 21: Assign an HR or operational workflow task to an employee"""
    emp = db.query(Employee).filter(Employee.id == payload.assigned_to).first()
    if not emp:
        raise HTTPException(status_code=404, detail=f"Employee ID {payload.assigned_to} not found")

    new_task = Task(
        title=payload.title,
        description=payload.description,
        assigned_to=payload.assigned_to,
        created_by=current_user.id,
        priority=payload.priority or "MEDIUM",
        status=payload.status or "TODO",
        category=payload.category or "HR Operations",
        due_date=payload.due_date
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    # Log audit event
    log_audit_event(
        db=db,
        user_id=current_user.id,
        user_name=current_user.full_name,
        action="CREATE_TASK",
        module="WORKFLOW_TASKS",
        details=f"Assigned task '{new_task.title}' (Priority: {new_task.priority}) to {emp.first_name} {emp.last_name}."
    )

    # Fetch loaded relationships
    task_loaded = db.query(Task).options(
        joinedload(Task.assignee).joinedload(Employee.department),
        joinedload(Task.creator)
    ).filter(Task.id == new_task.id).first()

    return format_task_response(task_loaded)

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR, UserRole.MANAGER]))
):
    """Module 21: Update task configuration, due date, priority, or assignee"""
    task = db.query(Task).options(
        joinedload(Task.assignee).joinedload(Employee.department),
        joinedload(Task.creator)
    ).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if payload.title is not None:
        task.title = payload.title
    if payload.description is not None:
        task.description = payload.description
    if payload.assigned_to is not None:
        task.assigned_to = payload.assigned_to
    if payload.priority is not None:
        task.priority = payload.priority
    if payload.status is not None:
        task.status = payload.status
    if payload.category is not None:
        task.category = payload.category
    if payload.due_date is not None:
        task.due_date = payload.due_date

    db.commit()
    db.refresh(task)

    log_audit_event(
        db=db,
        user_id=current_user.id,
        user_name=current_user.full_name,
        action="UPDATE_TASK",
        module="WORKFLOW_TASKS",
        details=f"Updated task ID {task.id}: '{task.title}'"
    )

    return format_task_response(task)

@router.patch("/{task_id}/status", response_model=TaskResponse)
def update_task_status(
    task_id: int,
    payload: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Module 21: Update employee task status (TODO -> IN_PROGRESS -> REVIEW -> COMPLETED)"""
    valid_statuses = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    task = db.query(Task).options(
        joinedload(Task.assignee).joinedload(Employee.department),
        joinedload(Task.creator)
    ).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # If employee, verify task belongs to them
    if current_user.role == UserRole.EMPLOYEE:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp or task.assigned_to != emp.id:
            raise HTTPException(status_code=403, detail="You can only update the status of your own tasks.")

    old_status = task.status
    task.status = payload.status
    db.commit()
    db.refresh(task)

    log_audit_event(
        db=db,
        user_id=current_user.id,
        user_name=current_user.full_name,
        action="UPDATE_TASK_STATUS",
        module="WORKFLOW_TASKS",
        details=f"Task ID {task.id} status transitioned from {old_status} to {task.status}"
    )

    return format_task_response(task)

@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR]))
):
    """Module 21: Delete task from workflow system"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    title = task.title
    db.delete(task)
    db.commit()

    log_audit_event(
        db=db,
        user_id=current_user.id,
        user_name=current_user.full_name,
        action="DELETE_TASK",
        module="WORKFLOW_TASKS",
        details=f"Deleted task ID {task_id}: '{title}'"
    )

    return {"message": "Task successfully deleted", "task_id": task_id}
