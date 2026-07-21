# 🚀 Deployment Guide - Kealee Services

## Current Status

✅ **Git Repository:** Connected and pushed to GitHub
✅ **Code:** All committed and up to date
✅ **Database:** Models synced and ready
✅ **Vercel Config:** vercel.json files present

⚠️ **Vercel Authentication:** Needs login/token refresh

---

## 🔐 Step 1: Vercel Authentication

You need to authenticate with Vercel first:

```bash
vercel login
```

This will open your browser for authentication. Choose your preferred login method:
- GitHub
- GitLab
- Bitbucket
- Email

---

## 🚀 Step 2: Deploy Applications

Once authenticated, deploy each application:

### Deploy m-ops-services (Development + GC Operations)

```bash
cd apps/m-ops-services
vercel --prod
```

**This deploys:**
- Kealee Development (`/development`)
- Kealee Operations Services (`/gc-services`)

### Deploy m-permits-inspections (Permits)

```bash
cd apps/m-permits-inspections
vercel --prod
```

**This deploys:**
- Kealee Permits & Inspections (`/contractors`)

---

## ⚙️ Step 3: Configure Environment Variables

After deployment, you need to set environment variables in Vercel dashboard.

### For m-ops-services:

**Navigate to:** Vercel Dashboard → m-ops-services → Settings → Environment Variables

**Add these variables:**

```env
# Database
DATABASE_URL=your_production_database_url

# Email Provider
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_resend_api_key

# Or for SendGrid:
# EMAIL_PROVIDER=sendgrid
# SENDGRID_API_KEY=your_sendgrid_key

# Base URL
NEXT_PUBLIC_BASE_URL=https://your-production-url.vercel.app

# Node Environment
NODE_ENV=production
```

### For m-permits-inspections:

**Navigate to:** Vercel Dashboard → m-permits-inspections → Settings → Environment Variables

**Add these variables:**

```env
# Database
DATABASE_URL=your_production_database_url

# Supabase (if using)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Email
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_resend_api_key

# Base URL
NEXT_PUBLIC_BASE_URL=https://your-permits-url.vercel.app

NODE_ENV=production
```

---

## 📋 Step 4: Verify Email Domain

**Before production use, verify your domain with email provider:**

### Resend (Recommended):

1. Go to https://resend.com/domains
2. Add domain: `kealee.com`
3. Add the DNS records provided
4. Verify domain
5. Add sending addresses:
   - `intake@kealee.com`
   - `ops@kealee.com`
   - `permits@kealee.com`

### SendGrid:

1. Go to SendGrid → Settings → Sender Authentication
2. Add domain: `kealee.com`
3. Add DNS records (SPF, DKIM, CNAME)
4. Verify domain

---

## 🔄 Step 5: Redeploy After Environment Variables

After setting environment variables:

```bash
# Redeploy m-ops-services
cd apps/m-ops-services
vercel --prod

# Redeploy m-permits-inspections
cd apps/m-permits-inspections
vercel --prod
```

---

## 🧪 Step 6: Test Production Deployments

### Test m-ops-services:

**URLs to test:**
- `https://your-url.vercel.app/development`
- `https://your-url.vercel.app/gc-services`
- `https://your-url.vercel.app/portal/development-leads`
- `https://your-url.vercel.app/portal/gc-ops-leads`

**Test forms:**
1. Submit development lead
2. Submit GC ops trial request
3. Check emails are sent
4. Verify leads in admin dashboards

### Test m-permits-inspections:

**URLs to test:**
- `https://your-permits-url.vercel.app/contractors`
- `https://your-permits-url.vercel.app/portal/permit-leads`

**Test forms:**
1. Submit permit service request
2. Check emails are sent
3. Verify lead in admin dashboard

---

## 🔧 Alternative: Deploy via Vercel Dashboard

If CLI doesn't work, use the Vercel dashboard:

### Option A: Import from GitHub

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Select the app to deploy:
   - For Development + GC Ops: Select `apps/m-ops-services`
   - For Permits: Select `apps/m-permits-inspections`
4. Configure root directory and build settings (use vercel.json)
5. Add environment variables
6. Deploy

### Option B: Deploy from Vercel Git Integration

1. Connect your GitHub repository to Vercel
2. Enable automatic deployments
3. Push to main branch
4. Vercel auto-deploys

---

## 📊 Deployment Checklist

### Pre-Deployment:
- [x] Code committed to GitHub
- [x] Database models synced
- [x] vercel.json files present
- [ ] Vercel authentication complete
- [ ] Email domain verified

### Environment Variables:
- [ ] DATABASE_URL set
- [ ] EMAIL_PROVIDER configured
- [ ] API keys added (Resend/SendGrid)
- [ ] NEXT_PUBLIC_BASE_URL set
- [ ] All secrets configured

### Post-Deployment:
- [ ] Test all 3 services on production URLs
- [ ] Submit test forms on each site
- [ ] Verify emails send correctly
- [ ] Check admin dashboards work
- [ ] Test mobile responsiveness
- [ ] Run Lighthouse audit
- [ ] Verify SEO metadata

---

## 🔐 Security Notes

**Important:** Never commit these to git:
- `.env.local` files (already in .gitignore)
- API keys
- Database credentials
- Authentication tokens

**Only set in Vercel dashboard:**
- All production secrets
- API keys
- Database URLs

---

## 🌐 Expected URLs After Deployment

### Option 1: Separate Deployments (Recommended)

**m-ops-services:**
- `https://m-ops-services-xxxxx.vercel.app/development`
- `https://m-ops-services-xxxxx.vercel.app/gc-services`

**m-permits-inspections:**
- `https://m-permits-inspections-xxxxx.vercel.app/contractors`

### Option 2: Custom Domains (Production)

**After setting up custom domains:**
- `https://development.kealee.com`
- `https://operations.kealee.com`
- `https://permits.kealee.com`

---

## 📞 Manual Deployment Steps

**If automated deployment doesn't work:**

### 1. Login to Vercel

```bash
vercel login
```

### 2. Link Projects (if needed)

```bash
cd apps/m-ops-services
vercel link

cd apps/m-permits-inspections
vercel link
```

### 3. Deploy to Production

```bash
cd apps/m-ops-services
vercel --prod

cd apps/m-permits-inspections
vercel --prod
```

---

## ✅ Quick Deploy Commands

**Once authenticated:**

```bash
# Deploy Development + GC Operations
cd apps/m-ops-services
vercel --prod

# Deploy Permits & Inspections
cd apps/m-permits-inspections
vercel --prod
```

---

## 🎯 Next Steps

1. **Run:** `vercel login` to authenticate
2. **Deploy:** Run deployment commands above
3. **Configure:** Add environment variables in Vercel dashboard
4. **Verify:** Domain setup with email provider
5. **Test:** All forms and functionality on production
6. **Monitor:** Check logs for any issues

---

**Ready to deploy once you run `vercel login`!**
