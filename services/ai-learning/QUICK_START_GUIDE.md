# Quick Start Guide - Simple Answers

## 1. Where is the Server? (MLflow)

**The server runs on YOUR computer** - it's not a remote server. You need to start it yourself.

### How to Start the MLflow Server:

1. **Open PowerShell** (or Terminal)
2. **Navigate to the AI learning folder:**
   ```powershell
   cd "c:\Kealee-Platform v10\services\ai-learning"
   ```

3. **Activate the Python environment:**
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```

4. **Start the MLflow server:**
   ```powershell
   mlflow ui --port 5000
   ```

5. **You'll see output like:**
   ```
   [INFO] Starting MLflow UI at http://127.0.0.1:5000
   ```

6. **Open your browser and go to:**
   ```
   http://localhost:5000
   ```

**Note:** Keep the PowerShell window open while using MLflow. Close it to stop the server.

---

## 2. What is W&B? (Weights & Biases)

**W&B = Weights & Biases** - It's a **cloud-based service** (like a website) that tracks your AI/ML experiments.

### What it does:
- 📊 Tracks your AI model training progress
- 📈 Shows graphs and metrics
- 💾 Stores experiment results in the cloud
- 🔍 Helps you compare different AI models

**Think of it like:** GitHub for AI experiments - it stores and tracks your work online.

**Website:** https://wandb.ai

---

## 3. Where Do I Log In? (W&B Login)

### Step 1: Create a Free Account

1. **Go to:** https://wandb.ai/signup
2. **Sign up** with your email (it's free)
3. **Verify your email** if needed

### Step 2: Get Your API Key

1. **Go to:** https://wandb.ai/authorize
2. **Copy your API key** (it looks like: `abc123def456...`)

### Step 3: Login from Command Line

1. **Open PowerShell** in the AI learning folder:
   ```powershell
   cd "c:\Kealee-Platform v10\services\ai-learning"
   .\venv\Scripts\Activate.ps1
   ```

2. **Run the login command:**
   ```powershell
   wandb login
   ```

3. **Paste your API key** when prompted and press Enter

4. **Verify it worked:**
   ```powershell
   wandb status
   ```
   
   Should show: `wandb: Logged in as: your_username`

---

## Summary

| Item | What It Is | Where/How |
|------|------------|-----------|
| **MLflow Server** | Local tracking server | Start with `mlflow ui --port 5000` on your computer |
| **MLflow URL** | Web interface | http://localhost:5000 (only works after starting server) |
| **W&B** | Cloud AI tracking service | Website: https://wandb.ai |
| **W&B Login** | Command line login | Run `wandb login` in PowerShell |
| **W&B Signup** | Create account | https://wandb.ai/signup |
| **W&B API Key** | Your access key | https://wandb.ai/authorize |

---

## Quick Commands Reference

### Start MLflow Server:
```powershell
cd "c:\Kealee-Platform v10\services\ai-learning"
.\venv\Scripts\Activate.ps1
mlflow ui --port 5000
```
Then open: http://localhost:5000

### Login to W&B:
```powershell
cd "c:\Kealee-Platform v10\services\ai-learning"
.\venv\Scripts\Activate.ps1
wandb login
# Paste API key from https://wandb.ai/authorize
```

---

## Need Help?

- **MLflow not starting?** Make sure Python environment is activated
- **Can't access http://localhost:5000?** Make sure MLflow server is running
- **W&B login failing?** Double-check your API key from https://wandb.ai/authorize
- **Forgot API key?** Go to https://wandb.ai/authorize to get a new one
