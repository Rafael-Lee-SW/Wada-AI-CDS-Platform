# app/main.py

import os
import logging
from datetime import datetime
import ray
from ray import serve
import time
from logging.handlers import TimedRotatingFileHandler
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from typing import Any
import numpy as np
import pandas as pd
import tempfile
from pathlib import Path
import chardet  # 추가된 부분

# Import your model functions
from models import (
    random_forest_regression,
    random_forest_classification,
    logistic_regression_binary,
    logistic_regression_multinomial,
    kmeans_clustering_segmentation,
    kmeans_clustering_anomaly_detection,
    neural_network_regression,
    graph_neural_network_analysis,
    support_vector_machine_classification,
    support_vector_machine_regression,
)

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

    # 로그에 현재 작업 디렉토리 출력
    current_working_dir = os.getcwd()
    logger.info(f"Current Working Directory: {current_working_dir}")

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
        "support_vector_machine_classification": support_vector_machine_classification,
        "support_vector_machine_regression": support_vector_machine_regression,
    }

    if model_choice not in model_functions:
        raise HTTPException(
            status_code=400, detail=f"Model '{model_choice}' not found."
        )

    model_function = model_functions[model_choice]
    kwargs = request.dict()
    kwargs.pop("model_choice", None)

    try:
        # Handle file encoding conversion
        if "file_path" in kwargs:
            original_file_path = Path(kwargs["file_path"]).resolve()
            logger.info(f"Resolved file path: {original_file_path}")

            # Check if the file exists
            if not original_file_path.is_file():
                logger.error(f"File '{original_file_path}' does not exist.")
                raise HTTPException(
                    status_code=400, detail=f"File '{original_file_path}' not found."
                )

            # Detect file encoding using chardet
            with open(original_file_path, 'rb') as f:
                raw_data = f.read()
                detected = chardet.detect(raw_data)
                encoding = detected['encoding']
                confidence = detected['confidence']
                logger.info(f"Detected encoding: {encoding} with confidence {confidence}")

            if encoding is None:
                raise HTTPException(
                    status_code=400, detail="Unable to detect file encoding."
                )

            # Define allowed encodings
            allowed_encodings = ['euc-kr', 'cp949', 'utf-8']

            if encoding.lower() not in allowed_encodings:
                raise HTTPException(
                    status_code=400, detail=f"Unsupported file encoding: {encoding}. Please use one of {allowed_encodings}."
                )

            # Create a temporary file to store UTF-8 encoded data
            with tempfile.NamedTemporaryFile(
                mode="w", encoding="utf-8", suffix=".csv", delete=False
            ) as temp_utf8_file:
                temp_utf8_path = temp_utf8_file.name

                # Read the original file with detected encoding
                try:
                    df = pd.read_csv(original_file_path, encoding=encoding)
                    logger.info(f"Successfully read the file with encoding {encoding}.")
                except UnicodeDecodeError as e:
                    logger.error(
                        f"Failed to decode file '{original_file_path}' with {encoding} encoding: {e}"
                    )
                    raise HTTPException(
                        status_code=400,
                        detail=f"Failed to decode the uploaded file with {encoding}. Please ensure it's encoded correctly.",
                    )

                # Save the DataFrame as UTF-8 encoded CSV
                df.to_csv(temp_utf8_path, encoding="utf-8", index=False)
                logger.info(f"Saved UTF-8 encoded file to {temp_utf8_path}.")

            # Update the file path in kwargs to the temporary UTF-8 file
            kwargs["file_path"] = temp_utf8_path

        if model_choice == "graph_neural_network_analysis":
            # Remove parameters that we'll pass explicitly to avoid duplication
            file_path = kwargs.pop("file_path")
            id_column = kwargs.pop("id_column", None)
            additional_features = kwargs.pop("additional_features", None)
            feature_generations = kwargs.pop("feature_generations", [])
            exclude_columns = kwargs.pop("exclude_columns", None)
            sample_size = kwargs.pop("sample_size", 10)
            random_state = kwargs.pop("random_state", 42)

            # Now call the function with explicit parameters
            results = model_function(
                file_path=file_path,
                id_column=id_column,
                additional_features=additional_features,
                feature_generations=feature_generations,
                exclude_columns=exclude_columns,
                sample_size=sample_size,
                random_state=random_state,
                **kwargs,  # Any remaining parameters
            )
        else:
            # For other models, pass all parameters
            results = model_function(**kwargs)

        # Delete the temporary UTF-8 file after processing
        if "temp_utf8_path" in locals():
            try:
                os.remove(temp_utf8_path)
                logger.info(f"Temporary UTF-8 file '{temp_utf8_path}' removed successfully.")
            except Exception as e:
                logger.warning(f"Failed to remove temporary file '{temp_utf8_path}': {e}")

        return JSONResponse(content=make_serializable(results))

    except HTTPException as he:
        # Re-raise HTTPExceptions to be handled by FastAPI
        raise he
    except Exception as e:
        logger.exception(f"Error occurred while running model '{model_choice}': {e}")
        raise HTTPException(status_code=500, detail=f"Exception: {e}")


# Ray Serve deployment
@serve.deployment
@serve.ingress(app)
class ModelService:
    pass


if __name__ == "__main__":
    import uvicorn

    # Initialize Ray and Ray Serve
    if not ray.is_initialized():
        context = ray.init(
            ignore_reinit_error=True,
            include_dashboard=True,
            dashboard_host="0.0.0.0",
            dashboard_port=8265,
        )
        logging.info("Ray has been initialized.")
        logging.info(context.dashboard_url)

    # Deploy FastAPI app with Ray Serve (port 8000)
    serve.run(ModelService.bind(), route_prefix="/")

    # Run FastAPI app with Uvicorn (port 8282)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8282)
