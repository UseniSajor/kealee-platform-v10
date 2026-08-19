# 🚀 Vercel Deployment Checklist

## ✅ Code Changes (COMPLETED)

- [x] Upgraded PNPM to 9.15.4 in `package.json`
- [x] Added `.node-version` (Node 20)
- [x] Created `pnpm-workspace.yaml`
- [x] Enhanced `.npmrc` with better timeout and hoisting settings
- [x] Updated all 8 `apps/*/vercel.json` with corepack commands
- [x] Committed and pushed to GitHub (commit: `e4e9af6`)

---

## ⚙️ VERCEL DASHBOARD SETTINGS (YOU MUST DO THIS!)

### For Each App in Vercel:

#### 1. General Settings
Go to: **Project → Settings → General**

- **Framework Preset:** `Next.js` ✅
- **Node.js Version:** `20.x` ⚠️ **SET THIS!**
- **Package Manager:** `pnpm` ⚠️ **SET THIS!**
- **Root Directory:** Leave empty (or set to `apps/<app-name>` if needed)

#### 2. Build & Output Settings
Should automatically use commands from `vercel.json`:

- **Build Command:** `cd ../.. && corepack enable && corepack prepare pnpm@9.15.4 --activate && pnpm build --filter=<app>`
- **Install Command:** `cd ../.. && corepack enable && corepack prepare pnpm@9.15.4 --activate && pnpm install --no-frozen-lockfile`

#### 3. Environment Variables (Recommended)
Go to: **Project → Settings → Environment Variables**

Add these for **ALL environments** (Production, Preview, Development):

```env
ENABLE_EXPERIMENTAL_COREPACK=1
NODE_ENV=production
```

**App-Specific Variables:**

For all apps, also add:
```env
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-staging.up.railway.app
DATABASE_URL=your_database_url_here
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🎯 Apps to Configure (8 Total)

| App Name | Vercel Project | Status |
|----------|---------------|--------|
| m-ops-services | kealee-m-ops-services | ⏳ Configure |
| os-pm | kealee-os-pm | ⏳ Configure |
| m-finance-trust | kealee-m-finance-trust | ⏳ Configure |
| m-marketplace | kealee-m-marketplace | ⏳ Configure |
| m-project-owner | kealee-m-project-owner | ⏳ Configure |
| m-architect | kealee-m-architect | ⏳ Configure |
| m-permits-inspections | kealee-m-permits-inspections | ⏳ Configure |
| os-admin | kealee-os-admin | ⏳ Configure |

---

## 🔄 Deployment Steps

### Step 1: Configure Vercel Settings (Do This First!)
1. Open Vercel Dashboard
2. For each project above:
   - Go to Settings → General
   - Set Node.js Version to `20.x`
   - Set Package Manager to `pnpm`
   - Add environment variables

### Step 2: Trigger Deployment
Deployment should auto-trigger from the git push. If not:

**Option A: Redeploy from Dashboard**
1. Go to Deployments tab
2. Click on latest deployment
3. Click "Redeploy"

**Option B: Force Deploy via CLI**
```bash
cd apps/<app-name>
vercel --prod
```

### Step 3: Monitor Build Logs
Watch for these success indicators:

```
✓ Running "corepack enable"
✓ Corepack enabled
✓ Running "corepack prepare pnpm@9.15.4 --activate"
✓ Preparing pnpm@9.15.4 for immediate activation
✓ pnpm install --no-frozen-lockfile
✓ Installing dependencies...
✓ Dependencies installed
✓ pnpm build --filter=<app>
✓ Build completed successfully
```

### Step 4: Verify Deployment
Once deployed:
- [ ] Check deployment URL works
- [ ] Verify API calls work (check browser console)
- [ ] Test authentication flow
- [ ] Test key features

---

## 🆘 If Build Still Fails

### Quick Fixes (Try in Order):

#### Fix 1: Clear Build Cache
```
Vercel Dashboard → Project → Settings → Clear Build Cache → Redeploy
```

#### Fix 2: Add More Environment Variables
```env
VERCEL_FORCE_NO_BUILD_CACHE=1
ENABLE_EXPERIMENTAL_COREPACK=1
```

#### Fix 3: Check Node Version
Make sure it's **20.x** in Vercel settings, not 18.x or 16.x

#### Fix 4: Manual Deploy with Fresh Install
```bash
# Local terminal
cd apps/<app-name>
rm -rf node_modules
pnpm install
pnpm build
vercel --prod
```

---

## 📊 Expected Timeline

- **Config Updates:** 5-10 minutes per app
- **First Deploy:** 3-5 minutes per app
- **Subsequent Deploys:** 2-3 minutes per app

**Total Setup Time:** 30-45 minutes for all 8 apps

---

## ✅ Success Criteria

You'll know everything works when:

1. ✅ All builds complete without `ERR_INVALID_THIS` errors
2. ✅ Apps are accessible at their Vercel URLs
3. ✅ No PNPM version errors in build logs
4. ✅ API connections work from frontend
5. ✅ Authentication flows complete successfully

---

## 📞 Support Resources

- **Vercel Docs:** https://vercel.com/docs/concepts/projects/overview
- **PNPM Monorepo:** https://pnpm.io/workspaces
- **Corepack Docs:** https://nodejs.org/api/corepack.html

---

## 🎉 Ready to Deploy!

**Current Status:**
- ✅ All code changes committed (commit: `e4e9af6`)
- ✅ Pushed to GitHub
- ⏳ Waiting for Vercel dashboard configuration
- ⏳ Waiting for deployment

**Next Action:** 
👉 **Go to Vercel Dashboard and configure Node.js version & Package Manager settings!**

---

**Last Updated:** 2025-01-24  
**Commit Hash:** e4e9af6
