"""
Complete Setup Verification Script
Tests all components after setup
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

def test_imports():
    """Test all package imports"""
    print("=" * 60)
    print("Testing Package Imports")
    print("=" * 60)
    
    packages = [
        ("torch", "PyTorch"),
        ("torchvision", "torchvision"),
        ("numpy", "NumPy"),
        ("pandas", "Pandas"),
        ("sklearn", "scikit-learn"),
        ("mlflow", "MLflow"),
        ("wandb", "Weights & Biases"),
        ("fastapi", "FastAPI"),
        ("sqlalchemy", "SQLAlchemy"),
    ]
    
    all_ok = True
    for module_name, display_name in packages:
        try:
            module = __import__(module_name)
            version = getattr(module, "__version__", "unknown")
            print(f"[OK] {display_name} {version}")
        except ImportError as e:
            print(f"[FAILED] {display_name} - {e}")
            all_ok = False
    
    return all_ok

def test_mlflow():
    """Test MLflow configuration"""
    print("\n" + "=" * 60)
    print("Testing MLflow Configuration")
    print("=" * 60)
    
    try:
        from config.mlflow_config import configure_mlflow
        config = configure_mlflow()
        print(f"[OK] MLflow tracking URI: {config['tracking_uri']}")
        print(f"[OK] Experiment: {config['experiment_name']}")
        
        # Try to connect
        import mlflow
        try:
            experiments = mlflow.search_experiments()
            print(f"[OK] MLflow server connection successful ({len(experiments)} experiments)")
            return True
        except Exception as e:
            print(f"[WARNING] MLflow server not running: {e}")
            print("         Start MLflow with: mlflow ui --port 5000")
            return False
    except Exception as e:
        print(f"[FAILED] MLflow configuration error: {e}")
        return False

def test_wandb():
    """Test W&B configuration"""
    print("\n" + "=" * 60)
    print("Testing Weights & Biases Configuration")
    print("=" * 60)
    
    try:
        from config.wandb_config import configure_wandb
        config = configure_wandb()
        print(f"[OK] W&B Project: {config['project']}")
        print(f"[OK] W&B Entity: {config['entity']}")
        print(f"[OK] W&B Mode: {config['mode']}")
        
        if config['api_key_set']:
            print("[OK] W&B API key configured")
            
            # Try to initialize (offline mode to avoid network issues)
            import wandb
            try:
                wandb.init(project="setup-test", mode="offline")
                print("[OK] W&B initialization successful")
                wandb.finish()
                return True
            except Exception as e:
                print(f"[WARNING] W&B initialization issue: {e}")
                return False
        else:
            print("[WARNING] W&B API key not set")
            print("         Run: wandb login")
            return False
    except Exception as e:
        print(f"[FAILED] W&B configuration error: {e}")
        return False

def test_database():
    """Test database connection"""
    print("\n" + "=" * 60)
    print("Testing Database Configuration")
    print("=" * 60)
    
    try:
        from config.database_config import test_connection, DATABASE_URL
        print(f"[INFO] Database URL: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
        
        if test_connection():
            print("[OK] Database connection successful")
            return True
        else:
            print("[WARNING] Database connection failed")
            print("         Check DATABASE_URL in .env file")
            return False
    except Exception as e:
        print(f"[FAILED] Database configuration error: {e}")
        return False

def test_ai_components():
    """Test AI learning components"""
    print("\n" + "=" * 60)
    print("Testing AI Learning Components")
    print("=" * 60)
    
    components = [
        ("data_collection.consent_manager", "ConsentManager"),
        ("data_collection.outcome_tracker", "OutcomeTracker"),
        ("training.trainer", "ModelTrainer"),
        ("training.federated_trainer", "FederatedTrainer"),
        ("monitoring.performance_monitor", "PerformanceMonitor"),
        ("ab_testing.ab_tester", "ABTester"),
    ]
    
    all_ok = True
    for module_name, class_name in components:
        try:
            module = __import__(module_name, fromlist=[class_name])
            cls = getattr(module, class_name)
            print(f"[OK] {class_name} imported successfully")
        except Exception as e:
            print(f"[FAILED] {class_name} - {e}")
            all_ok = False
    
    return all_ok

def main():
    """Run all tests"""
    print("\n")
    print("=" * 60)
    print("AI Learning Service - Complete Setup Verification")
    print("=" * 60)
    print()
    
    results = {
        "Imports": test_imports(),
        "MLflow": test_mlflow(),
        "W&B": test_wandb(),
        "Database": test_database(),
        "AI Components": test_ai_components(),
    }
    
    print("\n" + "=" * 60)
    print("Setup Verification Summary")
    print("=" * 60)
    
    for component, status in results.items():
        status_symbol = "[OK]" if status else "[ISSUES]"
        print(f"{status_symbol} {component}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n[SUCCESS] All components verified successfully!")
        print("\nNext steps:")
        print("1. Start MLflow: mlflow ui --port 5000")
        print("2. Login to W&B: wandb login")
        print("3. Configure .env file with your settings")
        return 0
    else:
        print("\n[WARNING] Some components need attention")
        print("Check the output above for details")
        return 1

if __name__ == "__main__":
    sys.exit(main())
