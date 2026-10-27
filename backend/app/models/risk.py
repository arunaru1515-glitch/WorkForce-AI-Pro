from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    risk_score = Column(Float, nullable=False)  # 0.0 to 100.0%
    risk_level = Column(String(50), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    confidence = Column(Float, default=0.88)
    primary_driver = Column(String(255), nullable=True)
    contributing_factors = Column(Text, nullable=True)  # JSON serialized list of factors
    trigger_event = Column(String(100), default="Manual Evaluation")
    assessed_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationship
    employee = relationship("Employee")
