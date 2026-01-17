# Kealee Platform v10 - Deployment URLs Reference

**Last Updated:** January 17, 2026

This document contains all production URLs for the Kealee Platform.

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
- Port: `3001` (internal)
- Protocol: `HTTPS`
- Status: ✅ Deployed

### **Private Network (Railway Internal):**
```
http://kealee-platform-v10.railway.internal:3001
```
⚠️ Only accessible from within Railway network

---

## ☁️ **Vercel (Frontend Apps)**

### **1. os-admin** - Platform Administration
```
URL: https://kealee-admin.vercel.app
Status: ⏳ Pending Deployment
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
URL: https://kealee-pm.vercel.app
Status: ⏳ Pending Deployment
```

**Purpose:**
- Project management
- Task management
- Client management
- Reports and analytics

---

### **3. m-architect** - Architect Dashboard
```
URL: https://kealee-architect.vercel.app
Status: ⏳ Pending Deployment
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
URL: https://kealee-permits.vercel.app
Status: ⏳ Pending Deployment
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
URL: https://kealee-project-owner.vercel.app
Status: ⏳ Pending Deployment
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
URL: https://kealee-ops-services.vercel.app
Status: ⏳ Pending Deployment
```

**Purpose:**
- Service request management
- Service plans
- Operations workflow
- Customer portal

---

## 🗄️ **Supabase (Database & Auth)**

### **Project URL:**
```
https://your-project-id.supabase.co
```
📝 Update this after Supabase setup

### **Dashboard:**
```
https://app.supabase.com/project/your-project-id
```

---

## 🔑 **Environment Variables Summary**

### **For All Vercel Apps:**

```env
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NODE_ENV=production
```

### **For Railway API:**

```env
DATABASE_URL=postgresql://postgres:password@host:6543/postgres
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
PORT=3001
NODE_ENV=production
```

---

## 📋 **Deployment Checklist**

### **Backend (Railway):**
- [x] API deployed
- [x] Health check passing
- [x] GraphQL endpoint working
- [x] Database connected
- [ ] Environment variables verified
- [ ] CORS configured for Vercel domains

### **Frontend (Vercel):**
- [ ] os-admin deployed
- [ ] os-pm deployed
- [ ] m-architect deployed
- [ ] m-permits-inspections deployed
- [ ] m-project-owner deployed
- [ ] m-ops-services deployed

### **Integration:**
- [ ] All Vercel apps can reach Railway API
- [ ] Supabase auth working on all apps
- [ ] Database queries working
- [ ] File uploads working
- [ ] Real-time features working

---

## 🔄 **How to Update This File**

When you deploy an app, update the status and URL:

```markdown
### **1. os-admin** - Platform Administration
```
URL: https://kealee-admin.vercel.app
Status: ✅ Deployed (Jan 17, 2026)
```
```

---

## 🧪 **Testing URLs**

### **Health Checks:**

**Railway API:**
```bash
curl https://kealee-platform-v10-production.up.railway.app/health
# Expected: {"status":"ok"}
```

**Vercel Apps (after deployment):**
```bash
# Test each app loads
curl https://kealee-admin.vercel.app
curl https://kealee-pm.vercel.app
# etc...
```

### **API Connectivity from Vercel:**

Once deployed, test that Vercel apps can reach Railway:
1. Open browser console on any Vercel app
2. Check Network tab for API calls
3. Verify calls go to `https://kealee-platform-v10-production.up.railway.app`

---

## 🔐 **Security Notes**

### **Public URLs:**
✅ Safe to share:
- All Vercel app URLs
- Railway API URL
- Supabase Project URL

### **Keep Secret:**
❌ Never commit to Git:
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- Any API keys (OpenAI, Anthropic, Stripe, etc.)
- Webhook secrets

---

## 📞 **Support & Resources**

- **Railway Dashboard:** https://railway.app/dashboard
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://app.supabase.com

---

## 🎯 **Quick Reference**

| Service | URL | Status |
|---------|-----|--------|
| Railway API | `https://kealee-platform-v10-production.up.railway.app` | ✅ Live |
| os-admin | `https://kealee-admin.vercel.app` | ⏳ Pending |
| os-pm | `https://kealee-pm.vercel.app` | ⏳ Pending |
| m-architect | `https://kealee-architect.vercel.app` | ⏳ Pending |
| m-permits | `https://kealee-permits.vercel.app` | ⏳ Pending |
| m-project-owner | `https://kealee-project-owner.vercel.app` | ⏳ Pending |
| m-ops-services | `https://kealee-ops-services.vercel.app` | ⏳ Pending |

---

**Last Verified:** January 17, 2026  
**Next Update:** After Vercel deployments complete
