# models/logistic_regression.py

import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from utils import (
    load_and_preprocess_data,
    split_data,
    generate_binary_condition,
    read_csv_with_encoding,
)


def logistic_regression_binary(
    file_path=None,
    target_variable=None,
    feature_columns=None,
    binary_conditions=None,
    sample_size=30,  # Added sample_size for summary
    random_state=42,
    **kwargs,
):
    """
    Train and evaluate a Logistic Regression model on a binary classification task.
    Prepares data for interactive visualization.
    """
    # New Logic Start: Check and set target_variable from binary_conditions if needed
    if target_variable is None:
        if binary_conditions and isinstance(binary_conditions, list):
            # Attempt to extract 'target_column' from the list of conditions
            target_columns = [
                condition["target_column"]
                for condition in binary_conditions
                if "target_column" in condition
            ]
            if not target_columns:
                raise ValueError(
                    "No 'target_column' found in binary_conditions. Target variable must be specified for binary classification."
                )
            if len(set(target_columns)) > 1:
                raise ValueError(
                    "Multiple 'target_column' values found in binary_conditions. Please ensure only one target_column is specified."
                )
            target_variable = target_columns[0]
            print(
                f"Using 'target_column' from binary_conditions as target_variable: '{target_variable}'"
            )
        else:
            raise ValueError(
                "Target variable must be specified for binary classification."
            )
    # New Logic End

    # Load the dataset
    df = read_csv_with_encoding(file_path)

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

    # Use load_and_preprocess_data to handle missing values and preprocessing
    X, y = load_and_preprocess_data(
        df,
        target_variable=target_variable,
        feature_columns=feature_columns,
        task_type="classification",
    )

    # Perform PCA for visualization
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    pca = PCA(n_components=2)
    X_pca = pca.fit_transform(X_scaled)

    # Split the data
    X_train, X_test, y_train, y_test = split_data(X_pca, y)

    # Initialize the model
    model = LogisticRegression(max_iter=2000, random_state=random_state)

    # Train the model
    model.fit(X_train, y_train)

    # Predict on test data
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)

    # Evaluate the model
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)
    confusion = confusion_matrix(y_test, y_pred).tolist()

    # Limit the number of data points for visualization
    max_points = 1000
    if len(X_pca) > max_points:
        indices = np.random.choice(len(X_pca), max_points, replace=False)
        X_pca_sample = X_pca[indices]
        y_sample = y.iloc[indices]
    else:
        X_pca_sample = X_pca
        y_sample = y

    # Prepare data for visualization
    graph1 = {
        "graph_type": "decision_boundary",
        "X_pca": X_pca_sample.tolist(),
        "y": y_sample.tolist(),
        "coefficients": model.coef_.tolist(),
        "intercept": model.intercept_.tolist(),
        "classes": model.classes_.tolist(),
    }

    graph3 = {
        "graph_type": "table",
        "classification_report": report,
    }

    graph4 = {
        "graph_type": "heatmap",
        "confusion_matrix": confusion,
        "labels": [str(label) for label in model.classes_],
    }

    result = {
        "model": "LogisticRegressionBinary",
        "accuracy": accuracy,
        "coefficients": model.coef_.tolist(),
        "intercept": model.intercept_.tolist(),
        "classes": model.classes_.tolist(),
        "graph1": graph1,
        "graph3": graph3,
        "graph4": graph4,
    }

    # Prepare summary data
    # For summary, sample a smaller subset for visualization
    actual_sample_size = min(sample_size, len(X_pca))
    indices_summary = np.random.choice(len(X_pca), actual_sample_size, replace=False)
    X_pca_sample_summary = X_pca[indices_summary]
    y_sample_summary = y.iloc[indices_summary]

    # Prepare data for visualization in summary
    graph1_summary = {
        "graph_type": "decision_boundary",
        "X_pca": X_pca_sample_summary.tolist(),
        "y": y_sample_summary.tolist(),
        "coefficients": model.coef_.tolist(),
        "intercept": model.intercept_.tolist(),
        "classes": model.classes_.tolist(),
    }
    # Build summary
    summary = {
        "model": "LogisticRegressionBinary",
        "accuracy": accuracy,
        "coefficients": model.coef_.tolist(),
        "intercept": model.intercept_.tolist(),
        "classes": model.classes_.tolist(),
        "graph1": graph1_summary,
        "graph3": graph3,  # Reuse the classification report
        "graph4": graph4,  # Reuse the confusion matrix
    }

    return {
        "status": "success",
        "result": result,
        "summary": summary,
    }


def logistic_regression_multinomial(
    file_path=None,
    target_variable=None,
    feature_columns=None,
    sample_size=30,  # Added sample_size for summary
    random_state=42,
    **kwargs,
):
    """
    Train and evaluate a Multinomial Logistic Regression model.
    Prepares data for interactive visualization.
    """
    if not target_variable:
        raise ValueError(
            "Target variable must be specified for multinomial classification."
        )

    # Load the dataset
    df = read_csv_with_encoding(file_path)

    # Load and preprocess data
    X, y = load_and_preprocess_data(
        df,
        target_variable=target_variable,
        feature_columns=feature_columns,
        task_type="classification",
    )

    # **새로운 단계:** 희소 클래스 병합
    class_counts = y.value_counts()
    threshold = 5  # 적절한 임계값 설정
    classes_to_keep = class_counts[class_counts >= threshold].index
    y = y.apply(lambda x: x if x in classes_to_keep else "Other")

    # 'Other' 클래스를 포함하지 않도록 필터링 (필요 시)
    X = X[y != "Other"]
    y = y[y != "Other"]

    # 클래스별 샘플 수 확인
    if y.value_counts().min() < 2:
        raise ValueError("병합 후에도 일부 클래스에 샘플이 2개 미만입니다.")

    # Perform PCA for visualization
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    pca = PCA(n_components=2, random_state=random_state)
    X_pca = pca.fit_transform(X_scaled)

    # Split the data
    X_train, X_test, y_train, y_test = split_data(X_pca, y)

    # Initialize the model with multinomial option
    model = LogisticRegression(
        multi_class="multinomial",
        solver="lbfgs",
        max_iter=2000,
        random_state=random_state,
    )

    # Train the model
    model.fit(X_train, y_train)

    # Predict on test data
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)

    # Evaluate the model
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)
    confusion = confusion_matrix(y_test, y_pred).tolist()

    # Limit the number of data points for visualization
    max_points = 1000
    if len(X_pca) > max_points:
        indices = np.random.choice(len(X_pca), max_points, replace=False)
        X_pca_sample = X_pca[indices]
        y_sample = y.iloc[indices]
    else:
        X_pca_sample = X_pca
        y_sample = y

    # Prepare data for visualization
    graph1 = {
        "graph_type": "decision_boundary",
        "X_pca": X_pca_sample.tolist(),
        "y": y_sample.tolist(),
        "coefficients": model.coef_.tolist(),
        "intercept": model.intercept_.tolist(),
        "classes": model.classes_.tolist(),
    }

    graph3 = {
        "graph_type": "table",
        "classification_report": report,
    }

    graph4 = {
        "graph_type": "heatmap",
        "confusion_matrix": confusion,
        "labels": [str(label) for label in model.classes_],
    }

    result = {
        "model": "LogisticRegressionMultinomial",
        "accuracy": accuracy,
        "coefficients": model.coef_.tolist(),
        "intercept": model.intercept_.tolist(),
        "classes": model.classes_.tolist(),
        "graph1": graph1,
        "graph3": graph3,
        "graph4": graph4,
    }

    # 모든 클래스 쌍의 결정 경계 라인 계산
    # 모든 클래스 쌍의 결정 경계 라인 계산

    lines = []
    n_classes = len(model.classes_)
    if n_classes > 2:
        for i in range(n_classes):
            for j in range(i + 1, n_classes):
                # 클래스 i와 클래스 j의 계수 차이 계산
                w_diff = np.array(model.coef_[i]) - np.array(model.coef_[j])
                b_diff = model.intercept_[i] - model.intercept_[j]
                if w_diff[1] != 0:
                    slope = -w_diff[0] / w_diff[1]
                    intercept_line = -b_diff / w_diff[1]
                    lines.append(
                        {
                            "class_pair": [model.classes_[i], model.classes_[j]],
                            "slope": slope,
                            "intercept": intercept_line,
                        }
                    )
                else:
                    # 기울기가 무한대인 경우 (수직선)
                    lines.append(
                        {
                            "class_pair": [model.classes_[i], model.classes_[j]],
                            "slope": np.inf,
                            "intercept": (
                                -b_diff / w_diff[0] if w_diff[0] != 0 else None
                            ),
                        }
                    )
    else:
        # 클래스가 두 개인 경우
        w = model.coef_[0]
        b = model.intercept_[0]
        if w[1] != 0:
            slope = -w[0] / w[1]
            intercept_line = -b / w[1]
            lines.append(
                {
                    "class_pair": [model.classes_[0], model.classes_[1]],
                    "slope": slope,
                    "intercept": intercept_line,
                }
            )
        else:
            # 기울기가 무한대인 경우 (수직선)
            lines.append(
                {
                    "class_pair": [model.classes_[0], model.classes_[1]],
                    "slope": np.inf,
                    "intercept": -b / w[0] if w[0] != 0 else None,
                }
            )

    # Prepare summary data
    # For summary, sample a smaller subset for visualization
    actual_sample_size = min(sample_size, len(X_pca))
    indices_summary = np.random.choice(len(X_pca), actual_sample_size, replace=False)
    X_pca_sample_summary = X_pca[indices_summary]
    y_sample_summary = y.iloc[indices_summary]

    # Prepare data for visualization in summary
    graph1_summary = {
        "graph_type": "decision_boundary",
        "X_pca": X_pca_sample_summary.tolist(),
        "y": y_sample_summary.tolist(),
        "coefficients": model.coef_.tolist(),
        "intercept": model.intercept_.tolist(),
        "classes": model.classes_.tolist(),
    }

    # Build summary
    summary = {
        "model": "LogisticRegressionMultinomial",
        "accuracy": accuracy,
        "coefficients": model.coef_.tolist(),
        "intercept": model.intercept_.tolist(),
        "classes": model.classes_.tolist(),
        "decision_boundaries": lines,  # 모든 결정 경계 라인 포함
        "graph1": graph1_summary,
        "graph3": graph3,  # Reuse the classification report
        "graph4": graph4,  # Reuse the confusion matrix
    }

    return {
        "status": "success",
        "result": result,
        "summary": summary,
    }
