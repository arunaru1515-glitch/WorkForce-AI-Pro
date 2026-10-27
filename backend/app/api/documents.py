import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.document import Document
from app.models.employee import Employee
from app.schemas.document import DocumentResponse
from app.core.deps import get_current_user

router = APIRouter(prefix="/documents", tags=["7. Chat & Documents"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".png", ".jpg", ".jpeg", ".xlsx"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

def format_doc_response(d: Document) -> DocumentResponse:
    emp_name = f"{d.employee.first_name} {d.employee.last_name}" if d.employee else "Unknown"
    return DocumentResponse(
        id=d.id,
        employee_id=d.employee_id,
        employee_name=emp_name,
        title=d.title,
        document_type=d.document_type,
        file_path=d.file_path,
        file_size_kb=d.file_size_kb,
        mime_type=d.mime_type,
        uploaded_at=d.uploaded_at
    )

@router.get("/", response_model=List[DocumentResponse])
def get_documents(employee_id: Optional[int] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Module 9: List employee documents"""
    query = db.query(Document)
    if employee_id:
        query = query.filter(Document.employee_id == employee_id)
    docs = query.order_by(Document.id.desc()).all()
    return [format_doc_response(d) for d in docs]

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    employee_id: int = Form(...),
    title: str = Form(...),
    document_type: str = Form("Contract"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Module 9: Upload and validate employee document"""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format '{ext}'. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )
        
    safe_filename = f"emp_{employee_id}_{int(os.times().elapsed)}_{file.filename.replace(' ', '_')}"
    file_location = os.path.join(UPLOAD_DIR, safe_filename)
    
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    size_kb = int(os.path.getsize(file_location) / 1024)
    if size_kb > (MAX_FILE_SIZE / 1024):
        os.remove(file_location)
        raise HTTPException(status_code=400, detail="File exceeds maximum allowed size (10 MB)")
        
    doc = Document(
        employee_id=employee_id,
        title=title,
        document_type=document_type,
        file_path=file_location,
        file_size_kb=size_kb,
        mime_type=file.content_type or "application/octet-stream"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return format_doc_response(doc)

@router.get("/download/{document_id}")
def download_document(document_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Module 9: Download validated document file"""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document file not found on server")
        
    return FileResponse(
        path=doc.file_path,
        media_type=doc.mime_type,
        filename=os.path.basename(doc.file_path)
    )

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Module 9: Delete employee document"""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass
            
    db.delete(doc)
    db.commit()
    return None
