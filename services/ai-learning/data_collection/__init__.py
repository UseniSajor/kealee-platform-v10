"""
Data Collection Module
"""

# Import from files with hyphens using importlib
import importlib.util
from pathlib import Path

# Load consent-manager.py
consent_manager_path = Path(__file__).parent / "consent-manager.py"
spec = importlib.util.spec_from_file_location("consent_manager", consent_manager_path)
consent_manager = importlib.util.module_from_spec(spec)
spec.loader.exec_module(consent_manager)

# Load outcome-tracker.py
outcome_tracker_path = Path(__file__).parent / "outcome-tracker.py"
spec = importlib.util.spec_from_file_location("outcome_tracker", outcome_tracker_path)
outcome_tracker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(outcome_tracker)

# Export classes
ConsentManager = consent_manager.ConsentManager
ConsentStatus = consent_manager.ConsentStatus
DataAnonymizer = consent_manager.DataAnonymizer
DataCollector = consent_manager.DataCollector
OutcomeTracker = outcome_tracker.OutcomeTracker
OutcomeStatus = outcome_tracker.OutcomeStatus

__all__ = [
    "ConsentManager",
    "ConsentStatus",
    "DataAnonymizer",
    "DataCollector",
    "OutcomeTracker",
    "OutcomeStatus",
]
