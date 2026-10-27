"""
WORKFORCE AI PRO - Overall Suite Verification (Phases 1, 2, and 3)
Modules 1 to 30 Complete End-to-End Validation
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_admin_token():
    res = client.post("/api/v1/auth/login", json={"email": "admin@workforce.ai", "password": "Admin@123"})
    assert res.status_code == 200
    return res.json()["access_token"]

def test_overall_platform_health_phase3():
    """Verify platform health and all 30 modules operational"""
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["phase"] == 3
    assert data["total_modules"] == 30

def test_overall_root_metadata():
    """Verify root metadata exposes all 30 modules across 3 phases"""
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert "Phase 3" in data["phase"]
    assert len(data["modules_active"]) == 30

def test_overall_phase1_core_pipeline():
    """Verify Core HRMS: Auth, Employees, Departments, Attendance, Leaves, Payroll"""
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Auth
    me = client.get("/api/v1/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["role"] == "ADMIN"

    # Employees
    emps = client.get("/api/v1/employees/", headers=headers)
    assert emps.status_code == 200
    assert len(emps.json()) >= 10

    # Departments
    depts = client.get("/api/v1/departments/", headers=headers)
    assert depts.status_code == 200
    assert len(depts.json()) >= 5

    # Attendance
    att = client.get("/api/v1/attendance/", headers=headers)
    assert att.status_code == 200

    # Leaves
    leaves = client.get("/api/v1/leaves/", headers=headers)
    assert leaves.status_code == 200

    # Payroll
    pay = client.get("/api/v1/payroll/", headers=headers)
    assert pay.status_code == 200

def test_overall_phase2_ai_intelligence_pipeline():
    """Verify AI Attrition: Datasets, Predictions, Risk History, Forecasting, Interventions"""
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Model info
    info = client.get("/api/v1/ai/model-info", headers=headers)
    assert info.status_code == 200

    # Real-time Prediction
    pred = client.post("/api/v1/ai/predict", json={
        "employee_id": 4,
        "age": 30,
        "monthly_income": 3500,
        "overtime": "Yes"
    }, headers=headers)
    assert pred.status_code == 200
    assert "risk_score" in pred.json()

    # Overview
    overview = client.get("/api/v1/ai/overview", headers=headers)
    assert overview.status_code == 200
    assert overview.json()["total_analyzed"] >= 10

    # Forecasting
    forecast = client.get("/api/v1/ai/forecasting", headers=headers)
    assert forecast.status_code == 200
    assert "projected_6m_exits" in forecast.json()

    # Interventions
    interventions = client.get("/api/v1/interventions/", headers=headers)
    assert interventions.status_code == 200

def test_overall_phase3_enterprise_features():
    """Verify Phase 3 Enterprise: Reports & Exports, Audit, Tasks, Performance, Search, Stability"""
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Module 19: Reports
    rep = client.get("/api/v1/reports/summary", headers=headers)
    assert rep.status_code == 200

    # Module 20: Audit
    audit = client.get("/api/v1/audit/logs?limit=5", headers=headers)
    assert audit.status_code == 200

    # Module 21: Tasks
    tasks = client.get("/api/v1/tasks/", headers=headers)
    assert tasks.status_code == 200
    assert len(tasks.json()) >= 1

    # Module 22: Performance
    perf = client.get("/api/v1/performance/reviews", headers=headers)
    assert perf.status_code == 200
    assert len(perf.json()) >= 1

    # Module 23: Recommendations
    recs = client.get("/api/v1/ai/recommendations/workforce", headers=headers)
    assert recs.status_code == 200

    # Module 24: Search
    search = client.get("/api/v1/search/global?query=Alex", headers=headers)
    assert search.status_code == 200

    # Module 27: Stability
    stability = client.get("/api/v1/ai/stability", headers=headers)
    assert stability.status_code == 200
    assert stability.json()["overall_stability_score"] > 0
