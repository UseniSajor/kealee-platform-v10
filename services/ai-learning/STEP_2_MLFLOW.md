# Step 2: Set Up MLflow Tracking Server

## Quick Start

### Start MLflow UI

**Windows PowerShell:**
```powershell
cd services/ai-learning
.\venv\Scripts\Activate.ps1
mlflow ui --port 5000
```

**Linux/Mac:**
```bash
cd services/ai-learning
source venv/bin/activate
mlflow ui --port 5000
```

**Or use the script:**
```powershell
# Windows
.\scripts\start-mlflow.ps1

# Linux/Mac
./scripts/start-mlflow.sh
```

### Access MLflow UI

Open browser: **http://localhost:5000**

You should see the MLflow UI with:
- Experiments list
- Model registry
- Runs tracking

## Configuration

### Environment Variables

Create or update `services/ai-learning/.env`:

```env
MLFLOW_TRACKING_URI=http://localhost:5000
MLFLOW_REGISTRY_URI=sqlite:///mlflow.db
MLFLOW_ARTIFACT_ROOT=./mlruns
```

### Test MLflow Connection

```python
import mlflow
mlflow.set_tracking_uri("http://localhost:5000")

# Test connection
experiments = mlflow.search_experiments()
print(f"Connected! Found {len(experiments)} experiments")
```

## Production Setup

For production, use PostgreSQL backend:

```bash
mlflow ui \
  --backend-store-uri postgresql://user:pass@host/db \
  --default-artifact-root s3://bucket/mlflow-artifacts \
  --host 0.0.0.0 \
  --port 5000
```

## Verification

Run verification script:
```bash
python scripts/setup_complete.py
```

---

**Status**: Ready to start MLflow server
