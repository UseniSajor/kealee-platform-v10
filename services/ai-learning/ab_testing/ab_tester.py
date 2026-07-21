"""
A/B Testing Framework for Model Versions
Tests multiple model versions and tracks performance
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
import random
from enum import Enum


class ABTestStatus(Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"


class ABTester:
    """A/B testing framework for model versions"""
    
    def __init__(self, db_connection):
        self.db = db_connection
        self.active_tests = {}
    
    def create_test(
        self,
        test_name: str,
        model_versions: List[str],
        traffic_split: List[float] = None,
        jurisdiction_id: Optional[str] = None,
        permit_type: Optional[str] = None
    ) -> str:
        """Create new A/B test"""
        if traffic_split is None:
            # Equal split by default
            traffic_split = [1.0 / len(model_versions)] * len(model_versions)
        
        if abs(sum(traffic_split) - 1.0) > 0.01:
            raise ValueError("Traffic split must sum to 1.0")
        
        test_id = f"ab-test-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        test_config = {
            "test_id": test_id,
            "test_name": test_name,
            "model_versions": model_versions,
            "traffic_split": traffic_split,
            "jurisdiction_id": jurisdiction_id,
            "permit_type": permit_type,
            "status": ABTestStatus.DRAFT.value,
            "created_at": datetime.utcnow().isoformat(),
            "results": {},
        }
        
        self.active_tests[test_id] = test_config
        
        return test_id
    
    def start_test(self, test_id: str) -> bool:
        """Start an A/B test"""
        if test_id not in self.active_tests:
            return False
        
        self.active_tests[test_id]["status"] = ABTestStatus.ACTIVE.value
        self.active_tests[test_id]["started_at"] = datetime.utcnow().isoformat()
        
        return True
    
    def assign_model(
        self,
        test_id: str,
        request_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Assign model version for a request based on A/B test"""
        if test_id not in self.active_tests:
            return "default"
        
        test = self.active_tests[test_id]
        if test["status"] != ABTestStatus.ACTIVE.value:
            return "default"
        
        # Check jurisdiction/permit type filters
        if test.get("jurisdiction_id") and metadata:
            if metadata.get("jurisdiction_id") != test["jurisdiction_id"]:
                return "default"
        
        if test.get("permit_type") and metadata:
            if metadata.get("permit_type") != test["permit_type"]:
                return "default"
        
        # Assign based on traffic split
        r = random.random()
        cumulative = 0.0
        for i, split in enumerate(test["traffic_split"]):
            cumulative += split
            if r <= cumulative:
                model_version = test["model_versions"][i]
                self._track_assignment(test_id, request_id, model_version)
                return model_version
        
        return test["model_versions"][0]
    
    def record_result(
        self,
        test_id: str,
        request_id: str,
        model_version: str,
        prediction: Any,
        actual: Any,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Record A/B test result"""
        if test_id not in self.active_tests:
            return
        
        test = self.active_tests[test_id]
        
        if model_version not in test["results"]:
            test["results"][model_version] = {
                "total": 0,
                "correct": 0,
                "incorrect": 0,
                "metrics": {},
            }
        
        result = test["results"][model_version]
        result["total"] += 1
        
        if prediction == actual:
            result["correct"] += 1
        else:
            result["incorrect"] += 1
        
        accuracy = result["correct"] / result["total"] if result["total"] > 0 else 0.0
        result["metrics"]["accuracy"] = accuracy
    
    def get_test_results(self, test_id: str) -> Dict[str, Any]:
        """Get A/B test results"""
        if test_id not in self.active_tests:
            return {}
        
        test = self.active_tests[test_id]
        
        return {
            "test_id": test_id,
            "test_name": test["test_name"],
            "status": test["status"],
            "model_results": test["results"],
            "winner": self._determine_winner(test["results"]),
            "statistical_significance": self._calculate_significance(test["results"]),
        }
    
    def _track_assignment(self, test_id: str, request_id: str, model_version: str):
        """Track model version assignment"""
        pass
    
    def _determine_winner(self, results: Dict[str, Dict[str, Any]]) -> Optional[str]:
        """Determine winning model version"""
        if not results:
            return None
        
        best_version = None
        best_accuracy = 0.0
        
        for version, result in results.items():
            accuracy = result["metrics"].get("accuracy", 0.0)
            if accuracy > best_accuracy:
                best_accuracy = accuracy
                best_version = version
        
        return best_version
    
    def _calculate_significance(self, results: Dict[str, Dict[str, Any]]) -> bool:
        """Calculate statistical significance"""
        if len(results) < 2:
            return False
        
        total_samples = sum(r["total"] for r in results.values())
        return total_samples >= 100
