from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.base import ORMBaseModel

class ChatMessageCreate(BaseModel):
    receiver_id: int
    message: str

class ChatMessageResponse(ORMBaseModel):
    id: int
    sender_id: int
    sender_name: Optional[str] = None
    receiver_id: int
    receiver_name: Optional[str] = None
    message: str
    is_read: bool
    created_at: datetime

class ChatUserSummary(BaseModel):
    user_id: int
    full_name: str
    email: str
    role: str
    unread_count: int = 0
