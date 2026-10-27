import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_auth_token(email="admin@workforce.ai", password="Admin@123"):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return res.json()["access_token"]

def test_datasets_module():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. List datasets
    res = client.get("/api/v1/datasets/", headers=headers)
    assert res.status_code == 200
    datasets = res.json()
    assert len(datasets) >= 1
    ds_id = datasets[0]["id"]

    # 2. Preview dataset
    preview = client.get(f"/api/v1/datasets/{ds_id}/preview", headers=headers)
    assert preview.status_code == 200
    pdata = preview.json()
    assert "total_rows" in pdata
    assert "columns" in pdata
    assert len(pdata["sample_rows"]) > 0

def test_ai_model_info():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/ai/model-info", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "accuracy" in data
    assert "top_features" in data
    assert len(data["top_features"]) > 0

def test_ai_predict_realtime():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Predict for seeded high-risk profile (Overtime=Yes, MonthlyIncome=3200)
    payload = {
        "employee_id": 4,
        "age": 29,
        "monthly_income": 3200.0,
        "overtime": "Yes",
        "job_satisfaction": 1,
        "work_life_balance": 1,
        "years_in_current_role": 3,
        "years_since_last_promotion": 3
    }
    res = client.post("/api/v1/ai/predict", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "risk_score" in data
    assert "risk_level" in data
    assert "primary_driver" in data
    assert len(data["contributing_factors"]) > 0
    assert len(data["recommendations"]) > 0

def test_ai_overview_dashboard():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/ai/overview", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_analyzed" in data
    assert "avg_attrition_risk" in data
    assert "high_risk_count" in data
    assert len(data["high_risk_employees"]) > 0
    assert len(data["department_risk_summary"]) > 0

def test_ai_forecasting():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/ai/forecasting", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "current_headcount" in data
    assert "projected_6m_exits" in data
    assert len(data["forecast_timeline"]) == 6
    assert len(data["department_forecasts"]) > 0

def test_risk_history_tracking():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/ai/risk-history/4", headers=headers)
    assert res.status_code == 200
    logs = res.json()
    assert isinstance(logs, list)

def test_interventions_module():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. List active interventions
    res = client.get("/api/v1/interventions/", headers=headers)
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 1
    int_id = items[0]["id"]

    # 2. Get AI recommendations for employee
    rec_res = client.get("/api/v1/interventions/recommendations/4", headers=headers)
    assert rec_res.status_code == 200
    assert "ai_recommendations" in rec_res.json()

    # 3. Update intervention status
    update_res = client.put(
        f"/api/v1/interventions/{int_id}/status",
        json={"status": "Resolved", "outcome_notes": "Employee accepted retention adjustment package."},
        headers=headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "Resolved"
