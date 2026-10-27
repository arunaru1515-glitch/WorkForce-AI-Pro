import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_auth_token(email="admin@workforce.ai", password="Admin@123"):
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200
    return resp.json()["access_token"]

def test_api_health():
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"

def test_auth_login_all_roles():
    roles = [
        ("admin@workforce.ai", "Admin@123", "ADMIN"),
        ("hr@workforce.ai", "Hr@123", "HR"),
        ("manager@workforce.ai", "Manager@123", "MANAGER"),
        ("employee@workforce.ai", "Employee@123", "EMPLOYEE"),
    ]
    for email, pwd, expected_role in roles:
        resp = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["user"]["role"] == expected_role

def test_auth_me_session():
    token = get_auth_token()
    resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "admin@workforce.ai"

def test_departments_module():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # List departments
    resp = client.get("/api/v1/departments/", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 5
    
    # Create new department
    new_dept = {"name": "Quality Assurance", "code": "QA", "description": "Software QA & test automation"}
    create_resp = client.post("/api/v1/departments/", json=new_dept, headers=headers)
    assert create_resp.status_code in [201, 400] # 201 or 400 if already exists

def test_employees_module():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # List employees
    resp = client.get("/api/v1/employees/", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 5
    
    # Search employee
    search_resp = client.get("/api/v1/employees/?search=Elena", headers=headers)
    assert search_resp.status_code == 200
    assert any("Elena" in e["first_name"] for e in search_resp.json())

def test_attendance_module():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    resp = client.get("/api/v1/attendance/", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1

def test_leave_module():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # List leaves
    resp = client.get("/api/v1/leaves/", headers=headers)
    assert resp.status_code == 200
    leaves = resp.json()
    assert len(leaves) >= 1
    
    # Review first leave
    leave_id = leaves[0]["id"]
    rev_resp = client.put(f"/api/v1/leaves/{leave_id}/review", json={"status": "Approved", "review_comments": "Approved via automated test"}, headers=headers)
    assert rev_resp.status_code == 200
    assert rev_resp.json()["status"] == "Approved"

def test_payroll_module():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    resp = client.get("/api/v1/payroll/", headers=headers)
    assert resp.status_code == 200
    payrolls = resp.json()
    assert len(payrolls) >= 1
    
    # Verify payslip detail
    p_id = payrolls[0]["id"]
    slip_resp = client.get(f"/api/v1/payroll/payslip/{p_id}", headers=headers)
    assert slip_resp.status_code == 200
    assert slip_resp.json()["net_salary"] > 0

def test_notifications_module():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    resp = client.get("/api/v1/notifications/", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1

def test_chat_module():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get chat users
    users_resp = client.get("/api/v1/chat/users", headers=headers)
    assert users_resp.status_code == 200
    chat_users = users_resp.json()
    assert len(chat_users) >= 1
    
    # Send message
    target_id = chat_users[0]["user_id"]
    send_resp = client.post("/api/v1/chat/send", json={"receiver_id": target_id, "message": "Test message from automated test suite"}, headers=headers)
    assert send_resp.status_code == 200
    assert send_resp.json()["message"] == "Test message from automated test suite"

def test_analytics_dashboard_module():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    resp = client.get("/api/v1/analytics/dashboard", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_employees"] >= 10
    assert data["total_departments"] >= 5
    assert data["attendance"]["attendance_rate"] >= 0
