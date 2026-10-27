from fastapi import APIRouter, Depends, Query, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date, timedelta

from app.database import get_db
from app.models.audit import AuditLog
from app.models.user import User, UserRole
from app.schemas.audit import AuditLogResponse, AuditStatsResponse
from app.core.deps import get_current_user, require_roles
from app.core.audit import log_audit_event

router = APIRouter(prefix="/audit", tags=["Audit Logs & Activity Tracking (Module 20)"])

@router.get("/logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    module: Optional[str] = Query(None, description="Filter by module (e.g. AUTH, EMPLOYEES, TASKS)"),
    action: Optional[str] = Query(None, description="Filter by action (e.g. LOGIN, CREATE, UPDATE, DELETE)"),
    search: Optional[str] = Query(None, description="Search by username or details"),
    limit: int = Query(50, ge=1, le=500),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR]))
):
    """Module 20: Retrieve chronological user and system activity logs with multi-field filtering"""
    query = db.query(AuditLog)

    if module:
        query = query.filter(AuditLog.module.ilike(f"%{module}%"))
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (AuditLog.user_name.ilike(search_fmt)) |
            (AuditLog.details.ilike(search_fmt)) |
            (AuditLog.action.ilike(search_fmt))
        )

    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs

@router.get("/stats", response_model=AuditStatsResponse)
def get_audit_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR]))
):
    """Module 20: System Audit Tracking & Action History Metrics"""
    total_logs = db.query(AuditLog).count()

    today_start = datetime.combine(date.today(), datetime.min.time())
    today_count = db.query(AuditLog).filter(AuditLog.created_at >= today_start).count()

    # Distinct active users in past 7 days
    past_7d = datetime.utcnow() - timedelta(days=7)
    distinct_users = db.query(AuditLog.user_id).filter(
        AuditLog.created_at >= past_7d,
        AuditLog.user_id.isnot(None)
    ).distinct().count()

    # Module breakdown
    all_logs = db.query(AuditLog.module).all()
    breakdown = {}
    for (mod,) in all_logs:
        mod_key = mod or "GENERAL"
        breakdown[mod_key] = breakdown.get(mod_key, 0) + 1

    # Recent security / critical events
    critical_logs = db.query(AuditLog).filter(
        AuditLog.action.in_(["LOGIN", "DELETE", "UPDATE_STATUS", "RBAC_VIOLATION", "TERMINATION"])
    ).order_by(AuditLog.created_at.desc()).limit(5).all()

    recent_security = [
        {
            "id": l.id,
            "action": l.action,
            "user_name": l.user_name,
            "module": l.module,
            "details": l.details,
            "timestamp": l.created_at.isoformat()
        }
        for l in critical_logs
    ]

    return AuditStatsResponse(
        total_logs=total_logs,
        today_count=today_count,
        active_users_count=max(1, distinct_users),
        module_breakdown=breakdown,
        recent_security_events=recent_security
    )

@router.post("/log")
def create_manual_audit_log(
    action: str,
    module: str,
    details: Optional[str] = None,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Module 20: Manually record an audit activity event from frontend user action"""
    client_ip = request.client.host if (request and request.client) else "127.0.0.1"
    entry = log_audit_event(
        db=db,
        user_id=current_user.id,
        user_name=current_user.full_name,
        action=action,
        module=module,
        details=details,
        ip_address=client_ip
    )
    if not entry:
        raise HTTPException(status_code=500, detail="Failed to record audit log")
    return {"message": "Audit log successfully registered", "log_id": entry.id}
