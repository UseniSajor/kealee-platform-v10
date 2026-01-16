# AI Learning Service

Continuous AI learning system for permit prediction and inspection optimization.

## Features

### 1. Data Collection Pipeline
- **Consent Management**: Tracks and manages consent for anonymized data collection
- **Data Anonymization**: Removes PII while preserving data utility
- **Correction Pattern Extraction**: Identifies jurisdiction-specific correction patterns
- **Inspector Feedback Collection**: Gathers human feedback for model improvement
- **Outcome Tracking**: Tracks success/failure outcomes for training data

### 2. Model Training Infrastructure
- **Distributed Training**: PyTorch DDP for multi-GPU training
- **MLflow Integration**: Model versioning and registry
- **Weights & Biases**: Experiment tracking and visualization
- **Kubernetes**: Scalable training jobs on GPU clusters

### 3. Jurisdiction-Specific Fine-tuning
- **Federated Learning**: Privacy-preserving distributed training
- **Transfer Learning**: Fine-tune general models for specific jurisdictions
- **Custom Rules**: Incorporate jurisdiction-specific rules into models

### 4. Performance Monitoring
- **Accuracy Metrics**: Track performance by jurisdiction and permit type
- **False Positive/Negative Analysis**: Identify model weaknesses
- **Drift Detection**: Alert on model performance degradation
- **Human-in-the-Loop**: Track human validation of AI predictions

### 5. A/B Testing
- **Model Version Testing**: Compare multiple model versions
- **Traffic Splitting**: Controlled rollout of new models
- **Statistical Analysis**: Determine winning model versions

### 6. Automated Retraining
- **Scheduled Retraining**: Periodic model updates
- **Drift-Triggered Retraining**: Retrain when drift detected
- **Data-Threshold Triggers**: Retrain when enough new data collected

## Architecture

```
services/ai-learning/
├── data-collection/
│   ├── consent-manager.py
│   ├── outcome-tracker.py
│   └── anonymizer.py
├── training/
│   ├── trainer.py
│   ├── federated_trainer.py
│   └── retraining_trigger.py
├── monitoring/
│   └── performance_monitor.py
├── ab-testing/
│   └── ab_tester.py
├── kubernetes/
│   ├── training-job.yaml
│   └── federated-training.yaml
└── requirements.txt
```

## Setup

### Install Dependencies

```bash
cd services/ai-learning
pip install -r requirements.txt
```

### Configure MLflow

```bash
export MLFLOW_TRACKING_URI=http://localhost:5000
mlflow ui
```

### Configure Weights & Biases

```bash
wandb login
export WANDB_PROJECT=kealee-permit-ai
```

### Kubernetes Training

1. Build training image:
```bash
docker build -t kealee/ai-training:latest .
```

2. Deploy training job:
```bash
kubectl apply -f kubernetes/training-job.yaml
```

## Usage

### Data Collection

```python
from data_collection.consent_manager import ConsentManager
from data_collection.outcome_tracker import OutcomeTracker

# Request consent
consent_id = consent_manager.request_consent(
    jurisdiction_id="jurisdiction-123",
    purpose="ML model training",
    data_types=["permits", "corrections"]
)

# Track outcomes
outcome_tracker.track_permit_outcome(
    permit_id="permit-456",
    outcome=OutcomeStatus.SUCCESS,
    metrics=success_metrics,
    jurisdiction_id="jurisdiction-123"
)
```

### Model Training

```python
from training.trainer import ModelTrainer

trainer = ModelTrainer(
    model_config={
        "input_size": 128,
        "hidden_sizes": [256, 128, 64],
        "num_classes": 3,
    },
    training_config={
        "learning_rate": 0.001,
        "num_epochs": 50,
    },
    use_distributed=True
)

results = trainer.train(train_loader, val_loader, test_loader)
```

### Performance Monitoring

```python
from monitoring.performance_monitor import PerformanceMonitor

monitor = PerformanceMonitor(db_connection)

metrics = monitor.calculate_metrics(
    predictions=predictions,
    actuals=actuals,
    jurisdiction_id="jurisdiction-123"
)

drift_info = monitor.detect_drift(current_metrics, baseline_metrics)
```

### A/B Testing

```python
from ab_testing.ab_tester import ABTester

tester = ABTester(db_connection)

test_id = tester.create_test(
    test_name="Model v2 vs v3",
    model_versions=["v2", "v3"],
    traffic_split=[0.5, 0.5]
)

tester.start_test(test_id)

# Assign model for each request
model_version = tester.assign_model(test_id, request_id, metadata)

# Record results
tester.record_result(test_id, request_id, model_version, prediction, actual)
```

## Database Models

The following models need to be added to the Prisma schema:

- `DataConsent`: Consent tracking
- `AnonymizedPermitData`: Anonymized training data
- `CorrectionPattern`: Jurisdiction correction patterns
- `InspectorFeedback`: Human feedback
- `ModelVersion`: Model version tracking
- `TrainingJob`: Training job tracking
- `PerformanceMetric`: Performance metrics
- `ABTest`: A/B test configuration
- `DriftAlert`: Drift detection alerts

## Monitoring Dashboard

- MLflow UI: `http://localhost:5000`
- Weights & Biases: `https://wandb.ai/kealee/permit-ai`

## Next Steps

1. Add database models for AI learning system
2. Integrate with main API service
3. Set up Kubernetes cluster for distributed training
4. Configure monitoring dashboards
5. Implement data pipeline ETL jobs
