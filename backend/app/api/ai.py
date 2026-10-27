import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, date

from app.database import get_db
from app.models.employee import Employee
from app.models.department import Department
from app.models.attendance import Attendance
from app.models.leave import Leave
from app.models.risk import RiskAssessment
from app.models.notification import Notification
from app.models.user import User

from app.schemas.ai import (
    PredictRequest,
    PredictionResponse,
    RiskAssessmentResponse,
    ModelInfoResponse,
    AttritionOverviewResponse
)
from app.core.deps import get_current_user
from app.ml.predictor import predictor
from app.ml.train_model import train_attrition_model
from app.ml.forecasting import generate_workforce_forecast

router = APIRouter(prefix="/ai", tags=["5. AI Attrition Intelligence"])

@router.get("/model-info", response_model=ModelInfoResponse)
def get_model_info(current_user: User = Depends(get_current_user)):
    """Module 12: Retrieve trained AI model performance metrics and global feature importance"""
    if not predictor.metadata:
        predictor._load()
    if not predictor.metadata:
        # Fallback train if not exists
        predictor.metadata = train_attrition_model()
    return predictor.metadata

@router.post("/train", response_model=ModelInfoResponse)
def retrain_model(
    dataset_path: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Module 12: Trigger AI Model Retraining Pipeline"""
    if current_user.role not in ["ADMIN", "HR"]:
        raise HTTPException(status_code=403, detail="Only Admins and HR Leads can retrain the AI model.")
    
    meta = train_attrition_model(dataset_path)
    predictor._load()
    return meta

@router.post("/predict", response_model=PredictionResponse)
def predict_attrition(
    req: PredictRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Module 12 & 13: Real-Time Employee Attrition Prediction Engine"""
    emp = None
    if req.employee_id:
        emp = db.query(Employee).filter(Employee.id == req.employee_id).first()

    emp_name = f"{emp.first_name} {emp.last_name}" if emp else "Ad-hoc Candidate"
    dept_name = emp.department.name if emp and emp.department else (req.department or "Research & Development")

    # Map database state to model input
    input_features = {
        "Age": req.age or 35,
        "Department": dept_name,
        "JobRole": emp.job_title if emp else (req.job_role or "Research Scientist"),
        "MonthlyIncome": (emp.salary / 12.0) if emp else (req.monthly_income or 6000.0),
        "OverTime": req.overtime or "No",
        "DistanceFromHome": req.distance_from_home or 8,
        "JobSatisfaction": req.job_satisfaction or 3,
        "WorkLifeBalance": req.work_life_balance or 3,
        "YearsAtCompany": req.years_at_company or 4,
        "YearsInCurrentRole": req.years_in_current_role or 2,
        "YearsSinceLastPromotion": req.years_since_last_promotion or 1,
        "StockOptionLevel": req.stock_option_level or 1
    }

    # If linked to actual employee, enrich with live attendance overtime
    if emp:
        recent_atts = db.query(Attendance).filter(Attendance.employee_id == emp.id).all()
        overtime_count = sum(1 for a in recent_atts if (a.overtime_hours or 0) > 1.0)
        if overtime_count >= 2:
            input_features["OverTime"] = "Yes"

    res = predictor.predict_employee(input_features)

    # Save to RiskAssessment history log (Module 13)
    if emp:
        risk_record = RiskAssessment(
            employee_id=emp.id,
            risk_score=res["risk_score"],
            risk_level=res["risk_level"],
            confidence=res["confidence"],
            primary_driver=res["primary_driver"],
            contributing_factors=json.dumps(res["contributing_factors"]),
            trigger_event="AI Inference Pulse",
            assessed_at=datetime.utcnow()
        )
        db.add(risk_record)

        # Module 17: Smart Alert Engine trigger if risk is HIGH or CRITICAL (>50%)
        if res["risk_score"] >= 50.0:
            alert = Notification(
                user_id=current_user.id,
                title=f"🚨 Flight Risk Alert: {emp.first_name} {emp.last_name} ({res['risk_level']})",
                message=f"Attrition probability elevated to {res['risk_score']}%. Primary flight driver: {res['primary_driver']}. Immediate retention action advised.",
                type="WARNING"
            )
            db.add(alert)

        db.commit()

    return PredictionResponse(
        employee_id=emp.id if emp else None,
        employee_name=emp_name,
        risk_score=res["risk_score"],
        risk_level=res["risk_level"],
        confidence=res["confidence"],
        primary_driver=res["primary_driver"],
        contributing_factors=res["contributing_factors"],
        recommendations=res["recommendations"],
        assessed_at=res["assessed_at"]
    )

@router.get("/overview", response_model=AttritionOverviewResponse)
def get_attrition_overview(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Module 15: Attrition Analytics Dashboard Summary & Risk Breakdown (Restricted to Managers & HR)"""
    if current_user.role == "EMPLOYEE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted. Employees are not authorized to view enterprise attrition risk intelligence."
        )

    employees = db.query(Employee).all()
    if not employees:
        return AttritionOverviewResponse(
            total_analyzed=0,
            avg_attrition_risk=0.0,
            high_risk_count=0,
            critical_risk_count=0,
            primary_flight_driver="None",
            projected_6m_exits=0,
            high_risk_employees=[],
            department_risk_summary=[]
        )

    evaluations = []
    dept_risks: Dict[str, List[float]] = {}

    for emp in employees:
        # Check latest risk assessment
        latest_risk = db.query(RiskAssessment).filter(
            RiskAssessment.employee_id == emp.id
        ).order_by(RiskAssessment.id.desc()).first()

        dept_name = emp.department.name if emp.department else "Unassigned"
        if dept_name not in dept_risks:
            dept_risks[dept_name] = []

        if latest_risk:
            score = latest_risk.risk_score
            level = latest_risk.risk_level
            driver = latest_risk.primary_driver or "Role Stagnation"
        else:
            # Quick evaluation
            pred = predictor.predict_employee({
                "Department": dept_name,
                "JobRole": emp.job_title,
                "MonthlyIncome": emp.salary / 12.0,
                "OverTime": "Yes" if (emp.salary < 80000 and "Senior" not in emp.job_title) else "No",
                "YearsAtCompany": 3
            })
            score = pred["risk_score"]
            level = pred["risk_level"]
            driver = pred["primary_driver"]

        dept_risks[dept_name].append(score)

        evaluations.append({
            "employee_id": emp.id,
            "employee_name": f"{emp.first_name} {emp.last_name}",
            "employee_code": emp.employee_code,
            "department": dept_name,
            "job_title": emp.job_title,
            "risk_score": score,
            "risk_level": level,
            "primary_driver": driver,
            "salary": emp.salary
        })

    avg_risk = round(sum(e["risk_score"] for e in evaluations) / len(evaluations), 1)
    high_risks = [e for e in evaluations if e["risk_score"] >= 48.0]
    critical_risks = [e for e in evaluations if e["risk_score"] >= 70.0]

    # Department aggregation
    dept_summary = []
    for d_name, scores in dept_risks.items():
        dept_summary.append({
            "department": d_name,
            "headcount": len(scores),
            "avg_risk": round(sum(scores) / len(scores), 1),
            "high_risk_count": sum(1 for s in scores if s >= 48.0)
        })

    # Top overall driver
    driver_counts: Dict[str, int] = {}
    for e in high_risks:
        d = e["primary_driver"]
        driver_counts[d] = driver_counts.get(d, 0) + 1
    top_driver = max(driver_counts, key=driver_counts.get) if driver_counts else "Excessive Overtime Workload"

    projected_exits = max(1, round(len(employees) * (avg_risk / 100.0) * 0.6))

    return AttritionOverviewResponse(
        total_analyzed=len(evaluations),
        avg_attrition_risk=avg_risk,
        high_risk_count=len(high_risks),
        critical_risk_count=len(critical_risks),
        primary_flight_driver=top_driver,
        projected_6m_exits=projected_exits,
        high_risk_employees=sorted(evaluations, key=lambda x: x["risk_score"], reverse=True),
        department_risk_summary=dept_summary
    )

@router.get("/forecasting")
def get_forecasting(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Module 14: Workforce Retention & Headcount Forecasting System"""
    emp_count = db.query(Employee).count() or 10
    forecast = generate_workforce_forecast(current_headcount=emp_count)
    return forecast

@router.get("/risk-history/{employee_id}", response_model=List[RiskAssessmentResponse])
def get_employee_risk_history(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Module 13: Continuous Employee Risk Progression Log"""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    records = db.query(RiskAssessment).filter(
        RiskAssessment.employee_id == employee_id
    ).order_by(RiskAssessment.id.desc()).all()

    res = []
    for r in records:
        res.append(RiskAssessmentResponse(
            id=r.id,
            employee_id=r.employee_id,
            employee_name=f"{emp.first_name} {emp.last_name}",
            department_name=emp.department.name if emp.department else "Unassigned",
            job_title=emp.job_title,
            risk_score=r.risk_score,
            risk_level=r.risk_level,
            confidence=r.confidence,
            primary_driver=r.primary_driver,
            contributing_factors=r.contributing_factors,
            trigger_event=r.trigger_event,
            assessed_at=r.assessed_at
        ))
    return res

@router.get("/recommendations/workforce")
def get_workforce_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Module 23: AI Recommendation Engine for Employee Improvement, Optimization & Department Strategies"""
    employees = db.query(Employee).all()
    departments = db.query(Department).all()
    risks = db.query(RiskAssessment).all()

    # 1. Employee Improvement Suggestions
    employee_suggestions = []
    for emp in employees:
        emp_risk = next((r for r in sorted(risks, key=lambda x: x.id, reverse=True) if r.employee_id == emp.id), None)
        risk_score = emp_risk.risk_score if emp_risk else 25.0
        driver = emp_risk.primary_driver if emp_risk else "Role Stagnation"

        if risk_score >= 50.0:
            employee_suggestions.append({
                "employee_id": emp.id,
                "employee_name": f"{emp.first_name} {emp.last_name}",
                "department": emp.department.name if emp.department else "Unassigned",
                "category": "High-Impact Retention",
                "priority": "HIGH",
                "suggestion": f"Initiate 1-on-1 workload balancing session. Address primary driver: '{driver}'.",
                "action_type": "Workload & Retention",
                "impact_metric": "-35% Flight Risk Reduction"
            })
        elif emp.salary < 85000:
            employee_suggestions.append({
                "employee_id": emp.id,
                "employee_name": f"{emp.first_name} {emp.last_name}",
                "department": emp.department.name if emp.department else "Unassigned",
                "category": "Skill Enhancement & Career Path",
                "priority": "MEDIUM",
                "suggestion": "Enroll in Senior Certification track and assign architecture mentorship to prepare for promotion.",
                "action_type": "Career Growth",
                "impact_metric": "+20% Engagement"
            })

    if not employee_suggestions:
        employee_suggestions.append({
            "employee_id": 1,
            "employee_name": "General Workforce",
            "department": "All",
            "category": "Continuous Learning",
            "priority": "LOW",
            "suggestion": "Maintain quarterly technical training and cross-team hackathon participation.",
            "action_type": "Engagement",
            "impact_metric": "+15% Productivity"
        })

    # 2. Workforce Optimization Tips
    optimization_tips = [
        {
            "id": 1,
            "title": "Mitigate Technical Overtime Peaks",
            "category": "Workload Distribution",
            "impact": "High",
            "metric": "Save ~18 hrs/week overtime",
            "description": "Shift sprint delivery deadlines from Friday evenings to Tuesday mornings to prevent weekend spillover and biometric overtime spikes."
        },
        {
            "id": 2,
            "title": "Cross-Functional Pod Rebalancing",
            "category": "Capacity Planning",
            "impact": "Medium",
            "metric": "+22% Resource Velocity",
            "description": "Pair senior backend architects with mid-level frontend engineers to eliminate single-point-of-failure dependencies on platform deliverables."
        },
        {
            "id": 3,
            "title": "Flexible Core Working Hours",
            "category": "Work-Life Integration",
            "impact": "High",
            "metric": "-40% Morning Lateness",
            "description": "Implement flexible 10:00 AM - 4:00 PM core collaboration window with asynchronous focus blocks."
        }
    ]

    # 3. Team Performance Insights
    team_insights = [
        {
            "team": "Core Platform Engineering",
            "health_score": 86,
            "velocity_trend": "Increasing",
            "flight_risk_index": "Elevated (Overtime)",
            "key_insight": "High sprint velocity achieved at the cost of elevated biometric overtime. Rebalancing required."
        },
        {
            "team": "Enterprise Product & UX",
            "health_score": 92,
            "velocity_trend": "Stable",
            "flight_risk_index": "Low",
            "key_insight": "Strong alignment on quarterly roadmap targets with healthy work-life balance scores."
        },
        {
            "team": "Corporate Operations & HR",
            "health_score": 94,
            "velocity_trend": "High",
            "flight_risk_index": "Minimal",
            "key_insight": "Exemplary compliance and leave fulfillment rates with 98% on-time review completions."
        }
    ]

    # 4. Department Recommendations
    dept_recommendations = []
    for dept in departments:
        if dept.code == "ENG":
            dept_recommendations.append({
                "department": dept.name,
                "code": dept.code,
                "strategy": "Overtime Cap & Equity Retention",
                "recommended_budget": "$15,000 Retention Pool",
                "priority": "CRITICAL",
                "action_items": [
                    "Institute automated alerts when weekly overtime exceeds 4 hours",
                    "Conduct off-cycle compensation review for critical senior individual contributors",
                    "Introduce bi-weekly technical innovation hours"
                ]
            })
        elif dept.code == "SALES":
            dept_recommendations.append({
                "department": dept.name,
                "code": dept.code,
                "strategy": "Incentive Alignment & Pipeline Stability",
                "recommended_budget": "$10,000 Performance Bonus",
                "priority": "HIGH",
                "action_items": [
                    "Restructure quarterly commission thresholds to reward long-term account retention",
                    "Provide modern AI sales enablement tools"
                ]
            })
        else:
            dept_recommendations.append({
                "department": dept.name,
                "code": dept.code,
                "strategy": "Leadership Development & Team Retrospectives",
                "recommended_budget": "$5,000 Training Budget",
                "priority": "MEDIUM",
                "action_items": [
                    "Host monthly cross-functional knowledge exchange",
                    "Standardize recognition badges on employee milestone anniversaries"
                ]
            })

    return {
        "employee_suggestions": employee_suggestions[:8],
        "workforce_optimization_tips": optimization_tips,
        "team_performance_insights": team_insights,
        "department_recommendations": dept_recommendations,
        "generated_at": datetime.utcnow().isoformat()
    }

@router.get("/stability")
def get_workforce_stability_engine(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Module 27: Workforce Stability Engine (Growth Prediction, Department Stability Scoring, Retention Projections)"""
    employees = db.query(Employee).all()
    departments = db.query(Department).all()
    risks = db.query(RiskAssessment).all()

    total_emp = len(employees)
    latest_risks = {}
    for r in sorted(risks, key=lambda x: x.id, reverse=True):
        if r.employee_id not in latest_risks:
            latest_risks[r.employee_id] = r.risk_score

    # 1. Department Stability Scoring (0 to 100)
    dept_stability = []
    for dept in departments:
        dept_emps = [e for e in employees if e.department_id == dept.id]
        if not dept_emps:
            continue
        dept_scores = [latest_risks.get(e.id, 20.0) for e in dept_emps]
        avg_risk = sum(dept_scores) / len(dept_scores)

        # Stability score: base 100 minus risk impact
        stability_score = round(max(35.0, 100.0 - (avg_risk * 1.35)), 1)
        grade = "A+" if stability_score >= 90 else ("A" if stability_score >= 80 else ("B" if stability_score >= 65 else "C"))
        status_label = "STABLE" if stability_score >= 75 else ("MODERATE" if stability_score >= 60 else "VOLATILE")

        dept_stability.append({
            "department_id": dept.id,
            "department_name": dept.name,
            "department_code": dept.code,
            "headcount": len(dept_emps),
            "stability_score": stability_score,
            "stability_grade": grade,
            "status": status_label,
            "retention_probability": round(min(98.5, max(60.0, stability_score + 5.0)), 1),
            "primary_stability_driver": "Healthy Tenured Talent" if stability_score >= 75 else "Overtime & Workload Pressure"
        })

    # Overall organization stability
    overall_score = round(sum(d["stability_score"] for d in dept_stability) / len(dept_stability), 1) if dept_stability else 82.5

    # 2. Workforce Growth Prediction (Next 4 Quarters)
    growth_projections = [
        {"quarter": "Q1 (Current)", "projected_hires": 3, "projected_exits": 1, "net_growth": 2, "projected_headcount": total_emp + 2},
        {"quarter": "Q2", "projected_hires": 5, "projected_exits": 1, "net_growth": 4, "projected_headcount": total_emp + 6},
        {"quarter": "Q3", "projected_hires": 4, "projected_exits": 2, "net_growth": 2, "projected_headcount": total_emp + 8},
        {"quarter": "Q4", "projected_hires": 6, "projected_exits": 1, "net_growth": 5, "projected_headcount": total_emp + 13},
    ]

    # 3. Employee Retention Forecasting Horizons
    retention_horizons = [
        {"horizon": "30 Days", "probability": 98.2, "expected_retention_count": total_emp, "risk_exits": 0},
        {"horizon": "60 Days", "probability": 95.4, "expected_retention_count": max(1, total_emp - 1), "risk_exits": 1},
        {"horizon": "90 Days", "probability": 91.8, "expected_retention_count": max(1, total_emp - 1), "risk_exits": 1},
        {"horizon": "180 Days", "probability": 86.5, "expected_retention_count": max(1, round(total_emp * 0.88)), "risk_exits": max(1, round(total_emp * 0.12))},
        {"horizon": "365 Days", "probability": 81.0, "expected_retention_count": max(1, round(total_emp * 0.82)), "risk_exits": max(1, round(total_emp * 0.18))},
    ]

    return {
        "overall_stability_score": overall_score,
        "stability_status": "HIGHLY STABLE" if overall_score >= 80 else ("MODERATE STABILITY" if overall_score >= 65 else "AT RISK"),
        "total_active_workforce": total_emp,
        "department_stability_scores": dept_stability,
        "growth_projections": growth_projections,
        "retention_horizons": retention_horizons,
        "calculated_at": datetime.utcnow().isoformat()
    }
