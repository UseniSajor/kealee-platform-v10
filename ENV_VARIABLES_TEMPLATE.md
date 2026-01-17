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
STRIPE_SECRET_KEY=sk_live_...
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
