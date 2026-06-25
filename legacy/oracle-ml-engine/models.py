from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

class PredictionRequest(BaseModel):
    feature_vector: list = Field(..., description="Feature array extracted from the Edge router")
    model_id: Optional[str] = Field(default="latest_active", description="Model version")
    context_metadata: Optional[Dict[str, Any]] = Field(default={}, description="Metadata context")

class PredictionResponse(BaseModel):
    bot_probability: float = Field(..., description="Probability score between 0.0 and 1.0")
    threat_level: str = Field(..., description="Categorical threat level (e.g., 'LOW', 'CRITICAL')")
    shap_values: Optional[list] = Field(default=[], description="Feature attributions")
    latency_ms: float = Field(..., description="Time taken for inference in milliseconds")
    model_version: Optional[str] = Field(default="1.0.0", description="Model version")

class TrainingData(BaseModel):
    dataset_uri: str = Field(..., description="Path or URI to the training dataset (DuckDB/SQLite/CSV)")
    target_column: str = Field(..., description="Column to predict")
    model_name: str = Field(..., description="Model identifier to save as")

class TrainingResponse(BaseModel):
    status: str = Field(..., description="Status of the training job")
    message: str = Field(..., description="Details regarding the training process")
    model_name: str = Field(..., description="The model being trained")
