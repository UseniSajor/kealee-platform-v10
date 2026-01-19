# ✅ Vercel Preview Deployment Checklist

**Status:** Pushed to `preview` branch  
**Commit:** `5c3d749`  
**Date:** 2025-01-15

---

## 🚀 What Was Pushed

✅ **All 6 apps** updated and pushed to `preview` branch:
- OS Admin
- OS PM
- Permits & Inspections
- Project Owner
- Architect
- Ops Services

✅ **Build Configuration:**
- Turbo build commands: `turbo run build --filter=[app-name]`
- Install command: `pnpm install`
- Framework: Next.js

---

## 📋 Verify Preview Deployments in Vercel

### **Step 1: Check Vercel Dashboard**

1. Go to: https://vercel.com/dashboard
2. Look for each project:
   - `kealee-os-admin`
   - `kealee-os-pm`
   - `kealee-permits`
   - `kealee-owner`
   - `kealee-architect`
   - `kealee-services`

### **Step 2: Verify Branch Settings**

**For each project:**

1. Click on the project
2. Go to **Settings** → **Git**
3. Check **Production Branch:**
   - Should be: `main` (NOT `preview`)
4. Check **Preview Deployments:**
   - Should be: **Enabled** ✅
   - Should include: `preview` branch

### **Step 3: Check Deployment Type**

**For each new deployment:**

1. Go to **Deployments** tab
2. Look at the latest deployment
3. Check the **Branch** column:
   - Should show: `preview` ✅
   - Should NOT show: `main` ❌
4. Check the **Type** column:
   - Should show: **Preview** ✅
   - Should NOT show: **Production** ❌

---

## 🎯 Expected Preview URLs

After deployment, you'll get preview URLs like:

```
https://kealee-os-admin-[hash].vercel.app
https://kealee-os-pm-[hash].vercel.app
https://kealee-permits-[hash].vercel.app
https://kealee-owner-[hash].vercel.app
https://kealee-architect-[hash].vercel.app
https://kealee-services-[hash].vercel.app
```

**Note:** Preview URLs have a unique hash and are NOT production domains.

---

## ⚠️ If Deployments Are Going to Production

**If you see deployments on `main` branch going to production:**

1. **Stop the deployment:**
   - Go to Vercel → Deployment
   - Click **"..."** → **"Cancel"**

2. **Check Git Integration:**
   - Settings → Git
   - Verify Production Branch is `main`
   - Verify Preview Deployments are enabled

3. **Redeploy from Preview:**
   - Go to Deployments tab
   - Find a deployment from `preview` branch
   - Click **"..."** → **"Redeploy"**
   - Select: **"Use existing Build Cache"**
   - Click **"Redeploy"**

---

## 🔍 Quick Verification Commands

**Check which branch is deployed:**

```bash
# In Vercel Dashboard, check:
# - Deployments → Branch column
# - Should show "preview" for all new deployments
```

**Check deployment status:**

1. Vercel Dashboard → Deployments
2. Filter by: **Preview** deployments
3. Should see 6 deployments (one per app)
4. All should show: **Branch: preview**

---

## 📊 Deployment Status Checklist

After pushing, verify:

- [ ] **OS Admin** - Preview deployment started/completed
- [ ] **OS PM** - Preview deployment started/completed
- [ ] **Permits** - Preview deployment started/completed
- [ ] **Project Owner** - Preview deployment started/completed
- [ ] **Architect** - Preview deployment started/completed
- [ ] **Ops Services** - Preview deployment started/completed

**All should show:**
- ✅ Branch: `preview`
- ✅ Type: **Preview**
- ✅ Status: Building/Ready

---

## 🚨 Troubleshooting

### **Issue: Deployments going to production instead of preview**

**Solution:**
1. Check Vercel → Settings → Git
2. Verify Production Branch is `main`
3. Verify Preview Deployments are enabled
4. Check that you pushed to `preview` branch (not `main`)

### **Issue: No deployments triggered**

**Solution:**
1. Check GitHub → Your repo → Branches
2. Verify `preview` branch exists and has latest commit
3. Check Vercel → Settings → Git → Connected Repository
4. Verify webhook is active in GitHub → Settings → Webhooks

### **Issue: Build failing**

**Solution:**
1. Check build logs in Vercel Dashboard
2. Verify Turbo is installed (should be in devDependencies)
3. Verify pnpm is enabled in Vercel project settings
4. Check that Root Directory is empty (not `apps/[app-name]`)

---

## ✅ Summary

**What was done:**
- ✅ Pushed to `preview` branch (commit `5c3d749`)
- ✅ All 6 apps updated with deployment trigger
- ✅ Turbo build commands configured
- ✅ Ready for preview deployments

**Next steps:**
1. ⏳ Wait 1-2 minutes for Vercel to detect push
2. 🔍 Check Vercel Dashboard for new deployments
3. ✅ Verify all deployments are **Preview** type (not Production)
4. 🧪 Test preview URLs once deployments complete

---

## 🎯 Quick Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **GitHub Repository:** Check `preview` branch
- **Latest Commit:** `5c3d749` - "Trigger Vercel preview deployments for all 6 apps"

**All apps should now be deploying to PREVIEW environment!** 🚀
