# models/neural_network.py

import pandas as pd
import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.optimizers import Adam
from spektral.layers import GCNConv
from spektral.models import GCN
from spektral.data import Dataset, Graph
import logging

from utils import load_and_preprocess_data, split_data

# Add these imports
from typing import Optional, List, Dict, Any
import tensorflow as tf

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
handler.setFormatter(formatter)
if not logger.handlers:
    logger.addHandler(handler)


def neural_network_regression(
    file_path,
    target_variable,
    feature_columns=None,
    id_column=None,
    sample_size=10,  # For summary
    random_state=42,
    **kwargs,
):
    """
    Train and evaluate a Neural Network for regression tasks.
    Prepares data for interactive visualization.

    Parameters:
    - file_path (str): Path to the CSV dataset file.
    - target_variable (str): Name of the target column.
    - feature_columns (list of str): List of feature column names.
    - id_column (str): Column name for identifiers (e.g., Employee Name or ID).
    - sample_size (int): Number of samples to include in the summary.
    - random_state (int): Random state for reproducibility.
    - **kwargs: Additional keyword arguments.

    Returns:
    - dict: Contains the model, metrics, predictions, identifiers, and summary.
    """
    try:
        logger.info("Starting Neural Network Regression...")

        # Load and preprocess data
        X, y = load_and_preprocess_data(
            data=file_path,
            target_variable=target_variable,
            feature_columns=feature_columns,
            task_type="regression",
        )
        logger.info("Data loaded and preprocessed successfully.")

        # Handle identifiers
        if id_column:
            df = pd.read_csv(file_path)
            if id_column in df.columns:
                identifiers = df[id_column].loc[X.index]
            else:
                identifiers = pd.Series(np.arange(len(X)), name="Index")
        else:
            identifiers = pd.Series(np.arange(len(X)), name="Index")

        # Split the data
        X_train, X_test, y_train, y_test, id_train, id_test = split_data(
            X, y, identifiers, return_ids=True, task_type="regression"
        )
        logger.info("Data split into training and testing sets.")

        # Feature scaling
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        logger.info("Feature scaling completed.")

        # Build the Neural Network model
        model = Sequential(
            [
                Dense(64, activation="relu", input_shape=(X_train_scaled.shape[1],)),
                Dropout(0.2),
                Dense(32, activation="relu"),
                Dropout(0.2),
                Dense(1, activation="linear"),
            ]
        )
        logger.info("Neural Network model architecture created.")

        # Compile the model
        model.compile(
            optimizer=Adam(learning_rate=0.001), loss="mse", metrics=["mae", "mse"]
        )
        logger.info("Neural Network model compiled.")

        # Train the model
        history = model.fit(
            X_train_scaled,
            y_train,
            epochs=100,
            batch_size=32,
            validation_split=0.2,
            verbose=0,  # Set to 1 for more detailed logs
        )
        logger.info("Neural Network model training completed.")

        # Predict on test data
        y_pred = model.predict(X_test_scaled).flatten()
        logger.info("Predictions on test data completed.")

        # Evaluate the model
        mse = mean_squared_error(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        logger.info(f"Model Evaluation - MSE: {mse}, MAE: {mae}, R2: {r2}")

        # Limit the number of data points for visualization
        max_points = 1000
        if len(X_test_scaled) > max_points:
            sampled_indices = np.random.choice(
                len(X_test_scaled), size=max_points, replace=False
            )
            X_test_sampled = X_test_scaled[sampled_indices]
            y_test_sampled = y_test.iloc[sampled_indices]
            y_pred_sampled = y_pred[sampled_indices]
            id_test_sampled = id_test.iloc[sampled_indices]
        else:
            X_test_sampled = X_test_scaled
            y_test_sampled = y_test
            y_pred_sampled = y_pred
            id_test_sampled = id_test

        # Prepare data for visualization
        graph1 = {
            "graph_type": "loss_curve",
            "loss": history.history["loss"],
            "val_loss": history.history["val_loss"],
            "epochs": list(range(1, len(history.history["loss"]) + 1)),
        }

        graph2 = {
            "graph_type": "prediction_scatter",
            "y_test": y_test_sampled.tolist(),
            "y_pred": y_pred_sampled.tolist(),
            "identifiers": id_test_sampled.tolist(),
        }

        graph3 = {"graph_type": "metrics_table", "mse": mse, "mae": mae, "r2_score": r2}

        result = {
            "model": "NeuralNetworkRegressor",
            "architecture": "Dense -> Dropout -> Dense -> Dropout -> Dense",
            "optimizer": "Adam",
            "learning_rate": 0.001,
            "epochs": len(history.history["loss"]),
            "batch_size": 32,
            "loss": history.history["loss"],
            "val_loss": history.history["val_loss"],
            "graph1": graph1,
            "graph2": graph2,
            "graph3": graph3,
        }

        # Prepare summary data
        actual_sample_size = min(sample_size, len(y_test))
        sampled_indices_summary = np.random.choice(
            len(y_test), size=actual_sample_size, replace=False
        )
        X_test_sampled_summary = X_test_scaled[sampled_indices_summary]
        y_test_sampled_summary = y_test.iloc[sampled_indices_summary]
        y_pred_sampled_summary = y_pred[sampled_indices_summary]
        id_test_sampled_summary = id_test.iloc[sampled_indices_summary]

        graph1_summary = {
            "graph_type": "loss_curve",
            "loss": history.history["loss"],
            "val_loss": history.history["val_loss"],
            "epochs": list(range(1, len(history.history["loss"]) + 1)),
        }

        graph2_summary = {
            "graph_type": "prediction_scatter",
            "y_test": y_test_sampled_summary.tolist(),
            "y_pred": y_pred_sampled_summary.tolist(),
            "identifiers": id_test_sampled_summary.tolist(),
        }

        graph3_summary = {
            "graph_type": "metrics_table",
            "mse": mse,
            "mae": mae,
            "r2_score": r2,
        }

        summary = {
            "model": "NeuralNetworkRegressor",
            "architecture": "Dense -> Dropout -> Dense -> Dropout -> Dense",
            "optimizer": "Adam",
            "learning_rate": 0.001,
            "epochs": len(history.history["loss"]),
            "batch_size": 32,
            "graph1": graph1_summary,
            "graph2": graph2_summary,
            "graph3": graph3_summary,
        }

        return {
            "status": "success",
            "result": result,
            "summary": summary,
        }
    except Exception as e:
        logger.exception(f"Error in neural_network_regression: {e}")
        return {"status": "failed", "detail": str(e)}

def graph_neural_network_analysis(
    file_path: str,
    id_column: str,
    additional_features: Optional[List[str]] = None,
    feature_generations: Optional[List[Dict[str, Any]]] = None,
    exclude_columns: Optional[List[str]] = None,
    sample_size: int = 10,  # For summary
    random_state: int = 42,
    **kwargs,
):
    """
    Train and evaluate a Graph Neural Network for node classification or regression.
    Prepares data for interactive visualization.

    Parameters:
    - file_path (str): Path to the CSV dataset file.
    - id_column (str): Column name for node identifiers.
    - additional_features (list of str): Additional features to include.
    - feature_generations (list of dict): Instructions for generating new features.
    - exclude_columns (list of str): Columns to exclude from node features.
    - sample_size (int): Number of samples to include in the summary.
    - random_state (int): Random state for reproducibility.
    - **kwargs: Additional keyword arguments.

    Returns:
    - dict: Contains the model, metrics, predictions, and summary.
    """
    try:
        logger.info("Starting Graph Neural Network Analysis...")

        # Load the dataset
        df = pd.read_csv(file_path)
        logger.info("Dataset loaded successfully.")

        # Apply feature generations if any
        if feature_generations:
            for feature_gen in feature_generations:
                if feature_gen["type"] == "period":
                    start_col = feature_gen["start_column"]
                    end_col = feature_gen["end_column"]
                    new_col = feature_gen["new_column"]

                    if start_col not in df.columns:
                        raise KeyError(f"Start column '{start_col}' not found in the dataset.")
                    if end_col not in df.columns:
                        raise KeyError(f"End column '{end_col}' not found in the dataset.")

                    start = pd.to_datetime(df[start_col], errors='coerce')
                    end = pd.to_datetime(df[end_col], errors='coerce').fillna(pd.Timestamp.now())
                    df[new_col] = (end - start).dt.days
                    logger.info(f"Generated feature '{new_col}' from '{start_col}' and '{end_col}'.")

        # Handle exclusion of columns
        if exclude_columns is None:
            exclude_columns = []

        # Always include id_column in node_features
        if additional_features:
            # Ensure id_column is included
            if id_column not in additional_features:
                additional_features = [id_column] + additional_features
        else:
            # If no additional_features provided, include only id_column
            additional_features = [id_column]

        # Select node features dynamically
        node_features = df[additional_features].copy()

        # Optionally exclude additional columns
        if exclude_columns:
            missing_excludes = [col for col in exclude_columns if col not in node_features.columns]
            if missing_excludes:
                logger.warning(f"Exclude columns not found in node features: {missing_excludes}")
            node_features.drop(columns=[col for col in exclude_columns if col in node_features.columns], inplace=True)

        logger.info("Node features prepared.")

        # Generate edges based on a relationship column if specified
        # For example, using 'ManagerID' to establish hierarchical relationships
        relationship_column = kwargs.get("relationship_column", "ManagerID")
        if relationship_column in df.columns:
            edges = df[[id_column, relationship_column]].dropna()
            # Ensure relationship_column exists in id_column
            edges = edges[edges[relationship_column].isin(df[id_column])]
            edges = edges.rename(columns={id_column: f"{id_column}_source", relationship_column: f"{id_column}_target"})
            logger.info(f"Edges generated based on '{relationship_column}'.")
        else:
            # If no relationship column is provided or exists, handle accordingly
            if kwargs.get("create_random_edges", False):
                # Optionally create random edges if specified
                num_edges = kwargs.get("num_random_edges", 100)
                sources = np.random.choice(node_features[id_column], size=num_edges)
                targets = np.random.choice(node_features[id_column], size=num_edges)
                edges = pd.DataFrame({
                    f"{id_column}_source": sources,
                    f"{id_column}_target": targets
                })
                logger.info(f"Randomly generated {num_edges} edges.")
            else:
                logger.warning(f"Relationship column '{relationship_column}' not found. No edges will be created.")
                edges = pd.DataFrame(columns=[f"{id_column}_source", f"{id_column}_target"])

        # Create a mapping from node ID to index
        node_ids = node_features[id_column].unique()
        id_to_index = {id_: idx for idx, id_ in enumerate(node_ids)}
        index_to_id = {idx: id_ for id_, idx in id_to_index.items()}

        # Create feature matrix
        X = node_features.drop(columns=[id_column]).values
        logger.info("Feature matrix created.")

        # Create adjacency matrix
        if not edges.empty:
            edge_index = edges[[f"{id_column}_source", f"{id_column}_target"]].values
            edge_index = np.array(
                [
                    [id_to_index[src], id_to_index[dst]]
                    for src, dst in edge_index
                    if src in id_to_index and dst in id_to_index
                ]
            ).T  # Shape: [2, num_edges]
            logger.info("Adjacency matrix created.")
        else:
            edge_index = np.array([[], []], dtype=int)
            logger.info("No edges to create adjacency matrix.")

        # Determine task type: classification or regression
        task_type = kwargs.get("task_type", "classification")  # Default to classification

        if task_type == "classification":
            # Assume binary classification if labels not provided
            if "labels" not in kwargs or kwargs["labels"] is None:
                labels = np.random.randint(0, 2, size=(X.shape[0],))
                logger.info("Generated dummy binary labels for node classification.")
            else:
                labels = kwargs["labels"]
                if isinstance(labels, pd.Series):
                    labels = labels.values
                elif isinstance(labels, list):
                    labels = np.array(labels)
                elif not isinstance(labels, np.ndarray):
                    labels = np.array(labels)
        elif task_type == "regression":
            # Assume continuous labels
            if "labels" not in kwargs or kwargs["labels"] is None:
                labels = np.random.rand(X.shape[0])
                logger.info("Generated dummy continuous labels for node regression.")
            else:
                labels = kwargs["labels"]
                if isinstance(labels, pd.Series):
                    labels = labels.values
                elif isinstance(labels, list):
                    labels = np.array(labels)
                elif not isinstance(labels, np.ndarray):
                    labels = np.array(labels)
        else:
            raise ValueError(f"Unsupported task type: {task_type}")

        # Create a Graph object using Spektral
        class MyDataset(Dataset):
            def read(self):
                return [Graph(x=X, a=edge_index, y=labels)]

        dataset = MyDataset()
        graph = dataset[0]

        # Split the dataset into train and test
        idx = np.arange(len(graph.x))
        np.random.seed(random_state)
        np.random.shuffle(idx)
        split = int(0.8 * len(idx))
        idx_train = idx[:split]
        idx_test = idx[split:]

        # Define the GNN model
        class GCNModel(tf.keras.Model):
            def __init__(self, num_classes: int):
                super().__init__()
                self.conv1 = GCNConv(16, activation="relu")
                if task_type == "classification":
                    self.conv2 = GCNConv(num_classes, activation="softmax")
                elif task_type == "regression":
                    self.conv2 = GCNConv(1, activation="linear")

            def call(self, inputs):
                x, a = inputs
                x = self.conv1([x, a])
                x = self.conv2([x, a])
                return x

        num_classes = 2 if task_type == "classification" else 1
        model = GCNModel(num_classes=num_classes)

        if task_type == "classification":
            loss = "sparse_categorical_crossentropy"
            metrics = ["accuracy"]
        elif task_type == "regression":
            loss = "mse"
            metrics = ["mae", "mse"]

        model.compile(
            optimizer=Adam(learning_rate=0.01),
            loss=loss,
            metrics=metrics,
        )
        logger.info("Graph Neural Network model architecture created and compiled.")

        # Train the model
        model.fit(
            [graph.x, graph.a],
            graph.y,
            sample_weight=np.isin(idx, idx_train).astype(float),
            epochs=100,
            batch_size=1,
            verbose=0,
        )
        logger.info("Graph Neural Network model training completed.")

        # Predict on test data
        predictions = model.predict([graph.x, graph.a])
        if task_type == "classification":
            y_pred = np.argmax(predictions, axis=1)
        else:
            y_pred = predictions.flatten()
        y_true = graph.y

        # Evaluate the model
        if task_type == "classification":
            accuracy = np.mean(y_pred[idx_test] == y_true[idx_test])
            logger.info(f"GNN Model Evaluation - Accuracy: {accuracy}")
        elif task_type == "regression":
            mse = mean_squared_error(y_true[idx_test], y_pred[idx_test])
            mae = mean_absolute_error(y_true[idx_test], y_pred[idx_test])
            r2 = r2_score(y_true[idx_test], y_pred[idx_test])
            logger.info(f"GNN Model Evaluation - MSE: {mse}, MAE: {mae}, R2: {r2}")

        # Prepare data for visualization
        graph1 = {
            "graph_type": "node_embeddings",
            "embeddings": graph.x.tolist(),
            "labels": y_true.tolist(),
        }

        graph2 = {
            "graph_type": "adjacency",
            "edge_index": edge_index.tolist(),
        }

        if task_type == "classification":
            graph3 = {
                "graph_type": "metrics_table",
                "accuracy": accuracy,
            }
        elif task_type == "regression":
            graph3 = {
                "graph_type": "metrics_table",
                "mse": mse,
                "mae": mae,
                "r2_score": r2,
            }

        result = {
            "model": "GraphNeuralNetwork",
            "architecture": "GCNConv -> GCNConv",
            "optimizer": "Adam",
            "learning_rate": 0.01,
            "epochs": 100,
            "loss": loss,
            "metrics": metrics,
            "graph1": graph1,
            "graph2": graph2,
            "graph3": graph3,
        }

        # Prepare summary data
        actual_sample_size = min(sample_size, len(y_true))
        sampled_indices_summary = np.random.choice(
            len(y_true), size=actual_sample_size, replace=False
        )
        embeddings_sample = graph.x[sampled_indices_summary].tolist()
        labels_sample = y_true[sampled_indices_summary].tolist()
        edge_index_sample = (
            edge_index[:, sampled_indices_summary].tolist()
            if sampled_indices_summary.size > 0 and edge_index.shape[1] >= sampled_indices_summary.size
            else []
        )

        graph1_summary = {
            "graph_type": "node_embeddings",
            "embeddings": embeddings_sample,
            "labels": labels_sample,
        }

        graph2_summary = {
            "graph_type": "adjacency",
            "edge_index": edge_index_sample,
        }

        if task_type == "classification":
            graph3_summary = {
                "graph_type": "metrics_table",
                "accuracy": accuracy,
            }
        elif task_type == "regression":
            graph3_summary = {
                "graph_type": "metrics_table",
                "mse": mse,
                "mae": mae,
                "r2_score": r2,
            }

        summary = {
            "model": "GraphNeuralNetwork",
            "architecture": "GCNConv -> GCNConv",
            "optimizer": "Adam",
            "learning_rate": 0.01,
            "epochs": 100,
            "loss": loss,
            "metrics": metrics,
            "graph1": graph1_summary,
            "graph2": graph2_summary,
            "graph3": graph3_summary,
        }

        return {
            "status": "success",
            "result": result,
            "summary": summary,
        }

    except KeyError as ke:
        logger.error(f"Missing column: {ke}")
        raise HTTPException(status_code=400, detail=f"Missing column: {ke}")
    except Exception as e:
        logger.exception(f"Error in graph_neural_network_analysis: {e}")
        return {"status": "failed", "detail": str(e)}