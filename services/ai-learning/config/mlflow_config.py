"""
MLflow Configuration
Configures MLflow tracking URI and settings
"""

import os
from pathlib import Path

# MLflow Configuration
MLFLOW_TRACKING_URI = os.getenv(
    "MLFLOW_TRACKING_URI",
    "http://localhost:5000"
)

MLFLOW_REGISTRY_URI = os.getenv(
    "MLFLOW_REGISTRY_URI",
    "sqlite:///mlflow.db"
)

MLFLOW_ARTIFACT_ROOT = os.getenv(
    "MLFLOW_ARTIFACT_ROOT",
    str(Path(__file__).parent.parent / "mlruns")
)

# Experiment name
DEFAULT_EXPERIMENT_NAME = "kealee-permit-ai"

def configure_mlflow():
    """Configure MLflow with environment settings"""
    import mlflow
    
    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
    mlflow.set_experiment(DEFAULT_EXPERIMENT_NAME)
    
    return {
        "tracking_uri": mlflow.get_tracking_uri(),
        "experiment_name": DEFAULT_EXPERIMENT_NAME,
    }
