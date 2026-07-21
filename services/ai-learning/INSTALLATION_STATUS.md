# Installation Status

## ✅ Step 1: Python Dependencies Installation

**Status:** Installation in progress (timed out, but packages were downloading)

**To Complete:**
```bash
cd services/ai-learning
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**Expected Packages:**
- torch>=2.0.0
- torchvision>=0.15.0
- numpy>=1.24.0
- pandas>=2.0.0
- scikit-learn>=1.3.0
- mlflow>=2.7.0
- wandb>=0.15.0
- fastapi>=0.100.0
- sqlalchemy>=2.0.0
- psycopg2-binary>=2.9.0

## Step 2: MLflow Setup

**Commands:**
```bash
# Start MLflow UI
mlflow ui --port 5000

# Access at http://localhost:5000
```

**Environment Variable:**
```env
MLFLOW_TRACKING_URI=http://localhost:5000
```

## Step 3: Weights & Biases Setup

**Commands:**
```bash
# Login
wandb login

# Get API key from: https://wandb.ai/authorize
```

**Environment Variable:**
```env
WANDB_API_KEY=your_api_key_here
WANDB_PROJECT=kealee-permit-ai
```

## Step 4: Database Configuration

**Environment Variable:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/kealee?schema=public
```

## Step 5: Verification

**Test Script:**
```python
# test_installation.py
import torch
import mlflow
import wandb

print(f"✅ PyTorch: {torch.__version__}")
print(f"✅ MLflow: {mlflow.__version__}")
print(f"✅ W&B: {wandb.__version__}")

# Test CUDA
print(f"CUDA available: {torch.cuda.is_available()}")
```

**Run:**
```bash
python test_installation.py
```
