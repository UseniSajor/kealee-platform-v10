"""
Test script to verify AI learning service installation
"""

import sys

def test_imports():
    """Test all required package imports"""
    print("Testing package imports...")
    
    try:
        import torch
        print(f"[OK] PyTorch {torch.__version__} - OK")
    except ImportError as e:
        print(f"❌ PyTorch - FAILED: {e}")
        return False
    
    try:
        import torchvision
        print(f"[OK] torchvision {torchvision.__version__} - OK")
    except ImportError as e:
        print(f"❌ torchvision - FAILED: {e}")
        return False
    
    try:
        import numpy
        print(f"[OK] NumPy {numpy.__version__} - OK")
    except ImportError as e:
        print(f"❌ NumPy - FAILED: {e}")
        return False
    
    try:
        import pandas
        print(f"[OK] Pandas {pandas.__version__} - OK")
    except ImportError as e:
        print(f"❌ Pandas - FAILED: {e}")
        return False
    
    try:
        import sklearn
        print(f"[OK] scikit-learn {sklearn.__version__} - OK")
    except ImportError as e:
        print(f"❌ scikit-learn - FAILED: {e}")
        return False
    
    try:
        import mlflow
        print(f"[OK] MLflow {mlflow.__version__} - OK")
    except ImportError as e:
        print(f"❌ MLflow - FAILED: {e}")
        return False
    
    try:
        import wandb
        print(f"[OK] Weights & Biases {wandb.__version__} - OK")
    except ImportError as e:
        print(f"❌ W&B - FAILED: {e}")
        return False
    
    try:
        import fastapi
        print(f"[OK] FastAPI {fastapi.__version__} - OK")
    except ImportError as e:
        print(f"❌ FastAPI - FAILED: {e}")
        return False
    
    try:
        import sqlalchemy
        print(f"[OK] SQLAlchemy {sqlalchemy.__version__} - OK")
    except ImportError as e:
        print(f"❌ SQLAlchemy - FAILED: {e}")
        return False
    
    return True

def test_cuda():
    """Test CUDA availability"""
    try:
        import torch
        if torch.cuda.is_available():
            print(f"[OK] CUDA available: {torch.cuda.get_device_name(0)}")
            print(f"   CUDA version: {torch.version.cuda}")
        else:
            print("[WARNING]  CUDA not available (CPU-only mode)")
    except Exception as e:
        print(f"[WARNING]  CUDA check failed: {e}")

def test_mlflow_connection():
    """Test MLflow connection"""
    try:
        import mlflow
        import os
        tracking_uri = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000")
        mlflow.set_tracking_uri(tracking_uri)
        print(f"[OK] MLflow tracking URI: {mlflow.get_tracking_uri()}")
    except Exception as e:
        print(f"[WARNING]  MLflow connection test failed: {e}")

def test_wandb():
    """Test W&B initialization"""
    try:
        import wandb
        import os
        api_key = os.getenv("WANDB_API_KEY")
        if api_key:
            print("[OK] W&B API key found")
        else:
            print("[WARNING]  W&B API key not set (run: wandb login)")
    except Exception as e:
        print(f"[WARNING]  W&B test failed: {e}")

if __name__ == "__main__":
    print("=" * 50)
    print("AI Learning Service - Installation Test")
    print("=" * 50)
    print()
    
    success = test_imports()
    print()
    
    test_cuda()
    print()
    
    test_mlflow_connection()
    print()
    
    test_wandb()
    print()
    
    if success:
        print("=" * 50)
        print("[OK] All core packages installed successfully!")
        print("=" * 50)
        sys.exit(0)
    else:
        print("=" * 50)
        print("❌ Some packages are missing. Run: pip install -r requirements.txt")
        print("=" * 50)
        sys.exit(1)
