"""
Performance Monitoring for AI Models
Tracks accuracy, false positives/negatives, and drift detection
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from collections import defaultdict
import numpy as np
from dataclasses import dataclass


@dataclass
class PerformanceMetrics:
    """Performance metrics for a model"""
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    false_positive_rate: float
    false_negative_rate: float
    jurisdiction_id: Optional[str] = None
    permit_type: Optional[str] = None
    model_version: Optional[str] = None
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()


class PerformanceMonitor:
    """Monitors model performance and detects drift"""
    
    def __init__(self, db_connection):
        self.db = db_connection
        self.metrics_history = []
        self.drift_threshold = 0.05  # 5% accuracy drop triggers alert
    
    def calculate_metrics(
        self,
        predictions: List[int],
        actuals: List[int],
        jurisdiction_id: Optional[str] = None,
        permit_type: Optional[str] = None,
        model_version: Optional[str] = None
    ) -> PerformanceMetrics:
        """Calculate performance metrics"""
        predictions = np.array(predictions)
        actuals = np.array(actuals)
        
        # Confusion matrix
        tp = np.sum((predictions == 1) & (actuals == 1))
        tn = np.sum((predictions == 0) & (actuals == 0))
        fp = np.sum((predictions == 1) & (actuals == 0))
        fn = np.sum((predictions == 0) & (actuals == 1))
        
        # Metrics
        accuracy = (tp + tn) / (tp + tn + fp + fn) if (tp + tn + fp + fn) > 0 else 0.0
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1_score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
        
        false_positive_rate = fp / (fp + tn) if (fp + tn) > 0 else 0.0
        false_negative_rate = fn / (fn + tp) if (fn + tp) > 0 else 0.0
        
        metrics = PerformanceMetrics(
            accuracy=accuracy,
            precision=precision,
            recall=recall,
            f1_score=f1_score,
            false_positive_rate=false_positive_rate,
            false_negative_rate=false_negative_rate,
            jurisdiction_id=jurisdiction_id,
            permit_type=permit_type,
            model_version=model_version,
        )
        
        # Store metrics
        self.metrics_history.append(metrics)
        # self.db.insert("performance_metrics", metrics.__dict__)
        
        return metrics
    
    def get_metrics_by_jurisdiction(
        self,
        jurisdiction_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[PerformanceMetrics]:
        """Get metrics filtered by jurisdiction"""
        filtered = [
            m for m in self.metrics_history
            if m.jurisdiction_id == jurisdiction_id
            and (start_date is None or m.timestamp >= start_date)
            and (end_date is None or m.timestamp <= end_date)
        ]
        return filtered
    
    def get_metrics_by_permit_type(
        self,
        permit_type: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[PerformanceMetrics]:
        """Get metrics filtered by permit type"""
        filtered = [
            m for m in self.metrics_history
            if m.permit_type == permit_type
            and (start_date is None or m.timestamp >= start_date)
            and (end_date is None or m.timestamp <= end_date)
        ]
        return filtered
    
    def detect_drift(
        self,
        current_metrics: PerformanceMetrics,
        baseline_metrics: Optional[PerformanceMetrics] = None
    ) -> Dict[str, Any]:
        """Detect model drift"""
        if baseline_metrics is None:
            # Use recent metrics as baseline
            if len(self.metrics_history) < 10:
                return {"drift_detected": False, "reason": "insufficient_history"}
            baseline_metrics = self.metrics_history[-10]
        
        # Calculate drift
        accuracy_drift = current_metrics.accuracy - baseline_metrics.accuracy
        f1_drift = current_metrics.f1_score - baseline_metrics.f1_score
        
        drift_detected = (
            accuracy_drift < -self.drift_threshold or
            f1_drift < -self.drift_threshold
        )
        
        drift_info = {
            "drift_detected": drift_detected,
            "accuracy_drift": accuracy_drift,
            "f1_drift": f1_drift,
            "current_accuracy": current_metrics.accuracy,
            "baseline_accuracy": baseline_metrics.accuracy,
            "threshold": self.drift_threshold,
        }
        
        if drift_detected:
            # Trigger alert
            self._send_drift_alert(drift_info)
        
        return drift_info
    
    def _send_drift_alert(self, drift_info: Dict[str, Any]):
        """Send drift detection alert"""
        print(f"⚠️ Model Drift Detected: {drift_info}")
        # In production: send notification, trigger retraining, etc.
    
    def analyze_false_positives(
        self,
        predictions: List[int],
        actuals: List[int],
        metadata: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Analyze false positive cases"""
        false_positives = []
        
        for i, (pred, actual, meta) in enumerate(zip(predictions, actuals, metadata)):
            if pred == 1 and actual == 0:  # False positive
                false_positives.append({
                    "index": i,
                    "prediction": pred,
                    "actual": actual,
                    "metadata": meta,
                })
        
        return false_positives
    
    def analyze_false_negatives(
        self,
        predictions: List[int],
        actuals: List[int],
        metadata: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Analyze false negative cases"""
        false_negatives = []
        
        for i, (pred, actual, meta) in enumerate(zip(predictions, actuals, metadata)):
            if pred == 0 and actual == 1:  # False negative
                false_negatives.append({
                    "index": i,
                    "prediction": pred,
                    "actual": actual,
                    "metadata": meta,
                })
        
        return false_negatives
    
    def human_in_the_loop_validation(
        self,
        predictions: List[Dict[str, Any]],
        validation_results: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Track human validation of AI predictions"""
        total = len(predictions)
        agreed = sum(
            1 for p, v in zip(predictions, validation_results)
            if p["prediction"] == v["human_decision"]
        )
        disagreed = total - agreed
        
        agreement_rate = agreed / total if total > 0 else 0.0
        
        # Store validation results
        validation_summary = {
            "total": total,
            "agreed": agreed,
            "disagreed": disagreed,
            "agreement_rate": agreement_rate,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        # self.db.insert("human_validation", validation_summary)
        
        return validation_summary
