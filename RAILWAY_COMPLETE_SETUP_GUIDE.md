# Kealee Platform v10 - Deployment URLs Reference

**Last Updated:** January 18, 2026

This document contains all production and staging URLs for the Kealee Platform.

---

## 🚂 **Railway (Backend API)**

### **Production API:**
```
https://kealee-platform-v10-production.up.railway.app
```

**Endpoints:**
- Health Check: `https://kealee-platform-v10-production.up.railway.app/health`
- GraphQL: `https://kealee-platform-v10-production.up.railway.app/graphql`
- API Documentation: `https://kealee-platform-v10-production.up.railway.app/docs`

**Configuration:**
- Port: `3000` (internal)
- Protocol: `HTTPS`
- Status: ✅ Deployed
- Environment: `NODE_ENV=production`
- Sleep Mode: Disabled (always on)

---

### **Staging API:** ⭐ NEW
```
https://api-staging-production-xxxx.up.railway.app
```

**Endpoints:**
- Health Check: `https://api-staging-production-xxxx.up.railway.app/health`
- GraphQL: `https://api-staging-production-xxxx.up.railway.app/graphql`
- API Documentation: `https://api-staging-production-xxxx.up.railway.app/docs`

**Configuration:**
- Port: `3000` (internal)
- Protocol: `HTTPS`
- Status: ✅ Deployed
- Environment: `NODE_ENV=staging`
- Sleep Mode: Enabled (sleeps after 5 min idle)
- Log Level: `debug` (verbose logging)

**Purpose:**
- Testing preview deployments
- Safe environment for destructive testing
- Debug mode enabled
- Uses test API keys (Stripe, etc.)

---

### **Private Network (Railway Internal):**
```
# Production
http://kealee-platform-v10.railway.internal:3000

# Staging
http://api-staging.railway.internal:3000
```
⚠️ Only accessible from within Railway network

---

## ☁️ **Vercel (Frontend Apps)**

### **Environment Variable Configuration:**

All Vercel apps use this environment variable:

```env
NEXT_PUBLIC_API_URL

Production:  https://kealee-platform-v10-production.up.railway.app
Preview:     https://api-staging-production-xxxx.up.railway.app
Development: http://localhost:3000
```

---

### **1. os-admin** - Platform Administration
```
Production: https://kealee-admin.vercel.app
Preview:    https://kealee-admin-git-preview-xxx.vercel.app
Status:     ⏳ Pending Deployment
```

**Purpose:**
- Platform management
- Organization management
- User administration
- Financial reporting
- System monitoring

---

### **2. os-pm** - Project Manager Dashboard
```
Production: https://kealee-pm.vercel.app
Preview:    https://kealee-pm-git-preview-xxx.vercel.app
Status:     ⏳ Pending Deployment
```

**Purpose:**
- Project management
- Task management
- Client management
- Reports and analytics

---

### **3. m-architect** - Architect Dashboard
```
Production: https://kealee-architect.vercel.app
Preview:    https://kealee-architect-git-preview-xxx.vercel.app
Status:     ⏳ Pending Deployment
```

**Purpose:**
- Design project management
- Drawing set management
- BIM model integration
- Review workflows
- AI-powered design assistance

---

### **4. m-permits-inspections** - Permits Hub
```
Production: https://kealee-permits.vercel.app
Preview:    https://kealee-permits-git-preview-xxx.vercel.app
Status:     ⏳ Pending Deployment
```

**Purpose:**
- Permit applications
- Inspection scheduling
- Jurisdiction integration
- Document management
- Compliance tracking

---

### **5. m-project-owner** - Project Owner Portal
```
Production: https://kealee-project-owner.vercel.app
Preview:    https://kealee-project-owner-git-preview-xxx.vercel.app
Status:     ⏳ Pending Deployment
```

**Purpose:**
- Project overview
- Property management
- Contract management
- Payment tracking
- Milestone monitoring

---

### **6. m-ops-services** - Operations Portal
```
Production: https://kealee-ops-services.vercel.app
Preview:    https://kealee-ops-services-git-preview-xxx.vercel.app
Status:     ⏳ Pending Deployment
```

**Purpose:**
- Service request management
- Service plans
- Operations workflow
- Customer portal

---

## 🗄️ **Supabase (Database & Auth)**

### **Production Database:**
```
https://your-project-id.supabase.co
```
📝 Update this after Supabase setup

### **Staging Database (Optional):**
```
https://your-staging-project-id.supabase.co
```
📝 Create separate staging project if needed

### **Dashboard:**
```
https://app.supabase.com/project/your-project-id
```

---

## 🔑 **Environment Variables Summary**

### **For All Vercel Apps:**

```env
# API Configuration (Environment-Specific)
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app  # Production
NEXT_PUBLIC_API_URL=https://api-staging-production-xxxx.up.railway.app     # Preview

# Supabase (Same for both environments)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Environment
NODE_ENV=production  # or staging
```

---

### **For Railway Production API:**

```env
# Core
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:password@host:6543/postgres

# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# CORS (Allow Vercel domains)
CORS_ORIGINS=https://*.vercel.app,http://localhost:3000

# API Keys (Production)
STRIPE_SECRET_KEY=sk_live_...
ANTHROPIC_API_KEY=sk-ant-...
SENDGRID_API_KEY=SG...

# Logging
LOG_LEVEL=info
```

---

### **For Railway Staging API:**

```env
# Core
NODE_ENV=staging
PORT=3000
DATABASE_URL=postgresql://postgres:password@host:6543/postgres  # Same or different

# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# CORS (Allow Vercel preview domains)
CORS_ORIGINS=https://*.vercel.app,http://localhost:3000

# API Keys (Test/Staging)
STRIPE_SECRET_KEY=sk_test_...  # ⭐ Test key!
ANTHROPIC_API_KEY=sk-ant-...
SENDGRID_API_KEY=SG...

# Debug Features
LOG_LEVEL=debug  # ⭐ Verbose logging
ENABLE_DEBUG_MODE=true
ALLOW_TEST_USERS=true

# Identification
RAILWAY_ENVIRONMENT=staging
```

---

## 📋 **Deployment Status Checklist**

### **Backend (Railway):**
- [x] Production API deployed
- [x] Production API health check passing
- [x] Staging API deployed ⭐
- [x] Staging API health check passing ⭐
- [x] Both environments isolated ⭐
- [ ] Environment variables verified
- [ ] CORS configured for Vercel domains

### **Frontend (Vercel):**
- [ ] os-admin deployed (production & preview)
- [ ] os-pm deployed (production & preview)
- [ ] m-architect deployed (production & preview)
- [ ] m-permits-inspections deployed (production & preview)
- [ ] m-project-owner deployed (production & preview)
- [ ] m-ops-services deployed (production & preview)

### **Integration:**
- [ ] Production apps reach production API
- [ ] Preview apps reach staging API
- [ ] Supabase auth working on all apps
- [ ] Database queries working
- [ ] File uploads working
- [ ] Real-time features working

---

## 🔄 **Deployment Workflow**

### **Production Flow:**
```bash
1. Push to main branch
   git push origin main

2. Railway production API rebuilds automatically
3. Vercel production apps rebuild automatically
4. Both use production environment variables
```

---

### **Staging/Preview Flow:**
```bash
1. Push to preview-deploy branch (or any branch)
   git push origin preview-deploy

2. Railway staging API rebuilds (if configured)
3. Vercel preview apps deploy automatically
4. Both use staging/preview environment variables
```

---

## 🧪 **Testing URLs**

### **Health Checks:**

**Railway Production:**
```bash
curl https://kealee-platform-v10-production.up.railway.app/health
# Expected: {"status":"ok","timestamp":1234567890}
```

**Railway Staging:**
```bash
curl https://api-staging-production-xxxx.up.railway.app/health
# Expected: {"status":"ok","timestamp":1234567890}
```

**Vercel Apps (after deployment):**
```bash
# Test each app loads
curl https://kealee-admin.vercel.app
curl https://kealee-pm.vercel.app
# etc...
```

---

### **API Connectivity Test:**

**From Browser (Vercel App):**
1. Open any Vercel app URL
2. Open DevTools (F12)
3. Go to Network tab
4. Trigger an API call in the app
5. Verify request goes to correct API:
   - Production: `kealee-platform-v10-production.up.railway.app`
   - Preview: `api-staging-production-xxxx.up.railway.app`

---

## 🔐 **Security Notes**

### **Public URLs (Safe to Share):**
✅ All Vercel app URLs
✅ Railway API URLs (both production and staging)
✅ Supabase Project URLs

### **Keep Secret (Never Commit):**
❌ `SUPABASE_SERVICE_ROLE_KEY`
❌ `DATABASE_URL`
❌ Any API keys (OpenAI, Anthropic, Stripe, etc.)
❌ Webhook secrets
❌ `API_SECRET_KEY`

---

## 📞 **Support & Resources**

- **Railway Dashboard:** https://railway.app/dashboard
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://app.supabase.com
- **GitHub Repository:** https://github.com/UseniSajor/kealee-platform-v10

---

## 🎯 **Quick Reference**

| Service | Environment | URL | Status |
|---------|-------------|-----|--------|
| **Railway API** | Production | `https://kealee-platform-v10-production.up.railway.app` | ✅ Live |
| **Railway API** | Staging | `https://api-staging-production-xxxx.up.railway.app` | ✅ Live |
| os-admin | Production | `https://kealee-admin.vercel.app` | ⏳ Pending |
| os-admin | Preview | `https://kealee-admin-git-preview-xxx.vercel.app` | ⏳ Pending |
| os-pm | Production | `https://kealee-pm.vercel.app` | ⏳ Pending |
| os-pm | Preview | `https://kealee-pm-git-preview-xxx.vercel.app` | ⏳ Pending |
| m-architect | Production | `https://kealee-architect.vercel.app` | ⏳ Pending |
| m-architect | Preview | `https://kealee-architect-git-preview-xxx.vercel.app` | ⏳ Pending |
| m-permits | Production | `https://kealee-permits.vercel.app` | ⏳ Pending |
| m-permits | Preview | `https://kealee-permits-git-preview-xxx.vercel.app` | ⏳ Pending |

---

**Last Verified:** January 18, 2026  
**Next Update:** After Vercel deployments complete  
**Staging API Created:** ✅ Complete
