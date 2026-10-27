import os
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

def train_attrition_model(dataset_path: str = None) -> dict:
    base_dir = os.path.dirname(__file__)
    if not dataset_path:
        dataset_path = os.path.join(base_dir, "..", "..", "uploads", "datasets", "ibm_hr_attrition_benchmark.csv")

    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset not found at: {dataset_path}")

    df = pd.read_csv(dataset_path)

    # Clean invariant or identifier columns
    drop_cols = ["EmployeeCount", "EmployeeNumber", "Over18", "StandardHours"]
    df = df.drop(columns=[c for c in drop_cols if c in df.columns], errors="ignore")

    # Encode target
    if "Attrition" not in df.columns:
        raise ValueError("Dataset missing 'Attrition' target column.")

    y = df["Attrition"].apply(lambda x: 1 if str(x).strip().lower() in ["yes", "1", "true"] else 0)
    X = df.drop(columns=["Attrition"])

    # One-hot encode categorical features
    cat_cols = X.select_dtypes(include=["object"]).columns.tolist()
    num_cols = X.select_dtypes(exclude=["object"]).columns.tolist()

    X_encoded = pd.get_dummies(X, columns=cat_cols, drop_first=True)
    feature_names = X_encoded.columns.tolist()

    # Train / Test split
    X_train, X_test, y_train, y_test = train_test_split(
        X_encoded, y, test_size=0.20, random_state=42, stratify=y
    )

    # Train Random Forest Classifier
    clf = RandomForestClassifier(
        n_estimators=150,
        max_depth=10,
        min_samples_split=4,
        class_weight="balanced",
        random_state=42
    )
    clf.fit(X_train, y_train)

    # Predictions & Probabilities
    y_pred = clf.predict(X_test)
    y_prob = clf.predict_proba(X_test)[:, 1]

    # Metrics
    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_test, y_prob))
    cm = confusion_matrix(y_test, y_pred).tolist()

    # Feature Importances
    importances = clf.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]
    
    top_features = []
    for idx in sorted_idx[:15]:
        top_features.append({
            "feature": feature_names[idx],
            "importance": round(float(importances[idx]) * 100, 2)
        })

    # Save artifacts
    artifacts_dir = os.path.join(base_dir, "artifacts")
    os.makedirs(artifacts_dir, exist_ok=True)

    model_path = os.path.join(artifacts_dir, "attrition_model.pkl")
    features_path = os.path.join(artifacts_dir, "feature_names.pkl")
    meta_path = os.path.join(artifacts_dir, "model_metadata.json")

    joblib.dump(clf, model_path)
    joblib.dump(feature_names, features_path)

    metadata = {
        "model_type": "Random Forest Classifier (Ensemble)",
        "dataset_used": os.path.basename(dataset_path),
        "total_records": len(df),
        "trained_at": datetime.utcnow().isoformat(),
        "accuracy": round(acc * 100, 2),
        "precision": round(prec * 100, 2),
        "recall": round(rec * 100, 2),
        "f1_score": round(f1 * 100, 2),
        "roc_auc": round(roc_auc * 100, 2),
        "confusion_matrix": cm,
        "top_features": top_features,
        "n_features": len(feature_names)
    }

    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"Model trained successfully! Accuracy: {metadata['accuracy']}%, ROC-AUC: {metadata['roc_auc']}%")
    return metadata

if __name__ == "__main__":
    train_attrition_model()
