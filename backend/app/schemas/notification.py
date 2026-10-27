from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.base import ORMBaseModel

class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str
    type: Optional[str] = "INFO"

class NotificationResponse(ORMBaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime
