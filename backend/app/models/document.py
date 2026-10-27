from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    
    title = Column(String(200), nullable=False)
    document_type = Column(String(50), default="Contract") # Contract, ID_Proof, Resume, Certificate, Appraisal
    file_path = Column(String(500), nullable=False)
    file_size_kb = Column(Integer, default=0)
    mime_type = Column(String(100), default="application/pdf")
    
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="documents")
