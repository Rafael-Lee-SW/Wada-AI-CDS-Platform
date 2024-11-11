# models/kmeans.py

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from utils import load_and_preprocess_data


def kmeans_clustering(
    file_path,
    feature_columns=None,
    num_clusters=3,
    cluster_label="Cluster",
    sample_size=10,  # Added sample_size for summary
    random_state=42,
    **kwargs
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

    # K-Means clustering
    kmeans = KMeans(n_clusters=num_clusters, random_state=random_state)
    kmeans.fit(X_scaled)

    # Add cluster labels to original data
    X[cluster_label] = kmeans.labels_

    # Limit the number of data points for visualization
    max_points = 1000
    if len(X) > max_points:
        sampled_indices = np.random.choice(X.index, size=max_points, replace=False)
        X_sampled = X.loc[sampled_indices]
    else:
        X_sampled = X.copy()

    # Prepare data for visualization
    graph4 = {
        "graph_type": "data_sample",
        "clustered_data_sample": X_sampled.to_dict(orient="list"),
    }

    # Send essential model parameters
    result = {
        "model": "KmeansClusteringSegmentation",
        "n_clusters": num_clusters,
        "cluster_centers": kmeans.cluster_centers_.tolist(),
        "scaler_mean": scaler.mean_.tolist(),
        "scaler_scale": scaler.scale_.tolist(),
        "feature_columns_used": actual_feature_columns,
        "cluster_label": cluster_label,
        # Graphs
        "graph1": {
            "graph_type": "bar",
            # We can send cluster sizes instead of full data
            "cluster_sizes": X[cluster_label].value_counts().to_dict(),
        },
        "graph2": {
            "graph_type": "scatter",
            # Data will be computed in visualization code
        },
        "graph3": {
            "graph_type": "table",
            "cluster_centers": kmeans.cluster_centers_.tolist(),
            "feature_names": actual_feature_columns,
        },
        "graph4": graph4,
    }

    # Prepare summary data
    # For summary, sample a smaller subset for visualization
    actual_sample_size = min(sample_size, len(X))
    sampled_indices_summary = np.random.choice(
        X.index, size=actual_sample_size, replace=False
    )
    X_sampled_summary = X.loc[sampled_indices_summary]

    # Prepare data for visualization in summary
    graph4_summary = {
        "graph_type": "data_sample",
        "clustered_data_sample": X_sampled_summary.to_dict(orient="list"),
    }

    # Build summary
    summary = {
        "model": "KmeansClusteringSegmentation",
        "n_clusters": num_clusters,
        "cluster_centers": kmeans.cluster_centers_.tolist(),
        "scaler_mean": scaler.mean_.tolist(),
        "scaler_scale": scaler.scale_.tolist(),
        "feature_columns_used": actual_feature_columns,
        "cluster_label": cluster_label,
        # Graphs
        "graph1": result["graph1"],  # Reuse graph1 from result
        "graph3": result["graph3"],  # Reuse graph3 from result
        "graph4": graph4_summary,  # Use the reduced data sample
    }

    return {
        "status": "success",
        "result": result,
        "summary": summary,
    }


def kmeans_clustering_segmentation(
    file_path,
    feature_columns=None,
    num_clusters=3,
    sample_size=10,  # Added sample_size for summary
    random_state=42,
    **kwargs
):
    result = kmeans_clustering(
        file_path=file_path,
        feature_columns=feature_columns,
        num_clusters=num_clusters,
        cluster_label="Cluster_Segmentation",
        sample_size=sample_size,
        random_state=random_state,
        **kwargs
    )
    return result


def kmeans_clustering_anomaly_detection(
    file_path,
    feature_columns=None,
    num_clusters=3,
    sample_size=10,  # Added sample_size for summary
    random_state=42,
    **kwargs
):
    clustering_result = kmeans_clustering(
        file_path=file_path,
        feature_columns=feature_columns,
        num_clusters=num_clusters,
        cluster_label="Cluster_Anomaly",
        sample_size=sample_size,
        random_state=random_state,
        **kwargs
    )

    # For anomalies, we only send the necessary parameters
    # Anomalies will be computed in visualization code

    # Update the model name
    clustering_result["result"]["model"] = "KMeansClusteringAnomalyDetection"
    clustering_result["summary"]["model"] = "KMeansClusteringAnomalyDetection"

    return clustering_result
