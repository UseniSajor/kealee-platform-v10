# Start MLflow Tracking Server (PowerShell)

# Set default port if not provided
$env:MLFLOW_PORT = if ($env:MLFLOW_PORT) { $env:MLFLOW_PORT } else { "5000" }
$env:MLFLOW_HOST = if ($env:MLFLOW_HOST) { $env:MLFLOW_HOST } else { "0.0.0.0" }

Write-Host "Starting MLflow UI on http://$env:MLFLOW_HOST`:$env:MLFLOW_PORT"

# Set backend store URI
$backendStoreUri = if ($env:MLFLOW_BACKEND_STORE_URI) { $env:MLFLOW_BACKEND_STORE_URI } else { "sqlite:///mlflow.db" }
$artifactRoot = if ($env:MLFLOW_ARTIFACT_ROOT) { $env:MLFLOW_ARTIFACT_ROOT } else { "./mlruns" }

# Start MLflow UI
mlflow ui `
  --host $env:MLFLOW_HOST `
  --port $env:MLFLOW_PORT `
  --backend-store-uri $backendStoreUri `
  --default-artifact-root $artifactRoot
