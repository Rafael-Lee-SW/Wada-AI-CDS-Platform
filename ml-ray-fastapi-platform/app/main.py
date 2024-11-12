# app/main.py

import os
import logging
from datetime import datetime
import ray
from ray import serve
import time  # Ensure that 'time' is imported
from logging.handlers import TimedRotatingFileHandler
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from typing import Any
import numpy as np
import pandas as pd

# Import your model functions
from models import (
    random_forest_regression,
    random_forest_classification,
    logistic_regression_binary,
    logistic_regression_multinomial,  # Added this line
    kmeans_clustering_segmentation,
    kmeans_clustering_anomaly_detection,
    neural_network_regression,
    graph_neural_network_analysis,
    generate_graph_data,  # Import the new function
)

from models.neural_network import run_model, FeatureGeneration

# Import necessary classes for serialization
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.cluster import KMeans
from tensorflow.keras.models import Sequential as TfSequential
from keras.models import Sequential as KerasSequential

# Import ModelRequest from schemas.py
from app.schemas import ModelRequest

# Suppress TensorFlow oneDNN warnings
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

# Set Ray Serve HTTP host and port to allow external access
os.environ["RAY_SERVE_HTTP_HOST"] = "0.0.0.0"  # Bind to all IP addresses
os.environ["RAY_SERVE_DASHBOARD_HOST"] = "0.0.0.0"  # Bind to all IP addresses
os.environ["RAY_SERVE_HTTP_PORT"] = "8000"  # Use port 8000
os.environ["RAY_SERVE_HTTP_KEEP_ALIVE_TIMEOUT_S"] = "10"  # Adjust timeout as needed

# Ensure the 'log' directory exists
log_directory = "log"
if not os.path.exists(log_directory):
    os.makedirs(log_directory)

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)  # Capture all levels of logs

# Define the base log filename
base_log_filename = "server.log"
base_log_path = os.path.join(log_directory, base_log_filename)

# Create a TimedRotatingFileHandler that rotates logs daily at midnight
file_handler = TimedRotatingFileHandler(
    base_log_path,
    when="midnight",
    interval=1,
    backupCount=30,  # Keep logs for the last 30 days
    encoding="utf-8",
    delay=False,
    utc=False,
)

# Set the suffix for the rotated log files
file_handler.suffix = "%Y-%m-%d.log"  # e.g., server.log.2024-10-30.log

# Define the log format
file_formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
file_handler.setFormatter(file_formatter)

# Add the file handler to the logger
logger.addHandler(file_handler)

# Create a StreamHandler to output logs to the console
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)  # Adjust as needed (DEBUG, INFO, WARNING, etc.)
console_formatter = logging.Formatter("%(levelname)s - %(message)s")
console_handler.setFormatter(console_formatter)
logger.addHandler(console_handler)

# Initialize FastAPI app
app = FastAPI()


# Function to make objects JSON serializable
def make_serializable(obj: Any) -> Any:
    if isinstance(obj, pd.DataFrame):
        return obj.to_dict(orient="records")
    elif isinstance(obj, pd.Series):
        return obj.tolist()
    elif isinstance(obj, (np.ndarray, list, tuple)):
        return [make_serializable(item) for item in obj]
    elif isinstance(obj, (np.integer, np.floating)):
        return obj.item()
    elif isinstance(obj, (int, float, str, bool)):
        return obj
    elif isinstance(obj, dict):
        return {k: make_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, (RandomForestRegressor, RandomForestClassifier)):
        return {
            "model_type": type(obj).__name__,
            "n_estimators": obj.n_estimators,
            "max_depth": obj.max_depth,
            "feature_importances_": make_serializable(obj.feature_importances_),
        }
    elif isinstance(obj, LogisticRegression):
        return {
            "model_type": type(obj).__name__,
            "coefficients": make_serializable(obj.coef_),
            "intercept": make_serializable(obj.intercept_),
            "classes_": make_serializable(obj.classes_),
        }
    elif isinstance(obj, KMeans):
        return {
            "model_type": type(obj).__name__,
            "n_clusters": obj.n_clusters,
            "cluster_centers_": make_serializable(obj.cluster_centers_),
            "labels_": make_serializable(obj.labels_),
            "inertia_": make_serializable(obj.inertia_),
        }
    elif isinstance(obj, (TfSequential, KerasSequential)):
        from io import StringIO

        stream = StringIO()
        obj.summary(print_fn=lambda x: stream.write(x + "\n"))
        summary_string = stream.getvalue()
        return {
            "model_type": "Sequential",
            "summary": summary_string,
        }
    elif hasattr(obj, "__dict__"):
        return make_serializable(obj.__dict__)
    else:
        return str(obj)


# Prediction route
@app.post("/predict")
async def predict(request: ModelRequest):
    model_choice = request.model_choice

    # Map model_choice to the corresponding function
    model_functions = {
        "random_forest_regression": random_forest_regression,
        "random_forest_classification": random_forest_classification,
        "logistic_regression_binary": logistic_regression_binary,
        "logistic_regression_multinomial": logistic_regression_multinomial,
        "kmeans_clustering_segmentation": kmeans_clustering_segmentation,
        "kmeans_clustering_anomaly_detection": kmeans_clustering_anomaly_detection,
        "neural_network_regression": neural_network_regression,
        "graph_neural_network_analysis": graph_neural_network_analysis,
    }

    if model_choice not in model_functions:
        raise HTTPException(
            status_code=400, detail=f"Model '{model_choice}' not found."
        )

    model_function = model_functions[model_choice]
    kwargs = request.dict()
    kwargs.pop("model_choice", None)

    # Handle 'graph_neural_network_analysis' by generating node_features and edges in-memory
    if model_choice == "graph_neural_network_analysis":
        # Extract necessary parameters
        file_path = kwargs.get("file_path")
        id_column = kwargs.get("id_column", "EmpID")
        edge_source_column = kwargs.get("edge_source_column", "EmpID")
        edge_target_column = kwargs.get("edge_target_column", "ManagerID")
        additional_features = kwargs.get("additional_features", [])
        feature_generations = kwargs.get("feature_generations", [])

        # **additional_features 리스트 내의 공백 제거**
        if additional_features:
            additional_features = [col.strip() for col in additional_features]
            kwargs["additional_features"] = additional_features

        # Validate required parameters
        if not file_path:
            raise HTTPException(
                status_code=400,
                detail="file_path is required for graph_neural_network_analysis.",
            )

        # Generate node_features and edges DataFrames in-memory
        try:
            node_features, edges = generate_graph_data(
                file_path=file_path,
                id_column=id_column,
                edge_source_column=edge_source_column,
                edge_target_column=edge_target_column,
                additional_features=additional_features,
                feature_generations=(
                    feature_generations if feature_generations else None
                ),
            )
            logger.info("Generated node_features and edges in-memory.")
        except HTTPException as he:
            raise he
        except Exception as e:
            logger.exception(f"Error occurred while generating graph data: {e}")
            raise HTTPException(
                status_code=500, detail=f"Error generating graph data: {e}"
            )

        # Remove additional unwanted arguments to prevent unexpected keyword arguments
        kwargs.pop("file_path", None)
        kwargs.pop("id_column", None)
        kwargs.pop("edge_source_column", None)
        kwargs.pop("edge_target_column", None)
        kwargs.pop("additional_features", None)
        kwargs.pop("feature_generations", None)
        kwargs.pop("target_variable", None)  # 추가: target_variable 제거

        try:
            results = model_function(
                node_features=node_features, edges=edges, id_column=id_column, **kwargs
            )
        except Exception as e:
            logger.exception(
                f"Error occurred while running model '{model_choice}': {e}"
            )
            raise HTTPException(status_code=500, detail=f"Exception: {e}")

    elif model_choice == "neural_network_regression":
        # Ensure feature_generations include 'TenureDays'
        feature_generations = kwargs.get("feature_generations")
        if not feature_generations:
            kwargs["feature_generations"] = [
                FeatureGeneration(
                    type="period",
                    new_column="TenureDays",
                    start_column="DateofHire",
                    end_column="DateofTermination",
                )
            ]
            logger.info(
                "Added default feature_generations for neural_network_regression."
            )

        # **feature_columns 리스트 내의 공백 제거**
        feature_columns = kwargs.get("feature_columns")
        if feature_columns:
            feature_columns = [col.strip() for col in feature_columns]
            kwargs["feature_columns"] = feature_columns

        try:
            results = model_function(**kwargs)
        except Exception as e:
            logger.exception(
                f"Error occurred while running model '{model_choice}': {e}"
            )
            raise HTTPException(status_code=500, detail=f"Exception: {e}")
    else:
        # For other models, proceed as usual
        try:
            results = model_function(**kwargs)
        except Exception as e:
            logger.exception(
                f"Error occurred while running model '{model_choice}': {e}"
            )
            raise HTTPException(status_code=500, detail=f"Exception: {e}")

    serializable_results = make_serializable(results)
    return JSONResponse(content=serializable_results)

# Ray Serve deployment
@serve.deployment
@serve.ingress(app)
class ModelService:
    pass


if __name__ == "__main__":
    import uvicorn

    # Ray 및 Ray Serve 초기화
    if not ray.is_initialized():
        context = ray.init(
            ignore_reinit_error=True,
            include_dashboard=True,
            dashboard_host="0.0.0.0",
            dashboard_port=8265,
        )
        logging.info("Ray has been initialized.")
        logging.info(context.dashboard_url)

    # Ray Serve에서 FastAPI 배포 (8000 포트)
    serve.run(ModelService.bind(), route_prefix="/")

    # Uvicorn으로 FastAPI 실행 (8080 포트)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8282)
