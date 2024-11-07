# app/schemas.py
from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Union

class FeatureGeneration(BaseModel):
    type: str
    new_column: str
    start_column: str
    end_column: Optional[str] = None

class BinaryCondition(BaseModel):
    column: str
    operator: str
    value: Union[str, int, float]
    target_column: str  # Name of the column to create

class ModelRequest(BaseModel):
    file_path: str
    model_choice: str
    target_variable: Optional[str] = None
    feature_columns: Optional[List[str]] = None
    num_clusters: Optional[int] = 3
    epochs: Optional[int] = 50
    batch_size: Optional[int] = 10
    node_features_path: Optional[str] = None
    edges_path: Optional[str] = None
    id_column: Optional[str] = None
    edge_source_column: Optional[str] = None
    edge_target_column: Optional[str] = None
    binary_conditions: Optional[List[BinaryCondition]] = None
    feature_generations: Optional[List[FeatureGeneration]] = None
    additional_features: Optional[List[str]] = None
    threshold: Optional[float] = None  # For anomaly detection

    model_config = ConfigDict(
        protected_namespaces=()
    )