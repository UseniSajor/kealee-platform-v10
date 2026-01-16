"""
Federated Learning Trainer
Privacy-preserving federated learning for jurisdiction-specific models
"""

import torch
import torch.nn as nn
from typing import Dict, Any, List
import copy
from datetime import datetime


class FederatedTrainer:
    """Federated learning trainer for privacy-preserving training"""
    
    def __init__(
        self,
        global_model: nn.Module,
        num_jurisdictions: int,
        aggregation_strategy: str = "fedavg"
    ):
        self.global_model = global_model
        self.num_jurisdictions = num_jurisdictions
        self.aggregation_strategy = aggregation_strategy
        self.jurisdiction_models = {}
        self.jurisdiction_data_sizes = {}
    
    def train_round(
        self,
        jurisdiction_id: str,
        local_data: List[Dict[str, Any]],
        local_epochs: int = 3,
        learning_rate: float = 0.01
    ) -> Dict[str, Any]:
        """Train one jurisdiction's local model"""
        # Create local model copy
        local_model = copy.deepcopy(self.global_model)
        local_model.train()
        
        # Prepare data
        dataset = self._prepare_dataset(local_data)
        train_loader = torch.utils.data.DataLoader(dataset, batch_size=32, shuffle=True)
        
        # Train locally
        optimizer = torch.optim.SGD(local_model.parameters(), lr=learning_rate)
        criterion = nn.CrossEntropyLoss()
        
        for epoch in range(local_epochs):
            for features, labels in train_loader:
                optimizer.zero_grad()
                outputs = local_model(features)
                loss = criterion(outputs, labels)
                loss.backward()
                optimizer.step()
        
        # Store local model and data size
        self.jurisdiction_models[jurisdiction_id] = local_model.state_dict()
        self.jurisdiction_data_sizes[jurisdiction_id] = len(local_data)
        
        return {
            "jurisdiction_id": jurisdiction_id,
            "data_size": len(local_data),
            "trained": True,
        }
    
    def aggregate_models(self) -> Dict[str, torch.Tensor]:
        """Aggregate local models into global model (FedAvg)"""
        if not self.jurisdiction_models:
            return self.global_model.state_dict()
        
        # Calculate total data size
        total_size = sum(self.jurisdiction_data_sizes.values())
        
        # Initialize aggregated state dict
        aggregated_state = {}
        
        # Weighted average of model parameters
        for key in self.global_model.state_dict().keys():
            aggregated_param = None
            
            for jurisdiction_id, local_state in self.jurisdiction_models.items():
                weight = self.jurisdiction_data_sizes[jurisdiction_id] / total_size
                param = local_state[key]
                
                if aggregated_param is None:
                    aggregated_param = param * weight
                else:
                    aggregated_param += param * weight
            
            aggregated_state[key] = aggregated_param
        
        # Update global model
        self.global_model.load_state_dict(aggregated_state)
        
        return aggregated_state
    
    def transfer_learning(
        self,
        source_model: nn.Module,
        target_jurisdiction: str,
        target_data: List[Dict[str, Any]],
        fine_tune_layers: List[str] = None
    ) -> nn.Module:
        """Transfer learning from general model to jurisdiction-specific"""
        # Clone source model
        target_model = copy.deepcopy(source_model)
        
        # Freeze layers that shouldn't be fine-tuned
        if fine_tune_layers:
            for name, param in target_model.named_parameters():
                if name not in fine_tune_layers:
                    param.requires_grad = False
        
        # Fine-tune on target data
        optimizer = torch.optim.Adam(
            filter(lambda p: p.requires_grad, target_model.parameters()),
            lr=0.001
        )
        criterion = nn.CrossEntropyLoss()
        
        dataset = self._prepare_dataset(target_data)
        train_loader = torch.utils.data.DataLoader(dataset, batch_size=32, shuffle=True)
        
        for epoch in range(5):  # Few epochs for fine-tuning
            for features, labels in train_loader:
                optimizer.zero_grad()
                outputs = target_model(features)
                loss = criterion(outputs, labels)
                loss.backward()
                optimizer.step()
        
        return target_model
    
    def _prepare_dataset(self, data: List[Dict[str, Any]]):
        """Prepare dataset from raw data"""
        # Convert data to tensors (mock implementation)
        features = torch.randn(len(data), 128)  # Mock features
        labels = torch.randint(0, 3, (len(data),))  # Mock labels
        
        return [(features[i], labels[i]) for i in range(len(data))]
