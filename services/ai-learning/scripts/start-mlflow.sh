#!/bin/bash
# Start MLflow Tracking Server

# Set default port if not provided
PORT=${MLFLOW_PORT:-5000}
HOST=${MLFLOW_HOST:-0.0.0.0}

echo "Starting MLflow UI on http://${HOST}:${PORT}"

# Start MLflow UI
mlflow ui \
  --host ${HOST} \
  --port ${PORT} \
  --backend-store-uri ${MLFLOW_BACKEND_STORE_URI:-sqlite:///mlflow.db} \
  --default-artifact-root ${MLFLOW_ARTIFACT_ROOT:-./mlruns}
