# Railway Manual Deployment Guide

**Issue**: Push to main didn't trigger automatic build
**Cause**: GitHub webhook not configured or not firing
**Solution**: Manual deployment + webhook fix

---

## 🚀 MANUAL DEPLOY NOW (5 minutes)

### Step 1: Go to Railway Dashboard
```
URL: https://railway.app/dashboard
```

### Step 2: Select Web-Main Service
```
Top left dropdown → Select "web-main"
(NOT os-admin, NOT portal-owner, NOT worker)
```

### Step 3: Trigger Manual Build
```
Option A: Click "Deploy" button (top right)
Option B: Click "⋯" (more menu) → "Trigger Deploy"
```

### Step 4: Configure Deployment
```
When prompted:
  • Branch: select "main"
  • Commit: select "abef25aa" (latest)
  • Click "Deploy"
```

### Step 5: Monitor Build
```
You should see:
  1. "Building..." (5-10 min)
  2. "Deploying..." (1-2 min)
  3. ✅ "Successfully deployed"

Click on deployment to see real-time logs
```

### Step 6: Verify Live
```
curl https://kealee.com/api/health

Expected response:
{
  "status": "ok",
  "database": "connected",
  "twilio": "operational"
}
```

---

## 🔗 FIX WEBHOOK (So future pushes auto-deploy)

### Check Current Status

**In Railway Dashboard:**
```
1. Click Project → Settings (⚙️)
2. Look for "GitHub" section
3. Check if connected:
   ✅ Repository: UseniSajor/kealee-platform-v10
   ✅ Branch: main
   ✅ Auto-deploy: ON
```

### If NOT Connected

**Step 1: Disconnect Current**
```
Settings → GitHub → Click "Disconnect"
```

**Step 2: Reconnect Repository**
```
Settings → GitHub → Click "Connect"
→ Authorize Railway in GitHub
→ Select repository: UseniSajor/kealee-platform-v10
→ Select branch: main
→ Toggle: "Auto-deploy" = ON
```

**Step 3: Verify Webhook**
```
GitHub Repo Settings → Webhooks → Should see Railway webhook
```

### If GitHub Webhook Still Not Working

**Alternative: Use Railway's Webhook**

```
In Railway Dashboard:
  1. Settings → Integrations
  2. Copy webhook URL
  3. Go to GitHub Repo → Settings → Webhooks
  4. Add webhook:
     - Payload URL: [Railway webhook URL]
     - Content type: application/json
     - Events: Push events
     - Active: ✓
  5. Click "Add webhook"
```

---

## 📋 CURRENT DEPLOYMENT STATE

**Latest Commit**: `abef25aa`
- Dockerfile fix for optional dependencies
- Should build now

**Before Fix**: `f2eaa3ea`
- mobile-measurement package.json fix

**Before That**: `e2d37cc7`
- Production activation commands

All committed to `main` ✅

---

## ✅ CHECKLIST

### Pre-Deployment
- [ ] You can access https://railway.app/dashboard
- [ ] You can see "web-main" service
- [ ] Latest commit is `abef25aa` (check GitHub main branch)

### Deployment
- [ ] Clicked "Deploy" in Railway
- [ ] Selected branch: main
- [ ] Selected commit: abef25aa
- [ ] Build started (see "Building..." status)
- [ ] Build completed (see "✅ Successfully deployed")

### Post-Deployment
- [ ] Test API: `curl https://kealee.com/api/health`
- [ ] Should return: `{ "status": "ok" }`
- [ ] Check Sentry: https://sentry.io (no new errors)
- [ ] Check Twilio: https://www.twilio.com/console/sms/logs

### Webhook Fix (For Auto-Deploy Next Time)
- [ ] Verify GitHub webhook in Railway settings
- [ ] If missing, reconnect repository
- [ ] Test: Make a small push to main, watch for auto-build

---

## 🆘 TROUBLESHOOTING

### "Build started but failed"
```
Click on deployment → "Build Logs"
Look for error message
Common issues:
  ❌ "pnpm: command not found"
     → pnpm not installed in Railway
     → Restart railway pod

  ❌ "Module not found"
     → Lockfile still outdated
     → Run: pnpm install --no-frozen-lockfile locally
     → Commit pnpm-lock.yaml
     → Push and redeploy

  ❌ "Out of memory"
     → Increase build memory in Railway
     → Settings → Build Settings → Memory
```

### "Build never started"
```
Webhook not firing. Fix:
  1. Check GitHub webhook exists
  2. Check Railway webhook URL is correct
  3. Manually deploy using "Deploy" button
  4. After manual deploy works, check webhook logs
     → GitHub Repo → Settings → Webhooks → Recent Deliveries
```

### "Deploy succeeded but site down"
```
Check:
  1. Railway logs: Recent errors?
  2. Service status: Running?
  3. Environment variables: All set?
  4. Port: 3000?
  5. Try: pnpm run build locally to find build errors
```

---

## 🎯 IMMEDIATE NEXT STEPS

**Right now:**
1. Go to https://railway.app/dashboard
2. Click "Deploy" button
3. Select commit: abef25aa
4. Click "Deploy"
5. Wait 10-15 minutes for build + deployment
6. Test: `curl https://kealee.com/api/health`
7. Check logs if anything goes wrong

**After successful deploy:**
1. Verify webhook is set up
2. Make a test push to main
3. Confirm automatic build starts
4. Once webhook works, you won't need manual deploys

---

## 📞 IF STUCK

If build fails:
1. Check build logs for error message
2. If "pnpm: not found" → Try manual deploy again (Railway pod may need restart)
3. If "lockfile mismatch" → Run `pnpm install` locally, commit lock, push
4. If webhook → Try GitHub webhook instead of Railway's

Let me know what error you see in build logs!
