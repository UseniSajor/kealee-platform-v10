# How to Configure Railway Dashboard - Step by Step

## Step-by-Step Guide to Configure Build & Start Commands

### Step 1: Access Your Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Sign in to your account
3. Click on your project (or create a new one if you haven't)

### Step 2: Navigate to Service Settings

**If you already have a service:**
1. In your project, you'll see your services listed
2. Click on the service you want to configure (e.g., "api" or the service name)
3. You'll see tabs at the top: **Deployments**, **Metrics**, **Logs**, **Settings**

**If you need to create a service:**
1. Click the **"+"** button or **"New"** button
2. Select **"GitHub Repo"**
3. Choose your repository: `UseniSajor/kealee-platform-v10`
4. Select branch: `main`
5. Railway will create a new service

### Step 3: Open Settings Tab

1. Click on the **"Settings"** tab (usually at the top or in a sidebar)
2. You'll see several sections:
   - **General**
   - **Source** ← **Click this one!**
   - **Networking**
   - **Variables**
   - etc.

### Step 4: Configure Source Settings

Click on **"Source"** in the Settings menu.

You'll see these fields:

#### A. Root Directory
- **Leave this EMPTY** (blank)
- This tells Railway to use the monorepo root

#### B. Build Command
- **Click in the "Build Command" field**
- **Enter this exactly:**
  ```
  pnpm install && pnpm build --filter=@kealee/api
  ```
- This installs dependencies and builds only the API service

#### C. Start Command
- **Click in the "Start Command" field**
- **Enter this exactly:**
  ```
  cd services/api && node dist/index.js
  ```
- This changes to the API directory and starts the compiled service

#### D. Watch Paths (Optional)
- You can add: `services/api/**`
- This tells Railway which files to watch for auto-deploy

### Step 5: Save Configuration

1. **Scroll down** (if needed) to find the **"Save"** or **"Update"** button
2. **Click "Save"**
3. Railway will automatically start a new deployment with your new settings

### Step 6: Monitor Deployment

1. Go to the **"Deployments"** tab
2. You'll see a new deployment starting
3. Click on it to see the build logs
4. Watch for:
   - ✅ "Installing dependencies..."
   - ✅ "Building @kealee/api..."
   - ✅ "Starting service..."
   - ✅ "🚀 API server running on port..."

## Visual Guide

```
Railway Dashboard Layout:
┌─────────────────────────────────────────┐
│  Railway Dashboard                      │
│                                         │
│  [Your Project Name]                   │
│  ┌─────────────────────────────────┐   │
│  │  [Service Name]                 │   │ ← Click here
│  │                                 │   │
│  │  Tabs:                          │   │
│  │  [Deployments] [Metrics]        │   │
│  │  [Logs] [Settings] ← Click      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Settings Page:                         │
│  ┌─────────────────────────────────┐   │
│  │  General                        │   │
│  │  Source ← Click this            │   │
│  │  Networking                     │   │
│  │  Variables                      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Source Settings:                       │
│  ┌─────────────────────────────────┐   │
│  │  Root Directory: [empty]        │   │
│  │                                 │   │
│  │  Build Command:                 │   │
│  │  [pnpm install && pnpm build...]│   │ ← Type here
│  │                                 │   │
│  │  Start Command:                 │   │
│  │  [cd services/api && node...]   │   │ ← Type here
│  │                                 │   │
│  │  [Save] ← Click to save         │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## Configuration for Different Services

### For API Service:

**Build Command:**
```
pnpm install && pnpm build --filter=@kealee/api
```

**Start Command:**
```
cd services/api && node dist/index.js
```

### For Worker Service:

**Build Command:**
```
pnpm install && pnpm build --filter=@kealee/worker
```

**Start Command:**
```
cd services/worker && node dist/index.js
```

## Common Issues & Solutions

### Issue: "Save" button is grayed out
- **Solution:** Make sure you've entered both Build and Start commands

### Issue: Can't find "Source" tab
- **Solution:** Make sure you're in the service settings, not project settings
- Click on the service name first, then Settings

### Issue: Build command field is missing
- **Solution:** Some Railway interfaces show it differently
- Look for "Build Settings" or "Deploy Settings"
- Or check if there's an "Advanced" section

### Issue: Changes not saving
- **Solution:** 
  1. Make sure you clicked "Save"
  2. Refresh the page
  3. Check if deployment started (should auto-deploy after save)

## Alternative: Using Raw Editor

Some Railway interfaces have a "Raw Editor" option:

1. In Source settings, look for **"Raw Editor"** or **"Edit as JSON"**
2. You can paste this configuration:

```json
{
  "buildCommand": "pnpm install && pnpm build --filter=@kealee/api",
  "startCommand": "cd services/api && node dist/index.js"
}
```

## Verification Checklist

After configuring, verify:

- [ ] Build Command is set correctly
- [ ] Start Command is set correctly
- [ ] Root Directory is empty (or set correctly)
- [ ] Settings are saved
- [ ] New deployment started automatically
- [ ] Build logs show successful build
- [ ] Service starts without errors

## Next Steps After Configuration

1. ✅ Wait for deployment to complete
2. ✅ Check deployment logs for errors
3. ✅ Verify service is running (green status)
4. ✅ Test your API endpoint
5. ✅ Set up environment variables (if not done)
6. ✅ Configure custom domain (optional)

## Quick Reference

**API Service Configuration:**
- Build: `pnpm install && pnpm build --filter=@kealee/api`
- Start: `cd services/api && node dist/index.js`

**Worker Service Configuration:**
- Build: `pnpm install && pnpm build --filter=@kealee/worker`
- Start: `cd services/worker && node dist/index.js`

## Need Help?

If you can't find these settings:
1. Check Railway documentation: https://docs.railway.app
2. Look for "Deploy Settings" or "Build Settings"
3. Railway interface may vary - look for any field related to "build" or "start"
4. Try the Railway CLI: `railway variables` to see available options
