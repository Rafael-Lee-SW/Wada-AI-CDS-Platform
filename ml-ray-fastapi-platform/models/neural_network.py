# models/neural_network.py

import pandas as pd
import numpy as np
import scipy.sparse as sp  # Add this import
from sklearn.metrics import (
    mean_squared_error,
    mean_absolute_error,
    r2_score,
)  # Encode categorical features
from sklearn.preprocessing import OneHotEncoder
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, Input
from tensorflow.keras.optimizers import Adam
from spektral.layers import GCNConv
from spektral.models import GCN
from spektral.data import Dataset, Graph
from spektral.data.loaders import SingleLoader
import logging

from utils import load_and_preprocess_data, split_data, read_csv_with_encoding

# Add these imports
from typing import Optional, List, Dict, Any
import tensorflow as tf
from tensorflow.keras.layers import Layer, Dense, Dropout, Input, Lambda
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
handler.setFormatter(formatter)
if not logger.handlers:
    logger.addHandler(handler)


# Add this custom layer class before the main function
class GraphConvolution(Layer):
    def __init__(self, units, activation=None, **kwargs):
        super(GraphConvolution, self).__init__(**kwargs)
        self.units = units
        self.activation = tf.keras.activations.get(activation)

    def build(self, input_shape):
        features_shape = input_shape[0]
        self.weight = self.add_weight(
            shape=(features_shape[-1], self.units),
            initializer="glorot_uniform",
            name="weight",
        )
        self.bias = self.add_weight(
            shape=(self.units,), initializer="zeros", name="bias"
        )
        super().build(input_shape)

    def call(self, inputs):
        features, adj = inputs
        # Linear transformation
        h = tf.matmul(features, self.weight)  # [batch_size, nodes, units]
        # Graph convolution
        output = tf.matmul(adj, h)  # [batch_size, nodes, units]
        # Add bias
        output = tf.nn.bias_add(output, self.bias)
        # Apply activation
        if self.activation is not None:
            output = self.activation(output)
        return output


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
            df = read_csv_with_encoding(file_path)
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
            "batch_size": 32,
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
    relationship_column: str,
    additional_features: Optional[List[str]] = None,
    feature_generations: Optional[List[Dict[str, Any]]] = None,
    exclude_columns: Optional[List[str]] = None,
    task_type: str = "classification",
    target_column: str = None,
    **kwargs,
):
    try:
        logger.info("Starting Graph Neural Network Analysis...")

        # Load the dataset
        df = read_csv_with_encoding(file_path)
        logger.info("Dataset loaded successfully.")

        # Apply feature generations if any
        if feature_generations:
            for feature_gen in feature_generations:
                if feature_gen["type"] == "period":
                    start_col = feature_gen["start_column"]
                    end_col = feature_gen["end_column"]
                    new_col = feature_gen["new_column"]

                    if start_col not in df.columns:
                        raise KeyError(
                            f"Start column '{start_col}' not found in the dataset."
                        )
                    if end_col not in df.columns:
                        raise KeyError(
                            f"End column '{end_col}' not found in the dataset."
                        )

                    start = pd.to_datetime(df[start_col], errors="coerce")
                    end = pd.to_datetime(df[end_col], errors="coerce").fillna(
                        pd.Timestamp.now()
                    )
                    df[new_col] = (end - start).dt.days
                    logger.info(
                        f"Generated feature '{new_col}' from '{start_col}' and '{end_col}'."
                    )

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
            missing_excludes = [
                col for col in exclude_columns if col not in node_features.columns
            ]
            if missing_excludes:
                logger.warning(
                    f"Exclude columns not found in node features: {missing_excludes}"
                )
            node_features.drop(
                columns=[
                    col for col in exclude_columns if col in node_features.columns
                ],
                inplace=True,
            )

        logger.info("Node features prepared.")

        # Generate edges based on a relationship column if specified
        if relationship_column in df.columns:
            edges = df[[id_column, relationship_column]].dropna()
            # Ensure relationship_column exists in id_column
            edges = edges[edges[relationship_column].isin(df[id_column])]
            edges = edges.rename(
                columns={
                    id_column: f"{id_column}_source",
                    relationship_column: f"{id_column}_target",
                }
            )
            logger.info(f"Edges generated based on '{relationship_column}'.")
        else:
            # Handle cases where the relationship column is missing
            logger.warning(
                f"Relationship column '{relationship_column}' not found. No edges will be created."
            )
            edges = pd.DataFrame(columns=[f"{id_column}_source", f"{id_column}_target"])

        # Create a mapping from node ID to index
        node_ids = node_features[id_column].unique()
        id_to_index = {id_: idx for idx, id_ in enumerate(node_ids)}
        index_to_id = {idx: id_ for id_, idx in id_to_index.items()}

        # Encode categorical features
        X = node_features.drop(columns=[id_column])
        categorical_cols = X.select_dtypes(
            include=["object", "category"]
        ).columns.tolist()

        if categorical_cols:
            try:
                # Try the new API first
                encoder = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
            except TypeError:
                # Fall back to old API if needed
                encoder = OneHotEncoder(sparse=False, handle_unknown="ignore")

            X_encoded = encoder.fit_transform(X[categorical_cols])
            X_numeric = X.drop(columns=categorical_cols).values
            X = np.hstack([X_numeric, X_encoded])
            logger.info("Categorical features one-hot encoded.")
        else:
            X = X.values

        # Handle missing values
        if np.isnan(X).any():
            imputer = SimpleImputer(strategy="mean")
            X = imputer.fit_transform(X)
            logger.info("Missing values imputed.")

        # Create edge index
        if not edges.empty:
            edge_index = edges[[f"{id_column}_source", f"{id_column}_target"]].values
            edge_index = np.array(
                [
                    [id_to_index[src], id_to_index[dst]]
                    for src, dst in edge_index
                    if src in id_to_index and dst in id_to_index
                ]
            ).T  # Shape: [2, num_edges]
            logger.info("Edge index created.")
        else:
            edge_index = np.array([[], []], dtype=int)
            logger.info("No edges to create adjacency matrix.")

        # Create labels based on task type
        if task_type == "classification":
            if target_column and target_column in df.columns:
                # Use specified target column if provided
                labels = df[target_column].values
                # Convert to binary classification if needed
                if len(np.unique(labels)) > 2:
                    logger.info("Converting target to binary classification.")
                    labels = (labels > np.median(labels)).astype(int)
            else:
                # Create dummy binary labels if no target specified
                logger.info("Creating dummy binary labels for node classification.")
                labels = np.random.binomial(1, 0.5, size=len(node_features))
        else:
            # Regression task
            if not target_column or target_column not in df.columns:
                raise ValueError("Target column must be specified for regression tasks")
            labels = df[target_column].values
            # Normalize regression targets
            labels = (labels - np.mean(labels)) / np.std(labels)

        # Convert labels to appropriate format
        labels = tf.convert_to_tensor(
            labels, dtype=tf.float32 if task_type == "regression" else tf.int32
        )

        # Create adjacency matrix with proper handling of empty edges
        num_nodes = X.shape[0]
        if len(edge_index[0]) == 0:
            logger.warning("No edges found. Creating random edges for connectivity.")
            # Define number of random edges (average 3 connections per node)
            num_random_edges = num_nodes * 3

            # Generate random edges
            random_edges = np.random.randint(0, num_nodes, size=(2, num_random_edges))

            # Create adjacency matrix
            A = np.zeros((num_nodes, num_nodes))
            A[random_edges[0], random_edges[1]] = 1
            A = A + A.T  # Make symmetric
            A[A > 1] = 1  # Remove duplicates

            logger.info(
                f"Created {num_random_edges} random edges for {num_nodes} nodes"
            )
        else:
            # Create adjacency matrix from existing edges
            A = np.zeros((num_nodes, num_nodes))
            A[edge_index[0], edge_index[1]] = 1
            A = A + A.T  # Make symmetric
            A[A > 1] = 1  # Remove duplicates

        # Add self-loops and normalize
        A = A + np.eye(num_nodes)
        D = np.sum(A, axis=1)
        D_inv_sqrt = np.power(D, -0.5)
        D_inv_sqrt[np.isinf(D_inv_sqrt)] = 0
        D_inv_sqrt = np.diag(D_inv_sqrt)
        A_normalized = D_inv_sqrt.dot(A).dot(D_inv_sqrt)

        # Fix tensor reshaping
        num_nodes = X.shape[0]
        num_features = X.shape[1]
        batch_size = min(
            32, num_nodes
        )  # Ensure batch size doesn't exceed number of nodes

        # Reshape tensors properly for batched processing
        X_tensor = tf.cast(X, dtype=tf.float32)
        X_tensor = tf.tile(
            tf.expand_dims(X_tensor, 0), [batch_size, 1, 1]
        )  # Create 32 batches

        A_tensor = tf.convert_to_tensor(A_normalized, dtype=tf.float32)
        A_tensor = tf.tile(
            tf.expand_dims(A_tensor, 0), [batch_size, 1, 1]
        )  # Create 32 batches

        # Repeat labels for each batch
        labels_tensor = tf.tile(tf.expand_dims(labels, 0), [batch_size, 1])

        # Create model inputs with correct shapes
        node_features = Input(shape=(num_nodes, num_features))
        adj_matrix = Input(shape=(num_nodes, num_nodes))

        # Model architecture
        x = GraphConvolution(64, activation="relu")([node_features, adj_matrix])
        x = Dropout(0.5)(x)
        x = GraphConvolution(32, activation="relu")([x, adj_matrix])
        x = Dropout(0.5)(x)

        # Output layer
        if task_type == "classification":
            outputs = Dense(2, activation="softmax")(x)
        else:
            outputs = Dense(1)(x)

        # Create and compile model
        model = Model(inputs=[node_features, adj_matrix], outputs=outputs)

        if task_type == "classification":
            model.compile(
                optimizer=Adam(learning_rate=0.01),
                loss="sparse_categorical_crossentropy",
                metrics=["accuracy"],
            )
        else:
            model.compile(
                optimizer=Adam(learning_rate=0.01), loss="mse", metrics=["mae"]
            )

        # Train model with proper validation handling
        if num_nodes < 5:  # If very small dataset
            validation_split = 0.0  # No validation
            logger.warning(
                "Dataset too small for validation split. Training without validation."
            )
        else:
            validation_split = 0.2

        # Train the model with adjusted batch size
        history = model.fit(
            [X_tensor, A_tensor],
            labels_tensor,
            epochs=100,
            batch_size=batch_size,
            validation_split=validation_split,
            verbose=1,
        )

        # Get predictions
        predictions = model.predict([X_tensor, A_tensor])
        predictions_numpy = predictions[0]  # Take first batch's predictions

        # Convert tensors to numpy arrays before visualization
        if isinstance(X, tf.Tensor):
            X = X.numpy()
        if isinstance(labels, tf.Tensor):
            labels = labels.numpy()
        if isinstance(edge_index, tf.Tensor):
            edge_index = edge_index.numpy()

        # After model training, ensure all tensors are properly converted
        history_dict = history.history

        # Convert predictions and handle numpy conversions properly
        embedding_model = Model(inputs=model.inputs, outputs=model.layers[-2].output)
        node_embeddings = embedding_model.predict([X_tensor, A_tensor])
        node_embeddings_numpy = node_embeddings[0]  # Take first batch's embeddings

        # Sample indices for visualization (after numpy conversion)
        sample_size = min(10, len(labels))
        sampled_indices = np.random.choice(len(labels), size=sample_size, replace=False)
        # Create visualization data with numpy arrays
        graph1 = {
            "graph_type": "loss_curve",
            "loss": [float(x) for x in history.history["loss"]],
            "val_loss": [float(x) for x in history.history["val_loss"]],
            "epochs": list(range(1, len(history.history["loss"]) + 1)),
        }

        graph2 = {
            "graph_type": "node_embeddings",
            "embeddings": node_embeddings_numpy[sampled_indices].tolist(),
            "predictions": predictions_numpy[sampled_indices].tolist(),
            "labels": labels[sampled_indices].tolist(),
        }

        graph3 = {
            "graph_type": "metrics_table",
            "accuracy": float(history.history["accuracy"][-1]),
            "val_accuracy": float(history.history["val_accuracy"][-1]),
        }

        # Prepare final summary
        summary = {
            "model": "GraphNeuralNetwork",
            "architecture": "GCNConv -> GCNConv",
            "optimizer": "Adam",
            "learning_rate": 0.01,
            "epochs": len(history.history["loss"]),
            "metrics": {
                "accuracy": float(history.history["accuracy"][-1]),
                "val_accuracy": float(history.history["val_accuracy"][-1]),
                "loss": float(history.history["loss"][-1]),
                "val_loss": float(history.history["val_loss"][-1]),
            },
            "graph1": graph1,
            "graph2": graph2,
            "graph3": graph3,
        }

        return {"status": "success", "result": summary["metrics"], "summary": summary}

    except Exception as e:
        logger.exception(f"Error in graph_neural_network_analysis: {e}")
        return {"status": "failed", "detail": str(e)}
