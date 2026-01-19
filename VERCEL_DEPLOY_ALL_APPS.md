# 🚀 Deploy All Apps to Vercel - Complete Guide

**Status:** All apps configured and ready to deploy  
**Last Updated:** Just now  
**All vercel.json files:** ✅ Configured

---

## 📋 Apps to Deploy

1. **OS Admin** → `apps/os-admin`
2. **PM Dashboard** → `apps/os-pm`
3. **Permits & Inspections** → `apps/m-permits-inspections`
4. **Project Owner** → `apps/m-project-owner`
5. **Architect** → `apps/m-architect`
6. **Ops Services** → `apps/m-ops-services`

---

## 🎯 Method 1: Automatic Deployment (Recommended)

### **Step 1: Verify GitHub Integration**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"** (if projects don't exist)
3. Import repository: `kealee-platform-v10`
4. **For each app**, create a separate project:

---

### **Step 2: Deploy OS Admin**

1. Click **"Add New Project"**
2. Select repository: `kealee-platform-v10`
3. Configure:
   - **Project Name:** `kealee-os-admin`
   - **Framework Preset:** Next.js
   - **Root Directory:** *(leave EMPTY)*
   - **Build Command:** *(auto-detected from vercel.json)*
   - **Output Directory:** *(auto-detected from vercel.json)*
   - **Install Command:** *(auto-detected from vercel.json)*
4. Click **"Deploy"**

---

### **Step 3: Deploy PM Dashboard**

1. Click **"Add New Project"**
2. Select repository: `kealee-platform-v10`
3. Configure:
   - **Project Name:** `kealee-os-pm`
   - **Framework Preset:** Next.js
   - **Root Directory:** *(leave EMPTY)*
4. Click **"Deploy"**

---

### **Step 4: Deploy Permits & Inspections**

1. Click **"Add New Project"**
2. Select repository: `kealee-platform-v10`
3. Configure:
   - **Project Name:** `kealee-permits`
   - **Framework Preset:** Next.js
   - **Root Directory:** *(leave EMPTY)*
4. Click **"Deploy"**

---

### **Step 5: Deploy Project Owner**

1. Click **"Add New Project"**
2. Select repository: `kealee-platform-v10`
3. Configure:
   - **Project Name:** `kealee-owner`
   - **Framework Preset:** Next.js
   - **Root Directory:** *(leave EMPTY)*
4. Click **"Deploy"**

---

### **Step 6: Deploy Architect**

1. Click **"Add New Project"**
2. Select repository: `kealee-platform-v10`
3. Configure:
   - **Project Name:** `kealee-architect`
   - **Framework Preset:** Next.js
   - **Root Directory:** *(leave EMPTY)*
4. Click **"Deploy"**

---

### **Step 7: Deploy Ops Services**

1. Click **"Add New Project"**
2. Select repository: `kealee-platform-v10`
3. Configure:
   - **Project Name:** `kealee-services`
   - **Framework Preset:** Next.js
   - **Root Directory:** *(leave EMPTY)*
4. Click **"Deploy"**

---

## 🔧 Method 2: Manual Redeploy (If Projects Already Exist)

### **For Each Existing Project:**

1. Go to Vercel Dashboard
2. Click on the project (e.g., `kealee-os-admin`)
3. Click **"Deployments"** tab
4. Click **"..."** (three dots) → **"Redeploy"**
5. Select latest commit: `b4767b0`
6. Click **"Redeploy"**

**Repeat for all 6 projects.**

---

## ⚙️ Verify Configuration (For Each Project)

**Go to:** Vercel → Project → Settings → General

**Verify these settings:**

```
Root Directory: (EMPTY - this is correct!)
Framework Preset: Next.js
Build Command: (auto from vercel.json)
Output Directory: (auto from vercel.json)
Install Command: (auto from vercel.json)
```

**If Root Directory shows `apps/os-admin`, clear it!**

---

## 📊 Deployment Status Checklist

After deploying, check each app:

- [ ] **OS Admin** - Building/Deployed
- [ ] **PM Dashboard** - Building/Deployed
- [ ] **Permits & Inspections** - Building/Deployed
- [ ] **Project Owner** - Building/Deployed
- [ ] **Architect** - Building/Deployed
- [ ] **Ops Services** - Building/Deployed

---

## 🔗 Expected Preview URLs

Once deployed, you'll get URLs like:

```
https://kealee-os-admin-[hash].vercel.app
https://kealee-os-pm-[hash].vercel.app
https://kealee-permits-[hash].vercel.app
https://kealee-owner-[hash].vercel.app
https://kealee-architect-[hash].vercel.app
https://kealee-services-[hash].vercel.app
```

---

## 🧪 Test Each Deployment

**After deployment completes:**

```bash
# Test each app loads
curl -I https://your-os-admin-url.vercel.app
curl -I https://your-os-pm-url.vercel.app
curl -I https://your-permits-url.vercel.app
curl -I https://your-owner-url.vercel.app
curl -I https://your-architect-url.vercel.app
curl -I https://your-services-url.vercel.app
```

**Expected:** `HTTP/2 200` or `HTTP/2 301` (redirect)

---

## 🚨 Troubleshooting

### **Issue: "Command pnpm install exited with 1"**

**Solution:**
- Verify Root Directory is **EMPTY** in Vercel settings
- Check that `.npmrc` file exists in repository root
- Verify `packageManager: "pnpm@8.12.0"` in root package.json

### **Issue: "Build failed"**

**Solution:**
- Check build logs in Vercel Dashboard
- Verify all dependencies are in package.json
- Check for TypeScript errors

### **Issue: "404 Not Found"**

**Solution:**
- Verify Output Directory is correct: `apps/[app-name]/.next`
- Check that Next.js build completed successfully
- Verify framework is set to "Next.js"

---

## ✅ Current Configuration

**All apps have:**
- ✅ `vercel.json` with correct build commands
- ✅ Root Directory: Empty (runs from monorepo root)
- ✅ Install Command: `corepack enable && corepack prepare pnpm@8.12.0 --activate && pnpm install --frozen-lockfile`
- ✅ Build Command: `pnpm build --filter=[app-name]`
- ✅ Output Directory: `apps/[app-name]/.next`
- ✅ Framework: `nextjs`

---

## 🎯 Quick Deploy Commands

**If you have Vercel CLI installed:**

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy each app
cd apps/os-admin && vercel --prod
cd ../os-pm && vercel --prod
cd ../m-permits-inspections && vercel --prod
cd ../m-project-owner && vercel --prod
cd ../m-architect && vercel --prod
cd ../m-ops-services && vercel --prod
```

---

## 📝 Summary

**All apps are ready to deploy!**

1. ✅ Code pushed to GitHub
2. ✅ vercel.json files configured
3. ✅ Build commands set correctly
4. ⏳ **Next:** Deploy in Vercel Dashboard (see steps above)

**Go to Vercel Dashboard and deploy all 6 apps!** 🚀
