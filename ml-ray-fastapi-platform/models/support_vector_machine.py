# models/support_vector_machine.py

import pandas as pd  # pandas 라이브러리 import
import numpy as np  # numpy 라이브러리 import
from sklearn.svm import (
    SVC,
    SVR,
)  # Support Vector Classifier와 Regressor 임포트 (SVC and SVR)
from sklearn.metrics import (
    accuracy_score,  # 정확도 평가 함수
    classification_report,  # 분류 Report 생성 함수
    confusion_matrix,  # 혼동 행렬 생성 함수
    mean_squared_error,  # 평균 제곱 오차 계산 함수
    r2_score,  # 결정 계수 계산 함수
    roc_auc_score,  # ROC AUC 점수 계산 함수
    precision_recall_curve,  # 정밀도-재현율 곡선 계산 함수
    auc,  # 면적 계산 함수
    roc_curve,  # ROC 곡선 계산 함수
)
from sklearn.preprocessing import StandardScaler  # 데이터 스케일링을 위한 스케일러
from sklearn.model_selection import GridSearchCV  # 그리드 서치 교차 검증
from sklearn.decomposition import PCA  # 주성분 분석

# 직접 정의한 데이터 가공 함수들
from utils import load_and_preprocess_data, split_data, read_csv_with_encoding


def clean_data_for_json(data):
    """
    Recursively cleans data structures by converting non-serializable types
    and replacing NaN or infinite values with None.
    -
    JSON으로 직렬화할 수 없는 타입을 변환하고, NaN 또는 무한대 값을 None으로 대체하여 데이터 구조를 재귀적으로 정리합니다.
    """
    if isinstance(data, dict):
        return {k: clean_data_for_json(v) for k, v in data.items()}  # 딕셔너리의 각 값에 대해 재귀 호출
    elif isinstance(data, list):
        return [clean_data_for_json(v) for v in data]  # 리스트의 각 요소에 대해 재귀 호출
    elif isinstance(data, float):
        if np.isnan(data) or np.isinf(data):
            return None  # NaN 또는 무한대인 경우 None으로 대체
        else:
            return data  # 그렇지 않으면 원래 값 반환
    elif isinstance(data, np.ndarray):
        return clean_data_for_json(data.tolist())  # ndarray인 경우 리스트로 변환 후 재귀 호출
    else:
        return data  # 그 외의 경우 원래 값 반환


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
    -
    분류를 위한 서포트 벡터 머신 모델을 학습하고 평가
    시각화를 위해 필요한 데이터만 포함
    """
    try:
        # 데이터 및 식별자 불러오기
        df = read_csv_with_encoding(file_path)  # 한글파일도 encoding할 수 있도록 직접 정의한 것 활용

        # 범주형 특징 처리
        categorical_features = (
            df[feature_columns].select_dtypes(include=["object"]).columns
        )
        if len(categorical_features) > 0:
            # 범주형 특징 제거
            feature_columns = [
                f for f in feature_columns if f not in categorical_features
            ]

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

        # 무한대 값을 NaN으로 대체한 후 평균으로 채움
        X = X.replace([np.inf, -np.inf], np.nan)
        X = X.fillna(X.mean())

        identifiers = identifiers.loc[X.index]

        # 데이터 분할
        X_train, X_test, y_train, y_test, id_train, id_test = split_data(
            X, y, identifiers, return_ids=True, task_type="classification"
        )

        # 특성 스케일링
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        # 모델 초기화 및 학습
        model = SVC(
            kernel=kernel,
            C=C,
            gamma=gamma,
            probability=True,
            random_state=random_state,
        )
        model.fit(X_train_scaled, y_train)

        # 예측 수행
        y_pred = model.predict(X_test_scaled)
        y_proba = model.predict_proba(X_test_scaled)

        # 모델 평가
        accuracy = accuracy_score(y_test, y_pred)
        report = classification_report(y_test, y_pred, output_dict=True)
        confusion = confusion_matrix(y_test, y_pred).tolist()

        # ROC AUC 점수 및 정밀도-재현율 AUC 계산
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

        # 시각화를 위한 데이터 준비 (크기 축소)
        pca = PCA(n_components=2)
        X_vis = pca.fit_transform(X_test_scaled)  # PCA는 테스트 데이터에만 적용
        y_vis = y_test.tolist()

        # 시각화를 위한 데이터 크기 제한
        max_points = 200
        if len(X_vis) > max_points:
            X_vis = X_vis[:max_points]
            y_vis = y_vis[:max_points]
            id_test_sample = id_test.tolist()[:max_points]  # 시각화 데이터에 해당하는 식별자
        else:
            id_test_sample = id_test.tolist()  # 시각화 데이터에 해당하는 식별자

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

        # 결과 준비
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
                "ids_vis": id_test_sample,  # 시각화 데이터에 해당하는 식별자 추가
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
                "ids_vis": id_test_sample[:10],  # 시각화 데이터 식별자 중 최대 10개 샘플 포함
                "xx": xx[::10, ::10].tolist(),  # 그리드 데이터 샘플링 (크기 축소)
                "yy": yy[::10, ::10].tolist(),
                "Z": Z[::10, ::10].tolist(),
            },
            "graph3": result["graph3"],
            "graph4": result["graph4"],
            "identifiers": {
                "id_vis_sample": id_test_sample[:10],  # 시각화 데이터 식별자 중 10개 샘플 포함
            },
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
    -
    회귀를 위한 서포트 벡터 머신 모델을 학습하고 평가하며, 하이퍼파라미터 튜닝을 수행합니다.
    시각화를 위해 필요한 데이터만 포함됩니다.
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
            id_test_sample = id_test.tolist()[:max_points]  # 시각화 데이터에 해당하는 식별자
        else:
            id_test_sample = id_test.tolist()  # 시각화 데이터에 해당하는 식별자

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
                "ids_vis": id_test_sample,  # 시각화 데이터에 해당하는 식별자 추가
            },
        }

        # Prepare summary (simplified)
        summary = {
            "model": "SupportVectorMachineRegressor",
            "r2_score": r2,
            "graph1": result["graph1"],
            "identifiers": {
                "id_vis_sample": id_test_sample[:10],  # 시각화 데이터 식별자 중 10개 샘플 포함
            },
        }

        # Clean data before returning
        result_clean = clean_data_for_json(result)
        summary_clean = clean_data_for_json(summary)

        return {"status": "success", "result": result_clean, "summary": summary_clean}
    except Exception as e:
        return {"status": "error", "message": str(e)}
