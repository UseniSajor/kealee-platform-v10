# Staging Deployment Status

## Deployment Attempt Summary

**Date:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

### Vercel Deployments

Attempted to deploy 7 applications:
- ❌ m-marketplace
- ❌ m-ops-services
- ❌ m-project-owner
- ❌ m-permits-inspections
- ❌ m-architect
- ❌ os-admin
- ❌ os-pm

### Railway Deployments

Attempted to deploy 2 services:
- ❌ API service
- ❌ Worker service

---

## Common Issues & Solutions

### Vercel Deployment Issues

1. **Not logged in:**
   ```powershell
   vercel login
   ```

2. **Projects not linked:**
   ```powershell
   cd apps/m-ops-services
   vercel link
   ```

3. **Build required first:**
   ```powershell
   cd apps/m-ops-services
   pnpm build
   vercel deploy --prebuilt
   ```

### Railway Deployment Issues

1. **Not logged in:**
   ```powershell
   railway login
   ```

2. **Service not linked:**
   ```powershell
   cd services/api
   railway link
   ```

3. **Environment variables missing:**
   - Check Railway dashboard for required variables
   - Use `railway variables` to view current variables

---

## Recommended Deployment Steps

### Step 1: Verify CLI Access

```powershell
# Check Vercel
vercel whoami

# Check Railway
railway whoami
```

### Step 2: Link Projects (if needed)

**Vercel:**
```powershell
foreach ($app in @("m-marketplace", "m-ops-services", "m-project-owner", "m-permits-inspections", "m-architect", "os-admin", "os-pm")) {
    cd "apps/$app"
    vercel link
    cd ../..
}
```

**Railway:**
```powershell
cd services/api
railway link

cd ../worker
railway link
```

### Step 3: Build and Deploy

**Vercel (with build):**
```powershell
foreach ($app in @("m-marketplace", "m-ops-services", "m-project-owner", "m-permits-inspections", "m-architect", "os-admin", "os-pm")) {
    Write-Host "Building and deploying $app..." -ForegroundColor Cyan
    cd "apps/$app"
    pnpm build
    vercel deploy --prebuilt --yes
    cd ../..
}
```

**Railway:**
```powershell
cd services/api
railway up

cd ../worker
railway up
```

---

## Alternative: Use Vercel Dashboard

If CLI deployments fail, use the Vercel dashboard:

1. Go to https://vercel.com/dashboard
2. Select each project
3. Click "Deploy" → "Deploy Latest"
4. Or connect GitHub repo for automatic deployments

---

## Alternative: Use Railway Dashboard

If CLI deployments fail, use the Railway dashboard:

1. Go to https://railway.app
2. Select each service
3. Click "Deploy" or trigger via GitHub integration
4. Check deployment logs for errors

---

## Next Steps

1. ✅ Check CLI login status
2. ⏳ Link projects if needed
3. ⏳ Verify environment variables are set
4. ⏳ Build applications before deploying
5. ⏳ Check deployment logs for specific errors

---

## Quick Commands

```powershell
# Vercel - Deploy single app
cd apps/m-ops-services
pnpm build
vercel deploy --prebuilt --yes

# Railway - Deploy API
cd services/api
railway up

# Railway - Deploy Worker
cd services/worker
railway up
```


