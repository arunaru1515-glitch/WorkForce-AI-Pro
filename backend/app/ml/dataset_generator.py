import os
import random
import pandas as pd
import numpy as np

def generate_ibm_hr_dataset(output_path: str, n_samples: int = 1470) -> str:
    """
    Generates a realistic benchmark IBM HR Analytics Employee Attrition dataset 
    with the exact standard 35 features.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    random.seed(42)
    np.random.seed(42)

    departments = ["Research & Development", "Sales", "Human Resources"]
    dept_weights = [0.65, 0.30, 0.05]

    roles = {
        "Research & Development": ["Research Scientist", "Laboratory Technician", "Manufacturing Director", "Healthcare Representative", "Research Director", "Manager"],
        "Sales": ["Sales Executive", "Sales Representative", "Manager"],
        "Human Resources": ["Human Resources", "Manager"]
    }

    edu_fields = ["Life Sciences", "Medical", "Marketing", "Technical Degree", "Human Resources", "Other"]
    travel_opts = ["Travel_Rarely", "Travel_Frequently", "Non-Travel"]
    marital_opts = ["Married", "Single", "Divorced"]

    data = []
    for i in range(1, n_samples + 1):
        age = int(np.clip(np.random.normal(37, 9), 18, 60))
        dept = np.random.choice(departments, p=dept_weights)
        role = random.choice(roles[dept])
        gender = random.choice(["Male", "Female"])
        marital = random.choice(marital_opts)
        edu_field = random.choice(edu_fields)
        travel = np.random.choice(travel_opts, p=[0.70, 0.20, 0.10])
        dist_home = int(np.clip(np.random.exponential(9), 1, 30))
        edu_level = random.choice([1, 2, 3, 4, 5])

        total_working_years = max(1, int(age - 18 - np.random.randint(0, 4)))
        years_at_company = min(total_working_years, int(np.clip(np.random.exponential(7), 0, total_working_years)))
        years_in_role = min(years_at_company, random.randint(0, min(18, years_at_company)))
        years_since_promo = min(years_at_company, random.randint(0, min(15, years_at_company)))
        years_curr_mgr = min(years_at_company, random.randint(0, min(17, years_at_company)))

        job_level = min(5, max(1, 1 + total_working_years // 6))
        base_income = {1: 2800, 2: 5000, 3: 8500, 4: 12500, 5: 18000}[job_level]
        monthly_income = int(base_income + np.random.normal(0, 500))

        env_satisfaction = random.choice([1, 2, 3, 4])
        job_satisfaction = random.choice([1, 2, 3, 4])
        work_life_balance = random.choice([1, 2, 3, 4])
        job_involvement = random.choice([1, 2, 3, 4])
        rel_satisfaction = random.choice([1, 2, 3, 4])

        overtime = np.random.choice(["Yes", "No"], p=[0.28, 0.72])
        stock_option = random.choice([0, 1, 2, 3])
        num_companies = random.randint(0, 9)
        training_times = random.randint(0, 6)
        perf_rating = np.random.choice([3, 4], p=[0.85, 0.15])
        salary_hike = random.randint(11, 25)

        # Calibrate Attrition probability based on real HR risk drivers
        attrition_prob = 0.08
        if overtime == "Yes":
            attrition_prob += 0.22
        if monthly_income < 3500:
            attrition_prob += 0.18
        if job_satisfaction <= 2:
            attrition_prob += 0.15
        if work_life_balance == 1:
            attrition_prob += 0.14
        if years_in_role < 1:
            attrition_prob += 0.10
        if dist_home > 15:
            attrition_prob += 0.08
        if stock_option == 0:
            attrition_prob += 0.06
        if marital == "Single":
            attrition_prob += 0.07

        attrition = "Yes" if np.random.rand() < min(0.85, attrition_prob) else "No"

        row = {
            "Age": age,
            "Attrition": attrition,
            "BusinessTravel": travel,
            "DailyRate": random.randint(100, 1500),
            "Department": dept,
            "DistanceFromHome": dist_home,
            "Education": edu_level,
            "EducationField": edu_field,
            "EmployeeCount": 1,
            "EmployeeNumber": i,
            "EnvironmentSatisfaction": env_satisfaction,
            "Gender": gender,
            "HourlyRate": random.randint(30, 100),
            "JobInvolvement": job_involvement,
            "JobLevel": job_level,
            "JobRole": role,
            "JobSatisfaction": job_satisfaction,
            "MaritalStatus": marital,
            "MonthlyIncome": monthly_income,
            "MonthlyRate": random.randint(2000, 27000),
            "NumCompaniesWorked": num_companies,
            "Over18": "Y",
            "OverTime": overtime,
            "PercentSalaryHike": salary_hike,
            "PerformanceRating": perf_rating,
            "RelationshipSatisfaction": rel_satisfaction,
            "StandardHours": 80,
            "StockOptionLevel": stock_option,
            "TotalWorkingYears": total_working_years,
            "TrainingTimesLastYear": training_times,
            "WorkLifeBalance": work_life_balance,
            "YearsAtCompany": years_at_company,
            "YearsInCurrentRole": years_in_role,
            "YearsSinceLastPromotion": years_since_promo,
            "YearsWithCurrManager": years_curr_mgr
        }
        data.append(row)

    df = pd.DataFrame(data)
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} records at {output_path}. Attrition Rate: {(df['Attrition'] == 'Yes').mean():.2%}")
    return output_path

if __name__ == "__main__":
    out = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "datasets", "ibm_hr_attrition_benchmark.csv")
    generate_ibm_hr_dataset(out)
