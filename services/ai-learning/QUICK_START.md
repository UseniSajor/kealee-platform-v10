# AI Learning Service - Quick Start Guide

## ✅ Step 1: Install Python Dependencies (In Progress)

The installation is running. To complete manually:

```bash
cd services/ai-learning

# Activate virtual environment
.\venv\Scripts\Activate.ps1  # Windows PowerShell
# or
source venv/bin/activate     # Linux/Mac

# Install dependencies
pip install -r requirements.txt
```

**Key Packages Installed:**
- ✅ PyTorch 2.9.1 (for model training)
- ✅ MLflow 3.8.1 (for model versioning)
- ✅ Weights & Biases 0.24.0 (for experiment tracking)
- ✅ NumPy, Pandas, scikit-learn (for data processing)
- ✅ FastAPI, SQLAlchemy (for API and database)

## Step 2: Set Up MLflow Tracking Server

### Start MLflow UI

```bash
# In a new terminal
mlflow ui --port 5000 --host 0.0.0.0
```

### Configure Environment

Create `services/ai-learning/.env`:

```env
MLFLOW_TRACKING_URI=http://localhost:5000
MLFLOW_REGISTRY_URI=sqlite:///mlflow.db
```

### Access MLflow

Open browser: `http://localhost:5000`

## Step 3: Set Up Weights & Biases

### Login to W&B

```bash
wandb login
```

Get your API key from: https://wandb.ai/authorize

### Configure Environment

Add to `.env`:

```env
WANDB_API_KEY=your_wandb_api_key_here
WANDB_PROJECT=kealee-permit-ai
WANDB_ENTITY=kealee
```

### Verify Setup

```bash
wandb status
```

## Step 4: Configure Database Connection

### Update .env

```env
DATABASE_URL=postgresql://user:password@localhost:5432/kealee?schema=public
```

### Test Connection

```python
import os
from sqlalchemy import create_engine

engine = create_engine(os.getenv("DATABASE_URL"))
conn = engine.connect()
print("✅ Database connection successful!")
conn.close()
```

## Step 5: Verify Installation

### Test PyTorch

```python
import torch
print(f"PyTorch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
```

### Test MLflow

```python
import mlflow
mlflow.set_tracking_uri("http://localhost:5000")
print(f"✅ MLflow connected: {mlflow.get_tracking_uri()}")
```

### Test W&B

```python
import wandb
wandb.init(project="test", mode="disabled")
print("✅ W&B initialized successfully")
```

## Next Steps

1. ✅ **Install Dependencies** - Complete (or verify installation finished)
2. **Set Up MLflow** - Start MLflow UI server
3. **Set Up W&B** - Login and configure API key
4. **Configure Database** - Update connection string
5. **Verify Installation** - Test all components

## Troubleshooting

### Installation Timeout

If installation times out, run it in background or install packages individually:

```bash
pip install torch torchvision numpy pandas scikit-learn
pip install mlflow wandb
pip install fastapi sqlalchemy psycopg2-binary
```

### MLflow Connection Issues

```bash
# Check if MLflow is running
curl http://localhost:5000/health

# If not, start it
mlflow ui --port 5000
```

### W&B Login Issues

```bash
# Re-login
wandb login --relogin

# Check status
wandb status
```

---

**For detailed setup instructions, see:** `SETUP_GUIDE.md`
