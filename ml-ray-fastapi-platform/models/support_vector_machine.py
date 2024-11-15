# models/support_vector_machine.py

import pandas as pd
import numpy as np
from sklearn.svm import SVC, SVR
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    mean_squared_error,
    r2_score,
    roc_auc_score,
    precision_recall_curve,
    auc,
    roc_curve,
)
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import GridSearchCV
from sklearn.decomposition import PCA
from utils import load_and_preprocess_data, split_data, read_csv_with_encoding


def clean_data_for_json(data):
    """
    Recursively cleans data structures by converting non-serializable types
    and replacing NaN or infinite values with None.
    """
    if isinstance(data, dict):
        return {k: clean_data_for_json(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [clean_data_for_json(v) for v in data]
    elif isinstance(data, float):
        if np.isnan(data) or np.isinf(data):
            return None
        else:
            return data
    elif isinstance(data, np.ndarray):
        return clean_data_for_json(data.tolist())
    else:
        return data


def support_vector_machine_classification(
    file_path,
    target_variable=None,
    feature_columns=None,
    id_column=None,
    sample_size=5,
    kernel="rbf",
    C=1.0,
    gamma="scale",
    random_state=42,
    **kwargs,
):
    """
    Train and evaluate a Support Vector Machine model for classification.
    Includes only necessary data for visualizations.
    """
    try:
        # Load data and identifiers
        df = read_csv_with_encoding(file_path)

        # Handle categorical features
        categorical_features = (
            df[feature_columns].select_dtypes(include=["object"]).columns
        )
        if len(categorical_features) > 0:
            # Remove categorical features
            feature_columns = [
                f for f in feature_columns if f not in categorical_features
            ]

        if id_column and id_column in df.columns:
            identifiers = df[id_column]
        else:
            identifiers = pd.Series(np.arange(len(df)), name="Index")

        # Preprocess data
        X, y = load_and_preprocess_data(
            df,
            target_variable=target_variable,
            feature_columns=feature_columns,
            task_type="classification",
        )

        # Replace infinite values with NaN and then fill with mean
        X = X.replace([np.inf, -np.inf], np.nan)
        X = X.fillna(X.mean())

        identifiers = identifiers.loc[X.index]

        # Split data
        X_train, X_test, y_train, y_test, id_train, id_test = split_data(
            X, y, identifiers, return_ids=True, task_type="classification"
        )

        # Feature scaling
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        # Initialize and train model
        model = SVC(
            kernel=kernel,
            C=C,
            gamma=gamma,
            probability=True,
            random_state=random_state,
        )
        model.fit(X_train_scaled, y_train)

        # Predictions
        y_pred = model.predict(X_test_scaled)
        y_proba = model.predict_proba(X_test_scaled)

        # Evaluate model
        accuracy = accuracy_score(y_test, y_pred)
        report = classification_report(y_test, y_pred, output_dict=True)
        confusion = confusion_matrix(y_test, y_pred).tolist()

        # Calculate ROC AUC score and Precision-Recall AUC
        roc_auc = pr_auc = None
        fpr = tpr = roc_thresholds = precision = recall = pr_thresholds = None
        if len(model.classes_) == 2:
            try:
                roc_auc = roc_auc_score(y_test, y_proba[:, 1])
                fpr, tpr, roc_thresholds = roc_curve(y_test, y_proba[:, 1])
                precision, recall, pr_thresholds = precision_recall_curve(
                    y_test, y_proba[:, 1]
                )
                pr_auc = auc(recall, precision)
            except Exception:
                pass

        # Prepare data for visualization (reduced size)
        # PCA 부분 수정
        pca = PCA(n_components=2)
        X_vis = pca.fit_transform(X_test_scaled)  # PCA는 테스트 데이터에만 적용
        y_vis = y_test.tolist()

        # Limit data size for visualization
        max_points = 200
        if len(X_vis) > max_points:
            X_vis = X_vis[:max_points]
            y_vis = y_vis[:max_points]

        # 결정 경계 계산을 위한 그리드 생성
        x_min, x_max = X_vis[:, 0].min() - 1, X_vis[:, 0].max() + 1
        y_min, y_max = X_vis[:, 1].min() - 1, X_vis[:, 1].max() + 1
        xx, yy = np.meshgrid(
            np.linspace(x_min, x_max, 100), np.linspace(y_min, y_max, 100)
        )

        # 새로운 SVM 모델을 PCA 변환된 데이터로 학습
        svm_vis = SVC(
            kernel=kernel,
            C=C,
            gamma=gamma,
            probability=True,
            random_state=random_state,
        )
        svm_vis.fit(X_vis, y_test[: len(X_vis)])  # 시각화용 모델 학습

        # 결정 경계 계산
        grid_points = np.c_[xx.ravel(), yy.ravel()]
        Z = svm_vis.decision_function(grid_points)
        Z = Z.reshape(xx.shape)

        # Prepare results
        result = {
            "model": "SupportVectorMachineClassifier",
            "kernel": kernel,
            "C": C,
            "gamma": gamma,
            "accuracy": accuracy,
            "roc_auc_score": roc_auc,
            "pr_auc": pr_auc,
            "graph1": {
                "graph_type": "roc_curve" if roc_auc else None,
                "fpr": fpr.tolist() if fpr is not None else None,
                "tpr": tpr.tolist() if tpr is not None else None,
            },
            "graph2": {
                "graph_type": "decision_boundary",
                "X_vis": X_vis.tolist(),
                "y_vis": y_vis,
                "xx": xx.tolist(),
                "yy": yy.tolist(),
                "Z": Z.tolist(),
            },
            "graph3": {
                "graph_type": "classification_report",
                "classification_report": report,
            },
            "graph4": {
                "graph_type": "confusion_matrix",
                "confusion_matrix": confusion,
                "labels": [str(label) for label in model.classes_],
            },
        }

        # Prepare summary (simplified)
        summary = {
            "model": "SupportVectorMachineClassifier",
            "accuracy": accuracy,
            "roc_auc_score": roc_auc,
            "graph1": result["graph1"],
            "graph2": {
                "graph_type": "decision_boundary",
                "X_vis": X_vis.tolist(),
                "y_vis": y_vis,
                "xx": xx[::10, ::10].tolist(),  # 3단위로 샘플링하여 크기 축소
                "yy": yy[::10, ::10].tolist(),  # 3단위로 샘플링하여 크기 축소
                "Z": Z[::10, ::10].tolist(),  # 3단위로 샘플링하여 크기 축소
            },
            "graph3": result["graph3"],
            "graph4": result["graph4"],
        }

        # Clean data before returning
        result_clean = clean_data_for_json(result)
        summary_clean = clean_data_for_json(summary)

        return {"status": "success", "result": result_clean, "summary": summary_clean}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def support_vector_machine_regression(
    file_path,
    target_variable=None,
    feature_columns=None,
    id_column=None,
    sample_size=5,
    param_grid=None,
    random_state=42,
    **kwargs,
):
    """
    Train and evaluate a Support Vector Machine model for regression with hyperparameter tuning.
    Includes only necessary data for visualizations.
    """
    try:
        # Load data and identifiers
        df = read_csv_with_encoding(file_path)
        if id_column and id_column in df.columns:
            identifiers = df[id_column]
        else:
            identifiers = pd.Series(np.arange(len(df)), name="Index")

        # Preprocess data
        X, y = load_and_preprocess_data(
            df,
            target_variable=target_variable,
            feature_columns=feature_columns,
            task_type="regression",
        )
        identifiers = identifiers.loc[X.index]

        # Replace infinite values with NaN and then fill with mean
        X = X.replace([np.inf, -np.inf], np.nan)
        X = X.fillna(X.mean())

        # Split data
        X_train, X_test, y_train, y_test, id_train, id_test = split_data(
            X, y, identifiers, return_ids=True, task_type="regression"
        )

        # Feature scaling
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        # Default parameter grid if none provided
        if param_grid is None:
            param_grid = {
                "C": [0.1, 1, 10],
                "gamma": ["scale", "auto"],
                "epsilon": [0.1, 0.2],
                "kernel": ["rbf", "linear"],
            }

        # Initialize and train model with GridSearchCV
        model = SVR()
        grid_search = GridSearchCV(
            model, param_grid, cv=3, scoring="r2", n_jobs=-1, verbose=0
        )
        grid_search.fit(X_train_scaled, y_train)

        # Best model
        best_model = grid_search.best_estimator_
        best_params = grid_search.best_params_

        # Predictions
        y_pred = best_model.predict(X_test_scaled)

        # Evaluate model
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)

        # Prepare data for visualization (reduced size)
        # Use PCA to reduce to 1 or 2 dimensions for visualization
        n_components = 1 if X_test_scaled.shape[1] > 1 else X_test_scaled.shape[1]
        pca = PCA(n_components=n_components)
        X_vis = pca.fit_transform(X_test_scaled)
        y_vis = y_test.tolist()
        y_pred_vis = y_pred.tolist()

        # Limit data size for visualization
        max_points = 200  # Adjust as needed
        if len(X_vis) > max_points:
            X_vis = X_vis[:max_points]
            y_vis = y_vis[:max_points]
            y_pred_vis = y_pred_vis[:max_points]

        # Prepare results
        result = {
            "model": "SupportVectorMachineRegressor",
            "best_params": best_params,
            "mse": mse,
            "r2_score": r2,
            "graph1": {
                "graph_type": "regression_plot",
                "X_vis": (
                    X_vis.flatten().tolist() if n_components == 1 else X_vis.tolist()
                ),
                "y_vis": y_vis,
                "y_pred": y_pred_vis,
            },
        }

        # Prepare summary (simplified)
        summary = {
            "model": "SupportVectorMachineRegressor",
            "r2_score": r2,
            "graph1": result["graph1"],
        }

        # Clean data before returning
        result_clean = clean_data_for_json(result)
        summary_clean = clean_data_for_json(summary)

        return {"status": "success", "result": result_clean, "summary": summary_clean}
    except Exception as e:
        return {"status": "error", "message": str(e)}
