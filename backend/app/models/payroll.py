from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Payroll(Base):
    __tablename__ = "payrolls"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    
    month = Column(Integer, nullable=False) # 1 - 12
    year = Column(Integer, nullable=False)  # 2026
    
    basic_salary = Column(Float, default=0.0)
    hra = Column(Float, default=0.0)
    allowances = Column(Float, default=0.0)
    bonus = Column(Float, default=0.0)
    
    tax_deduction = Column(Float, default=0.0)
    provident_fund = Column(Float, default=0.0)
    other_deductions = Column(Float, default=0.0)
    
    gross_salary = Column(Float, default=0.0)
    net_salary = Column(Float, default=0.0)
    
    status = Column(String(50), default="Processed") # Draft, Processed, Paid
    payment_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="payrolls")
