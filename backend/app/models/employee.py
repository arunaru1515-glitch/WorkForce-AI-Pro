from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from app.database import Base

class EmploymentType(str, enum.Enum):
    FULL_TIME = "Full-Time"
    PART_TIME = "Part-Time"
    CONTRACT = "Contract"
    INTERN = "Intern"

class EmployeeStatus(str, enum.Enum):
    ACTIVE = "Active"
    ON_LEAVE = "On-Leave"
    RESIGNED = "Resigned"
    TERMINATED = "Terminated"

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    employee_code = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    job_title = Column(String(100), nullable=False)
    hire_date = Column(DateTime, default=datetime.utcnow)
    employment_type = Column(String(50), default=EmploymentType.FULL_TIME.value)
    salary = Column(Float, default=50000.0)
    status = Column(String(50), default=EmployeeStatus.ACTIVE.value)
    
    emergency_contact = Column(String(255), nullable=True)
    address = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    department = relationship("Department", back_populates="employees")
    user = relationship("User", foreign_keys=[user_id])
    attendances = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")
    leaves = relationship("Leave", back_populates="employee", cascade="all, delete-orphan")
    payrolls = relationship("Payroll", back_populates="employee", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="employee", cascade="all, delete-orphan")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
