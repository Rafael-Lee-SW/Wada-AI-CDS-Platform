# app/models_deployments.py

import logging
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from typing import Any, List
import os
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
)

# Import necessary classes for serialization
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.cluster import KMeans
from tensorflow.keras.models import Sequential as TfSequential
from keras.models import Sequential as KerasSequential

# Import Ray Serve
from ray import serve

# Import ModelRequest from schemas.py
from app.schemas import ModelRequest

# Initialize logger
logger = logging.getLogger("uvicorn.error")

# Initialize FastAPI app
app = FastAPI()


def make_serializable(obj: Any) -> Any:
    """Recursively make objects JSON serializable."""
    if isinstance(obj, pd.DataFrame):
        return obj.to_dict(orient='records')
    elif isinstance(obj, pd.Series):
        return obj.tolist()
    elif isinstance(obj, (np.ndarray, list, tuple)):
        return [make_serializable(item) for item in obj]
    elif isinstance(obj, (np.integer, np.floating)):
        return obj.item()  # Convert to native Python int or float
    elif isinstance(obj, (int, float, str, bool)):
        return obj
    elif isinstance(obj, dict):
        return {k: make_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, (RandomForestRegressor, RandomForestClassifier)):
        return {
            'model_type': type(obj).__name__,
            'n_estimators': obj.n_estimators,
            'max_depth': obj.max_depth,
            'feature_importances_': make_serializable(obj.feature_importances_),
        }
    elif isinstance(obj, LogisticRegression):
        return {
            'model_type': type(obj).__name__,
            'coefficients': make_serializable(obj.coef_),
            'intercept': make_serializable(obj.intercept_),
            'classes_': make_serializable(obj.classes_),
        }
    elif isinstance(obj, KMeans):
        return {
            'model_type': type(obj).__name__,
            'n_clusters': obj.n_clusters,
            'cluster_centers_': make_serializable(obj.cluster_centers_),
            'labels_': make_serializable(obj.labels_),
            'inertia_': make_serializable(obj.inertia_),
        }
    elif isinstance(obj, (TfSequential, KerasSequential)):
        # Serialize model summary
        from io import StringIO
        stream = StringIO()
        obj.summary(print_fn=lambda x: stream.write(x + '\n'))
        summary_string = stream.getvalue()
        return {
            'model_type': 'Sequential',
            'summary': summary_string,
        }
    elif hasattr(obj, '__dict__'):
        return make_serializable(obj.__dict__)
    else:
        # For other types, convert to string
        return str(obj)


@app.post("/predict")
async def predict(request: ModelRequest):
    model_choice = request.model_choice

    # Map model_choice to the corresponding function
    model_functions = {
        "random_forest_regression": random_forest_regression,
        "random_forest_classification": random_forest_classification,
        "logistic_regression_binary": logistic_regression_binary,
        "logistic_regression_multinomial": logistic_regression_multinomial,  # Added this line
        "kmeans_clustering_segmentation": kmeans_clustering_segmentation,
        "kmeans_clustering_anomaly_detection": kmeans_clustering_anomaly_detection,
        "neural_network_regression": neural_network_regression,
        "graph_neural_network_analysis": graph_neural_network_analysis,
    }

    if model_choice not in model_functions:
        raise HTTPException(status_code=400, detail=f"Model '{model_choice}' not found.")

    model_function = model_functions[model_choice]

    # Prepare kwargs from the request
    kwargs = request.dict()
    kwargs.pop('model_choice')

    try:
        results = model_function(**kwargs)
    except Exception as e:
        logger.exception(f"Error occurred while running model '{model_choice}': {e}")
        # Include exception details in the HTTP response
        raise HTTPException(status_code=500, detail=f"Exception: {e}")

    # Ensure results are JSON serializable
    serializable_results = make_serializable(results)

    return JSONResponse(content={"status": "success", "result": serializable_results})


# Wrap the FastAPI app in a Ray Serve deployment
@serve.deployment
@serve.ingress(app)
class ModelService:
    pass  # The FastAPI app handles all the routes
