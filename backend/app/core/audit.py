from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from typing import Optional
import logging

logger = logging.getLogger("workforce_ai.audit")

def log_audit_event(
    db: Session,
    user_id: Optional[int] = None,
    user_name: str = "System",
    action: str = "UNKNOWN",
    module: str = "SYSTEM",
    details: Optional[str] = None,
    ip_address: str = "127.0.0.1"
) -> Optional[AuditLog]:
    """Helper to record audit log events across the application (Module 20)"""
    try:
        log_entry = AuditLog(
            user_id=user_id,
            user_name=user_name,
            action=action,
            module=module,
            details=details,
            ip_address=ip_address
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry
    except Exception as e:
        logger.error(f"Failed to record audit log: {e}")
        try:
            db.rollback()
        except Exception:
            pass
        return None
