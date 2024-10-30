# models/logistic_regression.py

from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
import pandas as pd
import os
from utils import (
    load_and_preprocess_data,
    split_data,
    generate_binary_condition,
)


def logistic_regression_attrition(
    file_path, target_variable=None, feature_columns=None, **kwargs
):
    """
    Logistic Regression model for attrition prediction.

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
    model = LogisticRegression(max_iter=2000)

    # Train the model
    model.fit(X_train, y_train)

    # Predict on test data
    y_pred = model.predict(X_test)

    # Evaluate the model
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)

    return {
        "model": model,
        "accuracy": accuracy,
        "report": report,
        "y_test": y_test,
        "y_pred": y_pred,
    }


def logistic_regression_binary(
    file_path=None,
    target_variable=None,
    feature_columns=None,
    binary_conditions=None,
    **kwargs,
):
    """
    Train and evaluate a Logistic Regression model on a binary classification task.

    Parameters:
    - file_path (str): Path to the CSV file.
    - target_variable (str): Name of the target variable column.
    - feature_columns (list): List of feature column names.
    - binary_conditions (list of dict): Conditions to generate the binary target variable.
    - **kwargs: Additional keyword arguments.

    Returns:
    - dict: Contains model, accuracy, classification report, etc.
    """
    if not target_variable:
        raise ValueError("Target variable must be specified for binary classification.")

    # Load the dataset
    df = pd.read_csv(file_path)

    # Generate binary target variable based on conditions
    if target_variable not in df.columns:
        if not binary_conditions:
            raise ValueError(
                f"Target variable '{target_variable}' not found in the dataset and no binary conditions provided."
            )
        try:
            df = generate_binary_condition(df, target_variable, binary_conditions)
            print(f"Generated target variable '{target_variable}'.")
        except Exception as e:
            print(f"Error generating target variable '{target_variable}': {e}")
            raise e

    # Save the modified DataFrame to a temporary CSV
    temp_file = "temp_binary_dataset.csv"
    df.to_csv(temp_file, index=False)

    try:
        # Load and preprocess data
        X, y = load_and_preprocess_data(
            temp_file,
            target_variable=target_variable,
            feature_columns=feature_columns,
            task_type="classification",
        )
    except Exception as e:
        os.remove(temp_file)  # Ensure temp file is removed in case of error
        raise e

    # Remove the temporary file
    os.remove(temp_file)

    # Split the data
    X_train, X_test, y_train, y_test = split_data(X, y)

    # Initialize the model
    model = LogisticRegression(max_iter=2000)

    # Train the model
    model.fit(X_train, y_train)

    # Predict on test data
    y_pred = model.predict(X_test)

    # Evaluate the model
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)

    return {
        "model": model,
        "accuracy": accuracy,
        "report": report,
        "y_test": y_test,
        "y_pred": y_pred,
    }
