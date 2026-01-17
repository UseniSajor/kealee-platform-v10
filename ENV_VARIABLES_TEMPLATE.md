# Environment Variables Template

**Copy these to your deployment platforms**

---

## 🚂 **Railway API Service**

```env
# Database
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Server
PORT=3001
NODE_ENV=production

# Optional Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs - PM Services (Ops Services)
STRIPE_PRICE_PACKAGE_A=price_1Oxxxxxxxxxxxxx  # $1,700/month - Starter
STRIPE_PRICE_PACKAGE_B=price_1Oxxxxxxxxxxxxx  # $4,500/month - Professional
STRIPE_PRICE_PACKAGE_C=price_1Oxxxxxxxxxxxxx  # $8,500/month - Premium
STRIPE_PRICE_PACKAGE_D=price_1Oxxxxxxxxxxxxx  # $16,500/month - Enterprise

# Stripe Price IDs - Marketplace
STRIPE_PRICE_MARKETPLACE_BASIC=price_1Oxxxxxxxxxxxxx       # $49/month
STRIPE_PRICE_MARKETPLACE_PRO=price_1Oxxxxxxxxxxxxx         # $149/month
STRIPE_PRICE_MARKETPLACE_PREMIUM=price_1Oxxxxxxxxxxxxx     # $299/month

# Stripe Price IDs - Architect Services
STRIPE_PRICE_ARCHITECT_PRO=price_1Oxxxxxxxxxxxxx           # $99/month

# Stripe Price IDs - Permit Services
STRIPE_PRICE_PERMIT_PRO=price_1Oxxxxxxxxxxxxx              # $299/month

# Stripe Price IDs - Add-Ons
STRIPE_PRICE_API_ACCESS=price_1Oxxxxxxxxxxxxx              # $499/month
STRIPE_PRICE_WHITE_LABEL=price_1Oxxxxxxxxxxxxx             # $199/month

# DocuSign
DOCUSIGN_INTEGRATION_KEY=...
```

---

## ☁️ **Vercel Apps (All 6 Apps)**

**Copy these to EACH Vercel project:**

```env
# Railway API (Backend)
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app

# Supabase Authentication
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Supabase Service Role (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Environment
NODE_ENV=production
```

---

## 🔑 **Optional Variables (App-Specific)**

### **For m-architect:**
```env
NEXT_PUBLIC_OPENAI_API_KEY=sk-...
```

### **For m-permits-inspections:**
```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...
```

---

## 📝 **How to Use:**

1. **Railway:** Add to Railway Dashboard → Service → Variables
2. **Vercel:** Add to Vercel Dashboard → Project → Settings → Environment Variables
3. **Local Dev:** Create `.env.local` files in each app directory

---

## 🎯 **Your Current Values:**

**Railway API URL:**
```
https://kealee-platform-v10-production.up.railway.app
```

**Supabase:**
```
Update after Supabase setup
```
