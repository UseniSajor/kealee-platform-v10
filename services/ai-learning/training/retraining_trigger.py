"""
Automated Retraining Triggers
Monitors conditions and triggers model retraining
"""

from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Callable
from enum import Enum


class RetrainingTrigger(Enum):
    SCHEDULED = "scheduled"
    DRIFT_DETECTED = "drift_detected"
    DATA_THRESHOLD = "data_threshold"
    PERFORMANCE_DROP = "performance_drop"
    MANUAL = "manual"


class RetrainingTriggerService:
    """Service for automated retraining triggers"""
    
    def __init__(
        self,
        performance_monitor,
        data_collector,
        training_service,
        check_interval_hours: int = 24
    ):
        self.performance_monitor = performance_monitor
        self.data_collector = data_collector
        self.training_service = training_service
        self.check_interval_hours = check_interval_hours
        self.last_check = datetime.utcnow()
    
    def check_triggers(self) -> List[Dict[str, Any]]:
        """Check all retraining triggers"""
        triggers = []
        
        # Scheduled retraining
        scheduled = self._check_scheduled_retraining()
        if scheduled:
            triggers.append(scheduled)
        
        # Drift detection
        drift = self._check_drift()
        if drift:
            triggers.append(drift)
        
        # Data threshold
        data_threshold = self._check_data_threshold()
        if data_threshold:
            triggers.append(data_threshold)
        
        # Performance drop
        performance = self._check_performance_drop()
        if performance:
            triggers.append(performance)
        
        return triggers
    
    def _check_scheduled_retraining(self) -> Optional[Dict[str, Any]]:
        """Check if scheduled retraining is due"""
        # Retrain monthly by default
        days_since_last_training = (datetime.utcnow() - self.last_check).days
        
        if days_since_last_training >= 30:
            return {
                "trigger": RetrainingTrigger.SCHEDULED.value,
                "reason": f"{days_since_last_training} days since last training",
                "priority": "medium",
            }
        
        return None
    
    def _check_drift(self) -> Optional[Dict[str, Any]]:
        """Check for model drift"""
        # Get recent metrics
        recent_metrics = self.performance_monitor.metrics_history[-10:] if len(self.performance_monitor.metrics_history) >= 10 else []
        
        if not recent_metrics:
            return None
        
        current = recent_metrics[-1]
        baseline = recent_metrics[0] if len(recent_metrics) > 1 else current
        
        drift_info = self.performance_monitor.detect_drift(current, baseline)
        
        if drift_info.get("drift_detected"):
            return {
                "trigger": RetrainingTrigger.DRIFT_DETECTED.value,
                "reason": f"Accuracy drift: {drift_info['accuracy_drift']:.2%}",
                "priority": "high",
                "drift_info": drift_info,
            }
        
        return None
    
    def _check_data_threshold(self) -> Optional[Dict[str, Any]]:
        """Check if enough new data has been collected"""
        # Check if new data threshold reached (e.g., 1000 new samples)
        # In production, query database
        new_data_count = 1000  # Mock
        
        if new_data_count >= 1000:
            return {
                "trigger": RetrainingTrigger.DATA_THRESHOLD.value,
                "reason": f"{new_data_count} new samples collected",
                "priority": "medium",
            }
        
        return None
    
    def _check_performance_drop(self) -> Optional[Dict[str, Any]]:
        """Check for significant performance drop"""
        recent_metrics = self.performance_monitor.metrics_history[-20:] if len(self.performance_monitor.metrics_history) >= 20 else []
        
        if len(recent_metrics) < 10:
            return None
        
        # Calculate average accuracy over last 10 vs previous 10
        recent_avg = sum(m.accuracy for m in recent_metrics[-10:]) / 10
        previous_avg = sum(m.accuracy for m in recent_metrics[-20:-10]) / 10
        
        drop = previous_avg - recent_avg
        
        if drop > 0.05:  # 5% drop
            return {
                "trigger": RetrainingTrigger.PERFORMANCE_DROP.value,
                "reason": f"Accuracy dropped by {drop:.2%}",
                "priority": "high",
                "drop": drop,
            }
        
        return None
    
    def trigger_retraining(
        self,
        trigger: RetrainingTrigger,
        reason: str,
        model_version: str,
        jurisdiction_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Trigger model retraining"""
        training_job = {
            "trigger": trigger.value,
            "reason": reason,
            "model_version": model_version,
            "jurisdiction_id": jurisdiction_id,
            "status": "queued",
            "created_at": datetime.utcnow().isoformat(),
        }
        
        # Queue training job
        # self.training_service.queue_training_job(training_job)
        
        return training_job
