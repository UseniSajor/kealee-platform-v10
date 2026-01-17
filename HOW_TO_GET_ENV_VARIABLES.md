# How to Get Environment Variables

Complete step-by-step guide to obtain all environment variables for Railway and Vercel.

---

## 🔐 **STRIPE ENVIRONMENT VARIABLES**

### **Step 1: Get Stripe API Keys**

1. **Go to Stripe Dashboard:**
   - https://dashboard.stripe.com/test/apikeys (Test Mode)
   - https://dashboard.stripe.com/apikeys (Live Mode)

2. **Copy Your Keys:**
   
   **For Backend (Railway API):**
   ```
   STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
   ```
   
   **For Frontend (Vercel):**
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_... for production)
   ```

3. **⚠️ SECURITY:**
   - ✅ `STRIPE_SECRET_KEY` → **Only on Railway** (backend)
   - ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → **Only on Vercel** (frontend)
   - ❌ **NEVER** put secret key in frontend

---

### **Step 2: Create Stripe Products & Get Price IDs**

1. **Go to Products:**
   - https://dashboard.stripe.com/test/products (Test Mode)
   - https://dashboard.stripe.com/products (Live Mode)

2. **Create Product A - Essential:**
   ```
   Name: Essential Package
   Description: Timeline & task management, document organization, weekly check-ins
   Pricing: $1,750.00 USD / month (recurring)
   ```
   
   After creating, **copy the Price ID:**
   ```
   price_1Oxxxxxxxxxxxxx
   ```
   
   This becomes:
   ```
   STRIPE_PRICE_PACKAGE_A=price_1Oxxxxxxxxxxxxx
   ```

3. **Create Product B - Professional:**
   ```
   Name: Professional Package
   Description: Everything in Essential + contractor coordination, budget tracking, site visits
   Pricing: $3,750.00 USD / month (recurring)
   ```
   
   **Copy Price ID:**
   ```
   STRIPE_PRICE_PACKAGE_B=price_1Oxxxxxxxxxxxxx
   ```

4. **Create Product C - Premium:**
   ```
   Name: Premium Package
   Description: Everything in Professional + permit management, inspection coordination
   Pricing: $9,500.00 USD / month (recurring)
   ```
   
   **Copy Price ID:**
   ```
   STRIPE_PRICE_PACKAGE_C=price_1Oxxxxxxxxxxxxx
   ```

5. **Create Product D - White Glove:**
   ```
   Name: White Glove Package
   Description: Everything in Premium + we hire contractors, handle all payments
   Pricing: $16,500.00 USD / month (recurring)
   ```
   
   **Copy Price ID:**
   ```
   STRIPE_PRICE_PACKAGE_D=price_1Oxxxxxxxxxxxxx
   ```

6. **Create Product - Permit Acceleration (Optional):**
   ```
   Name: Permit Acceleration
   Description: Fast-track permit processing
   Pricing: $299.00 USD (one-time)
   ```
   
   **Copy Price ID:**
   ```
   STRIPE_PRICE_PERMIT=price_1Oxxxxxxxxxxxxx
   ```

---

### **Step 3: Get Stripe Webhook Secret**

1. **Go to Webhooks:**
   - https://dashboard.stripe.com/test/webhooks (Test Mode)
   - https://dashboard.stripe.com/webhooks (Live Mode)

2. **Click "Add endpoint"**

3. **Configure Endpoint:**
   ```
   Endpoint URL: https://kealee-platform-v10-production.up.railway.app/webhooks/stripe
   
   Description: Kealee Platform Production Webhooks
   
   Events to send:
   ✅ customer.subscription.created
   ✅ customer.subscription.updated
   ✅ customer.subscription.deleted
   ✅ invoice.paid
   ✅ invoice.payment_failed
   ✅ payment_intent.succeeded
   ✅ payment_intent.payment_failed
   ```

4. **After creating, click "Reveal" next to "Signing secret":**
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
   ```

---

## 🗄️ **SUPABASE ENVIRONMENT VARIABLES**

### **Step 1: Get Supabase URL & Keys**

1. **Go to Your Supabase Project:**
   - https://app.supabase.com/project/YOUR_PROJECT_ID

2. **Navigate to Settings → API**

3. **Copy Values:**
   
   **Project URL:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   ```
   
   **anon/public key (for frontend):**
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   
   **service_role key (for backend - ⚠️ SECRET):**
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Get Database URL (for Prisma):**
   - Go to **Settings → Database**
   - Scroll to **Connection string**
   - Select **URI** (not Transaction pooler)
   - Copy the connection string:
   
   ```
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```
   
   Replace `[YOUR-PASSWORD]` with your database password

---

## 🚂 **RAILWAY CONFIGURATION**

### **Where to Add Variables in Railway:**

1. **Go to Your Railway Project:**
   - https://railway.app/project/YOUR_PROJECT_ID

2. **Click on Your Service** (e.g., "kealee-platform-v10")

3. **Go to "Variables" Tab**

4. **Click "New Variable" and add each:**

#### **Railway Environment Variables:**
```env
# Database (from Supabase)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe (Backend)
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (Backend)
STRIPE_PRICE_PACKAGE_A=price_...
STRIPE_PRICE_PACKAGE_B=price_...
STRIPE_PRICE_PACKAGE_C=price_...
STRIPE_PRICE_PACKAGE_D=price_...
STRIPE_PRICE_PERMIT=price_...

# API Configuration
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-here

# CORS Origins (your frontend URLs)
CORS_ORIGIN=https://kealee-ops-services.vercel.app,https://kealee-marketplace.vercel.app
```

5. **Click "Deploy"** after adding variables

---

## ▲ **VERCEL CONFIGURATION**

### **Where to Add Variables in Vercel:**

1. **Go to Your Vercel Project:**
   - https://vercel.com/your-username/your-project

2. **Go to Settings → Environment Variables**

3. **Add variables for each app:**

---

### **For `m-ops-services` (Project Management App):**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Backend
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app

# Stripe (Frontend)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)

# Stripe Price IDs (Frontend needs these for pricing page)
NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_A=price_...
NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_B=price_...
NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_C=price_...
NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_D=price_...

# App URL (for Stripe redirects)
NEXT_PUBLIC_APP_URL=https://kealee-ops-services.vercel.app
```

**Environment:** Select "Production, Preview, and Development"

---

### **For `marketplace` (Contractor Marketplace):**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Backend
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app

# Stripe (Frontend)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# App URL
NEXT_PUBLIC_APP_URL=https://kealee-marketplace.vercel.app
```

---

### **For `os-admin` (Admin Dashboard):**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Backend
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app

# App URL
NEXT_PUBLIC_APP_URL=https://kealee-admin.vercel.app
```

---

### **For `os-homeowner` (Homeowner Portal):**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Backend
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app

# Stripe (Frontend - for homeowner subscriptions)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# App URL
NEXT_PUBLIC_APP_URL=https://kealee-homeowner.vercel.app
```

---

### **For `os-vendor` (Contractor/Vendor Portal):**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Backend
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app

# App URL
NEXT_PUBLIC_APP_URL=https://kealee-vendor.vercel.app
```

---

### **For `web-landing` (Marketing Site):**

```env
# Supabase (if needed for contact forms)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Backend
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app

# App URL
NEXT_PUBLIC_APP_URL=https://kealee.com
```

---

## 🔒 **GENERATING SECURE SECRETS**

### **For JWT_SECRET, SESSION_SECRET, etc:**

**Option 1: OpenSSL (Windows with Git Bash)**
```bash
openssl rand -base64 32
```

**Option 2: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option 3: PowerShell**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Option 4: Online Generator**
- https://www.uuidgenerator.net/
- https://randomkeygen.com/

---

## 📋 **QUICK CHECKLIST**

### **✅ Stripe (Priority 1):**
- [ ] Get `STRIPE_SECRET_KEY` from Stripe Dashboard
- [ ] Get `STRIPE_PUBLISHABLE_KEY` from Stripe Dashboard
- [ ] Create 4 products in Stripe Dashboard
- [ ] Copy all 4 price IDs (Package A, B, C, D)
- [ ] Create webhook endpoint
- [ ] Get `STRIPE_WEBHOOK_SECRET`

### **✅ Supabase (Priority 1):**
- [ ] Get `SUPABASE_URL`
- [ ] Get `SUPABASE_ANON_KEY` (public)
- [ ] Get `SUPABASE_SERVICE_ROLE_KEY` (secret)
- [ ] Get `DATABASE_URL` (with password)

### **✅ Railway (Priority 1):**
- [ ] Add all database variables
- [ ] Add Stripe secret keys
- [ ] Add Supabase service role key
- [ ] Generate and add `JWT_SECRET`
- [ ] Set `NODE_ENV=production`

### **✅ Vercel (Priority 2):**
- [ ] Add Supabase public variables to all apps
- [ ] Add `NEXT_PUBLIC_API_URL` to all apps
- [ ] Add Stripe publishable key to customer-facing apps
- [ ] Add Stripe price IDs to `m-ops-services`
- [ ] Set correct `NEXT_PUBLIC_APP_URL` for each app

---

## 🎯 **COPY-PASTE TEMPLATE**

Save this file and fill in the values as you get them:

```env
# ============================================
# RAILWAY ENVIRONMENT VARIABLES
# ============================================

# Database
DATABASE_URL=

# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PACKAGE_A=
STRIPE_PRICE_PACKAGE_B=
STRIPE_PRICE_PACKAGE_C=
STRIPE_PRICE_PACKAGE_D=
STRIPE_PRICE_PERMIT=

# App Config
NODE_ENV=production
PORT=3001
JWT_SECRET=

# ============================================
# VERCEL ENVIRONMENT VARIABLES (ALL APPS)
# ============================================

# Supabase (Public)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# API Backend
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app

# Stripe (Public - for customer apps only)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_A=
NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_B=
NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_C=
NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_D=

# App-specific URLs
NEXT_PUBLIC_APP_URL=  # Change per app
```

---

## 🆘 **TROUBLESHOOTING**

**Issue:** Can't find Stripe API keys  
**Solution:** Make sure you're looking at the right mode (Test vs Live)

**Issue:** Supabase connection fails  
**Solution:** Check that you're using the **URI** connection string, not Transaction pooler

**Issue:** Webhook not receiving events  
**Solution:** Verify webhook URL is publicly accessible and matches your Railway URL

**Issue:** Environment variables not working  
**Solution:** Make sure to **redeploy** after adding variables (both Railway and Vercel)

---

**Need help?** Check the service-specific docs:
- **Stripe:** https://stripe.com/docs/keys
- **Supabase:** https://supabase.com/docs/guides/api
- **Railway:** https://docs.railway.app/develop/variables
- **Vercel:** https://vercel.com/docs/concepts/projects/environment-variables
