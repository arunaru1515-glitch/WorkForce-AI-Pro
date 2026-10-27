# WorkForce AI Pro – HR Attrition Prediction & Workforce Intelligence Platform

WorkForce AI Pro is an enterprise-grade full-stack HR intelligence platform. It integrates core human resource management with machine learning to predict employee attrition risk, automate retention workflows, and deliver workforce analytics.

---

## Tech Stack

- **Backend:** FastAPI, Python 3.11, SQLAlchemy ORM, Pydantic, JWT Authentication
- **Database:** MySQL 8.0 (`workforce_ai_db`)
- **Frontend:** React 19 (Vite), Tailwind CSS, Recharts, Axios, Lucide Icons
- **AI / Analytics:** Scikit-learn (Random Forest Classifier), Pandas, NumPy

---

## Expected Flow (AI Simulation Pipeline)

```text
Employee activity changes
       ↓
AI prediction engine recalculates risk
       ↓
High-risk employee detected
       ↓
HR alert triggered
       ↓
Intervention workflow initiated
       ↓
Monitoring logs updated
       ↓
Analytics dashboard refreshed
```

---

## Modules Implemented (All 30 Modules)

### Phase 1: Core HRMS (Modules 1 – 10)
- [x] **Module 1: Authentication & Authorization** — JWT-based authentication with role-based access control (Admin, HR, Manager, Employee).
- [x] **Module 2: Employee Management System** — Full employee lifecycle management, directory, profile tracking, and status controls.
- [x] **Module 3: Department & Role Management** — Department hierarchy, branch locations, and organizational headcount allocation.
- [x] **Module 4: Attendance & Shift Management** — Biometric check-in/out logging, shift schedules, work hours, and overtime calculations.
- [x] **Module 5: Leave Management System** — Annual, sick, and casual leave request workflows with balance deduction and approvals.
- [x] **Module 6: Payroll Management System** — Base salary, allowances, tax deductions, net pay calculation, and digital payslips.
- [x] **Module 7: Notifications & Alerts System** — Real-time event notifications for leave requests, approvals, and system alerts.
- [x] **Module 8: One-to-One Chat & Communication** — Direct messaging between employees, managers, and HR administrators.
- [x] **Module 9: Document Management System** — Secure file uploads, metadata tagging, and document repository.
- [x] **Module 10: Workforce Analytics Dashboard** — High-level KPI cards for total staff, attendance rates, payroll spend, and department counts.

### Phase 2: AI Attrition & Intelligence Engine (Modules 11 – 18)
- [x] **Module 11: Dataset Management System** — Benchmark dataset integration (IBM HR Analytics), CSV upload, and preview.
- [x] **Module 12: AI Attrition Prediction Engine** — Random Forest ML model predicting turnover probability and risk tiers (Low, Medium, High).
- [x] **Module 13: Continuous Employee Risk Monitoring** — Automated risk recalculation based on live employee data adjustments.
- [x] **Module 14: Workforce Retention Forecasting** — 3-month, 6-month, and 12-month projections of headcount retention and turnover rates.
- [x] **Module 15: Attrition Analytics Dashboard** — Visual risk distributions, department-wise risk breakdowns, and primary risk driver analysis.
- [x] **Module 16: HR Intervention & Decision Support** — Actionable retention workflows (compensation review, role realignment, remote flexibility).
- [x] **Module 17: Smart Notification & Risk Escalation** — Automatic alerts triggered when employee attrition risk exceeds critical thresholds.
- [x] **Module 18: Real-Time Workforce Monitoring Feed** — Live activity stream tracking system events, risk changes, and interventions.

### Phase 3: Enterprise Features & Governance (Modules 19 – 30)
- [x] **Module 19: Reports & Export System** — Structured summary reports with CSV exports for employees, payroll, and attrition data.
- [x] **Module 20: Audit Logs & Activity Tracking** — Immutable security audit trail recording user actions, timestamps, and IP addresses.
- [x] **Module 21: Workflow & Task Management** — Operational task boards with priority levels and status tracking (TODO, IN_PROGRESS, COMPLETED).
- [x] **Module 22: Performance Review System** — Periodic review cycles, goal milestones, rating scores, and manager feedback.
- [x] **Module 23: AI Recommendation Engine** — Data-driven mitigation recommendations tailored to individual flight risk factors.
- [x] **Module 24: Advanced Search & Filtering System** — Global search modal (`Ctrl + K`) filtering by department, salary range, and risk tier.
- [x] **Module 25: Professional Enterprise UI/UX System** — Responsive interface with dark navigation, responsive layouts, and clean data tables.
- [x] **Module 26: Role-Based Access Control (RBAC)** — Strict multi-tier authorization with sensitive data masking (salaries hidden from non-admin roles).
- [x] **Module 27: Workforce Stability Engine** — Organizational stability scoring and volatility assessment based on attrition patterns.
- [x] **Module 28: System Optimization & Scalability** — Modular FastAPI router architecture, database indexing, and lightweight bundle footprint.
- [x] **Module 29: Testing & Validation** — Automated test suite with 37 unit and integration tests covering all 3 phases.
- [x] **Module 30: Frontend & Backend Integration** — Complete end-to-end integration via Axios client with unified error handling and JWT interceptors.

---

## Database Schema

The platform runs on MySQL (`workforce_ai_db`) with 15 normalized tables:

1. `users` — User authentication, credentials, and RBAC roles
2. `employees` — Employee profiles, job titles, hire dates, and compensation
3. `departments` — Department details, codes, and location assignments
4. `attendance` — Daily check-in/out records, work hours, and overtime logs
5. `leaves` — Leave requests, categories, approval statuses, and dates
6. `payroll` — Monthly salary calculations, allowances, taxes, and net pay
7. `notifications` — System notifications, status updates, and risk alerts
8. `chat_messages` — 1-on-1 workplace communications between users
9. `documents` — Uploaded documents, file metadata, and categories
10. `datasets` — Uploaded ML training datasets and metadata
11. `risk_assessments` — AI-generated attrition scores, risk tiers, and driver lists
12. `interventions` — Retention intervention action plans and resolution statuses
13. `audit_logs` — Activity audit trail capturing actions, modules, and IPs
14. `tasks` — Operational tasks, assignees, priorities, and deadlines
15. `performance_reviews` — Review cycles, ratings, goal progress, and feedback

---

## Installation & Setup

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- MySQL Server 8.0+

### 2. Database Setup
Create the MySQL database:
```sql
CREATE DATABASE IF NOT EXISTS workforce_ai_db;
```

### 3. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API starts at `http://localhost:8000`.

### 4. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
The frontend application starts at `http://localhost:5173`.

---

## API Documentation

Interactive API documentation is automatically generated by FastAPI:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

Endpoints are grouped into 8 primary business modules:
1. `Authentication & Profile` — Login, user profile, password handling
2. `Employees & Directory` — Employee CRUD, department listings
3. `Attendance & Leaves` — Check-in/out, leave approvals
4. `Payroll & Compensation` — Payslips, compensation breakdowns
5. `AI Attrition Intelligence` — ML model predictions, forecasting, interventions
6. `Tasks & Performance` — Workflows, goals, review cycles
7. `Chat & Documents` — Direct chat, document vault
8. `Reports & Analytics` — Summary dashboards, CSV exports, audit trails

---

## Testing

Run the complete automated test suite covering all 30 modules:
```bash
cd backend
python -m pytest tests/test_phase1.py tests/test_phase2.py tests/test_phase3.py tests/test_overall.py -v
```
**Results:** `37 passed in ~19s` (100% pass rate).

---

## Assessment Deliverables Checklist

- [x] Backend Source Code (FastAPI, SQLAlchemy, MySQL)
- [x] Frontend Source Code (React 19, Vite, Tailwind CSS, Recharts)
- [x] AI Prediction Engine (Scikit-learn Random Forest model)
- [x] Workforce Dashboards (Headcount, Attendance, Attrition Risk, Spend)
- [x] Analytics & Reporting (CSV exports, summary metrics)
- [x] Interactive API Documentation (Swagger UI at `/docs`)
- [x] Relational Database Schema (15 normalized MySQL tables)
- [x] Complete Test Suite (37 automated tests across all 3 phases)
