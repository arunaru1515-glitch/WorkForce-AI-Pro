import os
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any, List

class AttritionPredictor:
    def __init__(self):
        self.base_dir = os.path.dirname(__file__)
        self.artifacts_dir = os.path.join(self.base_dir, "artifacts")
        self.model_path = os.path.join(self.artifacts_dir, "attrition_model.pkl")
        self.features_path = os.path.join(self.artifacts_dir, "feature_names.pkl")
        self.meta_path = os.path.join(self.artifacts_dir, "model_metadata.json")

        self.model = None
        self.feature_names = None
        self.metadata = {}
        self._load()

    def _load(self):
        if os.path.exists(self.model_path) and os.path.exists(self.features_path):
            self.model = joblib.load(self.model_path)
            self.feature_names = joblib.load(self.features_path)
        if os.path.exists(self.meta_path):
            with open(self.meta_path, "r") as f:
                self.metadata = json.load(f)

    def is_ready(self) -> bool:
        return self.model is not None and self.feature_names is not None

    def predict_employee(self, emp_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs inference on employee features and returns risk probability, 
        risk band, confidence, contributing factors, and strategic recommendations.
        """
        if not self.is_ready():
            self._load()
            if not self.is_ready():
                raise RuntimeError("Attrition ML Model is not trained yet.")

        # Default fallback values for standard 35 features
        defaults = {
            "Age": 35,
            "BusinessTravel": "Travel_Rarely",
            "DailyRate": 800,
            "Department": "Research & Development",
            "DistanceFromHome": 8,
            "Education": 3,
            "EducationField": "Life Sciences",
            "EnvironmentSatisfaction": 3,
            "Gender": "Male",
            "HourlyRate": 65,
            "JobInvolvement": 3,
            "JobLevel": 2,
            "JobRole": "Research Scientist",
            "JobSatisfaction": 3,
            "MaritalStatus": "Married",
            "MonthlyIncome": 6000,
            "MonthlyRate": 14000,
            "NumCompaniesWorked": 2,
            "OverTime": "No",
            "PercentSalaryHike": 14,
            "PerformanceRating": 3,
            "RelationshipSatisfaction": 3,
            "StockOptionLevel": 1,
            "TotalWorkingYears": 10,
            "TrainingTimesLastYear": 2,
            "WorkLifeBalance": 3,
            "YearsAtCompany": 4,
            "YearsInCurrentRole": 2,
            "YearsSinceLastPromotion": 1,
            "YearsWithCurrManager": 2
        }

        # Override defaults with provided employee attributes
        record = {**defaults}
        for k, v in emp_data.items():
            if v is not None:
                record[k] = v

        # Convert to one-row DataFrame
        df_row = pd.DataFrame([record])
        df_encoded = pd.get_dummies(df_row)

        # Align with training features
        aligned = pd.DataFrame(0, index=[0], columns=self.feature_names)
        for col in df_encoded.columns:
            if col in aligned.columns:
                aligned[col] = df_encoded[col]

        # Model Probability
        proba = float(self.model.predict_proba(aligned)[0, 1])
        risk_score = round(proba * 100, 1)

        # Risk Classification
        if risk_score >= 70.0:
            risk_level = "CRITICAL"
        elif risk_score >= 48.0:
            risk_level = "HIGH"
        elif risk_score >= 26.0:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Determine Contributing Flight Risk Factors
        contributing_factors = []
        if record.get("OverTime") == "Yes":
            contributing_factors.append({"factor": "Excessive Overtime Workload", "impact": 24, "type": "negative"})
        if record.get("MonthlyIncome", 0) < 4500:
            contributing_factors.append({"factor": "Below Market Compensation", "impact": 21, "type": "negative"})
        if record.get("JobSatisfaction", 3) <= 2:
            contributing_factors.append({"factor": "Low Job Satisfaction Score", "impact": 18, "type": "negative"})
        if record.get("WorkLifeBalance", 3) <= 2:
            contributing_factors.append({"factor": "Strained Work-Life Balance", "impact": 15, "type": "negative"})
        if record.get("DistanceFromHome", 0) > 18:
            contributing_factors.append({"factor": "Extended Commute Distance", "impact": 12, "type": "negative"})
        if record.get("YearsInCurrentRole", 0) >= 4 and record.get("YearsSinceLastPromotion", 0) >= 3:
            contributing_factors.append({"factor": "Role & Promotion Stagnation", "impact": 14, "type": "negative"})
        if record.get("StockOptionLevel", 1) == 0:
            contributing_factors.append({"factor": "Zero Equity/Stock Incentives", "impact": 9, "type": "negative"})

        if not contributing_factors:
            contributing_factors.append({"factor": "Tenure Transition Window", "impact": 8, "type": "neutral"})

        contributing_factors.sort(key=lambda x: x["impact"], reverse=True)
        primary_driver = contributing_factors[0]["factor"]

        # Generate Strategic Retention Recommendations (Module 16)
        recommendations = []
        if "Overtime" in primary_driver:
            recommendations.append({
                "strategy": "Workload Rebalancing",
                "action": "Cap weekly overtime to <4 hours and allocate cross-functional support.",
                "priority": "HIGH"
            })
        if "Compensation" in primary_driver or record.get("MonthlyIncome", 0) < 5000:
            recommendations.append({
                "strategy": "Compensation Review",
                "action": "Benchmark role compensation against industry 75th percentile (+10-15% adjustment).",
                "priority": "URGENT" if risk_level in ["HIGH", "CRITICAL"] else "MEDIUM"
            })
        if "Promotion" in primary_driver or "Role" in primary_driver:
            recommendations.append({
                "strategy": "Career Progression & Mentorship",
                "action": "Formulate accelerated promotion roadmap and pair with Senior Staff Mentor.",
                "priority": "MEDIUM"
            })
        if "Satisfaction" in primary_driver or "Balance" in primary_driver:
            recommendations.append({
                "strategy": "Flexible Work Arrangements",
                "action": "Enable 2 days/week hybrid flexibility and schedule 1-on-1 manager pulse session.",
                "priority": "HIGH"
            })

        if not recommendations:
            recommendations.append({
                "strategy": "Talent Recognition",
                "action": "Acknowledge recent milestones and conduct quarterly career goals check-in.",
                "priority": "LOW"
            })

        confidence = round(0.85 + (abs(proba - 0.5) * 0.25), 2)

        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "confidence": confidence,
            "primary_driver": primary_driver,
            "contributing_factors": contributing_factors,
            "recommendations": recommendations,
            "assessed_at": datetime.utcnow().isoformat()
        }

# Global singleton
predictor = AttritionPredictor()
