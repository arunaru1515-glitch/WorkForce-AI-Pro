import os
import shutil
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.dataset import Dataset
from app.models.user import User, UserRole
from app.schemas.dataset import DatasetResponse, DatasetPreviewResponse
from app.core.deps import get_current_user, require_roles

router = APIRouter(prefix="/datasets", tags=["5. AI Attrition Intelligence"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "datasets")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/", response_model=List[DatasetResponse])
def get_datasets(db: Session = Depends(get_db), current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR]))):
    """Module 11 & Module 26: List all uploaded datasets (Restricted to ADMIN, HR)"""
    return db.query(Dataset).order_by(Dataset.id.desc()).all()

@router.post("/upload", response_model=DatasetResponse, status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    file: UploadFile = File(...),
    name: str = Form(...),
    version: str = Form("v1.0"),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR]))
):
    """Module 11 & Module 26: Upload and validate HR Attrition dataset (Restricted to ADMIN, HR)"""

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".csv", ".xlsx", ".xls"]:
        raise HTTPException(status_code=400, detail="Only CSV and Excel (.xlsx, .xls) files are supported.")

    timestamp = int(datetime.utcnow().timestamp())
    saved_filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, saved_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Validate and parse rows/columns with pandas
    try:
        if ext == ".csv":
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=f"Corrupt or invalid dataset format: {str(e)}")

    row_count = int(len(df))
    col_count = int(len(df.columns))

    if row_count < 10:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail="Dataset must contain at least 10 rows for statistical analysis.")

    new_dataset = Dataset(
        name=name,
        filename=saved_filename,
        file_path=file_path,
        row_count=row_count,
        column_count=col_count,
        version=version,
        description=description,
        uploaded_by=current_user.id,
        status="Ready"
    )
    db.add(new_dataset)
    db.commit()
    db.refresh(new_dataset)

    return new_dataset

@router.get("/{dataset_id}/preview", response_model=DatasetPreviewResponse)
def get_dataset_preview(dataset_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Module 11: Statistical distribution preview & sample rows"""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    file_path = dataset.file_path
    if not os.path.exists(file_path):
        fallback = os.path.join(UPLOAD_DIR, dataset.filename)
        if os.path.exists(fallback):
            file_path = fallback
            dataset.file_path = fallback
            db.commit()
        else:
            raise HTTPException(status_code=404, detail="Dataset file not found.")

    ext = os.path.splitext(file_path)[1].lower()
    df = pd.read_csv(file_path) if ext == ".csv" else pd.read_excel(file_path)

    # Top sample records (sanitized for JSON)
    sample_rows = df.head(15).fillna("N/A").to_dict(orient="records")
    columns = df.columns.tolist()

    # Attrition breakdown
    attrition_dist = {}
    if "Attrition" in df.columns:
        counts = df["Attrition"].value_counts().to_dict()
        attrition_dist = {str(k): int(v) for k, v in counts.items()}

    # Summary statistics for numeric features
    numeric_summary = {}
    num_df = df.select_dtypes(include=["number"])
    for col in num_df.columns[:8]:  # Key numeric features
        numeric_summary[col] = {
            "mean": round(float(num_df[col].mean()), 2),
            "min": round(float(num_df[col].min()), 2),
            "max": round(float(num_df[col].max()), 2)
        }

    # Duplicate Record Validation & Failed Record Reporting (Module 11)
    duplicate_count = int(df.duplicated().sum())
    missing_cells = int(df.isnull().sum().sum())
    failed_rows = int(df.isnull().any(axis=1).sum())
    validation_summary = {
        "status": "PASSED" if (duplicate_count == 0 and failed_rows == 0) else "PASSED_WITH_WARNINGS",
        "duplicate_records": duplicate_count,
        "failed_or_incomplete_rows": failed_rows,
        "total_missing_values": missing_cells,
        "clean_records": len(df) - duplicate_count - failed_rows,
        "data_integrity_score": f"{round(((len(df) - duplicate_count - failed_rows) / max(1, len(df))) * 100, 1)}%"
    }

    return DatasetPreviewResponse(
        dataset_id=dataset.id,
        filename=dataset.filename,
        total_rows=len(df),
        total_columns=len(columns),
        duplicate_records_count=duplicate_count,
        failed_records_count=failed_rows,
        validation_summary=validation_summary,
        columns=columns,
        sample_rows=sample_rows,
        attrition_distribution=attrition_dist,
        numeric_summary=numeric_summary
    )

@router.delete("/{dataset_id}", response_model=dict)
def delete_dataset(dataset_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Module 11: Delete a dataset version"""
    if current_user.role not in ["ADMIN", "HR"]:
        raise HTTPException(status_code=403, detail="Only Admins and HR Leads can delete datasets.")

    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    if os.path.exists(dataset.file_path):
        try:
            os.remove(dataset.file_path)
        except Exception:
            pass

    db.delete(dataset)
    db.commit()
    return {"message": "Dataset version removed successfully"}
