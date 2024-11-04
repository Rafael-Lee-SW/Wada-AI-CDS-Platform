# models/kmeans.py

from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import pandas as pd
from utils import load_and_preprocess_data

def kmeans_clustering(
    file_path, 
    feature_columns=None, 
    num_clusters=3, 
    cluster_label="Cluster", 
    **kwargs
):
    """
    Generalized K-Means clustering function.

    Parameters:
        file_path (str): Path to the CSV dataset file.
        feature_columns (list of str): List of feature column names.
        num_clusters (int): Number of clusters.
        cluster_label (str): Label name for the cluster assignments.
        **kwargs: Additional arguments.

    Returns:
        dict: Contains the model, clustered data, and scaler.
    """
    # Load and preprocess data
    X, _ = load_and_preprocess_data(
        file_path,
        target_variable=None,
        feature_columns=feature_columns,
        encode_categorical=True,
        fill_missing=True,
    )

    # Feature scaling
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # K-Means clustering
    kmeans = KMeans(n_clusters=num_clusters, random_state=42)
    kmeans.fit(X_scaled)

    # Add cluster labels
    X[cluster_label] = kmeans.labels_

    return {
        "kmeans_model": kmeans,
        "clustered_data": X,
        "scaler": scaler
    }

def kmeans_clustering_segmentation(
    file_path, 
    feature_columns=None, 
    num_clusters=3, 
    **kwargs
):
    """
    K-Means clustering for segmentation.

    Parameters:
        file_path (str): Path to the CSV dataset file.
        feature_columns (list of str): List of feature column names.
        num_clusters (int): Number of clusters.

    Returns:
        dict: Contains the model, clustered data, and scaler.
    """
    return kmeans_clustering(
        file_path=file_path,
        feature_columns=feature_columns,
        num_clusters=num_clusters,
        cluster_label="Cluster_Segmentation",
        **kwargs
    )

def kmeans_clustering_anomaly_detection(
    file_path, 
    feature_columns=None, 
    num_clusters=3, 
    threshold=1.5, 
    **kwargs
):
    """
    K-Means clustering for anomaly detection.

    Parameters:
        file_path (str): Path to the CSV dataset file.
        feature_columns (list of str): List of feature column names.
        num_clusters (int): Number of clusters.
        threshold (float): Threshold for considering a data point as an anomaly.

    Returns:
        dict: Contains the model, clustered data, scaler, and anomalies.
    """
    # Load and preprocess data
    X, _ = load_and_preprocess_data(
        file_path,
        target_variable=None,
        feature_columns=feature_columns,
        encode_categorical=True,
        fill_missing=True,
    )

    # Feature scaling
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # K-Means clustering
    kmeans = KMeans(n_clusters=num_clusters, random_state=42)
    kmeans.fit(X_scaled)

    # Add cluster labels
    X["Cluster_Anomaly"] = kmeans.labels_

    # Calculate distances to cluster centers
    distances = kmeans.transform(X_scaled).min(axis=1)

    # Identify anomalies
    X["Distance"] = distances
    anomalies = X[distances > threshold]

    return {
        "kmeans_model": kmeans,
        "clustered_data": X,
        "scaler": scaler,
        "anomalies": anomalies
    }
