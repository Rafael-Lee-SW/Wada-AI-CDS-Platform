# models/kmeans.py

from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import pandas as pd
from utils import load_and_preprocess_data
import plotly.express as px
import plotly.graph_objects as go
import numpy as np
from sklearn.decomposition import PCA
from sklearn.metrics import pairwise_distances

def generate_cluster_distribution(clustered_data, cluster_label):
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
    # PCA for dimensionality reduction
    pca = PCA(n_components=2)
    principal_components = pca.fit_transform(
        scaler.transform(clustered_data[feature_columns])
    )
    clustered_data = clustered_data.copy()
    clustered_data["PC1"] = principal_components[:, 0]
    clustered_data["PC2"] = principal_components[:, 1]

    fig = px.scatter(
        clustered_data,
        x="PC1",
        y="PC2",
        color=cluster_label,
        title="클러스터링 결과 산점도 (PCA 기반)",
        labels={"PC1": "주성분 1", "PC2": "주성분 2", cluster_label: "클러스터"},
        hover_data=feature_columns,  # Include essential hover data
    )

    # Add cluster centers
    centers_pca = pca.transform(
        scaler.transform(clustered_data.groupby(cluster_label).mean()[feature_columns])
    )
    centers_df = pd.DataFrame(centers_pca, columns=["PC1", "PC2"])
    centers_df[cluster_label] = clustered_data[cluster_label].unique()

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
    # Load and preprocess data
    X, y = load_and_preprocess_data(
        data=file_path,
        target_variable=None,
        feature_columns=feature_columns,
        encode_categorical=True,
        fill_missing=True,
    )

    # Feature columns after preprocessing
    actual_feature_columns = X.columns.tolist()

    # Feature scaling
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Convert scaled data back to DataFrame
    X_scaled_df = pd.DataFrame(X_scaled, columns=actual_feature_columns)

    # K-Means clustering
    kmeans = KMeans(n_clusters=num_clusters, random_state=42)
    kmeans.fit(X_scaled_df)

    # Add cluster labels
    X[cluster_label] = kmeans.labels_

    # Adjust feature_columns to include existing columns
    selected_columns = [col for col in feature_columns if col in X.columns]

    # Include one-hot encoded columns
    one_hot_columns = [
        col for col in X.columns if any(orig_col in col for orig_col in feature_columns if orig_col not in selected_columns)
    ]

    all_selected_columns = selected_columns + one_hot_columns + [cluster_label]

    # Select only existing columns
    clustered_data = X[all_selected_columns]

    # Update feature_columns_used
    feature_columns_used = all_selected_columns

    # Generate graphs
    cluster_distribution_graph = generate_cluster_distribution(X, cluster_label)
    cluster_scatter_graph = generate_cluster_scatter(
        X, scaler, actual_feature_columns, cluster_label
    )

    # Prepare return data following the desired format
    result = {
        "model": "KmeansClusteringSegmentation",
        "n_clusters": num_clusters,
        # Single variables
        "feature_columns_used": feature_columns_used,
        # Graphs and complex data
        "graph1": {
            "graph_type": "bar",
            "data": cluster_distribution_graph,
        },
        "graph2": {
            "graph_type": "scatter",
            "data": cluster_scatter_graph,
        },
        "graph3": {
            "graph_type": "table",
            "cluster_centers": kmeans.cluster_centers_.tolist(),
            "feature_names": actual_feature_columns,
        },
        "graph4": {
            "graph_type": "table",
            "clustered_data": clustered_data.to_dict(orient="records"),
        },
    }

    return result

def kmeans_clustering_segmentation(
    file_path, feature_columns=None, num_clusters=3, **kwargs
):
    result = kmeans_clustering(
        file_path=file_path,
        feature_columns=feature_columns,
        num_clusters=num_clusters,
        cluster_label="Cluster_Segmentation",
        **kwargs
    )
    return result

def kmeans_clustering_anomaly_detection(
    file_path, feature_columns=None, num_clusters=3, threshold=1.5, **kwargs
):
    # Perform clustering
    result = kmeans_clustering(
        file_path=file_path,
        feature_columns=feature_columns,
        num_clusters=num_clusters,
        cluster_label="Cluster_Anomaly",
        **kwargs
    )

    # Convert clustered data to DataFrame
    clustered_df = pd.DataFrame(result["graph4"]["clustered_data"])

    # Reconstruct scaler
    scaler = StandardScaler()
    # Assume that the scaler was fit on the same data
    scaler.fit(clustered_df[feature_columns])

    # Compute distances to cluster centers
    X_scaled = scaler.transform(clustered_df[feature_columns])
    cluster_centers = np.array(result["graph3"]["cluster_centers"])
    distances = pairwise_distances(X_scaled, cluster_centers, metric='euclidean').min(axis=1)
    clustered_df["Distance"] = distances

    # Identify anomalies
    anomalies = clustered_df[distances > threshold]

    # Generate anomaly graphs
    anomaly_distribution_graph = generate_cluster_distribution(
        anomalies, "Cluster_Anomaly"
    )
    anomaly_scatter_graph = generate_cluster_scatter(
        anomalies, scaler, feature_columns, "Cluster_Anomaly"
    )

    # Update result
    result.update({
        "model": "KmeansClusteringAnomalyDetection",
        "threshold": threshold,  # Single variable
        "graph5": {
            "graph_type": "bar",
            "data": anomaly_distribution_graph,
        },
        "graph6": {
            "graph_type": "scatter",
            "data": anomaly_scatter_graph,
        },
        "graph7": {
            "graph_type": "table",
            "anomalies": anomalies.to_dict(orient="records"),
        },
    })

    return result
