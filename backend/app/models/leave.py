from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Leave(Base):
    __tablename__ = "leaves"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    
    leave_type = Column(String(50), default="Casual") # Casual, Sick, Annual, Maternity, Unpaid
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    days_count = Column(Integer, default=1)
    reason = Column(Text, nullable=False)
    
    status = Column(String(50), default="Pending") # Pending, Approved, Rejected
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    review_comments = Column(Text, nullable=True)
    
    applied_on = Column(DateTime, default=datetime.utcnow)
    reviewed_on = Column(DateTime, nullable=True)

    employee = relationship("Employee", back_populates="leaves")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
