"""
Unified Schemas Module for WorkForce AI Pro.
Exports all core Pydantic request & response models for clean, simplified imports across routers and services.
"""

from app.schemas.base import ORMBaseModel

# Auth
from app.schemas.auth import (
    UserBase, UserCreate, UserLogin, UserResponse,
    Token, RefreshTokenRequest, ForgotPasswordRequest,
    ResetPasswordRequest, MessageResponse
)

# Department
from app.schemas.department import (
    DepartmentBase, DepartmentCreate, DepartmentUpdate, DepartmentResponse
)

# Employee
from app.schemas.employee import (
    EmployeeBase, EmployeeCreate, EmployeeUpdate, EmployeeResponse
)

# Attendance
from app.schemas.attendance import (
    AttendanceCheckIn, AttendanceCheckOut, AttendanceCreate, AttendanceResponse
)

# Leave
from app.schemas.leave import (
    LeaveApply, LeaveReview, LeaveResponse, LeaveBalanceResponse
)

# Payroll
from app.schemas.payroll import (
    PayrollGenerate, PayrollResponse
)

# Notification
from app.schemas.notification import (
    NotificationCreate, NotificationResponse
)

# Chat
from app.schemas.chat import (
    ChatMessageCreate, ChatMessageResponse, ChatUserSummary
)

# Document
from app.schemas.document import (
    DocumentResponse
)

# Dataset
from app.schemas.dataset import (
    DatasetBase, DatasetResponse, DatasetPreviewResponse
)

# AI & Attrition
from app.schemas.ai import (
    PredictRequest, FlightFactor, Recommendation,
    PredictionResponse, RiskAssessmentResponse, ModelInfoResponse
)

# Intervention
from app.schemas.intervention import (
    InterventionCreate, InterventionUpdate, InterventionResponse
)

# Audit
from app.schemas.audit import (
    AuditLogResponse, AuditStatsResponse
)

# Task
from app.schemas.task import (
    TaskBase, TaskCreate, TaskUpdate, TaskStatusUpdate,
    TaskResponse, TaskStatsResponse
)

# Performance
from app.schemas.performance import (
    GoalItem, PerformanceReviewBase, PerformanceReviewCreate,
    PerformanceReviewUpdate, PerformanceReviewResponse, PerformanceStatsResponse
)

# Reports
from app.schemas.reports import (
    ReportsSummaryResponse, EmployeeReportItem,
    AttritionReportItem, PayrollReportItem, AttendanceReportItem
)

# Search
from app.schemas.search import (
    SearchFilterParams, SearchResultItem, GlobalSearchResponse
)

# Analytics
from app.schemas.analytics import (
    DepartmentStats, AttendanceSummary, PayrollOverview, DashboardOverview
)
