# 🔧 Make Preview Fully Operational - Complete Setup Guide

**Current Status:** 25% operational (UI only)  
**Target:** 100% operational (full functionality)  
**Time Required:** 1-2 hours

---

## 📊 **CURRENT VS TARGET STATE:**

| Feature | Current | After Setup |
|---------|---------|-------------|
| UI/Navigation | ✅ 100% | ✅ 100% |
| Authentication | ❌ 0% | ✅ 100% |
| API Calls | ❌ 0% | ✅ 100% |
| Database | ❌ 0% | ✅ 100% |
| Stripe | ❌ 0% | ✅ 100% |
| **TOTAL** | **25%** | **100%** |

---

## 🎯 **SETUP ROADMAP:**

```
Step 1: Supabase Setup (30 min)
    ↓
Step 2: Deploy Database Schema (15 min)
    ↓
Step 3: Configure Environment Variables (15 min)
    ↓
Step 4: Stripe Setup (20 min)
    ↓
Step 5: Test Everything (20 min)
    ↓
  100% OPERATIONAL! 🎉
```

---

## 🔐 **STEP 1: SUPABASE SETUP (30 minutes)**

### **1.1 Create Supabase Project:**

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   ```
   Name: kealee-platform
   Database Password: [create strong password - SAVE THIS!]
   Region: [closest to your users]
   Plan: Free (upgrade later if needed)
   ```
4. Click **"Create new project"**
5. ⏳ Wait 2-3 minutes for setup

---

### **1.2 Get Supabase Credentials:**

Once project is ready:

1. Go to **Settings** → **API**
2. Copy these values:

```bash
# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co

# anon/public key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# service_role key (for backend only - keep secret!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**💾 SAVE THESE** - You'll need them in Step 3

---

### **1.3 Enable Authentication:**

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure settings:
   ```
   ✅ Enable Email Confirmations: OFF (for testing)
   ✅ Enable Email Change Confirmations: OFF (for testing)
   ✅ Secure Email Change: ON
   ```
4. Click **"Save"**

---

## 🗄️ **STEP 2: DEPLOY DATABASE SCHEMA (15 minutes)**

### **2.1 Check if Schema File Exists:**

```bash
# Check for Prisma schema
ls packages/database/prisma/schema.prisma

# Or check for SQL migration files
ls packages/database/supabase/migrations/
```

---

### **2.2 Deploy Schema to Supabase:**

**Option A: Using Prisma (Recommended)**

```bash
# Navigate to database package
cd packages/database

# Set database URL
# Windows PowerShell:
$env:DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT_REF].supabase.co:5432/postgres"

# Mac/Linux:
export DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT_REF].supabase.co:5432/postgres"

# Push schema to database
pnpm prisma db push

# Generate Prisma client
pnpm db:generate
```

**Option B: Using SQL Editor**

1. Go to Supabase Dashboard → **SQL Editor**
2. Create tables manually:

```sql
-- Example: Users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data" 
  ON public.users 
  FOR SELECT 
  USING (auth.uid() = id);

-- Add more tables as needed...
```

3. Click **"Run"** for each table

---

### **2.3 Verify Schema:**

1. Go to **Table Editor**
2. Check tables are created
3. Verify you see:
   - Users table
   - Projects table
   - Any other app-specific tables

---

## 🔐 **STEP 3: CONFIGURE ENVIRONMENT VARIABLES (15 minutes)**

### **3.1 Add Variables to Vercel:**

For each app in Vercel Dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add these variables for **Preview** environment:

```bash
# Supabase (from Step 1.2)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API URL (Railway)
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app

# App identification
NEXT_PUBLIC_APP_NAME=App Name [PREVIEW]
NEXT_PUBLIC_ENVIRONMENT=preview
```

3. Click **"Save"**
4. Repeat for all 4 apps

---

### **3.2 Trigger Redeployment:**

After adding env vars:

```bash
# Make a small change to trigger redeploy
git checkout preview-deploy
git commit --allow-empty -m "chore: trigger redeploy with env vars"
git push origin preview-deploy
```

Or click **"Redeploy"** in Vercel dashboard

---

## 💳 **STEP 4: STRIPE SETUP (20 minutes)** 

*Only for m-ops-services*

### **4.1 Get Stripe Test Keys:**

1. Go to https://dashboard.stripe.com
2. Toggle to **"Test Mode"** (top right)
3. Click **Developers** → **API Keys**
4. Copy:
   ```bash
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxx
   STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxx
   ```

---

### **4.2 Create Products in Stripe:**

1. Go to **Products** → **Add product**
2. Create 4 products:

**Package A - Starter:**
```
Name: PM Staffing - Starter (Package A)
Description: Essential project management support
Pricing: $1,700.00 USD per month
```
Copy the price ID: `price_xxxxxxxxxxxxx`

**Package B - Professional:**
```
Name: PM Staffing - Professional (Package B)
Description: Full project management service
Pricing: $4,500.00 USD per month
```
Copy the price ID: `price_xxxxxxxxxxxxx`

**Package C - Premium:**
```
Name: PM Staffing - Premium (Package C)
Description: Premium PM service with permits
Pricing: $8,500.00 USD per month
```
Copy the price ID: `price_xxxxxxxxxxxxx`

**Package D - Enterprise:**
```
Name: PM Staffing - Enterprise (Package D)
Description: Complete white-glove service
Pricing: $16,500.00 USD per month
```
Copy the price ID: `price_xxxxxxxxxxxxx`

---

### **4.3 Add Stripe Variables to Vercel:**

For **m-ops-services** only:

1. Go to Vercel → m-ops-services → **Settings** → **Environment Variables**
2. Add for **Preview** environment:

```bash
# Stripe Keys (TEST MODE)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxx

# Price IDs
STRIPE_PRICE_PACKAGE_A=price_xxxxxxxxxxxxx
STRIPE_PRICE_PACKAGE_B=price_xxxxxxxxxxxxx
STRIPE_PRICE_PACKAGE_C=price_xxxxxxxxxxxxx
STRIPE_PRICE_PACKAGE_D=price_xxxxxxxxxxxxx

# App URL (get from Vercel deployment)
NEXT_PUBLIC_APP_URL=https://kealee-m-ops-services-git-preview-deploy-xxx.vercel.app
```

3. Click **"Save"**
4. Redeploy

---

### **4.4 Set Up Webhook (Optional for Preview):**

1. Go to Stripe → **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Enter: `https://your-railway-url/webhooks/stripe`
4. Select events:
   ```
   customer.subscription.created
   customer.subscription.updated
   customer.subscription.deleted
   invoice.paid
   invoice.payment_failed
   ```
5. Copy webhook secret: `whsec_xxxxxxxxxxxxx`
6. Add to Railway environment variables:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

---

## 🧪 **STEP 5: TEST EVERYTHING (20 minutes)**

### **5.1 Test Authentication:**

```bash
# Open preview URL
open https://kealee-os-admin-git-preview-deploy-xxx.vercel.app

# Test login flow:
1. [ ] Sign up page loads
2. [ ] Can create new account
3. [ ] Receive confirmation (if enabled)
4. [ ] Can log in
5. [ ] Session persists across pages
6. [ ] Can log out
```

---

### **5.2 Test Database Operations:**

```bash
# Test data fetching:
1. [ ] Dashboard loads with data
2. [ ] Lists display items
3. [ ] Can create new items
4. [ ] Can update items
5. [ ] Can delete items
6. [ ] Changes persist after refresh
```

---

### **5.3 Test Stripe (m-ops-services):**

```bash
# Test checkout flow:
1. [ ] Pricing page displays all packages
2. [ ] Click "Get Started" on any package
3. [ ] Redirects to Stripe Checkout
4. [ ] Use test card: 4242 4242 4242 4242
5. [ ] Complete checkout
6. [ ] Redirects to success page
7. [ ] Check Stripe dashboard for payment
```

**Test Card Numbers:**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient: 4000 0000 0000 9995
```

---

### **5.4 Test API Integration:**

```bash
# Check browser console (F12):
1. [ ] No authentication errors
2. [ ] API calls return 200 status
3. [ ] Data loads successfully
4. [ ] No CORS errors
5. [ ] Network tab shows successful requests
```

---

### **5.5 Complete Test Checklist:**

Use the full checklist:

```bash
code PREVIEW_TEST_CHECKLIST.md

# Go through all sections:
- Basic Functionality: _____ / 10
- Authentication: _____ / 8
- API Integration: _____ / 7
- Database: _____ / 6
- Stripe: _____ / 8
- Performance: _____ / 5
```

---

## ✅ **VERIFICATION CHECKLIST:**

### **After Setup, Verify:**

- [ ] **Supabase:** Project created and accessible
- [ ] **Database:** Schema deployed, tables visible
- [ ] **Auth:** Can sign up and log in
- [ ] **Environment Variables:** All set in Vercel
- [ ] **API Calls:** Return data successfully
- [ ] **Stripe:** Test checkout completes
- [ ] **No Console Errors:** Clean browser console
- [ ] **Performance:** Pages load < 3 seconds

---

## 📊 **EXPECTED RESULTS:**

### **Before Setup:**
```
✅ UI Display: 100%
❌ Authentication: 0%
❌ API Calls: 0%
❌ Database: 0%
❌ Stripe: 0%

TOTAL: 25% Operational
```

### **After Setup:**
```
✅ UI Display: 100%
✅ Authentication: 100%
✅ API Calls: 100%
✅ Database: 100%
✅ Stripe: 100%

TOTAL: 100% Operational ✨
```

---

## 🔄 **IF SOMETHING DOESN'T WORK:**

### **Authentication Issues:**
```bash
# Check:
1. Supabase URL correct in env vars?
2. Anon key correct?
3. Auth enabled in Supabase?
4. App redeployed after adding vars?

# Debug:
- Check browser console for errors
- Check Supabase logs (Logs & Reports)
- Verify env vars in Vercel dashboard
```

---

### **API Call Failures:**
```bash
# Check:
1. Railway API running?
2. CORS enabled on Railway?
3. Correct API URL in env vars?
4. Database connected to Railway?

# Debug:
- Test Railway API directly in browser
- Check Railway logs
- Verify network requests in DevTools
```

---

### **Stripe Issues:**
```bash
# Check:
1. Using TEST keys (sk_test_...)?
2. Products created in TEST mode?
3. Correct price IDs in env vars?
4. Test card being used?

# Debug:
- Check Stripe Dashboard → Logs
- Verify keys in Vercel env vars
- Test with curl:
  curl https://api.stripe.com/v1/prices \
    -u sk_test_your_key:
```

---

## 🎉 **SUCCESS CRITERIA:**

Your preview is **fully operational** when:

✅ All pages load without errors  
✅ Can sign up and log in  
✅ Dashboard shows real data  
✅ Can create/update/delete items  
✅ Stripe checkout completes (test mode)  
✅ No console errors  
✅ All API calls successful  
✅ Sessions persist correctly  

---

## ⏱️ **TIME BREAKDOWN:**

| Task | Time | Cumulative |
|------|------|------------|
| Supabase Setup | 30 min | 30 min |
| Database Schema | 15 min | 45 min |
| Environment Variables | 15 min | 60 min |
| Stripe Setup | 20 min | 80 min |
| Testing | 20 min | 100 min |
| **TOTAL** | **~2 hours** | |

---

## 📝 **QUICK REFERENCE:**

### **Supabase Connection String:**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

### **Environment Variables Template:**
```bash
# All Apps
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_APP_NAME=
NEXT_PUBLIC_ENVIRONMENT=

# m-ops-services only
STRIPE_SECRET_KEY=
STRIPE_PRICE_PACKAGE_A=
STRIPE_PRICE_PACKAGE_B=
STRIPE_PRICE_PACKAGE_C=
STRIPE_PRICE_PACKAGE_D=
NEXT_PUBLIC_APP_URL=
```

---

## 🚀 **READY TO START?**

Follow the steps in order, don't skip any, and you'll have a fully operational preview deployment in about 2 hours!

**Start with Step 1: Supabase Setup** 👆
