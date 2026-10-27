from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.intervention import Intervention
from app.models.employee import Employee
from app.models.user import User
from app.models.notification import Notification
from app.schemas.intervention import InterventionCreate, InterventionUpdate, InterventionResponse
from app.core.deps import get_current_user
from app.ml.predictor import predictor

router = APIRouter(prefix="/interventions", tags=["5. AI Attrition Intelligence"])

def format_intervention_response(item: Intervention) -> InterventionResponse:
    emp_name = f"{item.employee.first_name} {item.employee.last_name}" if item.employee else "Unknown"
    dept_name = item.employee.department.name if item.employee and item.employee.department else "Unassigned"
    assignee_name = item.assignee.full_name if item.assignee else "HR Operations"
    return InterventionResponse(
        id=item.id,
        employee_id=item.employee_id,
        employee_name=emp_name,
        department_name=dept_name,
        action_title=item.action_title,
        strategy_type=item.strategy_type,
        description=item.description,
        priority=item.priority,
        status=item.status,
        assigned_to=item.assigned_to,
        assignee_name=assignee_name,
        expected_impact=item.expected_impact,
        outcome_notes=item.outcome_notes,
        created_at=item.created_at,
        updated_at=item.updated_at
    )

@router.get("/", response_model=List[InterventionResponse])
def get_interventions(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Module 16: List all active HR retention interventions and action plans"""
    query = db.query(Intervention)
    if status_filter:
        query = query.filter(Intervention.status == status_filter)
    items = query.order_by(Intervention.id.desc()).all()
    return [format_intervention_response(i) for i in items]

@router.post("/", response_model=InterventionResponse, status_code=status.HTTP_201_CREATED)
def create_intervention(
    item_in: InterventionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Module 16: Launch a targeted employee retention intervention"""
    if current_user.role not in ["ADMIN", "HR", "MANAGER"]:
        raise HTTPException(status_code=403, detail="Only Managers and HR Leads can launch retention plans.")

    emp = db.query(Employee).filter(Employee.id == item_in.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    new_item = Intervention(
        employee_id=item_in.employee_id,
        action_title=item_in.action_title,
        strategy_type=item_in.strategy_type,
        description=item_in.description,
        priority=item_in.priority,
        expected_impact=item_in.expected_impact,
        status="Initiated",
        assigned_to=current_user.id
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    # Dispatched notification
    notif = Notification(
        user_id=current_user.id,
        title=f"Retention Plan Launched: {emp.first_name} {emp.last_name}",
        message=f"Plan '{item_in.action_title}' initiated under strategy: {item_in.strategy_type}.",
        type="INFO"
    )
    db.add(notif)
    db.commit()

    return format_intervention_response(new_item)

@router.put("/{intervention_id}/status", response_model=InterventionResponse)
def update_intervention_status(
    intervention_id: int,
    update_in: InterventionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Module 16: Update intervention execution progress and outcome notes"""
    item = db.query(Intervention).filter(Intervention.id == intervention_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Intervention record not found")

    item.status = update_in.status
    if update_in.outcome_notes:
        item.outcome_notes = update_in.outcome_notes
    item.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(item)
    return format_intervention_response(item)

@router.get("/recommendations/{employee_id}")
def get_retention_recommendations(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Module 16: AI Decision Support - Generate tailored retention strategies"""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    dept_name = emp.department.name if emp.department else "Research & Development"
    pred = predictor.predict_employee({
        "Department": dept_name,
        "JobRole": emp.job_title,
        "MonthlyIncome": emp.salary / 12.0,
        "OverTime": "Yes" if emp.salary < 80000 else "No"
    })

    return {
        "employee_id": emp.id,
        "employee_name": f"{emp.first_name} {emp.last_name}",
        "risk_level": pred["risk_level"],
        "risk_score": pred["risk_score"],
        "primary_driver": pred["primary_driver"],
        "ai_recommendations": pred["recommendations"]
    }
