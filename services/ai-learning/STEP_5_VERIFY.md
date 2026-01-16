# Step 5: Verify Complete Setup

## Run Complete Verification

```bash
cd services/ai-learning
.\venv\Scripts\Activate.ps1
python scripts/setup_complete.py
```

## Expected Output

```
============================================================
AI Learning Service - Complete Setup Verification
============================================================

Testing Package Imports
============================================================
[OK] PyTorch 2.9.1+cpu
[OK] torchvision 0.24.1+cpu
[OK] NumPy 2.4.1
[OK] Pandas 2.3.3
[OK] scikit-learn 1.8.0
[OK] MLflow 3.8.1
[OK] Weights & Biases 0.24.0
[OK] FastAPI 0.128.0
[OK] SQLAlchemy 2.0.45

Testing MLflow Configuration
============================================================
[OK] MLflow tracking URI: http://localhost:5000
[OK] Experiment: kealee-permit-ai
[OK] MLflow server connection successful

Testing Weights & Biases Configuration
============================================================
[OK] W&B Project: kealee-permit-ai
[OK] W&B Entity: kealee
[OK] W&B API key configured
[OK] W&B initialization successful

Testing Database Configuration
============================================================
[OK] Database connection successful

Testing AI Learning Components
============================================================
[OK] ConsentManager imported successfully
[OK] OutcomeTracker imported successfully
[OK] ModelTrainer imported successfully
[OK] FederatedTrainer imported successfully
[OK] PerformanceMonitor imported successfully
[OK] ABTester imported successfully

============================================================
Setup Verification Summary
============================================================
[OK] Imports
[OK] MLflow
[OK] W&B
[OK] Database
[OK] AI Components

[SUCCESS] All components verified successfully!
```

## Manual Verification Checklist

- [ ] ✅ All Python packages import successfully
- [ ] ✅ MLflow UI accessible at http://localhost:5000
- [ ] ✅ W&B login successful (`wandb status` shows username)
- [ ] ✅ Database connection works
- [ ] ✅ All AI learning components import

## Quick Test Scripts

### Test Individual Components

**Test MLflow:**
```bash
python -c "from config.mlflow_config import configure_mlflow; print(configure_mlflow())"
```

**Test W&B:**
```bash
python -c "from config.wandb_config import configure_wandb; print(configure_wandb())"
```

**Test Database:**
```bash
python -c "from config.database_config import test_connection; test_connection()"
```

## Troubleshooting

### MLflow Not Connecting

1. Check if MLflow is running:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   
   # Linux/Mac
   lsof -i :5000
   ```

2. Start MLflow:
   ```bash
   mlflow ui --port 5000
   ```

### W&B Login Issues

```bash
# Re-login
wandb login --relogin

# Check status
wandb status
```

### Database Connection Issues

1. Verify DATABASE_URL in .env
2. Test connection string:
   ```bash
   # PostgreSQL
   psql $DATABASE_URL -c "SELECT 1"
   ```

---

**Status**: Run verification script to confirm all components working
