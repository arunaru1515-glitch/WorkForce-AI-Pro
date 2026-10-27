import json
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.database import get_db
from app.models.performance import PerformanceReview
from app.models.employee import Employee
from app.models.user import User, UserRole
from app.schemas.performance import (
    PerformanceReviewCreate,
    PerformanceReviewUpdate,
    PerformanceReviewResponse,
    PerformanceStatsResponse
)
from app.core.deps import get_current_user, require_roles
from app.core.audit import log_audit_event

router = APIRouter(prefix="/performance", tags=["6. Tasks & Performance"])

def format_review_response(review: PerformanceReview) -> PerformanceReviewResponse:
    emp_name = f"{review.employee.first_name} {review.employee.last_name}" if review.employee else "Unknown Employee"
    dept_name = review.employee.department.name if (review.employee and review.employee.department) else "Operations"
    job_title = review.employee.job_title if review.employee else "Employee"
    reviewer_name = review.reviewer.full_name if review.reviewer else "HR Reviewer"

    return PerformanceReviewResponse(
        id=review.id,
        employee_id=review.employee_id,
        reviewer_id=review.reviewer_id,
        reviewer_name=reviewer_name,
        employee_name=emp_name,
        department_name=dept_name,
        job_title=job_title,
        review_cycle=review.review_cycle,
        rating=review.rating,
        goals_json=review.goals_json,
        achievements=review.achievements,
        improvement_areas=review.improvement_areas,
        feedback=review.feedback,
        status=review.status,
        reviewed_at=review.reviewed_at
    )

@router.get("/reviews", response_model=List[PerformanceReviewResponse])
def get_all_reviews(
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    cycle: Optional[str] = Query(None, description="Filter by review cycle"),
    min_rating: Optional[float] = Query(None, ge=1.0, le=5.0),
    max_rating: Optional[float] = Query(None, ge=1.0, le=5.0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Module 22: Retrieve employee performance review history and goals"""
    query = db.query(PerformanceReview).options(
        joinedload(PerformanceReview.employee).joinedload(Employee.department),
        joinedload(PerformanceReview.reviewer)
    )

    # RBAC: Regular employee can only view their own reviews
    if current_user.role == UserRole.EMPLOYEE:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if emp:
            query = query.filter(PerformanceReview.employee_id == emp.id)
        else:
            return []
    elif employee_id:
        query = query.filter(PerformanceReview.employee_id == employee_id)

    if cycle:
        query = query.filter(PerformanceReview.review_cycle.ilike(f"%{cycle}%"))
    if min_rating is not None:
        query = query.filter(PerformanceReview.rating >= min_rating)
    if max_rating is not None:
        query = query.filter(PerformanceReview.rating <= max_rating)

    reviews = query.order_by(PerformanceReview.reviewed_at.desc(), PerformanceReview.id.desc()).all()
    return [format_review_response(r) for r in reviews]

@router.get("/employee/{emp_id}", response_model=List[PerformanceReviewResponse])
def get_employee_review_history(
    emp_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Module 22: Historical review timeline for an employee"""
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    # RBAC check
    if current_user.role == UserRole.EMPLOYEE:
        if emp.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied. Cannot view other employees' reviews.")

    reviews = db.query(PerformanceReview).options(
        joinedload(PerformanceReview.employee).joinedload(Employee.department),
        joinedload(PerformanceReview.reviewer)
    ).filter(PerformanceReview.employee_id == emp_id).order_by(PerformanceReview.reviewed_at.desc()).all()

    return [format_review_response(r) for r in reviews]

@router.get("/stats", response_model=PerformanceStatsResponse)
def get_performance_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR, UserRole.MANAGER]))
):
    """Module 22: Performance review analytics and rating distributions"""
    reviews = db.query(PerformanceReview).options(
        joinedload(PerformanceReview.employee).joinedload(Employee.department)
    ).all()

    if not reviews:
        return PerformanceStatsResponse(
            total_reviews=0,
            average_rating=0.0,
            high_performers_count=0,
            needs_improvement_count=0,
            rating_distribution={"5_star": 0, "4_star": 0, "3_star": 0, "2_star": 0, "1_star": 0},
            top_performers=[]
        )

    ratings = [r.rating for r in reviews]
    avg_rating = round(sum(ratings) / len(ratings), 2)
    high_perf = sum(1 for r in ratings if r >= 4.0)
    needs_imp = sum(1 for r in ratings if r < 3.0)

    dist = {
        "5_star": sum(1 for r in ratings if r >= 4.5),
        "4_star": sum(1 for r in ratings if 3.5 <= r < 4.5),
        "3_star": sum(1 for r in ratings if 2.5 <= r < 3.5),
        "2_star": sum(1 for r in ratings if 1.5 <= r < 2.5),
        "1_star": sum(1 for r in ratings if r < 1.5)
    }

    # Top performers list (sorted by rating descending)
    top_list = []
    sorted_reviews = sorted(reviews, key=lambda x: x.rating, reverse=True)[:5]
    for r in sorted_reviews:
        top_list.append({
            "employee_id": r.employee_id,
            "employee_name": f"{r.employee.first_name} {r.employee.last_name}" if r.employee else "Employee",
            "department": r.employee.department.name if (r.employee and r.employee.department) else "N/A",
            "rating": r.rating,
            "cycle": r.review_cycle
        })

    return PerformanceStatsResponse(
        total_reviews=len(reviews),
        average_rating=avg_rating,
        high_performers_count=high_perf,
        needs_improvement_count=needs_imp,
        rating_distribution=dist,
        top_performers=top_list
    )

@router.post("/reviews", response_model=PerformanceReviewResponse, status_code=status.HTTP_201_CREATED)
def create_performance_review(
    payload: PerformanceReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR, UserRole.MANAGER]))
):
    """Module 22: Submit a formal performance evaluation with ratings and goal tracking"""
    emp = db.query(Employee).filter(Employee.id == payload.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    new_review = PerformanceReview(
        employee_id=payload.employee_id,
        reviewer_id=current_user.id,
        review_cycle=payload.review_cycle,
        rating=payload.rating,
        goals_json=payload.goals_json,
        achievements=payload.achievements,
        improvement_areas=payload.improvement_areas,
        feedback=payload.feedback,
        status=payload.status or "Completed",
        reviewed_at=datetime.utcnow()
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    log_audit_event(
        db=db,
        user_id=current_user.id,
        user_name=current_user.full_name,
        action="CREATE_PERFORMANCE_REVIEW",
        module="PERFORMANCE_EVALUATION",
        details=f"Created {new_review.review_cycle} evaluation for {emp.first_name} {emp.last_name} (Rating: {new_review.rating}/5.0)"
    )

    loaded = db.query(PerformanceReview).options(
        joinedload(PerformanceReview.employee).joinedload(Employee.department),
        joinedload(PerformanceReview.reviewer)
    ).filter(PerformanceReview.id == new_review.id).first()

    return format_review_response(loaded)

@router.put("/reviews/{review_id}", response_model=PerformanceReviewResponse)
def update_performance_review(
    review_id: int,
    payload: PerformanceReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR, UserRole.MANAGER]))
):
    """Module 22: Update review details, goals, or rating"""
    review = db.query(PerformanceReview).options(
        joinedload(PerformanceReview.employee).joinedload(Employee.department),
        joinedload(PerformanceReview.reviewer)
    ).filter(PerformanceReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Performance review not found")

    if payload.review_cycle is not None:
        review.review_cycle = payload.review_cycle
    if payload.rating is not None:
        review.rating = payload.rating
    if payload.goals_json is not None:
        review.goals_json = payload.goals_json
    if payload.achievements is not None:
        review.achievements = payload.achievements
    if payload.improvement_areas is not None:
        review.improvement_areas = payload.improvement_areas
    if payload.feedback is not None:
        review.feedback = payload.feedback
    if payload.status is not None:
        review.status = payload.status

    db.commit()
    db.refresh(review)

    log_audit_event(
        db=db,
        user_id=current_user.id,
        user_name=current_user.full_name,
        action="UPDATE_PERFORMANCE_REVIEW",
        module="PERFORMANCE_EVALUATION",
        details=f"Updated performance review ID {review.id} for employee ID {review.employee_id}"
    )

    return format_review_response(review)

@router.delete("/reviews/{review_id}")
def delete_performance_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR]))
):
    """Module 22: Remove performance review record"""
    review = db.query(PerformanceReview).filter(PerformanceReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Performance review not found")

    db.delete(review)
    db.commit()

    log_audit_event(
        db=db,
        user_id=current_user.id,
        user_name=current_user.full_name,
        action="DELETE_PERFORMANCE_REVIEW",
        module="PERFORMANCE_EVALUATION",
        details=f"Deleted performance review ID {review_id}"
    )

    return {"message": "Performance review successfully deleted", "review_id": review_id}
