from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, List, Any
from app.schemas.base import ORMBaseModel

class AuditLogResponse(ORMBaseModel):
    id: int
    user_id: Optional[int] = None
    user_name: str
    action: str
    module: str
    details: Optional[str] = None
    ip_address: str
    created_at: datetime

class AuditStatsResponse(BaseModel):
    total_logs: int
    today_count: int
    active_users_count: int
    module_breakdown: Dict[str, int]
    recent_security_events: List[Dict[str, Any]]
