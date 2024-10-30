# models/random_forest.py

import pandas as pd
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.metrics import (
    mean_squared_error,
    r2_score,
    accuracy_score,
    classification_report,
    confusion_matrix,  # Added import
)
from sklearn.preprocessing import StandardScaler
from utils import load_and_preprocess_data, split_data


def random_forest_regression(
    file_path, target_variable=None, feature_columns=None, **kwargs
):
    """
    Calculates feature importances for Random Forest Regression.

    Parameters:
    - file_path (str): Path to the CSV dataset file.
    - target_variable (str): Name of the target column.
    - feature_columns (list of str): List of feature column names.

    Returns:
    - dict: Contains the model, metrics, and predictions.
    """
    # Load and preprocess data
    X, y = load_and_preprocess_data(
        file_path,
        target_variable=target_variable,
        feature_columns=feature_columns,
        task_type="regression",
    )

    # Split the data
    X_train, X_test, y_train, y_test = split_data(X, y)

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

    return {
        "model": model,
        "mse": mse,
        "r2": r2,
        "feature_importances": model.feature_importances_.tolist(),
        "y_test": y.tolist(),
        "y_pred": y_pred.tolist(),
    }


def random_forest_classification(
    file_path, target_variable=None, feature_columns=None, **kwargs
):
    """
    Random Forest Classification model.

    Parameters:
    - file_path (str): Path to the CSV dataset file.
    - target_variable (str): Name of the target column.
    - feature_columns (list of str): List of feature column names.

    Returns:
    - dict: Contains the model, metrics, and predictions.
    """
    # Load and preprocess data
    X, y = load_and_preprocess_data(
        file_path,
        target_variable=target_variable,
        feature_columns=feature_columns,
        task_type="classification",
    )

    # Split the data
    X_train, X_test, y_train, y_test = split_data(X, y)

    # Initialize the model
    model = RandomForestClassifier(n_estimators=100, random_state=42)

    # Train the model
    model.fit(X_train, y_train)

    # Predict on test data
    y_pred = model.predict(X_test)

    # Evaluate the model
    report = classification_report(y_test, y_pred, output_dict=True)
    accuracy = accuracy_score(y_test, y_pred)
    confusion = confusion_matrix(y_test, y_pred).tolist()  # Fixed variable reference
    
    # Feature importances
    feature_importances = model.feature_importances_

    return {
        "model": model,
        "accuracy": accuracy,
        "report": report,
        "confusion_matrix": confusion,  # Added comma
        "feature_importances": feature_importances.tolist(),  # Corrected reference
        "y_test": y.tolist(),
        "y_pred": y_pred.tolist(),
    }
