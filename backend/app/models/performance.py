from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class PerformanceReview(Base):
    __tablename__ = "performance_reviews"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    review_cycle = Column(String(100), default="Annual Review 2026")
    rating = Column(Float, nullable=False, default=4.0)  # 1.0 to 5.0
    goals_json = Column(Text, nullable=True)  # JSON goals with progress
    achievements = Column(Text, nullable=True)
    improvement_areas = Column(Text, nullable=True)
    feedback = Column(Text, nullable=True)
    status = Column(String(50), default="Completed")  # Draft, Submitted, Completed
    reviewed_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee")
    reviewer = relationship("User")
