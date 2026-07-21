"""
PyTorch Model Trainer
Distributed training infrastructure for permit prediction models
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torch.nn.parallel import DistributedDataParallel as DDP
from typing import Dict, Any, List, Optional
import wandb
import mlflow
import mlflow.pytorch
from datetime import datetime


class PermitDataset(Dataset):
    """Dataset for permit data"""
    
    def __init__(self, data: List[Dict[str, Any]]):
        self.data = data
    
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        sample = self.data[idx]
        # Convert to tensors
        features = torch.tensor(sample["features"], dtype=torch.float32)
        labels = torch.tensor(sample["labels"], dtype=torch.long)
        return features, labels


class PermitPredictionModel(nn.Module):
    """Neural network for permit outcome prediction"""
    
    def __init__(self, input_size: int, hidden_sizes: List[int], num_classes: int):
        super(PermitPredictionModel, self).__init__()
        
        layers = []
        prev_size = input_size
        
        for hidden_size in hidden_sizes:
            layers.extend([
                nn.Linear(prev_size, hidden_size),
                nn.ReLU(),
                nn.Dropout(0.2),
            ])
            prev_size = hidden_size
        
        layers.append(nn.Linear(prev_size, num_classes))
        self.network = nn.Sequential(*layers)
    
    def forward(self, x):
        return self.network(x)


class ModelTrainer:
    """Distributed model trainer with MLflow and Weights & Biases integration"""
    
    def __init__(
        self,
        model_config: Dict[str, Any],
        training_config: Dict[str, Any],
        use_distributed: bool = False
    ):
        self.model_config = model_config
        self.training_config = training_config
        self.use_distributed = use_distributed
        
        # Initialize distributed training
        if use_distributed:
            torch.distributed.init_process_group(backend="nccl")
            self.rank = torch.distributed.get_rank()
            self.world_size = torch.distributed.get_world_size()
        else:
            self.rank = 0
            self.world_size = 1
        
        # Initialize Weights & Biases
        if self.rank == 0:
            wandb.init(
                project="kealee-permit-ai",
                config={**model_config, **training_config}
            )
        
        # Initialize MLflow
        if self.rank == 0:
            mlflow.set_experiment("permit-prediction")
    
    def create_model(self) -> nn.Module:
        """Create model from config"""
        model = PermitPredictionModel(
            input_size=self.model_config["input_size"],
            hidden_sizes=self.model_config["hidden_sizes"],
            num_classes=self.model_config["num_classes"]
        )
        
        if self.use_distributed:
            model = DDP(model)
        
        return model
    
    def train(
        self,
        train_loader: DataLoader,
        val_loader: Optional[DataLoader] = None,
        test_loader: Optional[DataLoader] = None
    ) -> Dict[str, Any]:
        """Train model with distributed support"""
        model = self.create_model()
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(
            model.parameters(),
            lr=self.training_config["learning_rate"]
        )
        
        device = torch.device(f"cuda:{self.rank}" if torch.cuda.is_available() else "cpu")
        model = model.to(device)
        
        best_val_acc = 0.0
        training_history = []
        
        for epoch in range(self.training_config["num_epochs"]):
            # Training
            model.train()
            train_loss = 0.0
            train_correct = 0
            train_total = 0
            
            for features, labels in train_loader:
                features = features.to(device)
                labels = labels.to(device)
                
                optimizer.zero_grad()
                outputs = model(features)
                loss = criterion(outputs, labels)
                loss.backward()
                optimizer.step()
                
                train_loss += loss.item()
                _, predicted = torch.max(outputs.data, 1)
                train_total += labels.size(0)
                train_correct += (predicted == labels).sum().item()
            
            train_acc = 100 * train_correct / train_total
            avg_train_loss = train_loss / len(train_loader)
            
            # Validation
            val_acc = 0.0
            val_loss = 0.0
            if val_loader:
                model.eval()
                val_correct = 0
                val_total = 0
                
                with torch.no_grad():
                    for features, labels in val_loader:
                        features = features.to(device)
                        labels = labels.to(device)
                        
                        outputs = model(features)
                        loss = criterion(outputs, labels)
                        val_loss += loss.item()
                        
                        _, predicted = torch.max(outputs.data, 1)
                        val_total += labels.size(0)
                        val_correct += (predicted == labels).sum().item()
                
                val_acc = 100 * val_correct / val_total
                avg_val_loss = val_loss / len(val_loader)
                
                if val_acc > best_val_acc:
                    best_val_acc = val_acc
                    # Save best model
                    if self.rank == 0:
                        self._save_model(model, epoch, val_acc)
            
            # Log metrics
            metrics = {
                "epoch": epoch,
                "train_loss": avg_train_loss,
                "train_acc": train_acc,
                "val_loss": avg_val_loss if val_loader else None,
                "val_acc": val_acc if val_loader else None,
            }
            
            if self.rank == 0:
                wandb.log(metrics)
                mlflow.log_metrics(metrics, step=epoch)
            
            training_history.append(metrics)
        
        # Final evaluation on test set
        test_metrics = {}
        if test_loader:
            test_metrics = self._evaluate(model, test_loader, device, criterion)
            if self.rank == 0:
                wandb.log({"test": test_metrics})
                mlflow.log_metrics({"test": test_metrics})
        
        return {
            "model": model,
            "history": training_history,
            "test_metrics": test_metrics,
            "best_val_acc": best_val_acc,
        }
    
    def _evaluate(
        self,
        model: nn.Module,
        loader: DataLoader,
        device: torch.device,
        criterion: nn.Module
    ) -> Dict[str, float]:
        """Evaluate model on dataset"""
        model.eval()
        correct = 0
        total = 0
        total_loss = 0.0
        
        with torch.no_grad():
            for features, labels in loader:
                features = features.to(device)
                labels = labels.to(device)
                
                outputs = model(features)
                loss = criterion(outputs, labels)
                total_loss += loss.item()
                
                _, predicted = torch.max(outputs.data, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()
        
        return {
            "accuracy": 100 * correct / total,
            "loss": total_loss / len(loader),
        }
    
    def _save_model(self, model: nn.Module, epoch: int, val_acc: float):
        """Save model to MLflow"""
        model_name = f"permit-predictor-v{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        with mlflow.start_run():
            mlflow.pytorch.log_model(
                model.module if hasattr(model, "module") else model,
                "model",
                registered_model_name=model_name
            )
            mlflow.log_param("epoch", epoch)
            mlflow.log_param("val_accuracy", val_acc)
            mlflow.log_param("model_config", str(self.model_config))
