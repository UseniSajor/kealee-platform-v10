# Deploy to Staging - Ready Now

## ✅ Status

- ✅ Vercel CLI installed
- ✅ Railway CLI logged in
- ⏳ Vercel login in progress (complete in browser)

---

## 🚀 Deploy After Login

Once you've completed `vercel login` in your browser, run:

```powershell
# Deploy all Vercel apps
$apps = @("m-marketplace", "m-ops-services", "m-project-owner", "m-permits-inspections", "m-architect", "os-admin", "os-pm")
foreach ($app in $apps) {
    Write-Host "Deploying $app..." -ForegroundColor Cyan
    cd "apps/$app"
    vercel deploy --yes
    cd ../..
    Write-Host ""
}

# Deploy Railway services
cd services/api
railway up
cd ../..

cd services/worker
railway up
cd ../..
```

---

## 📋 Quick Commands

### Vercel - Deploy All Apps

```powershell
foreach ($app in @("m-marketplace", "m-ops-services", "m-project-owner", "m-permits-inspections", "m-architect", "os-admin", "os-pm")) {
    cd "apps/$app"
    vercel deploy --yes
    cd ../..
}
```

### Railway - Deploy Services

```powershell
# API Service
cd services/api
railway up
cd ../..

# Worker Service
cd services/worker
railway up
cd ../..
```

---

## 🎯 Alternative: Use Dashboards

If CLI deployment has issues, use the dashboards:

### Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Select each project
3. Click "Deploy" → "Deploy Latest"

### Railway Dashboard
1. Go to: https://railway.app
2. Select each service
3. Click "Deploy" or trigger via GitHub

---

## ✅ Verification

After deployment, check:

- **Vercel:** https://vercel.com/dashboard
- **Railway:** https://railway.app

All apps should show as "Deployed" or "Active".


