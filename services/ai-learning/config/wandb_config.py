"""
Weights & Biases Configuration
Configures W&B project and entity settings
"""

import os

# W&B Configuration
WANDB_API_KEY = os.getenv("WANDB_API_KEY")
WANDB_PROJECT = os.getenv("WANDB_PROJECT", "kealee-permit-ai")
WANDB_ENTITY = os.getenv("WANDB_ENTITY", "kealee")
WANDB_MODE = os.getenv("WANDB_MODE", "online")  # online, offline, disabled

def configure_wandb():
    """Configure W&B with environment settings"""
    config = {
        "project": WANDB_PROJECT,
        "entity": WANDB_ENTITY,
        "mode": WANDB_MODE,
        "api_key_set": WANDB_API_KEY is not None,
    }
    
    if WANDB_API_KEY:
        os.environ["WANDB_API_KEY"] = WANDB_API_KEY
    
    return config
