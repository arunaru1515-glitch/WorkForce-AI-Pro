from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.base import ORMBaseModel

class DocumentResponse(ORMBaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    title: str
    document_type: str
    file_path: str
    file_size_kb: int
    mime_type: str
    uploaded_at: datetime
