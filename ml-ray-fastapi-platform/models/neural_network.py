# models/neural_network.py

import networkx as nx
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder, MultiLabelBinarizer
from sklearn.model_selection import train_test_split
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.optimizers import Adam
import logging
from fastapi import HTTPException
import os
import re

from pydantic import BaseModel
from typing import List, Optional, Any


class Condition(BaseModel):
    column: str
    operator: str
    value: Any
    target_column: str


class FeatureGeneration(BaseModel):
    type: str  # e.g., "period", "binary_condition"
    new_column: str
    start_column: Optional[str] = None
    end_column: Optional[str] = None
    conditions: Optional[List[Condition]] = None


# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Optional: Add handlers (e.g., StreamHandler, FileHandler) if needed
# Example:
# handler = logging.StreamHandler()
# formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
# handler.setFormatter(formatter)
# logger.addHandler(handler)


# Helper functions for loading, preprocessing, and splitting data
def load_and_preprocess_data(
    data,
    target_variable=None,
    feature_columns=None,
    task_type="classification",
    encode_categorical=True,
    fill_missing=True,
):
    """
    데이터 로딩 및 전처리 함수
    """
    if isinstance(data, str):
        try:
            df = pd.read_csv(data)
            logger.info(f"Loaded data from {data}")
        except Exception as e:
            logger.error(f"Failed to load data from {data}: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to load data: {e}")
    elif isinstance(data, pd.DataFrame):
        df = data.copy()
        logger.info("Received data as pandas DataFrame")
    else:
        logger.error("Invalid data format. Must be a file path or pandas DataFrame.")
        raise HTTPException(status_code=400, detail="Invalid data format.")

    # **컬럼 이름의 앞뒤 공백 제거**
    df.columns = df.columns.str.strip()

    # **feature_columns 리스트 내의 공백 제거**
    if feature_columns:
        feature_columns = [col.strip() for col in feature_columns]

    original_indices = df.index.copy()

    # Process date columns
    date_cols = [
        col for col in df.columns if "date" in col.lower() or "dob" in col.lower()
    ]
    for date_col in date_cols:
        df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
        derived_col = f"{date_col}_DaysSince"
        df[derived_col] = (pd.to_datetime("today") - df[date_col]).dt.days
        df = df.drop(date_col, axis=1)
        if feature_columns and date_col in feature_columns:
            feature_columns.remove(date_col)
            feature_columns.append(derived_col)
        logger.info(f"Processed date column: {date_col}")

    # Identify categorical columns
    categorical_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
    if target_variable in categorical_cols:
        categorical_cols.remove(target_variable)

    # Identify multi-category columns (assuming comma-separated)
    multi_cat_cols = []
    for col in categorical_cols:
        if df[col].str.contains(",", na=False).any():
            multi_cat_cols.append(col)

    # Split multi-category columns and apply MultiLabelBinarizer
    if multi_cat_cols:
        for col in multi_cat_cols:
            try:
                # Split by comma and strip whitespace
                df[col] = df[col].apply(
                    lambda x: (
                        [cls.strip() for cls in x.split(",")]
                        if isinstance(x, str)
                        else []
                    )
                )
                mlb = MultiLabelBinarizer()
                dummies = pd.DataFrame(
                    mlb.fit_transform(df[col]),
                    columns=[f"{col}_{cls}" for cls in mlb.classes_],
                    index=df.index,
                )
                df = pd.concat([df, dummies], axis=1)
                df = df.drop(columns=col)
                logger.info(f"Handled multi-category column: {col}")
            except Exception as e:
                logger.error(f"Error processing multi-category column '{col}': {e}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Error processing multi-category column '{col}': {e}",
                )

    if encode_categorical:
        # Convert all object-type columns to string and strip whitespace to handle mixed types
        non_numeric_cols = df.select_dtypes(
            include=["object", "category"]
        ).columns.tolist()
        if non_numeric_cols:
            # Strip leading and trailing whitespace and replace multiple internal spaces with single space
            df[non_numeric_cols] = (
                df[non_numeric_cols]
                .astype(str)
                .apply(lambda x: x.str.strip().str.replace(r"\s+", " ", regex=True))
            )
            logger.info(
                f"Converted and stripped non-numeric columns: {non_numeric_cols}"
            )

            # **결측치 처리**
            if fill_missing:
                # Fill NaN for numerical columns
                num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
                df[num_cols] = df[num_cols].fillna(0)

                # Fill NaN for categorical columns
                df[non_numeric_cols] = df[non_numeric_cols].fillna("Unknown")

                logger.info(
                    "Filled missing data: numerical columns with 0, categorical columns with 'Unknown'."
                )

            # Apply one-hot encoding
            df = pd.get_dummies(df, drop_first=True)

            remaining_non_numeric = df.select_dtypes(
                exclude=[np.number]
            ).columns.tolist()
            if remaining_non_numeric:
                logger.error(
                    f"Non-numeric columns still present after encoding: {remaining_non_numeric}"
                )
                for col in remaining_non_numeric:
                    unique_values = df[col].unique()
                    logger.info(f"Unique values in {col}: {unique_values}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Non-numeric columns present after encoding: {remaining_non_numeric}",
                )

            logger.info("Applied one-hot encoding to categorical variables.")

            # **데이터 타입 로깅**
            logger.info("Data types after one-hot encoding:")
            logger.info(df.dtypes)

            # Ensure all remaining columns are numeric
            remaining_non_numeric = df.select_dtypes(
                exclude=[np.number]
            ).columns.tolist()
            if remaining_non_numeric:
                logger.error(
                    f"Non-numeric columns still present after encoding: {remaining_non_numeric}"
                )
                raise HTTPException(
                    status_code=400,
                    detail=f"Non-numeric columns present after encoding: {remaining_non_numeric}",
                )

        # Encode target variable if it's categorical
        if target_variable and df[target_variable].dtype == "object":
            try:
                y_encoded = LabelEncoder().fit_transform(df[target_variable])
                y = pd.Series(y_encoded, index=original_indices, name=target_variable)
                logger.info("Encoded target variable using LabelEncoder.")
            except Exception as e:
                logger.error(f"Failed to encode target variable: {e}")
                raise HTTPException(
                    status_code=400, detail=f"Failed to encode target variable: {e}"
                )
        else:
            y = df[target_variable] if target_variable else None
    else:
        y = df[target_variable] if target_variable else None

    # Re-align indices
    if y is not None:
        y.index = original_indices
    if feature_columns:
        X = df[feature_columns].copy()
    else:
        X = df.drop(
            columns=[target_variable] if target_variable else df.columns.tolist()
        ).copy()

    # Additional enforcement to convert all columns to numeric types
    try:
        X = X.apply(pd.to_numeric, errors="raise")
        logger.info("All feature columns converted to numeric types successfully.")
    except Exception as e:
        remaining_non_numeric = X.select_dtypes(exclude=[np.number]).columns.tolist()
        logger.error(f"Error converting columns to numeric types: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Non-numeric columns present in feature matrix after preprocessing: {remaining_non_numeric}",
        )

    # Final validation: Ensure all columns in X are numeric
    if not X.select_dtypes(include=[np.number]).shape[1] == X.shape[1]:
        remaining_non_numeric = X.select_dtypes(exclude=[np.number]).columns.tolist()
        logger.error(
            f"Non-numeric columns still present after preprocessing: {remaining_non_numeric}"
        )
        raise HTTPException(
            status_code=400,
            detail=f"Non-numeric columns present in feature matrix after preprocessing: {remaining_non_numeric}",
        )

    logger.info("Data loading and preprocessing completed successfully.")
    return X, y

def split_data(X, y, test_size=0.2, random_state=42):
    """
    Splits the data into training and testing sets.

    Parameters:
    - X (DataFrame): Feature matrix.
    - y (Series): Target variable.
    - test_size (float): Proportion of the dataset to include in the test split.
    - random_state (int): Random seed.

    Returns:
    - X_train, X_test, y_train, y_test: Split datasets.
    """
    return train_test_split(X, y, test_size=test_size, random_state=random_state)


# Neural Network Regression
def neural_network_regression(
    **kwargs,
):
    """
    Neural Network Regression model.

    Parameters (from kwargs):
    - file_path (str): Path to the CSV dataset file.
    - target_variable (str): Name of the target variable.
    - feature_columns (list): List of feature column names.
    - epochs (int, optional): Number of training epochs. Default is 50.
    - batch_size (int, optional): Batch size for training. Default is 10.
    - Any extra kwargs are ignored.

    Returns:
    - dict: Contains the model, history, loss, and predictions.
    """
    file_path = kwargs.get("file_path")
    target_variable = kwargs.get("target_variable")
    feature_columns = kwargs.get("feature_columns")
    epochs = kwargs.get("epochs", 50)
    batch_size = kwargs.get("batch_size", 10)

    # Validate required parameters
    if not all([file_path, target_variable, feature_columns]):
        logger.error("Missing required parameters for neural_network_regression.")
        raise HTTPException(
            status_code=400,
            detail="Missing required parameters for neural_network_regression.",
        )

    # **feature_columns 리스트 내의 공백 제거**
    if feature_columns:
        feature_columns = [col.strip() for col in feature_columns]
        kwargs["feature_columns"] = feature_columns

    # Load and preprocess data
    try:
        X, y = load_and_preprocess_data(
            data=file_path,
            target_variable=target_variable,
            feature_columns=feature_columns,
            task_type="regression",
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected error during data loading and preprocessing: {e}")
        raise HTTPException(
            status_code=500, detail=f"Unexpected error during data loading: {e}"
        )

    # Check if X is numeric
    if not np.all([np.issubdtype(dtype, np.number) for dtype in X.dtypes]):
        logger.error(
            "Non-numeric columns present in feature matrix after preprocessing."
        )
        raise HTTPException(
            status_code=400,
            detail="Non-numeric columns present in feature matrix after preprocessing.",
        )

    # Split data
    X_train, X_test, y_train, y_test = split_data(X, y)

    # Scale the features
    scaler_X = StandardScaler()
    X_train_scaled = scaler_X.fit_transform(X_train)
    X_test_scaled = scaler_X.transform(X_test)

    # Optionally, scale the target variable
    scaler_y = StandardScaler()
    y_train_scaled = scaler_y.fit_transform(y_train.values.reshape(-1, 1))
    y_test_scaled = scaler_y.transform(y_test.values.reshape(-1, 1))

    # Build the model
    model = Sequential(
        [
            Dense(64, activation="relu", input_dim=X_train_scaled.shape[1]),
            Dense(32, activation="relu"),
            Dense(1, activation="linear"),  # Output layer for regression
        ]
    )

    # Compile the model
    model.compile(optimizer=Adam(), loss="mean_squared_error")

    # Train the model
    try:
        history = model.fit(
            X_train_scaled,
            y_train_scaled,
            epochs=epochs,
            batch_size=batch_size,
            validation_data=(X_test_scaled, y_test_scaled),
            verbose=0,  # Set to 1 for more detailed logs
        )
        logger.info("Model training completed successfully.")
    except Exception as e:
        logger.error(f"Error during model training: {e}")
        raise HTTPException(status_code=500, detail=f"Error during model training: {e}")

    # Evaluate the model
    try:
        loss = model.evaluate(X_test_scaled, y_test_scaled, verbose=0)
        logger.info(f"Model evaluation completed. Loss: {loss}")
    except Exception as e:
        logger.error(f"Error during model evaluation: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error during model evaluation: {e}"
        )

    # Make predictions and inverse transform
    try:
        y_pred_scaled = model.predict(X_test_scaled).flatten()
        y_pred = scaler_y.inverse_transform(y_pred_scaled.reshape(-1, 1)).flatten()
        logger.info("Predictions made successfully.")
    except Exception as e:
        logger.error(f"Error during prediction: {e}")
        raise HTTPException(status_code=500, detail=f"Error during prediction: {e}")

    return {
        "model": model,
        "history": history.history,  # Convert history object to dict
        "loss": loss,
        "y_test": y_test.tolist(),
        "y_pred": y_pred.tolist(),
    }


def graph_neural_network_analysis(
    node_features: pd.DataFrame,
    edges: pd.DataFrame,
    id_column: str = "EmpID",
):
    """
    Implements Graph Neural Network Analysis.

    Parameters:
    - node_features (DataFrame): DataFrame containing node features.
    - edges (DataFrame): DataFrame representing edges in the graph.
    - id_column (str, optional): Column name for node identifiers. Default is "EmpID".

    Returns:
    - dict: Graph metrics.
    """
    # Validate required parameters
    if node_features is None or edges is None:
        logger.error("Missing node_features or edges DataFrame.")
        raise HTTPException(
            status_code=400,
            detail="Missing node_features or edges DataFrame.",
        )

    if id_column not in node_features.columns:
        logger.error(f"Identifier column '{id_column}' not found in node_features.")
        raise HTTPException(
            status_code=400,
            detail=f"Identifier column '{id_column}' not found in node_features.",
        )

    # Log number of nodes and edges loaded
    logger.info(f"Number of nodes loaded: {node_features.shape[0]}")
    logger.info(f"Number of edges loaded: {edges.shape[0]}")

    # Create a graph
    try:
        G = nx.from_pandas_edgelist(edges, source="source", target="target")
        logger.info(
            f"Graph created with {G.number_of_nodes()} nodes and {G.number_of_edges()} edges."
        )
    except Exception as e:
        logger.error(f"Error creating graph from edges: {e}")
        raise HTTPException(
            status_code=400, detail=f"Error creating graph from edges: {e}"
        )

    # Add node attributes
    try:
        for _, row in node_features.iterrows():
            node = row[id_column]
            attrs = row.drop(id_column).to_dict()
            nx.set_node_attributes(G, {node: attrs})
        logger.info("Node attributes set successfully.")
    except Exception as e:
        logger.error(f"Error setting node attributes: {e}")
        raise HTTPException(
            status_code=400, detail=f"Error setting node attributes: {e}"
        )

    # Compute basic graph metrics
    try:
        graph_metrics = {
            "number_of_nodes": G.number_of_nodes(),
            "number_of_edges": G.number_of_edges(),
            "average_degree": (
                sum(dict(G.degree()).values()) / G.number_of_nodes()
                if G.number_of_nodes() > 0
                else 0
            ),
            "density": nx.density(G),
        }
        logger.info("Graph metrics computed successfully.")
    except Exception as e:
        logger.error(f"Error computing graph metrics: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error computing graph metrics: {e}"
        )

    return {"graph_metrics": graph_metrics}


def generate_graph_data(
    file_path,
    id_column,
    edge_source_column,
    edge_target_column,
    additional_features=None,
    feature_generations=None,
):
    """
    그래프 데이터 생성 함수
    """
    try:
        df = pd.read_csv(file_path)
        logger.info(f"Loaded data from {file_path}")
    except Exception as e:
        logger.error(f"Failed to load data from {file_path}: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to load data: {e}")

    # **컬럼 이름의 앞뒤 공백 제거**
    df.columns = df.columns.str.strip()

    # **additional_features 리스트 내의 공백 제거**
    if additional_features:
        additional_features = [col.strip() for col in additional_features]

    if feature_generations:
        for fg in feature_generations:
            if isinstance(fg, FeatureGeneration):
                fg = fg.dict()
            gen_type = fg.get("type")
            new_column = fg.get("new_column")
            if gen_type == "period":
                start_col = fg.get("start_column")
                end_col = fg.get("end_column")
                try:
                    df[new_column] = (
                        pd.to_datetime(df[end_col]) - pd.to_datetime(df[start_col])
                    ).dt.days
                    logger.info(
                        f"Generated period feature '{new_column}' from '{start_col}' and '{end_col}'."
                    )
                except Exception as e:
                    logger.error(f"Error generating period feature '{new_column}': {e}")
                    raise HTTPException(
                        status_code=400,
                        detail=f"Error generating period feature '{new_column}': {e}",
                    )
            elif gen_type == "binary_condition":
                conditions = fg.get("conditions", [])
                for condition in conditions:
                    column = condition.get("column")
                    operator = condition.get("operator")
                    value = condition.get("value")
                    target_column = condition.get("target_column")
                    try:
                        # **범주형 변수 값의 공백 제거 및 정규화**
                        df[column] = (
                            df[column]
                            .astype(str)
                            .str.strip()
                            .str.replace("\s+", " ", regex=True)
                        )
                        df[target_column] = df.apply(
                            lambda row: (
                                1 if eval(f"row['{column}'] {operator} {value}") else 0
                            ),
                            axis=1,
                        )
                        logger.info(
                            f"Generated binary condition feature '{target_column}' based on '{column} {operator} {value}'."
                        )
                    except Exception as e:
                        logger.error(
                            f"Error generating binary condition feature '{target_column}': {e}"
                        )
                        raise HTTPException(
                            status_code=400,
                            detail=f"Error generating binary condition feature '{target_column}': {e}",
                        )
            else:
                logger.error(f"Unsupported feature generation type: {gen_type}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported feature generation type: {gen_type}",
                )

    if additional_features is None:
        additional_features = df.columns.drop(
            [id_column, edge_source_column, edge_target_column]
        ).tolist()

    node_features = df[[id_column] + additional_features].copy()

    # Handle categorical features in node_features
    node_features = pd.get_dummies(node_features, drop_first=True)

    # **결측치 처리**
    # Fill missing data
    num_cols = node_features.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = node_features.select_dtypes(
        include=["object", "category"]
    ).columns.tolist()
    if num_cols:
        node_features[num_cols] = node_features[num_cols].fillna(0)
    if cat_cols:
        node_features[cat_cols] = node_features[cat_cols].fillna("Unknown")

    # **모든 문자열 값의 공백 제거 및 정규화**
    node_features = node_features.applymap(
        lambda x: re.sub(r"\s+", " ", x.strip()) if isinstance(x, str) else x
    )

    # **확인 후 수치형으로 변환**
    try:
        node_features = node_features.apply(pd.to_numeric, errors="raise")
    except Exception as e:
        remaining_non_numeric = node_features.select_dtypes(
            exclude=[np.number]
        ).columns.tolist()
        logger.error(
            f"Non-numeric columns present in node_features after encoding: {remaining_non_numeric}"
        )
        raise HTTPException(
            status_code=400,
            detail=f"Non-numeric columns present in node_features after encoding: {remaining_non_numeric}",
        )

    edges = df[[edge_source_column, edge_target_column]].dropna()
    edges = edges[edges[edge_target_column].isin(df[id_column])]
    edges = edges.rename(
        columns={edge_source_column: "source", edge_target_column: "target"}
    )

    logger.info("Generated node_features and edges DataFrames successfully.")

    return node_features, edges


# Main function to determine model type and execute
def run_model(model_choice, **kwargs):
    """
    Determines which model to run based on model_choice and executes it.

    Parameters:
    - model_choice (str): Choice of the model to run.
    - **kwargs: Additional keyword arguments required by the model.

    Returns:
    - dict: Result from the model execution.
    """
    if model_choice == "neural_network_regression":
        return neural_network_regression(**kwargs)
    elif model_choice == "graph_neural_network_analysis":
        # Extract required parameters for graph analysis
        file_path = kwargs.get("file_path")
        id_column = kwargs.get("id_column")
        edge_source_column = kwargs.get("edge_source_column")
        edge_target_column = kwargs.get("edge_target_column")
        additional_features = kwargs.get("additional_features", [])
        feature_generations = kwargs.get("feature_generations", [])

        # **additional_features 리스트 내의 공백 제거**
        if additional_features:
            additional_features = [col.strip() for col in additional_features]
            kwargs["additional_features"] = additional_features

        # Validate required parameters
        if not all([file_path, id_column, edge_source_column, edge_target_column]):
            logger.error(
                "Missing required parameters for graph_neural_network_analysis."
            )
            raise HTTPException(
                status_code=400,
                detail="Missing required parameters for graph_neural_network_analysis.",
            )

        # Convert feature_generations to FeatureGeneration objects if they are dicts
        if feature_generations and isinstance(feature_generations[0], dict):
            try:
                feature_generations = [
                    FeatureGeneration(**fg) for fg in feature_generations
                ]
                logger.info(
                    "Converted feature_generations to FeatureGeneration objects."
                )
            except Exception as e:
                logger.error(f"Error converting feature_generations: {e}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Error converting feature_generations: {e}",
                )

        # Generate graph data
        try:
            node_features, edges = generate_graph_data(
                file_path=file_path,
                id_column=id_column,
                edge_source_column=edge_source_column,
                edge_target_column=edge_target_column,
                additional_features=additional_features,
                feature_generations=feature_generations,
            )
        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"Unexpected error during graph data generation: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected error during graph data generation: {e}",
            )

        # Perform graph neural network analysis
        try:
            graph_metrics = graph_neural_network_analysis(
                node_features=node_features,
                edges=edges,
                id_column=id_column,
            )
        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"Unexpected error during graph analysis: {e}")
            raise HTTPException(
                status_code=500, detail=f"Unexpected error during graph analysis: {e}"
            )

        return graph_metrics
    else:
        logger.error(f"Model choice '{model_choice}' not recognized.")
        raise HTTPException(status_code=400, detail="Model choice not recognized")
