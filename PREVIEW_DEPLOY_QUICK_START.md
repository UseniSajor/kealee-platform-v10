# ⚡ Preview Deployment - Quick Start Guide

**Get started with safe, test-before-production deployments in 15 minutes**

---

## 🎯 **WHAT YOU'LL ACHIEVE**

✅ Preview deployments for all 4 apps  
✅ Test everything before production  
✅ Automated workflow with Git branches  
✅ Rollback capability  
✅ Separate Stripe test/live keys  

---

## 🚀 **5-STEP SETUP**

### **STEP 1: Create Preview Branch (2 minutes)**

```bash
# Navigate to project
cd "c:\Kealee-Platform v10"

# Create preview branch from main
git checkout -b preview-deploy

# Push to GitHub
git push origin preview-deploy
```

✅ **Done!** You now have a preview branch.

---

### **STEP 2: Import First App to Vercel (5 minutes)**

Let's start with **os-admin** (simplest):

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select **`UseniSajor/kealee-platform-v10`**
4. Click **"Import"**

**Configure:**
```
Project Name: kealee-os-admin
Root Directory: apps/os-admin
Framework Preset: Next.js
Build Command: (leave empty)
Install Command: (leave empty)
```

**Add Environment Variables:**
```bash
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
NEXT_PUBLIC_APP_NAME=Kealee Admin [PREVIEW]
NEXT_PUBLIC_ENVIRONMENT=preview
```

**Important:** Select which environments for each variable:
- Check ✅ **Preview**
- Leave ⬜ Production (unchecked for now)
- Leave ⬜ Development (unchecked for now)

5. Click **"Deploy"**

⏳ **Wait 2-3 minutes** for deployment...

---

### **STEP 3: Test Your Preview (5 minutes)**

Once deployment completes:

1. Copy the preview URL (looks like: `https://kealee-os-admin-git-preview-deploy-yourusername.vercel.app`)

2. Open it in browser

3. **Quick Test Checklist:**
   - [ ] Page loads without errors
   - [ ] Open DevTools Console (F12) - no errors?
   - [ ] Try to log in (if auth is set up)
   - [ ] Click around - navigation works?
   - [ ] Check API calls - data loads?

✅ **If it works, you're ready for production!**

---

### **STEP 4: Configure Production (2 minutes)**

Back in Vercel Dashboard:

1. Go to your project **Settings**
2. Click **"Git"**
3. Find **"Production Branch"**
4. Change from `preview-deploy` to `main`
5. Click **"Save"**

Now update your environment variables:

1. Go to **Settings** → **Environment Variables**
2. For each variable, click **"..."** → **"Edit"**
3. Check ✅ **Production** (in addition to Preview)
4. Click **"Save"**

⚠️ **For Stripe keys (m-ops-services only):**
- Preview: Use `sk_test_...` (TEST key)
- Production: Use `sk_live_...` (LIVE key)

---

### **STEP 5: Deploy to Production (1 minute)**

When you're ready:

```bash
# Merge preview to main
git checkout main
git merge preview-deploy
git push origin main
```

🎉 **Production deployment starts automatically!**

Monitor it in Vercel dashboard.

---

## 🔄 **ONGOING WORKFLOW**

### **Daily Development:**

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes
# ... code ...

# 3. Push for preview
git push origin feature/my-feature

# 4. Test preview URL (Vercel creates automatically)

# 5. If good, merge to preview-deploy
git checkout preview-deploy
git merge feature/my-feature
git push origin preview-deploy

# 6. Test preview-deploy thoroughly

# 7. If all tests pass, promote to production
git checkout main
git merge preview-deploy
git push origin main
```

---

## 📋 **DEPLOY REMAINING 3 APPS**

Repeat Steps 2-4 for each app:

### **os-pm:**
```
Root Directory: apps/os-pm
Same env vars as os-admin
```

### **m-architect:**
```
Root Directory: apps/m-architect
Same env vars as os-admin
```

### **m-ops-services:**
```
Root Directory: apps/m-ops-services
Additional: STRIPE_SECRET_KEY, STRIPE_PRICE_* variables
⚠️ Use TEST keys for Preview!
```

---

## ✅ **VERIFICATION**

After setup, you should have:

| App | Preview Branch | Production Branch | Status |
|-----|----------------|-------------------|--------|
| os-admin | ✅ preview-deploy | ✅ main | Live |
| os-pm | ✅ preview-deploy | ✅ main | Live |
| m-architect | ✅ preview-deploy | ✅ main | Live |
| m-ops-services | ✅ preview-deploy | ✅ main | Live |

---

## 🎯 **TESTING WORKFLOW**

Use our comprehensive checklist:

```bash
# Open checklist
code PREVIEW_TEST_CHECKLIST.md

# Or use automated script (Git Bash/Mac/Linux)
bash scripts/preview-deploy.sh
```

---

## 🚨 **EMERGENCY ROLLBACK**

If production deploy breaks:

**Option 1: Vercel Dashboard (Instant)**
1. Go to Deployments
2. Find last working deployment
3. Click **"..."** → **"Promote to Production"**

**Option 2: Git Revert**
```bash
git revert HEAD
git push origin main
```

---

## 💡 **PRO TIPS**

1. **Always test preview first**
   - Never push directly to main
   - Use preview-deploy as staging

2. **Use environment indicators**
   ```tsx
   {process.env.NEXT_PUBLIC_ENVIRONMENT === 'preview' && (
     <Banner text="PREVIEW MODE" color="yellow" />
   )}
   ```

3. **Separate Stripe keys**
   - Preview: TEST keys only
   - Production: LIVE keys only
   - Never mix them up!

4. **Monitor deployments**
   - Enable Vercel Analytics
   - Check error logs regularly
   - Set up Slack notifications

5. **Automate testing**
   - Use GitHub Actions for CI
   - Run tests on every push
   - Block merges if tests fail

---

## 📚 **DETAILED DOCUMENTATION**

- **Full Guide:** `VERCEL_PREVIEW_DEPLOYMENT_GUIDE.md`
- **Test Checklist:** `PREVIEW_TEST_CHECKLIST.md`
- **Deployment Script:** `scripts/preview-deploy.sh`
- **Quick Deploy:** `VERCEL_QUICK_DEPLOY_CARD.md`

---

## 🎉 **YOU'RE READY!**

Your preview deployment workflow is set up! 

**Next time you make changes:**

1. ✅ Push to preview branch
2. ✅ Test preview URL
3. ✅ Merge to production when ready
4. ✅ Monitor production deployment

**Safe deployments = Happy users! 🛡️**

---

## 🆘 **NEED HELP?**

**Common Issues:**

**Q: Preview URL not working?**
A: Check Vercel logs - Settings → Functions → View Logs

**Q: Environment variables not loading?**
A: Make sure you selected "Preview" environment when adding them

**Q: Build fails?**
A: Check build logs in Vercel deployment detail page

**Q: API calls fail?**
A: Verify NEXT_PUBLIC_API_URL and Railway is running

**Q: Stripe test mode not working?**
A: Confirm you're using sk_test_* key, not sk_live_*

---

**Start with os-admin, get comfortable, then deploy the rest! 🚀**
