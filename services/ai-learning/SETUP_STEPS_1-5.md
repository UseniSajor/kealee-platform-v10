# AI Learning Service - Setup Steps 1-5

## Overview

Complete setup guide for the continuous AI learning system with all 5 essential steps.

---

## Step 1: Install Python Dependencies ✅ (In Progress)

### Status
Installation was started but may need to be completed. The packages are large and may take several minutes.

### Complete Installation

```bash
cd services/ai-learning

# Activate virtual environment
.\venv\Scripts\Activate.ps1  # Windows PowerShell

# Install all dependencies
pip install -r requirements.txt
```

### Verify Installation

```bash
# Run test script
python test_installation.py
```

Or manually test:

```python
import torch
import mlflow
import wandb
print("✅ All packages installed!")
```

### Key Packages
- **torch** (2.9.1) - PyTorch for model training
- **mlflow** (3.8.1) - Model versioning and registry
- **wandb** (0.24.0) - Experiment tracking
- **numpy, pandas, scikit-learn** - Data processing
- **fastapi, sqlalchemy** - API and database

---

## Step 2: Set Up MLflow Tracking Server

### Start MLflow UI

```bash
# In a new terminal window
mlflow ui --port 5000 --host 0.0.0.0
```

### Configure Environment

Create or update `services/ai-learning/.env`:

```env
MLFLOW_TRACKING_URI=http://localhost:5000
MLFLOW_REGISTRY_URI=sqlite:///mlflow.db
```

### Access MLflow

Open browser: **http://localhost:5000**

You should see the MLflow UI with experiments and model registry.

### Verify MLflow

```python
import mlflow
mlflow.set_tracking_uri("http://localhost:5000")
print(f"✅ MLflow connected: {mlflow.get_tracking_uri()}")
```

---

## Step 3: Set Up Weights & Biases (W&B)

### Create W&B Account

1. Go to: **https://wandb.ai/signup**
2. Create free account
3. Get your API key from: **https://wandb.ai/authorize**

### Login to W&B

```bash
wandb login
```

Paste your API key when prompted.

### Configure Environment

Add to `services/ai-learning/.env`:

```env
WANDB_API_KEY=your_wandb_api_key_here
WANDB_PROJECT=kealee-permit-ai
WANDB_ENTITY=kealee
```

### Verify W&B

```bash
wandb status
```

Should show your username and API key.

### Test W&B Integration

```python
import wandb

# Initialize (will use .env or default settings)
wandb.init(project="test", mode="offline")  # Offline for testing
print("✅ W&B initialized successfully")
wandb.finish()
```

---

## Step 4: Configure Database Connection

### Update Environment

Add to `services/ai-learning/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/kealee?schema=public
```

**Note:** Replace with your actual database credentials.

### Test Database Connection

```python
import os
from sqlalchemy import create_engine

database_url = os.getenv("DATABASE_URL")
if not database_url:
    print("⚠️  DATABASE_URL not set in environment")
else:
    try:
        engine = create_engine(database_url)
        conn = engine.connect()
        print("✅ Database connection successful!")
        conn.close()
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
```

### Alternative: Use SQLite for Testing

If PostgreSQL isn't available, you can use SQLite:

```env
DATABASE_URL=sqlite:///./ai_learning.db
```

---

## Step 5: Verify Complete Setup ✅

### Run Complete Verification

```bash
cd services/ai-learning
.\venv\Scripts\Activate.ps1
python scripts/setup_complete.py
```

This will test:
- ✅ All package imports
- ✅ MLflow connection
- ✅ W&B configuration
- ✅ Database connection
- ✅ AI learning components

See detailed instructions: `STEP_5_VERIFY.md`

### Manual Verification Checklist

- [ ] ✅ All Python packages import successfully
- [ ] ✅ MLflow UI accessible at http://localhost:5000
- [ ] ✅ W&B login successful (wandb status shows username)
- [ ] ✅ Database connection works
- [ ] ✅ CUDA available (if using GPU)

### Test Each Component

#### Test PyTorch
```python
import torch
print(f"PyTorch: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
```

#### Test MLflow
```python
import mlflow
mlflow.set_tracking_uri("http://localhost:5000")
with mlflow.start_run():
    mlflow.log_param("test", "value")
    print("✅ MLflow working!")
```

#### Test W&B
```python
import wandb
wandb.init(project="test", mode="offline")
wandb.log({"test": 1})
wandb.finish()
print("✅ W&B working!")
```

#### Test Data Collection
```python
from data_collection.consent_manager import ConsentManager

# Mock DB connection for testing
class MockDB:
    pass

consent_manager = ConsentManager(MockDB())
consent_id = consent_manager.request_consent(
    jurisdiction_id="test-jurisdiction",
    purpose="ML training",
    data_types=["permits"]
)
print(f"✅ Consent manager working: {consent_id}")
```

---

## Summary

### Quick Command Reference

```bash
# 1. Install dependencies
cd services/ai-learning
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 2. Start MLflow
mlflow ui --port 5000

# 3. Login to W&B
wandb login

# 4. Configure .env file
# Edit services/ai-learning/.env with:
# - MLFLOW_TRACKING_URI
# - WANDB_API_KEY
# - DATABASE_URL

# 5. Verify setup
python test_installation.py
```

### Environment File Template

Create `services/ai-learning/.env`:

```env
# MLflow
MLFLOW_TRACKING_URI=http://localhost:5000
MLFLOW_REGISTRY_URI=sqlite:///mlflow.db

# Weights & Biases
WANDB_API_KEY=your_wandb_api_key_here
WANDB_PROJECT=kealee-permit-ai
WANDB_ENTITY=kealee

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/kealee?schema=public

# Training Configuration (optional)
TRAINING_BATCH_SIZE=32
TRAINING_LEARNING_RATE=0.001
TRAINING_NUM_EPOCHS=50
```

---

## Troubleshooting

### Installation Timeout
Install packages in smaller batches:
```bash
pip install torch torchvision numpy pandas scikit-learn
pip install mlflow wandb
pip install fastapi sqlalchemy psycopg2-binary
```

### MLflow Not Starting
Check if port 5000 is in use:
```bash
# Windows
netstat -ano | findstr :5000
# Linux/Mac
lsof -i :5000
```

### W&B Login Issues
```bash
wandb login --relogin
```

### Database Connection Issues
Test connection string:
```bash
# PostgreSQL
psql $DATABASE_URL -c "SELECT 1"
```

---

**Status**: ✅ Setup guide complete. Follow steps 1-5 in order.
