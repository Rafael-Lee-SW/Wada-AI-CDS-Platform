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
from utils import load_and_preprocess_data, split_data


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
    """
    try:
        # Load data and identifiers
        df = pd.read_csv(file_path)

        # Handle categorical features
        categorical_features = df[feature_columns].select_dtypes(include=['object']).columns
        if len(categorical_features) > 0:
            # Remove categorical features
            feature_columns = [f for f in feature_columns if f not in categorical_features]

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
        try:
            if len(model.classes_) == 2:
                roc_auc = roc_auc_score(y_test, y_proba[:, 1])
                # ROC Curve
                fpr, tpr, roc_thresholds = roc_curve(y_test, y_proba[:, 1])
                # Precision-Recall curve
                precision, recall, pr_thresholds = precision_recall_curve(
                    y_test, y_proba[:, 1]
                )
                pr_auc = auc(recall, precision)
            else:
                # For multiclass, compute macro-average ROC AUC
                roc_auc = roc_auc_score(y_test, y_proba, multi_class="ovo", average="macro")
                fpr, tpr, roc_thresholds = None, None, None
                precision, recall, pr_thresholds = None, None, None
                pr_auc = None
        except Exception as e:
            roc_auc = None
            pr_auc = None
            fpr, tpr, roc_thresholds = None, None, None
            precision, recall, pr_thresholds = None, None, None

        # Prepare results
        result = {
            "model": "SupportVectorMachineClassifier",
            "kernel": kernel,
            "C": C,
            "gamma": gamma,
            "accuracy": accuracy,
            "roc_auc_score": roc_auc,
            "pr_auc": pr_auc,
            # Removed support_vectors to avoid large data and potential inf/NaN values
            # "support_vectors": model.support_vectors_.tolist(),
            "graph1": {
                "graph_type": "roc_curve" if roc_auc else None,
                "fpr": fpr.tolist() if fpr is not None else None,
                "tpr": tpr.tolist() if tpr is not None else None,
                "roc_thresholds": roc_thresholds.tolist()
                if roc_thresholds is not None
                else None,
                "precision": precision.tolist() if precision is not None else None,
                "recall": recall.tolist() if recall is not None else None,
                "pr_thresholds": pr_thresholds.tolist()
                if pr_thresholds is not None
                else None,
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

        # Prepare summary
        actual_sample_size = min(sample_size, len(y_test))
        sampled_indices = np.random.choice(
            len(y_test), size=actual_sample_size, replace=False
        )
        y_test_sample = y_test.iloc[sampled_indices].tolist()
        y_pred_sample = y_pred[sampled_indices].tolist()
        y_proba_sample = y_proba[sampled_indices].tolist()
        identifier_sample = id_test.iloc[sampled_indices].tolist()

        summary = {
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
                "roc_thresholds": roc_thresholds.tolist()
                if roc_thresholds is not None
                else None,
                "precision": precision.tolist() if precision is not None else None,
                "recall": recall.tolist() if recall is not None else None,
                "pr_thresholds": pr_thresholds.tolist()
                if pr_thresholds is not None
                else None,
            },
            "graph2": {
                "graph_type": "probability",
                "y_test_sample": y_test_sample,
                "y_pred_sample": y_pred_sample,
                "y_proba_sample": y_proba_sample,
                "identifier_sample": identifier_sample,
            },
            "graph3": {
                "graph_type": "table",
                "classification_report": report,
            },
            "graph4": result["graph4"],  # Reuse the confusion matrix
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
    """
    try:
        # Load data and identifiers
        df = pd.read_csv(file_path)
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
                "C": [0.1, 1, 10, 100],
                "gamma": ["scale", "auto", 0.1, 0.01],
                "epsilon": [0.1, 0.2, 0.5],
                "kernel": ["rbf", "linear", "poly"],
            }

        # Initialize and train model with GridSearchCV
        model = SVR()
        grid_search = GridSearchCV(
            model, param_grid, cv=5, scoring="r2", n_jobs=-1, verbose=1
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

        # Prepare results
        result = {
            "model": "SupportVectorMachineRegressor",
            "best_params": best_params,
            "mse": mse,
            "r2_score": r2,
            # Removed support_vectors to avoid large data and potential inf/NaN values
            # "support_vectors": best_model.support_.tolist(),
            "graph1": {
                "graph_type": "regression_plot",
                "y_test": y_test.tolist(),
                "y_pred": y_pred.tolist(),
                "identifier": id_test.tolist(),
            },
        }

        # Prepare summary
        actual_sample_size = min(sample_size, len(y_test))
        sampled_indices = np.random.choice(
            len(y_test), size=actual_sample_size, replace=False
        )
        y_test_sample = y_test.iloc[sampled_indices].tolist()
        y_pred_sample = y_pred[sampled_indices].tolist()
        identifier_sample = id_test.iloc[sampled_indices].tolist()

        summary = {
            "model": "SupportVectorMachineRegressor",
            "best_params": best_params,
            "mse": mse,
            "r2_score": r2,
            "graph1": {
                "graph_type": "regression_plot",
                "y_test_sample": y_test_sample,
                "y_pred_sample": y_pred_sample,
                "identifier_sample": identifier_sample,
            },
        }

        # Clean data before returning
        result_clean = clean_data_for_json(result)
        summary_clean = clean_data_for_json(summary)

        return {"status": "success", "result": result_clean, "summary": summary_clean}
    except Exception as e:
        return {"status": "error", "message": str(e)}
