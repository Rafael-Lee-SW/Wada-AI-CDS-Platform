# models/kmeans.py

from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import pandas as pd
from utils import load_and_preprocess_data
import plotly.express as px
import plotly.graph_objects as go
import json
import numpy as np
from sklearn.decomposition import PCA
from sklearn.metrics import pairwise_distances

def generate_cluster_distribution(clustered_data, cluster_label):
    """
    클러스터별 데이터 포인트 수를 나타내는 막대 그래프 생성.

    Parameters:
        clustered_data (pd.DataFrame): 클러스터링된 데이터.
        cluster_label (str): 클러스터 라벨 컬럼 이름.

    Returns:
        dict: Plotly 막대 그래프의 JSON 표현.
    """
    distribution = clustered_data[cluster_label].value_counts().reset_index()
    distribution.columns = [cluster_label, "Count"]

    fig = px.bar(
        distribution,
        x=cluster_label,
        y="Count",
        title="클러스터별 데이터 포인트 수",
        labels={cluster_label: "클러스터", "Count": "데이터 포인트 수"},
    )

    return fig.to_dict()


def generate_cluster_scatter(clustered_data, scaler, feature_columns, cluster_label):
    """
    클러스터링된 데이터를 2차원 산점도로 시각화하는 그래프 생성.

    Parameters:
        clustered_data (pd.DataFrame): 클러스터링된 데이터.
        scaler (StandardScaler): 데이터 스케일러 객체.
        feature_columns (list of str): 사용된 특성 열 이름.
        cluster_label (str): 클러스터 라벨 컬럼 이름.

    Returns:
        dict: Plotly 산점도 그래프의 JSON 표현.
    """
    # 주성분 분석(PCA)을 통해 2차원으로 축소
    pca = PCA(n_components=2)
    principal_components = pca.fit_transform(
        scaler.transform(clustered_data[feature_columns])
    )
    clustered_data = clustered_data.copy()  # 원본 데이터 프레임을 변경하지 않도록 복사
    clustered_data["PC1"] = principal_components[:, 0]
    clustered_data["PC2"] = principal_components[:, 1]

    fig = px.scatter(
        clustered_data,
        x="PC1",
        y="PC2",
        color=cluster_label,
        title="클러스터링 결과 산점도 (PCA 기반)",
        labels={"PC1": "주성분 1", "PC2": "주성분 2", cluster_label: "클러스터"},
        hover_data=["Salary", "TenureDays"],
    )  # 필요에 따라 추가 정보 포함

    # 클러스터 중심점 표시
    centers_pca = pca.transform(
        scaler.transform(clustered_data.groupby(cluster_label).mean()[feature_columns])
    )
    centers_df = pd.DataFrame(centers_pca, columns=["PC1", "PC2"])
    centers_df[cluster_label] = clustered_data[cluster_label].unique()

    # plotly.graph_objects.Scatter를 사용하여 클러스터 센터 추가
    fig.add_trace(
        go.Scatter(
            x=centers_df["PC1"],
            y=centers_df["PC2"],
            mode="markers",
            marker=dict(size=15, symbol="x", color="black"),
            name="클러스터 센터",
        )
    )

    return fig.to_dict()


def kmeans_clustering(
    file_path, feature_columns=None, num_clusters=3, cluster_label="Cluster", **kwargs
):
    """
    일반화된 K-Means 클러스터링 함수.

    Parameters:
        file_path (str): CSV 데이터셋 파일 경로.
        feature_columns (list of str): 사용될 특성 열 이름 리스트.
        num_clusters (int): 클러스터 수.
        cluster_label (str): 클러스터 할당 라벨 이름.
        **kwargs: 추가 인자.

    Returns:
        dict: 클러스터링된 데이터, 스케일러 정보, 클러스터 센터, 그래프 데이터를 포함하는 사전.
    """
    # 데이터 로드 및 전처리
    X, y = load_and_preprocess_data(
        data=file_path,
        target_variable=None,
        feature_columns=feature_columns,
        encode_categorical=True,
        fill_missing=True,
    )

    # 실제 사용된 특성 컬럼 추출
    actual_feature_columns = X.columns.tolist()

    # 특성 스케일링
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # 스케일링된 데이터를 DataFrame으로 변환
    X_scaled_df = pd.DataFrame(X_scaled, columns=actual_feature_columns)

    # K-Means 클러스터링
    kmeans = KMeans(n_clusters=num_clusters, random_state=42)
    kmeans.fit(X_scaled_df)

    # 클러스터 라벨 추가
    X[cluster_label] = kmeans.labels_

    # 클러스터 분포 그래프 생성
    cluster_distribution_graph = generate_cluster_distribution(X, cluster_label)

    # 클러스터 산점도 그래프 생성
    cluster_scatter_graph = generate_cluster_scatter(
        X, scaler, actual_feature_columns, cluster_label
    )

    # Prepare scaler information as separate entries
    scaler_info = {
        "with_mean": scaler.with_mean,
        "with_std": scaler.with_std,
        "feature_names_in_": list(X.columns),
        "n_features_in_": scaler.scale_.shape[0],
        "mean_": scaler.mean_.tolist(),
        "scale_": scaler.scale_.tolist(),
    }

    # Include cluster centers
    cluster_centers = kmeans.cluster_centers_.tolist()

    return {
        "clustered_data": X.to_dict(orient="records"),
        **scaler_info,  # Flatten scaler information into the top-level dictionary
        "cluster_centers": cluster_centers,  # Include cluster centers
        "graph1": {"graph_type": "bar", "data": cluster_distribution_graph},
        "graph2": {"graph_type": "scatter", "data": cluster_scatter_graph},
        "feature_columns_used": actual_feature_columns,  # 실제 사용된 특성 컬럼 반환
    }


def kmeans_clustering_segmentation(
    file_path, feature_columns=None, num_clusters=3, **kwargs
):
    """
    세분화를 위한 K-Means 클러스터링.

    Parameters:
        file_path (str): CSV 데이터셋 파일 경로.
        feature_columns (list of str): 사용될 특성 열 이름 리스트.
        num_clusters (int): 클러스터 수.
        **kwargs: 추가 인자.

    Returns:
        dict: 모델 유형, 클러스터링된 데이터, 스케일러 정보, 클러스터 센터, 그래프 데이터를 포함하는 사전.
    """
    result = kmeans_clustering(
        file_path=file_path,
        feature_columns=feature_columns,
        num_clusters=num_clusters,
        cluster_label="Cluster_Segmentation",
        **kwargs
    )

    # Add model type
    result["model"] = "KmeansClusteringSegmentation"

    return result


def kmeans_clustering_anomaly_detection(
    file_path, feature_columns=None, num_clusters=3, threshold=1.5, **kwargs
):
    """
    이상 탐지를 위한 K-Means 클러스터링.

    Parameters:
        file_path (str): CSV 데이터셋 파일 경로.
        feature_columns (list of str): 사용될 특성 열 이름 리스트.
        num_clusters (int): 클러스터 수.
        threshold (float): 이상치로 간주할 거리 임계값.
        **kwargs: 추가 인자.

    Returns:
        dict: 모델 유형, 클러스터링된 데이터, 스케일러 정보, 클러스터 센터, 그래프 데이터, 이상치 데이터를 포함하는 사전.
    """
    # 클러스터링 수행
    result = kmeans_clustering(
        file_path=file_path,
        feature_columns=feature_columns,
        num_clusters=num_clusters,
        cluster_label="Cluster_Anomaly",
        **kwargs
    )

    # 클러스터링된 데이터를 DataFrame으로 변환
    clustered_df = pd.DataFrame(result["clustered_data"])

    # 스케일링된 특성 데이터 준비
    scaler = StandardScaler(
        with_mean=result["with_mean"], with_std=result["with_std"]
    )
    scaler.mean_ = np.array(result["mean_"])
    scaler.scale_ = np.array(result["scale_"])

    # 스케일러로 변환된 특성 데이터만 선택
    feature_columns_used = result["feature_columns_used"]
    X_scaled = scaler.transform(clustered_df[feature_columns_used])

    # 클러스터 중심 데이터 준비
    cluster_centers = np.array(result["cluster_centers"])

    # 클러스터 중심까지의 최소 거리 계산
    distances = pairwise_distances(X_scaled, cluster_centers, metric='euclidean').min(axis=1)
    clustered_df["Distance"] = distances

    # 이상치 식별
    anomalies = clustered_df[distances > threshold]

    # 이상치 그래프 생성 (이상치 분포)
    anomaly_distribution_graph = generate_cluster_distribution(
        anomalies, "Cluster_Anomaly"
    )

    # 이상치 산점도 그래프 생성
    anomaly_scatter_graph = generate_cluster_scatter(
        anomalies, scaler, feature_columns_used, "Cluster_Anomaly"
    )

    # 그래프 데이터 추가 directly without 'graphs' key
    result["graph3"] = {
        "graph_type": "bar",
        "data": anomaly_distribution_graph,
    }
    result["graph4"] = {
        "graph_type": "scatter",
        "data": anomaly_scatter_graph,
    }
    result["anomalies"] = anomalies.to_dict(orient="records")

    # Add model type
    result["model"] = "KmeansClusteringAnomalyDetection"

    return result
