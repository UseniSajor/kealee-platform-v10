# Deploy All Kealee Apps to Vercel - Complete Guide

## 📋 Overview

This guide will help you deploy all 6 Next.js applications to Vercel.

**Total Apps to Deploy:** 6  
**Platform:** Vercel  
**Estimated Time:** 30-45 minutes  

---

## 🎯 Apps to Deploy

| # | App Name | Purpose | Priority | Vercel Project Name |
|---|----------|---------|----------|---------------------|
| 1 | **os-admin** | Platform Admin Dashboard | 🔴 High | `kealee-admin` |
| 2 | **os-pm** | Project Manager Dashboard | 🔴 High | `kealee-pm` |
| 3 | **m-ops-services** | Operations Services Portal | 🟠 Medium | `kealee-ops-services` |
| 4 | **m-permits-inspections** | Permits & Inspections Hub | 🟠 Medium | `kealee-permits` |
| 5 | **m-project-owner** | Project Owner Portal | 🟡 Low | `kealee-project-owner` |
| 6 | **m-architect** | Architect Dashboard | 🟡 Low | `kealee-architect` |

---

## 🔑 Environment Variables (Required for All Apps)

Before deploying, prepare these values:

### 1. Railway API URL
```env
NEXT_PUBLIC_API_URL=https://your-api-name.up.railway.app
```
**Where to get it:**
- Railway Dashboard → Your API Service → Settings → Domains
- Example: `https://kealee-api-production.up.railway.app`

### 2. Supabase Credentials
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Where to get them:**
- Supabase Dashboard → Settings → API
  - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
  - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Optional Variables (App-Specific)
```env
# For apps with AI features (m-architect, m-permits-inspections)
NEXT_PUBLIC_OPENAI_API_KEY=sk-...

# For apps with mapping (m-permits-inspections)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...

# General
NODE_ENV=production
```

---

## 🚀 Deployment Process

### Option A: Deploy via Vercel Dashboard (Recommended)

#### Step 1: Deploy First App (os-admin)

1. **Go to Vercel:** [https://vercel.com/new](https://vercel.com/new)

2. **Import Repository:**
   - Click "Import Git Repository"
   - Select: `UseniSajor/kealee-platform-v10`
   - Click "Import"

3. **Configure Project:**
   ```yaml
   Project Name: kealee-admin
   Root Directory: apps/os-admin
   Framework: Next.js (auto-detected)
   
   Build Command:
   cd ../.. && pnpm install --filter @kealee/os-admin... && pnpm build --filter @kealee/os-admin
   
   Output Directory: .next
   
   Install Command:
   cd ../.. && pnpm install --filter @kealee/os-admin...
   ```

4. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add all required variables (see section above)
   - Apply to: Production, Preview, Development

5. **Deploy:**
   - Click "Deploy"
   - Wait 3-5 minutes for build

6. **✅ Success!** Your app is live at: `https://kealee-admin.vercel.app`

#### Step 2: Deploy Remaining Apps

Repeat Step 1 for each remaining app, using the configurations below:

---

## 📦 App-Specific Configurations

### 1. **os-admin** - Platform Admin Dashboard

```yaml
Project Name: kealee-admin
Root Directory: apps/os-admin
Build Command: cd ../.. && pnpm install --filter @kealee/os-admin... && pnpm build --filter @kealee/os-admin
```

**Environment Variables:**
```env
NEXT_PUBLIC_API_URL=<your-railway-api-url>
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
NODE_ENV=production
```

**Features:**
- Organization management
- User management & RBAC
- Contract templates
- Jurisdiction management
- Financial reporting
- Audit logs
- System monitoring

---

### 2. **os-pm** - Project Manager Dashboard

```yaml
Project Name: kealee-pm
Root Directory: apps/os-pm
Build Command: cd ../.. && pnpm install --filter @kealee/os-pm... && pnpm build --filter @kealee/os-pm
```

**Environment Variables:**
```env
NEXT_PUBLIC_API_URL=<your-railway-api-url>
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
NODE_ENV=production
```

**Features:**
- Project management dashboard
- Client management
- Task management
- SOP management
- Reports and analytics
- Team collaboration

---

### 3. **m-ops-services** - Operations Services Portal

```yaml
Project Name: kealee-ops-services
Root Directory: apps/m-ops-services
Build Command: cd ../.. && pnpm install --filter @kealee/m-ops-services... && pnpm build --filter @kealee/m-ops-services
```

**Environment Variables:**
```env
NEXT_PUBLIC_API_URL=<your-railway-api-url>
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
NODE_ENV=production
```

**Features:**
- Service request management
- Service plan configuration
- Operations workflow
- Customer portal

---

### 4. **m-permits-inspections** - Permits & Inspections Hub

```yaml
Project Name: kealee-permits
Root Directory: apps/m-permits-inspections
Build Command: cd ../.. && pnpm install --filter @kealee/m-permits-inspections... && pnpm build --filter @kealee/m-permits-inspections
```

**Environment Variables:**
```env
NEXT_PUBLIC_API_URL=<your-railway-api-url>
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
NEXT_PUBLIC_MAPBOX_TOKEN=<your-mapbox-token>
NODE_ENV=production
```

**Features:**
- Permit application management
- Inspection scheduling
- Document management
- Jurisdiction integration
- Compliance tracking
- Interactive maps

---

### 5. **m-project-owner** - Project Owner Portal

```yaml
Project Name: kealee-project-owner
Root Directory: apps/m-project-owner
Build Command: cd ../.. && pnpm install --filter @kealee/m-project-owner... && pnpm build --filter @kealee/m-project-owner
```

**Environment Variables:**
```env
NEXT_PUBLIC_API_URL=<your-railway-api-url>
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
NODE_ENV=production
```

**Features:**
- Project overview
- Property management
- Contract management
- Payment tracking
- Milestone monitoring
- Document access

---

### 6. **m-architect** - Architect Dashboard

```yaml
Project Name: kealee-architect
Root Directory: apps/m-architect
Build Command: cd ../.. && pnpm install --filter @kealee/m-architect... && pnpm build --filter @kealee/m-architect
```

**Environment Variables:**
```env
NEXT_PUBLIC_API_URL=<your-railway-api-url>
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
NEXT_PUBLIC_OPENAI_API_KEY=<your-openai-key>
NODE_ENV=production
```

**Features:**
- Design project management
- Drawing set management
- BIM model integration
- Review and approval workflows
- Version control
- Permit package preparation
- AI-powered design assistance

---

## 🤖 Option B: Deploy via Vercel CLI (Fast for Multiple Apps)

### Setup (One-time)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login
```

### Deploy Each App

```bash
# Deploy os-admin
cd apps/os-admin
vercel --prod

# Deploy os-pm
cd ../os-pm
vercel --prod

# Deploy m-ops-services
cd ../m-ops-services
vercel --prod

# Deploy m-permits-inspections
cd ../m-permits-inspections
vercel --prod

# Deploy m-project-owner
cd ../m-project-owner
vercel --prod

# Deploy m-architect
cd ../m-architect
vercel --prod
```

**Note:** You'll still need to add environment variables via Vercel Dashboard for each project.

---

## ✅ Post-Deployment Checklist

For each deployed app:

### 1. **Verify Build Success**
- [ ] Go to Vercel Dashboard → Deployments
- [ ] Check build logs - should complete without errors
- [ ] Verify deployment status shows "Ready"

### 2. **Test Application**
- [ ] Visit the deployed URL
- [ ] Test login/authentication (Supabase)
- [ ] Verify API connection works (Railway)
- [ ] Check browser console for errors
- [ ] Test main features work

### 3. **Configure Settings**
- [ ] Set up custom domain (optional)
- [ ] Configure password protection for staging (optional)
- [ ] Enable preview deployments
- [ ] Set up monitoring/analytics

### 4. **Update Supabase**
- [ ] Add Vercel URL to Supabase redirect URLs
- [ ] Go to Supabase Dashboard → Authentication → URL Configuration
- [ ] Add: `https://your-app.vercel.app/**`

---

## 📊 Expected URLs After Deployment

After deploying all apps, you'll have:

| App | URL |
|-----|-----|
| os-admin | `https://kealee-admin.vercel.app` |
| os-pm | `https://kealee-pm.vercel.app` |
| m-ops-services | `https://kealee-ops-services.vercel.app` |
| m-permits-inspections | `https://kealee-permits.vercel.app` |
| m-project-owner | `https://kealee-project-owner.vercel.app` |
| m-architect | `https://kealee-architect.vercel.app` |

---

## 🐛 Common Issues & Solutions

### Build Fails: "Cannot find module @kealee/..."

**Cause:** Monorepo dependencies not installed correctly.

**Solution:** Verify build command includes:
```bash
cd ../.. && pnpm install --filter @kealee/[app-name]... && pnpm build --filter @kealee/[app-name]
```

### Build Fails: "Missing environment variables"

**Cause:** Required env vars not set in Vercel.

**Solution:**
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add all `NEXT_PUBLIC_*` variables
3. Redeploy: Deployments → Latest → Redeploy

### App loads but API calls fail

**Cause:** Incorrect Railway API URL or CORS issue.

**Solution:**
1. Verify `NEXT_PUBLIC_API_URL` points to Railway API
2. Test Railway API: `curl https://your-api.up.railway.app/health`
3. Check Railway API has CORS enabled for Vercel domains
4. Check Railway API logs for errors

### Login doesn't work

**Cause:** Supabase credentials incorrect or redirect URL not configured.

**Solution:**
1. Verify all Supabase environment variables are correct
2. Check Supabase Dashboard → Settings → API (keys match)
3. Add Vercel URL to Supabase redirect URLs:
   - Supabase → Authentication → URL Configuration
   - Add: `https://your-app.vercel.app/**`
4. Wait 1-2 minutes for Supabase to update

### Build is slow (>5 minutes)

**Cause:** Installing all monorepo dependencies.

**Solution:** This is normal for first build. Subsequent builds use cache and are faster (1-2 minutes).

---

## 🔄 Continuous Deployment

After initial setup, every push to `main` branch will:
1. Trigger automatic build for all Vercel projects
2. Deploy to production if build succeeds
3. Update all live URLs

To configure:
- Vercel Dashboard → Project Settings → Git
- Set "Production Branch" to `main`
- Enable "Automatically expose System Environment Variables"

---

## 🌐 Custom Domains (Optional)

To use your own domains:

### For Each App:

1. **Purchase Domain** (e.g., from Namecheap, GoDaddy)

2. **Configure in Vercel:**
   - Go to Vercel Dashboard → Project → Settings → Domains
   - Click "Add Domain"
   - Enter subdomain:
     - `admin.kealee.com` → os-admin
     - `pm.kealee.com` → os-pm
     - `architect.kealee.com` → m-architect
     - `permits.kealee.com` → m-permits-inspections
     - `owner.kealee.com` → m-project-owner
     - `ops.kealee.com` → m-ops-services

3. **Update DNS:**
   - Add CNAME record in your domain provider
   - Point to Vercel: `cname.vercel-dns.com`
   - Wait 5-30 minutes for propagation

4. **Update Supabase:**
   - Add custom domain to Supabase redirect URLs
   - Format: `https://admin.kealee.com/**`

---

## 📈 Monitoring & Analytics

### Enable Vercel Analytics:

1. Go to Vercel Dashboard → Project → Analytics
2. Click "Enable Analytics"
3. View metrics: page views, performance, errors

### Set Up Error Tracking:

Consider integrating:
- **Sentry** - Error monitoring
- **LogRocket** - Session replay
- **PostHog** - Product analytics

---

## 🎯 Deployment Strategy

### Recommended Order:

1. **Phase 1: Internal Tools**
   - Deploy `os-admin` first (admin dashboard)
   - Deploy `os-pm` second (PM dashboard)
   - Test thoroughly with internal team

2. **Phase 2: Customer-Facing Apps**
   - Deploy `m-ops-services` (main customer portal)
   - Deploy `m-project-owner` (project owners)
   - Enable password protection initially

3. **Phase 3: Professional Tools**
   - Deploy `m-permits-inspections` (permits hub)
   - Deploy `m-architect` (architect tools)
   - Beta test with select users

---

## 📋 Final Checklist

Before going live:

### Railway Backend:
- [ ] API deployed and healthy
- [ ] Database connected
- [ ] Environment variables set
- [ ] CORS configured for all Vercel domains
- [ ] Health checks passing

### Vercel Frontend (All Apps):
- [ ] All 6 apps deployed successfully
- [ ] Environment variables set for each
- [ ] Builds complete without errors
- [ ] Apps accessible at Vercel URLs
- [ ] Login/auth works (Supabase)
- [ ] API calls work (Railway)
- [ ] No console errors

### Supabase:
- [ ] All Vercel URLs added to redirect URLs
- [ ] Authentication enabled
- [ ] RLS policies configured
- [ ] Database tables created

### Testing:
- [ ] Test each app individually
- [ ] Test auth flow (login/logout/signup)
- [ ] Test API integration
- [ ] Test main user workflows
- [ ] Check mobile responsiveness
- [ ] Test in different browsers

---

## 🎉 Success!

Once all apps are deployed, you'll have:
- ✅ 6 live Next.js applications on Vercel
- ✅ Backend API on Railway
- ✅ Authentication via Supabase
- ✅ Automatic deployments on git push
- ✅ Professional URLs for each module

---

## 📞 Support & Next Steps

### If You Need Help:
1. Check Vercel build logs
2. Check Railway API logs
3. Verify environment variables
4. Test Supabase connection
5. Review browser console errors

### Next Steps:
1. Set up staging environments
2. Configure custom domains
3. Enable monitoring and analytics
4. Set up CI/CD pipelines
5. Implement feature flags
6. Set up backup and disaster recovery

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Railway Documentation](https://docs.railway.app)
- [pnpm Monorepo Guide](https://pnpm.io/workspaces)

---

**Ready to deploy? Start with `os-admin` and work through the list! 🚀**
