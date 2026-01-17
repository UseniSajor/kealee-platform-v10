# Deploy os-admin to Vercel - Quick Start

## 📋 Overview

**App:** `os-admin` - Platform Administration Dashboard  
**Vercel Project Name:** `kealee-admin` (or your choice)  
**Tech Stack:** Next.js 16 + React 19 + Supabase Auth

---

## 🚀 Deployment Steps

### Step 1: Go to Vercel

Visit: [https://vercel.com/new](https://vercel.com/new)

### Step 2: Import Repository

1. Click **"Import Git Repository"**
2. Select: `UseniSajor/kealee-platform-v10`
3. Click **"Import"**

### Step 3: Configure Project

**Project Name:**
```
kealee-admin
```
(or any unique name you prefer)

**Root Directory:**
```
apps/os-admin
```

**Framework Preset:**
```
Next.js (auto-detected)
```

**Build Settings:**

- **Install Command:**
```bash
cd ../.. && pnpm install --filter @kealee/os-admin...
```

- **Build Command:**
```bash
cd ../.. && pnpm install --filter @kealee/os-admin... && pnpm build --filter @kealee/os-admin
```

- **Output Directory:**
```
.next
```
(auto-detected, don't change)

### Step 4: Add Environment Variables

Click **"Environment Variables"** and add these:

#### Required Variables:

```env
# Railway API URL (your backend)
NEXT_PUBLIC_API_URL=https://your-api-name.up.railway.app

# Supabase Authentication
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Environment
NODE_ENV=production
```

#### Optional Variables (if you use these features):

```env
# OpenAI for AI-powered features (optional)
NEXT_PUBLIC_OPENAI_API_KEY=sk-...
```

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait 3-5 minutes for build to complete
3. ✅ Your app will be live at: `https://kealee-admin.vercel.app`

---

## 📊 Where to Get Environment Variable Values

### 1. **NEXT_PUBLIC_API_URL**
- Go to Railway Dashboard
- Select your API service
- Go to **Settings → Domains**
- Copy the URL (e.g., `https://kealee-api-production.up.railway.app`)

### 2. **Supabase Variables**
- Go to [Supabase Dashboard](https://app.supabase.com)
- Select your project
- Go to **Settings → API**
- Copy:
  - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
  - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

---

## ✅ After Deployment

### Test Your Deployment:

1. **Visit the URL:** `https://kealee-admin.vercel.app`
2. **Test Login:**
   - Should show Supabase login form
   - Try logging in with test user
3. **Test API Connection:**
   - After login, check if dashboard loads data
   - Should make API calls to Railway backend

### Check Build Logs:

1. Go to Vercel Dashboard
2. Click **"Deployments"** tab
3. Click latest deployment
4. Check **"Build Logs"** for any errors

---

## 🐛 Troubleshooting

### Build Fails: "Cannot find module @kealee/types"

**Solution:** Make sure build command includes monorepo context:
```bash
cd ../.. && pnpm install --filter @kealee/os-admin... && pnpm build --filter @kealee/os-admin
```

### Build Fails: "Missing environment variables"

**Solution:**
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add all required `NEXT_PUBLIC_*` variables
3. Redeploy (Vercel → Deployments → Latest → Three dots → Redeploy)

### App loads but can't connect to API

**Solution:**
1. Check `NEXT_PUBLIC_API_URL` is correct
2. Test Railway API directly: `https://your-api.up.railway.app/health`
3. Make sure Railway API is running (check Railway logs)
4. Verify API has CORS enabled for Vercel domain

### Login doesn't work

**Solution:**
1. Verify all Supabase environment variables are correct
2. Check Supabase Dashboard → Authentication → URL Configuration
3. Add Vercel URL to allowed redirect URLs in Supabase:
   - Go to Supabase Dashboard
   - Settings → Authentication → Redirect URLs
   - Add: `https://kealee-admin.vercel.app/**`

---

## 🎯 What This App Does

The **os-admin** app provides:

- ✅ Platform administration dashboard
- ✅ Organization management (create/edit/delete orgs)
- ✅ User management (invite/suspend/delete users)
- ✅ Role-Based Access Control (RBAC) configuration
- ✅ Contract template management
- ✅ Jurisdiction management
- ✅ Financial reporting
- ✅ Dispute resolution
- ✅ Audit logs and analytics
- ✅ System monitoring
- ✅ Automation rules and SOP builder

---

## 🔄 Continuous Deployment

After initial setup, every push to `main` branch will:
1. ✅ Trigger automatic Vercel build
2. ✅ Deploy to production
3. ✅ Update `https://kealee-admin.vercel.app`

To disable auto-deploy:
- Vercel Dashboard → Settings → Git → Disable "Production Branch"

---

## 🌟 Custom Domain (Optional)

To use your own domain:

1. Go to Vercel Dashboard → Project Settings → Domains
2. Click **"Add Domain"**
3. Enter your domain: `admin.kealee.com`
4. Follow DNS configuration instructions
5. Wait for DNS propagation (5-30 minutes)

---

## 📋 Deployment Checklist

Before deploying:

- [ ] Railway API is deployed and accessible
- [ ] Railway API URL is copied
- [ ] Supabase project is active
- [ ] Supabase credentials are ready
- [ ] All environment variables prepared
- [ ] Root Directory set to `apps/os-admin`
- [ ] Build Command includes pnpm filter
- [ ] Git repository connected to Vercel

After deploying:

- [ ] Build completed successfully
- [ ] App is accessible at Vercel URL
- [ ] Login works (Supabase auth)
- [ ] API calls work (Railway backend)
- [ ] No console errors in browser
- [ ] Environment variables verified

---

## 🎉 You're Done!

Your admin dashboard is now live on Vercel! 

**Next Steps:**
1. Deploy other apps (`os-pm`, `m-architect`, etc.)
2. Set up custom domains
3. Configure password protection for staging
4. Set up monitoring and analytics

---

## 📞 Support

If you encounter issues:
1. Check Vercel build logs
2. Verify environment variables
3. Test Railway API health endpoint
4. Check Supabase project status
5. Review browser console for errors
