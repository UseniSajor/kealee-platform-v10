# 🚀 Deploy to Staging - Quick Guide

## Current Status

**Vercel Login:** Waiting for browser authentication  
**Next Steps:** Complete login, then deploy

---

## Option 1: Complete Vercel Login (Recommended)

1. **Complete the login** that's currently waiting:
   - Visit: https://vercel.com/oauth/device?user_code=SPXK-CCQX
   - Or press ENTER in the terminal to open browser
   - Authorize the CLI

2. **Once logged in, run:**
   ```powershell
   .\scripts\quick-deploy-staging.ps1
   ```

---

## Option 2: Use Vercel Token (Faster)

If you have a Vercel token:

```powershell
# Set your token
$env:VERCEL_TOKEN = "your-vercel-token-here"

# Deploy
.\scripts\quick-deploy-staging.ps1
```

**Get your token from:**
- https://vercel.com/account/tokens
- Create a new token if needed

---

## Option 3: Manual Deployment (Per App)

If automated script has issues, deploy individually:

```powershell
# For each app:
cd apps/m-marketplace
pnpm build
vercel --yes --prod=false
cd ../..

cd apps/os-admin
pnpm build
vercel --yes --prod=false
cd ../..

# Repeat for:
# - apps/os-pm
# - apps/m-ops-services
# - apps/m-project-owner
# - apps/m-architect
# - apps/m-permits-inspections
```

---

## Apps to Deploy

1. ✅ **m-marketplace** - Landing page
2. ✅ **os-admin** - Admin console
3. ✅ **os-pm** - Project manager tools
4. ✅ **m-ops-services** - Ops services pricing
5. ✅ **m-project-owner** - Project owner portal
6. ✅ **m-architect** - Architect services
7. ✅ **m-permits-inspections** - Permits & inspections

---

## After Deployment

**Check deployments:**
- https://vercel.com/dashboard

**Test each app:**
- Check deployment URLs from Vercel dashboard
- Verify each app loads correctly
- Test key functionality

---

## Troubleshooting

**Build fails:**
- Check for missing dependencies: `pnpm install`
- Check TypeScript errors: `pnpm type-check`
- Review build logs in Vercel dashboard

**Deployment fails:**
- Verify Vercel login: `vercel whoami`
- Check project linking: `vercel link`
- Review error messages in terminal

**Missing environment variables:**
- Set in Vercel dashboard per app
- Or use: `vercel env add VARIABLE_NAME preview`

---

**Status:** ⏳ Waiting for Vercel authentication  
**Next:** Complete login → Run deployment script
