import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any

def generate_workforce_forecast(current_headcount: int = 10, avg_risk_rate: float = 0.22) -> Dict[str, Any]:
    """
    Module 14: Workforce Retention & Headcount Forecasting System.
    Projects 6-month & 12-month retention curves, departmental risk distribution,
    and expected exits.
    """
    months = ["Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6"]
    forecast_timeline = []

    retained = float(current_headcount)
    monthly_exit_rate = avg_risk_rate / 6.0  # Distributed across the semester
    cumulative_exits = 0

    for i, m in enumerate(months, 1):
        # Projected exits with slight natural variance
        exits_this_month = round(max(0, (retained * monthly_exit_rate) + np.random.uniform(-0.15, 0.25)), 1)
        cumulative_exits += exits_this_month
        retained = max(1.0, current_headcount - cumulative_exits)
        retention_rate = round((retained / current_headcount) * 100, 1)

        forecast_timeline.append({
            "period": m,
            "projected_headcount": round(retained),
            "expected_exits": round(exits_this_month, 1),
            "cumulative_exits": round(cumulative_exits, 1),
            "retention_rate": retention_rate
        })

    # Department Risk Breakdown
    departments = [
        {"department": "Engineering", "headcount": 4, "avg_risk": 24.5, "projected_exits": 1, "risk_level": "LOW"},
        {"department": "Sales", "headcount": 2, "avg_risk": 58.2, "projected_exits": 1, "risk_level": "HIGH"},
        {"department": "Product", "headcount": 2, "avg_risk": 32.0, "projected_exits": 0, "risk_level": "MEDIUM"},
        {"department": "Human Resources", "headcount": 2, "avg_risk": 18.5, "projected_exits": 0, "risk_level": "LOW"},
    ]

    # Module 14: Yearly Workforce Prediction (12-Month Horizon)
    annual_exit_rate = min(0.45, avg_risk_rate * 1.6)
    yearly_exits = round(current_headcount * annual_exit_rate)
    yearly_retention = max(1, current_headcount - yearly_exits)
    yearly_prediction = {
        "horizon": "12 Months (Yearly)",
        "projected_headcount": yearly_retention,
        "projected_yearly_exits": yearly_exits,
        "projected_retention_rate": round((yearly_retention / max(1, current_headcount)) * 100, 1),
        "annual_turnover_rate": round((yearly_exits / max(1, current_headcount)) * 100, 1)
    }

    # Module 14: Workforce Stability Analysis
    stability_score = round(max(30.0, 100.0 - (avg_risk_rate * 100.0 * 1.8)), 1)
    if stability_score >= 80:
        stability_status = "HIGH STABILITY"
        risk_grade = "Low Attrition Volatility"
    elif stability_score >= 60:
        stability_status = "MODERATE STABILITY"
        risk_grade = "Manageable Turnover Risk"
    else:
        stability_status = "VULNERABLE"
        risk_grade = "Elevated Flight Risk Cluster"

    stability_analysis = {
        "stability_score": stability_score,
        "stability_status": stability_status,
        "risk_grade": risk_grade,
        "stability_index": round(stability_score / 100.0, 2),
        "flight_risk_driver": "Workload & Market Benchmarks",
        "recommended_action": "Targeted retention packages for high-risk technical roles."
    }

    return {
        "current_headcount": current_headcount,
        "projected_6m_exits": round(cumulative_exits),
        "projected_6m_retention_rate": forecast_timeline[-1]["retention_rate"],
        "projected_turnover_rate": round((cumulative_exits / max(1, current_headcount)) * 100, 1),
        "forecast_timeline": forecast_timeline,
        "yearly_prediction": yearly_prediction,
        "stability_analysis": stability_analysis,
        "department_forecasts": departments,
        "generated_at": datetime.utcnow().isoformat()
    }
