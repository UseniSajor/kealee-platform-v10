# 🚀 Manual Deployment Steps - Kealee Services

## ⚠️ Vercel CLI Authentication Issue

The automated deployment encountered a token issue. Here's how to deploy manually:

---

## 🎯 Option 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Go to Vercel Dashboard

Visit: https://vercel.com/

### Step 2: Import Your Repository

1. Click "Add New..." → "Project"
2. Select "Import Git Repository"
3. Choose your repository: `UseniSajor/kealee-platform-v10`
4. If not connected, click "Adjust GitHub App Permissions" and authorize

### Step 3: Deploy m-ops-services (Development + GC Operations)

**Project settings:**
- **Framework Preset:** Next.js
- **Root Directory:** `apps/m-ops-services`
- **Build Command:** Use default (from vercel.json)
- **Install Command:** Use default (from vercel.json)

**Environment Variables to add:**
```
DATABASE_URL=your_supabase_postgres_url
EMAIL_PROVIDER=console
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://your-deployment-url.vercel.app
```

Click "Deploy"

### Step 4: Deploy m-permits-inspections (Permits)

Repeat the process:
- **Root Directory:** `apps/m-permits-inspections`
- **Same environment variables**

Click "Deploy"

---

## 🎯 Option 2: Deploy via CLI (After Fixing Auth)

### Fix Vercel Authentication

**In a NEW PowerShell terminal:**

```powershell
# Navigate to project
cd "c:\Kealee-Platform v10"

# Login to Vercel
vercel login
# This will open browser - complete authentication

# Verify login worked
vercel whoami
```

### Deploy Applications

**Once authenticated:**

```powershell
# Deploy m-ops-services (Development + GC Ops)
cd apps\m-ops-services
vercel --prod

# Deploy m-permits-inspections (Permits)
cd ..\m-permits-inspections
vercel --prod
```

---

## ⚙️ Environment Variables Required

### For Both Deployments:

**Add these in Vercel Dashboard → Project → Settings → Environment Variables:**

```env
# Database (Required)
DATABASE_URL=postgresql://postgres.[your-project]:[password]@aws-1-us-east-2.pooler.supabase.com:5432/postgres

# Email (Required for production)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_actual_key_here

# Or for SendGrid:
# EMAIL_PROVIDER=sendgrid
# SENDGRID_API_KEY=SG.your_actual_key

# Base URL (Auto-filled by Vercel usually)
NEXT_PUBLIC_BASE_URL=https://your-deployment-url.vercel.app

# Environment
NODE_ENV=production
```

**For development/testing, you can use:**
```env
EMAIL_PROVIDER=console  # Logs emails instead of sending
```

---

## 📧 Email Domain Setup

**Before production use:**

### If using Resend:

1. Go to https://resend.com/domains
2. Add domain: `kealee.com`
3. Add DNS records as instructed by Resend
4. Verify domain
5. Add authorized senders:
   - `intake@kealee.com`
   - `ops@kealee.com`  
   - `permits@kealee.com`

### If using SendGrid:

1. Go to SendGrid → Settings → Sender Authentication
2. Authenticate domain: `kealee.com`
3. Add DNS records (SPF, DKIM)
4. Verify domain

---

## 🧪 Testing After Deployment

### Once Deployed:

**1. Test m-ops-services deployment:**
```
https://[your-deployment-url].vercel.app/development
https://[your-deployment-url].vercel.app/gc-services
```

**2. Test m-permits-inspections deployment:**
```
https://[your-permits-url].vercel.app/contractors
```

**3. Test Forms:**
- Submit a test lead on each site
- Check if emails are received (if EMAIL_PROVIDER configured)
- Verify leads appear in admin dashboards

**4. Test Admin Dashboards:**
```
https://[your-url].vercel.app/portal/development-leads
https://[your-url].vercel.app/portal/gc-ops-leads
https://[your-permits-url].vercel.app/portal/permit-leads
```

---

## 🔧 Troubleshooting

### "Token is not valid" Error

**Solution:**
```powershell
# Clear Vercel config
Remove-Item -Recurse -Force $env:USERPROFILE\.vercel

# Login fresh
vercel login
```

### "Project not found" Error

**Solution:**
```powershell
cd apps\m-ops-services
vercel link  # Link to existing project or create new
vercel --prod
```

### Build Errors

**Check:**
- Environment variables are set correctly in Vercel
- DATABASE_URL is accessible from Vercel
- All dependencies are in package.json

---

## 📍 Current Status

**Repository:** ✅ Pushed to GitHub (commit 8a6923a)
**Authentication:** ⚠️ Token issue - needs manual login
**Deployments:** ⏳ Pending authentication

---

## 🎯 Quick Deploy Steps (Summary)

1. **Option A - Vercel Dashboard (Easiest):**
   - Go to https://vercel.com/new
   - Import `UseniSajor/kealee-platform-v10`
   - Deploy `apps/m-ops-services`
   - Deploy `apps/m-permits-inspections`
   - Add environment variables
   - Done!

2. **Option B - CLI (After fixing auth):**
   ```powershell
   vercel login
   cd apps\m-ops-services
   vercel --prod
   cd ..\m-permits-inspections
   vercel --prod
   ```

---

## 💡 Recommendation

**Use Vercel Dashboard (Option A)** - it's more reliable and gives you better visibility into the deployment process, build logs, and environment variable configuration.

Visit: https://vercel.com/new

---

Would you like me to create additional configuration files or would you prefer to proceed with the dashboard deployment?