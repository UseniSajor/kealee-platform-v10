# 🎯 Deploy via Vercel Dashboard - Step-by-Step Guide

## ✅ Current Status

- ✅ All code committed and pushed to GitHub
- ✅ Repository: `UseniSajor/kealee-platform-v10`
- ✅ Branch: `main`
- ✅ Commit: `8a6923a`

---

## 🚀 Deployment Steps

### Step 1: Go to Vercel Dashboard

Visit: **https://vercel.com/new**

(Or https://vercel.com and click "Add New..." → "Project")

---

### Step 2: Import Repository

1. You should see your GitHub repositories listed
2. Find: **`kealee-platform-v10`**
3. Click **"Import"** next to it

*If you don't see it:*
- Click "Adjust GitHub App Permissions"
- Authorize Vercel to access the repository
- Refresh the page

---

### Step 3: Deploy m-ops-services (First Deployment)

**Configure the project:**

**Framework Preset:** Next.js (should auto-detect)

**Root Directory:** Click "Edit" and set to:
```
apps/m-ops-services
```

**Build Settings:**
- ✅ Use settings from vercel.json (should be checked)
- Build Command: (auto from vercel.json)
- Install Command: (auto from vercel.json)

**Environment Variables:**

Click "Add Environment Variable" for each:

```
DATABASE_URL
Value: postgresql://postgres.[your-ref]:[password]@aws-1-us-east-2.pooler.supabase.com:5432/postgres

EMAIL_PROVIDER
Value: console

NODE_ENV
Value: production
```

**Click: "Deploy"**

---

### Step 4: Wait for Build (3-5 minutes)

You'll see:
- ⏳ Installing dependencies
- ⏳ Building application
- ⏳ Deploying to production

**When complete:**
- ✅ You'll get a production URL
- ✅ Click "Visit" to see your site

---

### Step 5: Deploy m-permits-inspections (Second Deployment)

**Go back to:** https://vercel.com/new

**Import the SAME repository again:**
- Find: `kealee-platform-v10`
- Click "Import"

**Configure the project:**

**Root Directory:** Click "Edit" and set to:
```
apps/m-permits-inspections
```

**Environment Variables:**

Add the same variables:
```
DATABASE_URL=your_database_url
EMAIL_PROVIDER=console
NODE_ENV=production
```

**Click: "Deploy"**

---

## 🌐 Your Production URLs

After both deployments complete, you'll have:

### m-ops-services Deployment:
```
https://m-ops-services-[random].vercel.app/development
https://m-ops-services-[random].vercel.app/gc-services
https://m-ops-services-[random].vercel.app/portal/development-leads
https://m-ops-services-[random].vercel.app/portal/gc-ops-leads
```

### m-permits-inspections Deployment:
```
https://m-permits-inspections-[random].vercel.app/contractors
https://m-permits-inspections-[random].vercel.app/portal/permit-leads
```

---

## 📧 Step 6: Set Up Email (Optional for Production)

### For Real Email Sending:

**1. Sign up for Resend (Recommended):**
   - Visit: https://resend.com
   - Sign up (free tier available)
   - Get your API key

**2. Add domain in Resend:**
   - Go to Domains
   - Add `kealee.com`
   - Add DNS records to your domain registrar
   - Verify domain

**3. Update Vercel Environment Variables:**
   - Go to each project → Settings → Environment Variables
   - Update `EMAIL_PROVIDER` to `resend`
   - Add `RESEND_API_KEY` with your key
   - Redeploy (or wait for auto-deploy)

---

## 🧪 Step 7: Test Your Deployments

### Test m-ops-services:

**1. Visit Development site:**
```
https://[your-url].vercel.app/development
```
- Check all pages load
- Test navigation
- Submit a test lead

**2. Visit GC Operations site:**
```
https://[your-url].vercel.app/gc-services
```
- Check all pages load
- Submit a trial request

**3. Check Admin:**
```
https://[your-url].vercel.app/portal/development-leads
https://[your-url].vercel.app/portal/gc-ops-leads
```

### Test m-permits-inspections:

**1. Visit Permits site:**
```
https://[your-permits-url].vercel.app/contractors
```
- Check all pages load
- Submit a permit request

**2. Check Admin:**
```
https://[your-permits-url].vercel.app/portal/permit-leads
```

---

## 🔧 Common Issues & Solutions

### Issue: "Root directory not found"

**Solution:**
- Make sure you set Root Directory to `apps/m-ops-services` or `apps/m-permits-inspections`
- Click the "Edit" button in the Root Directory field

### Issue: Build fails

**Check:**
1. Environment variables are set correctly
2. DATABASE_URL is accessible from Vercel
3. Check build logs for specific errors

### Issue: Pages show 404

**Solution:**
- Verify you're accessing the correct routes:
  - `/development` (not `/` for development site)
  - `/gc-services` (not `/` for GC site)
  - `/contractors` (not `/` for permits site)

### Issue: Forms don't submit

**Check:**
1. DATABASE_URL environment variable is set
2. Database is accessible from Vercel servers
3. Check Function logs in Vercel dashboard

---

## 📋 Deployment Checklist

### Pre-Deployment:
- [x] Code committed to GitHub
- [x] Database models synced
- [x] All pages built
- [x] Forms validated
- [x] APIs created

### During Deployment:
- [ ] Import repository in Vercel
- [ ] Set root directory correctly
- [ ] Add environment variables
- [ ] Deploy successfully

### Post-Deployment:
- [ ] Test all pages load
- [ ] Submit test forms
- [ ] Verify emails (if configured)
- [ ] Check admin dashboards
- [ ] Test on mobile
- [ ] Run Lighthouse audit

---

## 🎯 Quick Summary

**To deploy right now:**

1. **Go to:** https://vercel.com/new
2. **Import:** `UseniSajor/kealee-platform-v10`
3. **Set Root Directory:** `apps/m-ops-services`
4. **Add Environment Variables** (DATABASE_URL, EMAIL_PROVIDER, NODE_ENV)
5. **Click Deploy**
6. **Repeat for:** `apps/m-permits-inspections`

**That's it!** 🎉

---

## 💡 After Deployment

### Get Your URLs:

In Vercel dashboard, you'll see:
- Project name
- **Production URL** (click to visit)
- Deployment status

### Optional - Custom Domains:

Later, you can add custom domains:
- `development.kealee.com` → m-ops-services
- `operations.kealee.com` → m-ops-services/gc-services
- `permits.kealee.com` → m-permits-inspections

---

## 📞 Need Help?

**If you encounter issues:**
1. Check Vercel build logs
2. Verify environment variables
3. Test database connection
4. Review function logs

**Documentation:**
- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment

---

**Ready to deploy! Go to https://vercel.com/new and follow the steps above.** 🚀
