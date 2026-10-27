from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any

class DatasetBase(BaseModel):
    name: str
    description: Optional[str] = None
    version: Optional[str] = "v1.0"

class DatasetResponse(DatasetBase):
    id: int
    filename: str
    file_path: str
    row_count: int
    column_count: int
    status: str
    uploaded_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DatasetPreviewResponse(BaseModel):
    dataset_id: int
    filename: str
    total_rows: int
    total_columns: int
    duplicate_records_count: int = 0
    failed_records_count: int = 0
    validation_summary: Dict[str, Any] = {}
    columns: List[str]
    sample_rows: List[Dict[str, Any]]
    attrition_distribution: Dict[str, int]
    numeric_summary: Dict[str, Dict[str, float]]
