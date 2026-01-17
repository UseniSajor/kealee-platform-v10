# 🚀 Quick Deploy All Apps to Vercel

**Everything is ready. Let's deploy all 6 apps in ~15 minutes!**

---

## 📋 **Pre-Flight Checklist**

✅ Code is committed and pushed to GitHub  
✅ Each app has `vercel.json` configured  
✅ You have your environment variables ready (see `HOW_TO_GET_ENV_VARIABLES.md`)

---

## 🎯 **Deploy Order** (Recommended)

Deploy in this order to test progressively:

1. **web-landing** (simplest - no auth)
2. **os-admin** (admin dashboard)
3. **m-ops-services** (has Stripe integration)
4. **os-pm** (project management)
5. **m-architect** (architect portal)
6. **m-permits-inspections** (permits portal)
7. **m-project-owner** (owner portal)

---

## 🚀 **DEPLOYMENT STEPS** (Repeat for Each App)

### **Step 1: Create New Project**

1. Go to: https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your repository: `kealee-platform-v10`
4. Click **"Import"**

---

### **Step 2: Configure Project Settings**

**Before clicking "Deploy", configure these settings:**

#### **Framework Preset:**
- Select: **Next.js**

#### **Root Directory:**
- Click **"Edit"** next to Root Directory
- Choose the app folder (see table below)

#### **Build Settings:**
- ✅ **Leave all fields EMPTY** (vercel.json handles everything)
- Don't override Build Command
- Don't override Output Directory
- Don't override Install Command

---

### **Step 3: Environment Variables**

Click **"Environment Variables"** and add variables for the specific app (see below).

**Important:** Select **"Production, Preview, and Development"** for all variables.

---

### **Step 4: Deploy**

1. Click **"Deploy"**
2. Wait 2-5 minutes for build to complete
3. Test the deployment URL
4. ✅ Done! Move to next app

---

## 📊 **APP-SPECIFIC CONFIGURATIONS**

### **1️⃣ web-landing** (Marketing Site)

**Root Directory:** `apps/os-pm`

**Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

**Project Name Suggestion:** `kealee-landing`

---

### **2️⃣ os-admin** (Admin Dashboard)

**Root Directory:** `apps/os-admin`

**Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

**Project Name Suggestion:** `kealee-admin`

---

### **3️⃣ m-ops-services** (PM Services - Has Stripe!)

**Root Directory:** `apps/m-ops-services`

**Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app

# Stripe (Important!)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_A=price_...
NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_B=price_...
NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_C=price_...
NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_D=price_...
```

**Project Name Suggestion:** `kealee-ops-services`

---

### **4️⃣ os-pm** (Project Management)

**Root Directory:** `apps/os-pm`

**Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

**Project Name Suggestion:** `kealee-pm`

---

### **5️⃣ m-architect** (Architect Portal)

**Root Directory:** `apps/m-architect`

**Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

**Project Name Suggestion:** `kealee-architect`

---

### **6️⃣ m-permits-inspections** (Permits Portal)

**Root Directory:** `apps/m-permits-inspections`

**Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

**Project Name Suggestion:** `kealee-permits`

---

### **7️⃣ m-project-owner** (Owner Portal)

**Root Directory:** `apps/m-project-owner`

**Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app

# Stripe (for subscriptions)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Project Name Suggestion:** `kealee-project-owner`

---

## 📝 **COPY-PASTE ENVIRONMENT VARIABLES**

### **Base Variables (All Apps Need These):**

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app
NEXT_PUBLIC_APP_URL=
```

### **Stripe Variables (Only for m-ops-services & m-project-owner):**

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_A=
NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_B=
NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_C=
NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_D=
```

---

## ✅ **DEPLOYMENT CHECKLIST**

Track your progress:

- [ ] **web-landing** → Root: `apps/os-pm`
  - [ ] Deployed
  - [ ] Environment variables added
  - [ ] URL saved: `___________________________`

- [ ] **os-admin** → Root: `apps/os-admin`
  - [ ] Deployed
  - [ ] Environment variables added
  - [ ] URL saved: `___________________________`

- [ ] **m-ops-services** → Root: `apps/m-ops-services`
  - [ ] Deployed
  - [ ] Environment variables added (including Stripe!)
  - [ ] URL saved: `___________________________`
  - [ ] Update Stripe redirect URLs with this URL

- [ ] **os-pm** → Root: `apps/os-pm`
  - [ ] Deployed
  - [ ] Environment variables added
  - [ ] URL saved: `___________________________`

- [ ] **m-architect** → Root: `apps/m-architect`
  - [ ] Deployed
  - [ ] Environment variables added
  - [ ] URL saved: `___________________________`

- [ ] **m-permits-inspections** → Root: `apps/m-permits-inspections`
  - [ ] Deployed
  - [ ] Environment variables added
  - [ ] URL saved: `___________________________`

- [ ] **m-project-owner** → Root: `apps/m-project-owner`
  - [ ] Deployed
  - [ ] Environment variables added (including Stripe!)
  - [ ] URL saved: `___________________________`
  - [ ] Update Stripe redirect URLs with this URL

---

## 🔧 **AFTER ALL APPS ARE DEPLOYED**

### **Update Environment Variables with Real URLs**

Go back to each Vercel project and update `NEXT_PUBLIC_APP_URL` with the actual deployment URL:

**Example:**
```env
# Before (placeholder)
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app

# After (real URL)
NEXT_PUBLIC_APP_URL=https://kealee-admin-xyz123.vercel.app
```

### **Update Stripe Checkout Redirect URLs**

In `apps/m-ops-services/app/api/create-checkout/route.ts`, the success and cancel URLs use `NEXT_PUBLIC_APP_URL`. Make sure this is set correctly!

### **Test Each App**

1. ✅ Visit each deployment URL
2. ✅ Check that it loads without errors
3. ✅ Test authentication (if applicable)
4. ✅ Test API connection
5. ✅ Test Stripe checkout (for m-ops-services)

---

## 🚨 **COMMON ISSUES & FIXES**

### **Issue: Build fails with "Module not found"**
**Fix:** Make sure `vercel.json` exists in the app folder

### **Issue: Build fails with "pnpm: command not found"**
**Fix:** Vercel should auto-detect pnpm. Check that `pnpm-lock.yaml` exists in repo root

### **Issue: Environment variables not working**
**Fix:** 
1. Make sure variables are set for "Production, Preview, and Development"
2. Redeploy after adding variables (Settings → Deployments → Redeploy)

### **Issue: Build succeeds but app shows 404**
**Fix:** Check that Root Directory is set correctly (e.g., `apps/m-ops-services`, not just `m-ops-services`)

### **Issue: Stripe checkout fails**
**Fix:** 
1. Verify all 4 price IDs are set correctly
2. Check that `NEXT_PUBLIC_APP_URL` matches your deployment URL
3. Update Stripe webhook URL if needed

---

## 📊 **BUILD TIME EXPECTATIONS**

| App | Expected Build Time | Notes |
|-----|-------------------|-------|
| web-landing | 2-3 min | Simplest, no heavy dependencies |
| os-admin | 3-4 min | Medium complexity |
| m-ops-services | 4-5 min | Has Stripe integration |
| os-pm | 3-4 min | Standard Next.js app |
| m-architect | 3-4 min | Standard Next.js app |
| m-permits-inspections | 3-4 min | Standard Next.js app |
| m-project-owner | 3-4 min | Standard Next.js app |

**Total time to deploy all 7 apps:** ~15-20 minutes

---

## 🎯 **VERCEL CLI ALTERNATIVE** (Advanced - Optional)

If you prefer CLI over UI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy each app
cd apps/os-admin
vercel --prod

cd ../m-ops-services
vercel --prod

# ... repeat for each app
```

**Note:** You'll still need to add environment variables via the dashboard.

---

## 📞 **NEED HELP?**

**If deployment fails:**
1. Check build logs in Vercel dashboard
2. Verify Root Directory is correct
3. Ensure all environment variables are set
4. Check that code is pushed to GitHub
5. Try redeploying: Settings → Deployments → Redeploy

**Documentation:**
- Vercel Monorepo: https://vercel.com/docs/monorepos
- Next.js on Vercel: https://vercel.com/docs/frameworks/nextjs
- Environment Variables: https://vercel.com/docs/concepts/projects/environment-variables

---

## 🎉 **SUCCESS!**

Once all apps are deployed, save your URLs in `DEPLOYMENT_URLS.md`:

```markdown
# Production Deployment URLs

## Backend (Railway)
- API: https://kealee-platform-v10-production.up.railway.app

## Frontend (Vercel)
- Landing: https://kealee-landing.vercel.app
- Admin: https://kealee-admin.vercel.app
- PM Services: https://kealee-ops-services.vercel.app
- PM Dashboard: https://kealee-pm.vercel.app
- Architect: https://kealee-architect.vercel.app
- Permits: https://kealee-permits.vercel.app
- Project Owner: https://kealee-project-owner.vercel.app
```

---

**Ready? Let's deploy! 🚀**

Start with app #1 (web-landing) and work your way through the list!
