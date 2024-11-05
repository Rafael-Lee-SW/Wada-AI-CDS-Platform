# models/random_forest.py

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.metrics import (
    mean_squared_error,
    r2_score,
    accuracy_score,
    classification_report,
    confusion_matrix,
)
from sklearn.preprocessing import StandardScaler
from sklearn.tree import export_graphviz  # 올바르게 임포트
import graphviz
import os
import json
from utils import load_and_preprocess_data, split_data


def random_forest_regression(
    file_path, target_variable=None, feature_columns=None, id_column=None, **kwargs
):
    """
    Calculates feature importances for Random Forest Regression.

    Parameters:
    - file_path (str): Path to the CSV dataset file.
    - target_variable (str): Name of the target column.
    - feature_columns (list of str): List of feature column names.
    - id_column (str): Column name for identifiers (e.g., Employee Name or ID).

    Returns:
    - dict: Contains the model, metrics, predictions, and identifiers.
    """
    # Debug statement
    print(f"Received id_column: {id_column}")
    # Load identifiers and data
    df = pd.read_csv(file_path)
    if id_column and id_column in df.columns:
        identifiers = df[id_column]
    else:
        identifiers = pd.Series(np.arange(len(df)), name="Index")

    # Load and preprocess data
    X, y = load_and_preprocess_data(
        df,
        target_variable=target_variable,
        feature_columns=feature_columns,
        task_type="regression",
    )

    # Ensure identifiers are aligned with X and y
    identifiers = identifiers.loc[X.index]

    # Split the data
    X_train, X_test, y_train, y_test, id_train, id_test = split_data(
        X, y, identifiers, return_ids=True
    )

    # Initialize the model
    model = RandomForestRegressor(n_estimators=100, random_state=42)

    # Train the model
    model.fit(X_train, y_train)

    # Predict on test data
    y_pred = model.predict(X_test)

    # Evaluate the model
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    # Feature importances
    feature_importances = model.feature_importances_

    # Use the id_column name as the key for identifiers
    identifiers_key = f"identifier_{id_column}" if id_column else "identifiers"

    return {
        "model": "RandomForestRegressor",
        "n_estimators": model.n_estimators,
        "max_depth": model.max_depth,
        "mse": mse,
        "r2": r2,
        "graph1": {
            "graph_type": "bar",
            "feature_importances": feature_importances.tolist(),
            "feature_names": X.columns.tolist(),
        },
        "graph2": {
            "graph_type": "scatter",
            "y_test": y_test.tolist(),
            "y_pred": y_pred.tolist(),
            "identifier": id_test.tolist(),
        },
    }
def random_forest_classification(
    file_path, target_variable=None, feature_columns=None, id_column=None, **kwargs
):
    """
    Random Forest Classification 모델을 학습하고 결과를 반환합니다.

    Parameters:
    - file_path (str): CSV 데이터셋 파일 경로.
    - target_variable (str): 타겟 변수 이름.
    - feature_columns (list of str): 특성 변수 이름 리스트.
    - id_column (str): 식별자 컬럼 이름 (예: Employee Name 또는 ID).

    Returns:
    - dict: 모델, 지표, 예측값, 확률, 식별자 등을 포함하는 딕셔너리.
    """
    # 데이터 로드 및 식별자 처리
    df = pd.read_csv(file_path)
    if id_column and id_column in df.columns:
        identifiers = df[id_column]
    else:
        identifiers = pd.Series(np.arange(len(df)), name="Index")

    # 데이터 전처리
    X, y = load_and_preprocess_data(
        df,
        target_variable=target_variable,
        feature_columns=feature_columns,
        task_type="classification",
    )

    # 식별자 정렬
    identifiers = identifiers.loc[X.index]

    # 데이터 분할
    X_train, X_test, y_train, y_test, id_train, id_test = split_data(
        X, y, identifiers, return_ids=True
    )

    # 모델 초기화 및 학습
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # 예측 및 확률 계산
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)  # 클래스별 예측 확률

    # 모델 평가
    report = classification_report(y_test, y_pred, output_dict=True)
    accuracy = accuracy_score(y_test, y_pred)
    confusion = confusion_matrix(y_test, y_pred).tolist()

    # 특성 중요도
    feature_importances = model.feature_importances_

    # 식별자 키 설정
    identifiers_key = f"identifier_{id_column}" if id_column else "identifiers"

    return {
        "model": "RandomForestClassifier",
        "n_estimators": model.n_estimators,
        "max_depth": model.max_depth,
        "accuracy": accuracy,
        "graph1": {
            "graph_type": "bar",
            "feature_importances": feature_importances.tolist(),
            "feature_names": X.columns.tolist(),
        },
        "graph2": {
            "graph_type": "probability",
            "y_test": y_test.tolist(),
            "y_pred": y_pred.tolist(),
            "y_proba": y_proba.tolist(),
            "identifier": id_test.tolist(),
        },
        "graph3": {
            "graph_type": "table",
            "classification_report": report,
        },
        "graph4": {
            "graph_type": "heatmap",
            "confusion_matrix": confusion,
            "labels": [str(label) for label in model.classes_],
        },
    }
