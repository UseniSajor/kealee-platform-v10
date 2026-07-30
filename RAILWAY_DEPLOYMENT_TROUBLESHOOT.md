# Railway Deployment Troubleshooting

**Issue**: Push to main didn't trigger Railway deployment
**Status**: Investigating

## Quick Checks

### 1. Verify GitHub Webhook
```bash
# Check if Railway webhook is configured in GitHub
curl -H "Authorization: token YOUR_GITHUB_TOKEN" \
  https://api.github.com/repos/UseniSajor/kealee-platform-v10/hooks

# Look for payload_url containing "railway.app"
# Should show webhook for Railway
```

### 2. Check Recent Deployments
```bash
# Go to: https://railway.app/dashboard
# Select web-main service
# Click "Deployments" tab
# Should show:
  - Build status (Running, Success, Failed)
  - Timestamp of latest push
  - Build logs
```

### 3. Manual Deploy Trigger
```bash
# If webhook isn't working, trigger manually:
# In Railway dashboard:
  1. Select web-main service
  2. Click "⋯" (more options)
  3. Click "Deploy" or "Trigger Deploy"
  4. Select branch: main
  5. Click "Deploy"
```

### 4. Check Build Logs
```bash
# In Railway dashboard:
# Click on latest deployment
# View "Build Logs" tab
# Look for:
  ✅ "pnpm install" completed
  ✅ "pnpm run build" completed
  ✅ "Service deployed" message

  ❌ If failed, see error message (likely build error)
```

### 5. Verify Branch is Main
```bash
git branch -v
# Should show: * main (current branch)

git log -1 --oneline
# Should show latest commit: f2eaa3ea
```

## Common Issues & Fixes

### Issue A: Webhook Not Configured
**Symptom**: Push to main, but no deployment starts
**Fix**:
```bash
# In Railway dashboard:
1. Go to Project Settings
2. Click "GitHub"
3. Reconnect repository
4. Enable "Deploy on push"
5. Select branch: main
```

### Issue B: Build Failing
**Symptom**: Deployment starts but fails
**Fix**: Check build logs for error, common ones:
```
- "Cannot find pnpm" → Install pnpm in Railway
- "Out of memory" → Increase build memory
- "Module not found" → pnpm install failed (dependencies issue)
```

### Issue C: Wrong Service Selected
**Symptom**: Deployment to wrong service (os-admin instead of web-main)
**Fix**:
```bash
# In Railway:
1. Make sure web-main service is selected
2. Check service name matches repo
3. Verify GitHub branch is connected to web-main
```

### Issue D: Branch Protection
**Symptom**: Push succeeds but deployment blocked
**Fix**:
```bash
# In GitHub:
1. Go to Settings → Branches
2. Check "main" branch rules
3. If "Require branches to be up to date" is enabled:
   - May need to resolve conflicts
   - May need status checks to pass
```

## Manual Deployment Steps

If webhook is broken, deploy manually:

```bash
# Step 1: In Railway Dashboard
https://railway.app/dashboard

# Step 2: Select Project → web-main service

# Step 3: Click "Deploy" or "Trigger Deploy" button

# Step 4: Choose:
  - Branch: main
  - Commit: latest (f2eaa3ea)

# Step 5: Click "Deploy"

# Step 6: Monitor build logs
  - Should see "Building..."
  - Then "Deploying..."
  - Then "✅ Service deployed"

# Step 7: Verify live
  - Visit https://kealee.com/api/health
  - Should return: { "status": "ok" }
```

## Check Deployment Status

**Current Status**:
```
Last commit: f2eaa3ea (Fix mobile-measurement deps)
Remote: origin/main (✅ pushed)
Local: main branch (✅ up to date)
Railway: Check dashboard for deployment status
```

## Next Steps

1. **Check Railway Dashboard** (right now):
   - https://railway.app/dashboard
   - Select web-main service
   - Look for recent deployments
   - View build logs

2. **If no deployment found**:
   - Click "Deploy" or "Trigger Deploy" manually
   - Monitor build logs
   - Verify success

3. **If build fails**:
   - Review error message in logs
   - Fix issue (likely dependency or build config)
   - Commit fix and push
   - Trigger deploy again

4. **If everything looks good**:
   - Test API: `curl https://kealee.com/api/health`
   - Test SMS: `curl -X POST https://kealee.com/api/intake/send-to-phone ...`
   - Monitor Sentry: https://sentry.io

## Direct Railway Links

- Dashboard: https://railway.app/dashboard
- Logs: https://railway.app/project/[project-id]/logs
- Deployments: https://railway.app/project/[project-id]/deployments
- Settings: https://railway.app/project/[project-id]/settings
- GitHub Integration: https://railway.app/project/[project-id]/settings?tab=github

---

**ACTION**: Check Railway dashboard NOW to see deployment status.
