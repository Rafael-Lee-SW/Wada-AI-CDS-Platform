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
        "graph": "scatter",
        "model": {
            "model_type": "RandomForestRegressor",
            "n_estimators": model.n_estimators,
            "max_depth": model.max_depth,
            "feature_importances_": feature_importances.tolist(),
        },
        "mse": mse,
        "r2": r2,
        "feature_importances": feature_importances.tolist(),
        "feature_names": X.columns.tolist(),
        "y_test": y_test.tolist(),
        "y_pred": y_pred.tolist(),
        identifiers_key: id_test.tolist(),
    }


def random_forest_classification(
    file_path, target_variable=None, feature_columns=None, id_column=None, **kwargs
):
    """
    Random Forest Classification model.

    Parameters:
    - file_path (str): Path to the CSV dataset file.
    - target_variable (str): Name of the target column.
    - feature_columns (list of str): List of feature column names.
    - id_column (str): Column name for identifiers (e.g., Employee Name or ID).

    Returns:
    - dict: Contains the model, metrics, predictions, and identifiers.
    """
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
        task_type="classification",
    )

    # Ensure identifiers are aligned with X and y
    identifiers = identifiers.loc[X.index]

    # Split the data
    X_train, X_test, y_train, y_test, id_train, id_test = split_data(
        X, y, identifiers, return_ids=True
    )

    # Initialize the model
    model = RandomForestClassifier(n_estimators=100, random_state=42)

    # Train the model
    model.fit(X_train, y_train)

    # Predict on test data
    y_pred = model.predict(X_test)

    # Evaluate the model
    report = classification_report(y_test, y_pred, output_dict=True)
    accuracy = accuracy_score(y_test, y_pred)
    confusion = confusion_matrix(y_test, y_pred).tolist()

    # Feature importances
    feature_importances = model.feature_importances_

    # Use the id_column name as the key for identifiers
    identifiers_key = f"identifier_{id_column}" if id_column else "identifiers"

    return {
        "graph": "scatter",
        "model": {
            "model_type": "RandomForestClassifier",
            "n_estimators": model.n_estimators,
            "max_depth": model.max_depth,
            "feature_importances_": feature_importances.tolist(),
        },
        "accuracy": accuracy,
        "report": report,
        "confusion_matrix": confusion,
        "feature_importances": feature_importances.tolist(),
        "feature_names": X.columns.tolist(),
        "y_test": y_test.tolist(),
        "y_pred": y_pred.tolist(),
        identifiers_key: id_test.tolist(),
    }
