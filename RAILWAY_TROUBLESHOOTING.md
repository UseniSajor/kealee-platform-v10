# Railway Troubleshooting Guide

## Issue: Main Branch Disconnected

If your main branch shows as "disconnected" in Railway, here's how to fix it:

## Quick Fix Steps

### 1. Check GitHub Connection

**Via Dashboard:**
1. Go to Railway dashboard
2. Click on your project
3. Go to **Settings** → **Source**
4. Check if GitHub is connected
5. If not connected, click **"Connect GitHub"** or **"Reconnect"**

### 2. Reconnect GitHub Repository

**Option A: Via Dashboard**
1. Go to project **Settings** → **Source**
2. Click **"Disconnect"** (if connected but broken)
3. Click **"Connect GitHub"**
4. Select your repository
5. Select the branch (usually `main` or `master`)
6. Click **"Connect"**

**Option B: Via CLI**
```bash
# Link to your project
railway link

# Check current connection
railway status

# If needed, reconnect
railway connect
```

### 3. Verify Branch Name

Railway might be looking for the wrong branch:
- Check if your default branch is `main` or `master`
- In Railway: **Settings** → **Source** → **Branch**
- Update to match your GitHub default branch

### 4. Check Repository Permissions

1. Go to GitHub → **Settings** → **Applications** → **Authorized OAuth Apps**
2. Find **Railway**
3. Ensure it has access to your repository
4. If not, re-authorize Railway

### 5. Manual Reconnection

If automatic connection fails:

1. **Disconnect completely:**
   - Railway dashboard → Project → Settings → Source
   - Click **"Disconnect"**

2. **Reconnect:**
   - Click **"New"** → **"GitHub Repo"**
   - Select your repository
   - Select branch: `main`
   - Click **"Deploy"**

## Common Causes

### Cause 1: GitHub Token Expired
- Railway's GitHub token may have expired
- **Fix**: Reconnect GitHub in Railway settings

### Cause 2: Repository Moved/Renamed
- If you renamed your repository, Railway loses connection
- **Fix**: Reconnect with new repository name

### Cause 3: Branch Name Mismatch
- Railway looking for `master` but repo uses `main` (or vice versa)
- **Fix**: Update branch name in Railway settings

### Cause 4: Repository Permissions Changed
- GitHub permissions revoked or changed
- **Fix**: Re-authorize Railway in GitHub settings

### Cause 5: Repository Made Private
- If repo was public and made private, Railway may lose access
- **Fix**: Ensure Railway has access to private repos in GitHub settings

## Verification Steps

### Check Connection Status

**Via Dashboard:**
1. Project → Settings → Source
2. Should show: "Connected to GitHub" with repository name
3. Should show branch name (e.g., "main")

**Via CLI:**
```bash
railway status
# Should show connected repository and branch
```

### Test Deployment

After reconnecting:
1. Make a small change (e.g., update README)
2. Commit and push to `main` branch
3. Check Railway dashboard for new deployment
4. Should auto-deploy if connected correctly

## Advanced: Manual Service Setup

If reconnection doesn't work, set up services manually:

### For API Service:

1. **Create New Service:**
   - Railway dashboard → **New** → **GitHub Repo**
   - Select repository
   - Select branch: `main`

2. **Configure Service:**
   - **Root Directory**: (leave empty for monorepo root)
   - **Build Command**: `pnpm install && pnpm build --filter=@kealee/api`
   - **Start Command**: `cd services/api && node dist/index.js`

3. **Set Environment Variables:**
   - Add all required variables (see `RAILWAY_SETUP.md`)

### For Worker Service:

1. **Create New Service:**
   - Railway dashboard → **New** → **GitHub Repo**
   - Select same repository
   - Select branch: `main`

2. **Configure Service:**
   - **Root Directory**: (leave empty)
   - **Build Command**: `pnpm install && pnpm build --filter=@kealee/worker`
   - **Start Command**: `cd services/worker && node dist/index.js`

3. **Set Environment Variables:**
   - Add worker-specific variables

## CLI Commands for Troubleshooting

```bash
# Check project status
railway status

# View project info
railway whoami

# List services
railway service list

# Check logs
railway logs

# Link to project (if disconnected)
railway link

# Connect GitHub (if using CLI)
railway connect
```

## Still Not Working?

### Check These:

1. **GitHub Repository Settings:**
   - Is the repository accessible?
   - Is the branch name correct?
   - Is the repository private? (Railway needs access)

2. **Railway Account:**
   - Is your Railway account active?
   - Do you have access to the project?
   - Check Railway status: https://status.railway.app

3. **Network Issues:**
   - Check Railway status page
   - Try reconnecting after a few minutes

4. **Repository Webhooks:**
   - GitHub → Repository → Settings → Webhooks
   - Check if Railway webhook exists and is active
   - If missing, Railway will create it on reconnect

## Prevention

To avoid disconnection issues:

1. **Don't rename repository** without updating Railway
2. **Don't change default branch** without updating Railway
3. **Keep Railway GitHub token active** (reconnect periodically)
4. **Monitor Railway status** for service issues

## Getting Help

If none of these work:

1. Check Railway status: https://status.railway.app
2. Railway Discord: https://discord.gg/railway
3. Railway docs: https://docs.railway.app
4. Check Railway logs for error messages

## Quick Checklist

- [ ] GitHub repository is accessible
- [ ] Branch name matches (main/master)
- [ ] Railway has GitHub access
- [ ] Repository permissions are correct
- [ ] Railway webhook exists in GitHub
- [ ] Tried reconnecting in Railway dashboard
- [ ] Checked Railway status page
- [ ] Verified branch exists in GitHub
