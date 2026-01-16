# AI Learning Service - Setup Guide

Complete setup guide for the continuous AI learning system.

## Step 1: Install Python Dependencies

### Option A: Using pip

```bash
cd services/ai-learning
pip install -r requirements.txt
```

### Option B: Using pip with virtual environment (Recommended)

```bash
cd services/ai-learning

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Option C: Using setup.py

```bash
cd services/ai-learning
pip install -e .
```

## Step 2: Set Up MLflow Tracking Server

MLflow is used for model versioning and registry management.

### Install MLflow (if not already installed)

```bash
pip install mlflow
```

### Start MLflow UI

```bash
# Default port 5000
mlflow ui

# Or specify custom port
mlflow ui --port 5001 --host 0.0.0.0
```

### Access MLflow UI

Open browser to: `http://localhost:5000`

### Configure Environment

Add to `.env`:
```env
MLFLOW_TRACKING_URI=http://localhost:5000
MLFLOW_REGISTRY_URI=sqlite:///mlflow.db
```

## Step 3: Set Up Weights & Biases (W&B)

W&B is used for experiment tracking and visualization.

### Install W&B

```bash
pip install wandb
```

### Login to W&B

```bash
wandb login
```

This will prompt for your API key. Get it from: https://wandb.ai/authorize

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

The AI learning service needs database access for:
- Storing consent records
- Tracking outcomes
- Storing performance metrics
- Managing model versions

### Update .env

Copy `.env.example` to `.env` and update:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/kealee?schema=public
```

### Test Connection

```python
from sqlalchemy import create_engine
engine = create_engine(os.getenv("DATABASE_URL"))
engine.connect()
print("✅ Database connection successful!")
```

## Step 5: Set Up Kubernetes for Distributed Training (Optional)

For distributed training on GPU clusters, set up Kubernetes.

### Prerequisites

- Kubernetes cluster with GPU nodes
- NVIDIA GPU operator installed
- kubectl configured

### Create Namespace

```bash
kubectl create namespace kealee-ai
```

### Create Secrets

```bash
# W&B Secret
kubectl create secret generic wandb-secret \
  --from-literal=api-key=your_wandb_api_key \
  -n kealee-ai

# MLflow Secret (if using authentication)
kubectl create secret generic mlflow-secret \
  --from-literal=tracking-uri=http://mlflow-service:5000 \
  -n kealee-ai
```

### Create Persistent Volumes

```bash
# Training data PVC
kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: training-data-pvc
  namespace: kealee-ai
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 100Gi
EOF

# Model storage PVC
kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: model-storage-pvc
  namespace: kealee-ai
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 50Gi
EOF
```

### Create ConfigMap for Training Config

```bash
kubectl create configmap training-config \
  --from-file=kubernetes/training-config.yaml \
  -n kealee-ai
```

### Deploy Training Job

```bash
# Replace {{ JOB_ID }} in the YAML first
export JOB_ID=$(date +%s)
sed "s/{{ JOB_ID }}/$JOB_ID/g" kubernetes/training-job.yaml | kubectl apply -f -
```

## Verification

### Test Data Collection

```python
from data_collection.consent_manager import ConsentManager, DataCollector, DataAnonymizer

consent_manager = ConsentManager(db_connection)
anonymizer = DataAnonymizer()
collector = DataCollector(consent_manager, anonymizer)

# Request consent
consent_id = consent_manager.request_consent(
    jurisdiction_id="jurisdiction-123",
    purpose="ML model training",
    data_types=["permits", "corrections"]
)

print(f"✅ Consent created: {consent_id}")
```

### Test Training

```python
from training.trainer import ModelTrainer
import torch

# Simple test
trainer = ModelTrainer(
    model_config={
        "input_size": 128,
        "hidden_sizes": [256, 128, 64],
        "num_classes": 3,
    },
    training_config={
        "learning_rate": 0.001,
        "num_epochs": 5,  # Short test
    },
    use_distributed=False
)

print("✅ Trainer initialized successfully!")
```

### Test Monitoring

```python
from monitoring.performance_monitor import PerformanceMonitor

monitor = PerformanceMonitor(db_connection)

# Test metrics calculation
predictions = [0, 1, 1, 0, 1]
actuals = [0, 1, 0, 0, 1]

metrics = monitor.calculate_metrics(predictions, actuals)
print(f"✅ Metrics calculated: Accuracy = {metrics.accuracy:.2%}")
```

## Next Steps After Setup

1. **Add Database Models**: Update Prisma schema with AI learning models
2. **Run Initial Training**: Train baseline model on existing data
3. **Set Up Scheduled Jobs**: Configure cron jobs for regular retraining
4. **Configure Monitoring**: Set up alerts for drift detection
5. **Deploy Production**: Set up production MLflow and W&B instances

## Troubleshooting

### MLflow Connection Issues

```bash
# Check if MLflow server is running
curl http://localhost:5000/health

# Restart MLflow
mlflow ui --port 5000
```

### W&B Login Issues

```bash
# Re-login
wandb login --relogin

# Check status
wandb status
```

### GPU Not Detected

```bash
# Check PyTorch CUDA
python -c "import torch; print(torch.cuda.is_available())"

# If False, install CUDA-enabled PyTorch
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

### Database Connection Issues

```bash
# Test connection string
psql $DATABASE_URL -c "SELECT 1"

# Check SQLAlchemy
python -c "from sqlalchemy import create_engine; engine = create_engine('$DATABASE_URL'); engine.connect()"
```
