from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Intervention(Base):
    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    action_title = Column(String(255), nullable=False)
    strategy_type = Column(String(100), default="Compensation")  # Compensation, Workload, Promotion, Mentorship, Culture
    description = Column(Text, nullable=False)
    priority = Column(String(50), default="HIGH")  # LOW, MEDIUM, HIGH, URGENT
    status = Column(String(50), default="Initiated")  # Initiated, In-Progress, Resolved, Cancelled
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    expected_impact = Column(String(255), nullable=True)
    outcome_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    employee = relationship("Employee")
    assignee = relationship("User")
