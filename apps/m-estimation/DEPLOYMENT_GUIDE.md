# 🚀 m-estimation Deployment Guide

**Status:** Ready for Deployment  
**Target:** Vercel  
**Domain:** estimation.kealee.com

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### ✅ Completed
- [x] Code committed to Git
- [x] Pushed to GitHub repository
- [x] vercel.json configured
- [x] package.json configured
- [x] Environment variables documented

### ⏳ Ready to Deploy
- [ ] Vercel login (1 minute)
- [ ] Deploy to Vercel (5-10 minutes)
- [ ] Configure domain (5 minutes)
- [ ] Set environment variables (5 minutes)

---

## 🔑 STEP 1: Login to Vercel

**⚠️ REQUIRED: Manual action**

Run this command and follow the browser prompts:

```bash
cd apps/m-estimation
vercel login
```

This will:
1. Open your browser
2. Prompt you to authenticate
3. Link your CLI to your Vercel account

---

## 🚀 STEP 2: Deploy to Vercel

After logging in, deploy:

```bash
# Deploy to preview (staging)
vercel

# OR deploy to production
vercel --prod
```

**First deployment will:**
1. Create new project in Vercel
2. Link to GitHub repository
3. Build the application
4. Deploy to temporary URL (*.vercel.app)

**Expected build time:** 5-10 minutes

---

## 🌐 STEP 3: Configure Custom Domain

### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your m-estimation project
3. Go to **Settings** → **Domains**
4. Add: `estimation.kealee.com`
5. Copy the DNS values provided

### Option B: Via CLI

```bash
vercel domains add estimation.kealee.com
```

---

## 🔧 STEP 4: Set Environment Variables

### Required Variables

Add these in Vercel Dashboard → **Settings** → **Environment Variables**:

```env
# Supabase (Required for auth - when implemented)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API (Required)
NEXT_PUBLIC_API_URL=https://api.kealee.com
API_URL=https://api.kealee.com

# App URL
NEXT_PUBLIC_APP_URL=https://estimation.kealee.com
```

### Optional Variables (For future features)

```env
# Claude AI (for AI features)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Redis (if using job queue)
REDIS_URL=your_redis_url
```

---

## 📡 STEP 5: Configure DNS

### In NameBright (or your DNS provider)

Add DNS record for `estimation.kealee.com`:

**Type:** CNAME  
**Name:** estimation  
**Value:** (Vercel will provide - typically `cname.vercel-dns.com`)

**OR if using A records:**

**Type:** A  
**Name:** estimation  
**Value:** (Vercel IP address)

**DNS Propagation:** 5 minutes - 48 hours (typically 15-30 minutes)

---

## ✅ STEP 6: Verify Deployment

### Check Deployment Status

```bash
vercel ls
```

### Test Your App

Once deployed:
1. Open the Vercel-provided URL (*.vercel.app)
2. Test the dashboard
3. Test create estimate wizard
4. Check all navigation

### Custom Domain

Once DNS propagates:
1. Visit https://estimation.kealee.com
2. Verify SSL certificate (green lock)
3. Test all features

---

## 🔄 CONTINUOUS DEPLOYMENT

### Auto-Deploy on Git Push

Vercel will automatically:
- Deploy on every push to `main` branch
- Create preview deployments for PRs
- Run build checks
- Update production

**No manual action needed after initial setup!**

---

## 🐛 TROUBLESHOOTING

### Build Fails

**Error:** "Module not found"
```bash
# Check package.json dependencies
# Ensure all workspace packages exist
```

**Error:** "Build exceeded time limit"
```bash
# Contact Vercel support or
# Optimize build configuration
```

### Domain Not Working

**Check DNS:**
```bash
nslookup estimation.kealee.com
```

**Check Vercel:**
- Verify domain added in dashboard
- Check DNS configuration
- Wait for propagation (up to 48 hours)

### Environment Variables Not Working

- Ensure variables are set for Production
- Redeploy after adding variables
- Check variable names (case-sensitive)

---

## 📊 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [x] Code committed
- [x] Tests passing (local)
- [x] vercel.json configured
- [x] Environment variables documented
- [x] Documentation complete

### Deployment
- [ ] Login to Vercel
- [ ] Run `vercel --prod`
- [ ] Monitor build logs
- [ ] Verify deployment URL

### Post-Deployment
- [ ] Add custom domain
- [ ] Configure DNS
- [ ] Set environment variables
- [ ] Test all features
- [ ] Verify SSL
- [ ] Monitor errors (Vercel dashboard)

---

## 🎯 QUICK DEPLOY COMMANDS

```bash
# Navigate to app
cd apps/m-estimation

# Login (first time only)
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Check deployments
vercel ls

# View logs
vercel logs
```

---

## 📝 NOTES

### Build Configuration
- **Framework:** Next.js 15
- **Build Time:** ~5-10 minutes (first build)
- **Output:** Static + Server (hybrid)
- **Node Version:** 20.x (from package.json engines)

### Monorepo Considerations
- Uses pnpm workspaces
- Builds from root directory
- Filters to @kealee/m-estimation package
- Skips Puppeteer download (not needed)

### Domain Strategy
- **Primary:** estimation.kealee.com
- **Vercel URL:** m-estimation-*.vercel.app (fallback)
- **SSL:** Auto-provisioned by Vercel

---

## 🆘 SUPPORT

### Vercel Resources
- Dashboard: https://vercel.com/dashboard
- Documentation: https://vercel.com/docs
- CLI Docs: https://vercel.com/docs/cli

### Project Resources
- README.md - App documentation
- QUICK_START.md - Development guide
- UI_SPECIFICATION.md - Design reference

---

## 🎉 READY TO DEPLOY!

Run these commands to deploy:

```bash
cd apps/m-estimation
vercel login
vercel --prod
```

**Estimated time:** 10-15 minutes including domain setup

---

**Last Updated:** February 1, 2026  
**Deployment Status:** ⏳ Ready - Awaiting Login  
**Next Step:** Run `vercel login`
