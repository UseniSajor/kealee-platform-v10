# 🚀 Vercel Deployment Guide - 4 Ready Apps

**Last Updated:** January 18, 2026  
**Status:** ✅ All 4 apps tested and ready for deployment

---

## ✅ **APPS READY FOR DEPLOYMENT**

1. **os-admin** - Internal admin console
2. **os-pm** - Project owner management portal
3. **m-ops-services** - PM services marketplace
4. **m-architect** - Architect design platform

---

## 📋 **DEPLOYMENT CHECKLIST**

### **Before You Start:**
- [ ] Vercel account created
- [ ] GitHub repository connected to Vercel
- [ ] Environment variables ready (see below)
- [ ] Railway API deployed and URL available

---

## 🎯 **STEP-BY-STEP DEPLOYMENT**

### **General Process (Same for All 4 Apps):**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Select **"Import Git Repository"**
4. Choose **`UseniSajor/kealee-platform-v10`**
5. Configure settings (see app-specific details below)
6. Add environment variables
7. Click **"Deploy"**

---

## 📦 **APP 1: os-admin**

### **Vercel Configuration:**
```
Project Name: kealee-os-admin
Root Directory: apps/os-admin
Framework: Next.js

Build Command: (leave empty - use default)
cd ../.. && pnpm install --frozen-lockfile && pnpm turbo run build --filter=os-admin

Output Directory: .next

Install Command: (leave empty - use default)
cd ../.. && pnpm install --frozen-lockfile
```

### **Environment Variables:**
```bash
# === REQUIRED ===
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# === OPTIONAL ===
NEXT_PUBLIC_APP_NAME=Kealee Admin Console
```

---

## 📦 **APP 2: os-pm**

### **Vercel Configuration:**
```
Project Name: kealee-os-pm
Root Directory: apps/os-pm
Framework: Next.js

Build Command: (leave empty)
cd ../.. && pnpm install --frozen-lockfile && pnpm turbo run build --filter=os-pm

Output Directory: .next

Install Command: (leave empty)
cd ../.. && pnpm install --frozen-lockfile
```

### **Environment Variables:**
```bash
# === REQUIRED ===
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# === OPTIONAL ===
NEXT_PUBLIC_APP_NAME=Kealee Project Management
```

---

## 📦 **APP 3: m-ops-services**

### **Vercel Configuration:**
```
Project Name: kealee-m-ops-services
Root Directory: apps/m-ops-services
Framework: Next.js

Build Command: (leave empty)
cd ../.. && pnpm install --frozen-lockfile && pnpm turbo run build --filter=m-ops-services

Output Directory: .next

Install Command: (leave empty)
cd ../.. && pnpm install --frozen-lockfile
```

### **Environment Variables:**
```bash
# === REQUIRED ===
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe (for pricing/checkout)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_APP_URL=https://your-vercel-url.vercel.app

# Stripe Price IDs
STRIPE_PRICE_PACKAGE_A=price_xxx
STRIPE_PRICE_PACKAGE_B=price_xxx
STRIPE_PRICE_PACKAGE_C=price_xxx
STRIPE_PRICE_PACKAGE_D=price_xxx

# === OPTIONAL ===
NEXT_PUBLIC_APP_NAME=Kealee PM Services
```

---

## 📦 **APP 4: m-architect**

### **Vercel Configuration:**
```
Project Name: kealee-m-architect
Root Directory: apps/m-architect
Framework: Next.js

Build Command: (leave empty)
cd ../.. && pnpm install --frozen-lockfile && pnpm turbo run build --filter=m-architect

Output Directory: .next

Install Command: (leave empty)
cd ../.. && pnpm install --frozen-lockfile
```

### **Environment Variables:**
```bash
# === REQUIRED ===
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# === OPTIONAL ===
NEXT_PUBLIC_APP_NAME=Kealee Architect Platform
```

---

## 🔑 **GETTING ENVIRONMENT VARIABLES**

### **1. Railway API URL:**
Already have this: `https://kealee-platform-v10-production.up.railway.app`

### **2. Supabase Credentials:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### **3. Stripe Keys (for m-ops-services only):**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **Developers** → **API Keys**
3. Copy **Secret key** → `STRIPE_SECRET_KEY`
4. For price IDs, see `STRIPE_PRODUCTS_TIERS.md`

---

## 🎬 **DEPLOYMENT ORDER**

**Recommended deployment order:**

1. ✅ **os-admin** (simplest, no Stripe)
2. ✅ **os-pm** (similar to os-admin)
3. ✅ **m-architect** (no Stripe dependencies)
4. ✅ **m-ops-services** (has Stripe, deploy last)

---

## 📝 **COPY-PASTE READY CONFIGS**

### **For Each App Import:**

1. Click **"Configure Project"** after selecting repository
2. Set **Root Directory** (see app-specific above)
3. Leave **Framework Preset** as **Next.js**
4. ⚠️ **IMPORTANT:** Leave Build Command and Install Command **EMPTY**
   - Vercel will detect and use the correct monorepo commands automatically
5. Paste environment variables from above
6. Click **"Deploy"**

---

## ✅ **POST-DEPLOYMENT CHECKLIST**

After each app deploys:

- [ ] Visit the deployment URL
- [ ] Check browser console for errors
- [ ] Test login functionality
- [ ] Verify API connection (check if data loads)
- [ ] Check environment variables in Vercel dashboard
- [ ] Enable auto-deployments on push (Settings → Git)

---

## 🐛 **TROUBLESHOOTING**

### **Build Fails:**
```bash
# Check build logs in Vercel dashboard
# Common issues:
- Missing environment variable
- Wrong Root Directory
- Build/Install command should be EMPTY
```

### **Environment Variables Not Working:**
```bash
# For production:
1. Go to Project Settings → Environment Variables
2. Select "Production" environment
3. Re-add the variable
4. Redeploy
```

### **API Connection Fails:**
```bash
# Check:
1. NEXT_PUBLIC_API_URL is correct
2. Railway API is running
3. CORS is enabled on Railway
```

### **Deployment Limit Reached:**
```
Error: "more than 100 deployments per day"

Solution:
- Wait 18-24 hours for limit reset
- OR upgrade to Vercel Pro
```

---

## 🎉 **SUCCESS INDICATORS**

When deployment is successful, you'll see:

✅ Build completes without errors  
✅ Deployment URL is live  
✅ App loads without console errors  
✅ Can navigate between pages  
✅ API calls return data (not 404)

---

## 📊 **EXPECTED DEPLOYMENT URLS**

After deployment, your URLs will look like:

1. `https://kealee-os-admin.vercel.app`
2. `https://kealee-os-pm.vercel.app`
3. `https://kealee-m-ops-services.vercel.app`
4. `https://kealee-m-architect.vercel.app`

*(You can add custom domains later)*

---

## 🔄 **AUTO-DEPLOYMENTS**

Once deployed, Vercel automatically redeploys when you push to GitHub:

```bash
git add .
git commit -m "your changes"
git push origin main

# Vercel automatically builds and deploys! 🚀
```

---

## 📚 **DOCUMENTATION REFERENCE**

- Full environment variable list: `ENV_VARIABLES_TEMPLATE.md`
- Stripe configuration: `STRIPE_PRODUCTS_TIERS.md`
- How to get env vars: `HOW_TO_GET_ENV_VARIABLES.md`
- Quick reference: `VERCEL_QUICK_REFERENCE.md`

---

## 💡 **TIPS**

1. **Deploy one at a time** - Easier to debug if something goes wrong
2. **Test locally first** - Run `pnpm build` before deploying
3. **Use production env vars** - Don't use test keys in production
4. **Enable analytics** - Vercel Speed Insights already added to os-admin
5. **Set up domains** - Add custom domains in Vercel dashboard

---

## 🆘 **NEED HELP?**

If you encounter issues:

1. Check Vercel build logs (very detailed)
2. Compare with working app configuration
3. Verify all environment variables are set
4. Check Railway API is accessible
5. Test build locally: `cd apps/APP_NAME && pnpm build`

---

**Ready to deploy? Start with `os-admin` and work your way through the list! 🚀**
