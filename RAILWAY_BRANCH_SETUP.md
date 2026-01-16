# Railway Branch Setup Guide

## Understanding "Branch connected to production"

This setting tells Railway:
- **Which GitHub branch to watch** for changes
- **Which branch to deploy** when you push code
- **Which environment** the branch is connected to

## Current Situation

You're seeing:
- ✅ **Branch:** `main` (correct choice)
- ⚠️ **"Connected branch does not exist"** - This is normal if you haven't pushed to GitHub yet

## Setup Steps

### Step 1: Push Your Code to GitHub First

Before connecting Railway, you need to push your code to GitHub:

```bash
# Make sure you're on the main branch
git branch -M main

# Add all files (except .env.local which is ignored)
git add .

# Commit
git commit -m "Initial commit: Kealee Platform V10"

# Create GitHub repository first, then:
git remote add origin https://github.com/yourusername/kealee-platform-v10.git
git push -u origin main
```

### Step 2: Configure Railway Branch Setting

Once your code is on GitHub:

1. **In Railway Dashboard:**
   - Go to your service
   - Click on **"Settings"** tab
   - Find **"Source"** or **"GitHub"** section
   - Look for **"Branch"** or **"Production Branch"** setting

2. **Set Branch to `main`:**
   - Select or type: `main`
   - This is your default branch name
   - Railway will deploy from this branch

3. **Save the settings**

### Step 3: Verify Connection

After pushing to GitHub:
- Railway should automatically detect the `main` branch
- The "Connected branch does not exist" message should disappear
- Railway will show: "Connected to `main` branch"

## Branch Strategy

### Recommended Setup:

```
Production Environment:
- Branch: main
- Auto-deploy: Yes
- Environment: Production

Staging Environment (optional):
- Branch: develop or staging
- Auto-deploy: Yes
- Environment: Staging
```

## What Happens After Setup

1. **You push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Railway automatically:**
   - Detects the push
   - Pulls the latest code from `main` branch
   - Runs your build command
   - Deploys the new version

3. **You see deployment in Railway:**
   - Build logs
   - Deployment status
   - Live URL

## Troubleshooting

### "Connected branch does not exist"

**Cause:** Branch hasn't been pushed to GitHub yet

**Solution:**
1. Push your code to GitHub first
2. Make sure branch is named `main` (or match Railway setting)
3. Refresh Railway dashboard

### "Branch not found"

**Cause:** Branch name mismatch

**Solution:**
- Check your GitHub branch name: `git branch`
- Update Railway to match (or rename branch)
- Common names: `main`, `master`, `develop`

### Railway not detecting pushes

**Solution:**
1. Verify GitHub integration is connected
2. Check Railway has access to your repository
3. Ensure branch name matches exactly
4. Try manual deploy first, then enable auto-deploy

## Quick Checklist

- [ ] Code pushed to GitHub
- [ ] Branch named `main` (or matching Railway setting)
- [ ] Railway connected to GitHub repository
- [ ] Branch setting in Railway set to `main`
- [ ] Auto-deploy enabled (optional but recommended)
- [ ] Environment variables configured
- [ ] Build command set correctly

## Next Steps After Branch Setup

1. ✅ Push code to GitHub
2. ✅ Set Railway branch to `main`
3. ✅ Configure environment variables
4. ✅ Set build/start commands
5. ✅ Deploy!

---

**Note:** The "Connected branch does not exist" message will disappear once you push your `main` branch to GitHub. This is expected behavior!
