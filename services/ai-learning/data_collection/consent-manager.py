"""
Consent Manager for Anonymized Data Collection
Tracks and manages consent for permit data collection
"""

from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum
import hashlib


class ConsentStatus(Enum):
    PENDING = "pending"
    GRANTED = "granted"
    REVOKED = "revoked"
    EXPIRED = "expired"


class ConsentManager:
    """Manages consent for anonymized data collection"""
    
    def __init__(self, db_connection):
        self.db = db_connection
    
    def request_consent(
        self,
        jurisdiction_id: str,
        purpose: str,
        data_types: list[str],
        retention_period_days: int = 2555  # 7 years default
    ) -> str:
        """Request consent for data collection"""
        consent_id = self._generate_consent_id(jurisdiction_id)
        
        consent_record = {
            "id": consent_id,
            "jurisdiction_id": jurisdiction_id,
            "purpose": purpose,
            "data_types": data_types,
            "status": ConsentStatus.PENDING.value,
            "requested_at": datetime.utcnow().isoformat(),
            "expires_at": None,  # Set after approval
            "retention_period_days": retention_period_days,
        }
        
        # Store in database (would use actual DB in production)
        # self.db.insert("data_consents", consent_record)
        
        return consent_id
    
    def grant_consent(self, consent_id: str) -> bool:
        """Grant consent for data collection"""
        # Update consent status
        # self.db.update("data_consents", consent_id, {"status": ConsentStatus.GRANTED.value})
        return True
    
    def check_consent(self, jurisdiction_id: str, data_type: str) -> bool:
        """Check if consent exists and is valid"""
        # Query database for active consent
        # return self.db.exists("data_consents", {
        #     "jurisdiction_id": jurisdiction_id,
        #     "data_types": {"$contains": data_type},
        #     "status": ConsentStatus.GRANTED.value,
        #     "expires_at": {"$gt": datetime.utcnow()}
        # })
        return True  # Mock for now
    
    def _generate_consent_id(self, jurisdiction_id: str) -> str:
        """Generate unique consent ID"""
        timestamp = datetime.utcnow().isoformat()
        raw = f"{jurisdiction_id}:{timestamp}"
        return hashlib.sha256(raw.encode()).hexdigest()[:16]


class DataAnonymizer:
    """Anonymizes permit data for ML training"""
    
    def anonymize_permit(self, permit_data: Dict[str, Any]) -> Dict[str, Any]:
        """Anonymize permit data by removing PII"""
        anonymized = permit_data.copy()
        
        # Remove PII fields
        pii_fields = [
            "applicantId",
            "applicantName",
            "applicantEmail",
            "applicantPhone",
            "architectId",
            "engineerId",
            "propertyId",
            "address",  # Replace with geohash
            "parcelNumber",
        ]
        
        for field in pii_fields:
            if field in anonymized:
                if field == "address":
                    # Replace with geohash for location preservation
                    anonymized[field] = self._geohash_address(anonymized[field])
                else:
                    anonymized[field] = None
        
        # Hash permit number for tracking without exposing
        if "permitNumber" in anonymized:
            anonymized["permitNumberHash"] = hashlib.sha256(
                anonymized["permitNumber"].encode()
            ).hexdigest()
            del anonymized["permitNumber"]
        
        # Add anonymization metadata
        anonymized["_anonymized"] = True
        anonymized["_anonymized_at"] = datetime.utcnow().isoformat()
        
        return anonymized
    
    def _geohash_address(self, address: str) -> str:
        """Convert address to geohash (mock implementation)"""
        # In production, use actual geocoding and geohash library
        return hashlib.md5(address.encode()).hexdigest()[:12]


class DataCollector:
    """Collects anonymized data for ML training"""
    
    def __init__(self, consent_manager: ConsentManager, anonymizer: DataAnonymizer):
        self.consent_manager = consent_manager
        self.anonymizer = anonymizer
    
    def collect_permit_data(
        self,
        jurisdiction_id: str,
        permit_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Collect permit data if consent exists"""
        # Check consent
        if not self.consent_manager.check_consent(jurisdiction_id, "permits"):
            return None
        
        # Anonymize data
        anonymized = self.anonymizer.anonymize_permit(permit_data)
        
        # Add collection metadata
        anonymized["_collected_at"] = datetime.utcnow().isoformat()
        anonymized["_jurisdiction_id"] = jurisdiction_id
        
        return anonymized
    
    def collect_correction_pattern(
        self,
        jurisdiction_id: str,
        correction_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Collect jurisdiction correction patterns"""
        if not self.consent_manager.check_consent(jurisdiction_id, "corrections"):
            return None
        
        # Anonymize correction data
        pattern = {
            "category": correction_data.get("category"),
            "priority": correction_data.get("priority"),
            "description_pattern": self._extract_pattern(correction_data.get("description", "")),
            "permit_type": correction_data.get("permitType"),
            "jurisdiction_id": jurisdiction_id,
            "_collected_at": datetime.utcnow().isoformat(),
        }
        
        return pattern
    
    def collect_inspector_feedback(
        self,
        jurisdiction_id: str,
        feedback_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Collect inspector feedback for model improvement"""
        if not self.consent_manager.check_consent(jurisdiction_id, "feedback"):
            return None
        
        feedback = {
            "inspection_type": feedback_data.get("inspectionType"),
            "result": feedback_data.get("result"),
            "ai_prediction": feedback_data.get("aiPrediction"),
            "human_override": feedback_data.get("humanOverride"),
            "feedback_notes": feedback_data.get("notes"),
            "jurisdiction_id": jurisdiction_id,
            "_collected_at": datetime.utcnow().isoformat(),
        }
        
        return feedback
    
    def _extract_pattern(self, description: str) -> str:
        """Extract pattern from correction description (mock)"""
        # In production, use NLP to extract common patterns
        return description.lower()[:100]
