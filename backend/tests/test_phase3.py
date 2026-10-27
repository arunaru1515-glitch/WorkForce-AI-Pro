import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_auth_token(email="admin@workforce.ai", password="Admin@123"):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]

def get_employee_token(email="employee@workforce.ai", password="Employee@123"):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]

# --- MODULE 19: Reports & Export System ---

def test_reports_summary():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/api/v1/reports/summary", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_employees"] >= 10
    assert data["active_employees"] >= 10
    assert data["avg_salary"] > 0
    assert data["attendance_rate"] >= 0

def test_reports_employees_and_filters():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/api/v1/reports/employees?status=Active", headers=headers)
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 10
    assert "employee_code" in items[0]
    assert "salary" in items[0]

def test_reports_attrition_report():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/api/v1/reports/attrition", headers=headers)
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 5
    assert "risk_score" in items[0]
    assert "risk_level" in items[0]

def test_reports_payroll_and_attendance():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Payroll
    p_res = client.get("/api/v1/reports/payroll", headers=headers)
    assert p_res.status_code == 200
    assert len(p_res.json()) >= 1

    # Attendance
    a_res = client.get("/api/v1/reports/attendance", headers=headers)
    assert a_res.status_code == 200
    assert len(a_res.json()) >= 1

def test_reports_export_csv():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/api/v1/reports/export/csv?report_type=employees", headers=headers)
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "Employee Code" in res.text

def test_reports_export_excel():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/api/v1/reports/export/excel?report_type=attrition", headers=headers)
    assert res.status_code == 200
    assert "spreadsheetml" in res.headers["content-type"]
    assert len(res.content) > 100

def test_reports_export_pdf():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/api/v1/reports/export/pdf?report_type=employees", headers=headers)
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert len(res.content) > 500

# --- MODULE 20: Audit Logs & Activity Tracking ---

def test_audit_logs_list_and_stats():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # List logs
    res = client.get("/api/v1/audit/logs?limit=20", headers=headers)
    assert res.status_code == 200
    logs = res.json()
    assert len(logs) >= 1
    assert "action" in logs[0]
    assert "module" in logs[0]

    # Stats
    stats_res = client.get("/api/v1/audit/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_logs"] >= 1
    assert "module_breakdown" in stats

# --- MODULE 21: Workflow & Task Management ---

def test_workflow_tasks_crud_and_status():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. List existing tasks
    res = client.get("/api/v1/tasks/", headers=headers)
    assert res.status_code == 200
    tasks = res.json()
    assert len(tasks) >= 1

    # 2. Get task stats
    stats_res = client.get("/api/v1/tasks/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_tasks"] >= 1

    # 3. Create a new task
    due = (date.today() + timedelta(days=3)).isoformat()
    new_task = {
        "title": "Quarterly 360 Feedback Assessment Review",
        "description": "Collect and compile peer feedback for engineering leads.",
        "assigned_to": tasks[0]["assigned_to"],
        "priority": "HIGH",
        "status": "TODO",
        "category": "Operations",
        "due_date": due
    }
    create_res = client.post("/api/v1/tasks/", json=new_task, headers=headers)
    assert create_res.status_code == 201
    created_id = create_res.json()["id"]

    # 4. Update status to IN_PROGRESS then COMPLETED
    status_res = client.patch(f"/api/v1/tasks/{created_id}/status", json={"status": "IN_PROGRESS"}, headers=headers)
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "IN_PROGRESS"

    comp_res = client.patch(f"/api/v1/tasks/{created_id}/status", json={"status": "COMPLETED"}, headers=headers)
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "COMPLETED"

    # 5. Delete task
    del_res = client.delete(f"/api/v1/tasks/{created_id}", headers=headers)
    assert del_res.status_code == 200

# --- MODULE 22: Performance Review System ---

def test_performance_review_crud_and_goals():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. List reviews
    res = client.get("/api/v1/performance/reviews", headers=headers)
    assert res.status_code == 200
    reviews = res.json()
    assert len(reviews) >= 1

    # 2. Performance stats
    stats_res = client.get("/api/v1/performance/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_reviews"] >= 1
    assert stats["average_rating"] > 0
    assert len(stats["top_performers"]) > 0

    # 3. Create a review with goals JSON
    new_rev = {
        "employee_id": 4,
        "review_cycle": "Mid-Year Review 2026",
        "rating": 4.9,
        "goals_json": '[{"title": "Scale ML cluster", "target": "Q3", "status": "IN_PROGRESS", "progress_percentage": 75}]',
        "achievements": "Superb execution in scaling AI response latencies.",
        "improvement_areas": "None. Benchmark contributor.",
        "feedback": "Promote to Principal.",
        "status": "Completed"
    }
    create_res = client.post("/api/v1/performance/reviews", json=new_rev, headers=headers)
    assert create_res.status_code == 201
    rev_id = create_res.json()["id"]

    # 4. Get employee specific review history
    emp_revs = client.get("/api/v1/performance/employee/4", headers=headers)
    assert emp_revs.status_code == 200
    assert len(emp_revs.json()) >= 1

    # 5. Delete review
    del_res = client.delete(f"/api/v1/performance/reviews/{rev_id}", headers=headers)
    assert del_res.status_code == 200

# --- MODULE 23: AI Recommendation Engine ---

def test_ai_workforce_recommendations():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/ai/recommendations/workforce", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "employee_suggestions" in data
    assert len(data["employee_suggestions"]) > 0
    assert "workforce_optimization_tips" in data
    assert len(data["workforce_optimization_tips"]) > 0
    assert "team_performance_insights" in data
    assert "department_recommendations" in data

# --- MODULE 24: Advanced Search & Filtering System ---

def test_global_advanced_search():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Query search
    res = client.get("/api/v1/search/global?query=Elena", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_matches"] >= 1
    assert "Elena" in data["results"][0]["full_name"]

    # Multi-filter search (min_salary + status)
    filter_res = client.get("/api/v1/search/global?min_salary=80000&status=Active", headers=headers)
    assert filter_res.status_code == 200
    fdata = filter_res.json()
    assert fdata["total_matches"] >= 1
    for r in fdata["results"]:
        assert r["salary"] >= 80000

# --- MODULE 26: Role-Based Access Control (RBAC) ---

def test_rbac_restrictions():
    emp_token = get_employee_token()
    emp_headers = {"Authorization": f"Bearer {emp_token}"}

    # Employee should NOT have access to system audit logs (403 Forbidden)
    audit_res = client.get("/api/v1/audit/logs", headers=emp_headers)
    assert audit_res.status_code == 403

    # Employee should NOT have access to reports export
    export_res = client.get("/api/v1/reports/export/csv?report_type=payroll", headers=emp_headers)
    assert export_res.status_code == 403

# --- MODULE 27: Workforce Stability Engine ---

def test_workforce_stability_engine():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/ai/stability", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "overall_stability_score" in data
    assert data["overall_stability_score"] > 0
    assert "department_stability_scores" in data
    assert len(data["department_stability_scores"]) > 0
    assert "growth_projections" in data
    assert "retention_horizons" in data
