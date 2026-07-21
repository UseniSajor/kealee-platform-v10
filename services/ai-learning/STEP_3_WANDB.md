# Step 3: Set Up Weights & Biases (W&B)

## Quick Start

### 1. Create W&B Account

1. Go to: **https://wandb.ai/signup**
2. Create a free account
3. Get your API key from: **https://wandb.ai/authorize**

### 2. Login to W&B

```bash
cd services/ai-learning
.\venv\Scripts\Activate.ps1
wandb login
```

Paste your API key when prompted.

### 3. Configure Environment

Create or update `services/ai-learning/.env`:

```env
WANDB_API_KEY=your_wandb_api_key_here
WANDB_PROJECT=kealee-permit-ai
WANDB_ENTITY=kealee
WANDB_MODE=online
```

### 4. Verify Setup

```bash
wandb status
```

Should show:
```
wandb: Logged in as: your_username
wandb: Tracking URI: https://api.wandb.ai
```

## Test W&B Integration

### Quick Test

```python
import wandb

# Initialize (will use .env settings)
wandb.init(project="test", mode="offline")
wandb.log({"test": 1})
wandb.finish()
print("W&B working!")
```

### Test with Configuration

```python
from config.wandb_config import configure_wandb
import wandb

config = configure_wandb()
print(config)

# Initialize
wandb.init(
    project=config["project"],
    entity=config["entity"],
    mode=config["mode"]
)
wandb.log({"test": 1})
wandb.finish()
```

## Modes

- **online**: Default, syncs to W&B cloud
- **offline**: Runs offline, sync later with `wandb sync`
- **disabled**: Disables W&B logging

## Verification

Run verification script:
```bash
python scripts/setup_complete.py
```

---

**Status**: Ready to login and configure W&B
