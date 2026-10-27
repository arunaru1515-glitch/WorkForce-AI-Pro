from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DocumentResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    title: str
    document_type: str
    file_path: str
    file_size_kb: int
    mime_type: str
    uploaded_at: datetime

    class Config:
        from_attributes = True
