# Vercel Deployment - Quick Reference Card

## 🚀 Copy-Paste Configurations

### 1. os-admin (Platform Admin)
```
Project Name: kealee-admin
Root Directory: apps/os-admin
Build Command: cd ../.. && pnpm install --filter @kealee/os-admin... && pnpm build --filter @kealee/os-admin
Install Command: cd ../.. && pnpm install --filter @kealee/os-admin...
Output Directory: .next
Framework: Next.js
```

### 2. os-pm (Project Manager Dashboard)
```
Project Name: kealee-pm
Root Directory: apps/os-pm
Build Command: cd ../.. && pnpm install --filter @kealee/os-pm... && pnpm build --filter @kealee/os-pm
Install Command: cd ../.. && pnpm install --filter @kealee/os-pm...
Output Directory: .next
Framework: Next.js
```

### 3. m-ops-services (Operations Portal)
```
Project Name: kealee-ops-services
Root Directory: apps/m-ops-services
Build Command: cd ../.. && pnpm install --filter @kealee/m-ops-services... && pnpm build --filter @kealee/m-ops-services
Install Command: cd ../.. && pnpm install --filter @kealee/m-ops-services...
Output Directory: .next
Framework: Next.js
```

### 4. m-permits-inspections (Permits Hub)
```
Project Name: kealee-permits
Root Directory: apps/m-permits-inspections
Build Command: cd ../.. && pnpm install --filter @kealee/m-permits-inspections... && pnpm build --filter @kealee/m-permits-inspections
Install Command: cd ../.. && pnpm install --filter @kealee/m-permits-inspections...
Output Directory: .next
Framework: Next.js
```

### 5. m-project-owner (Project Owner Portal)
```
Project Name: kealee-project-owner
Root Directory: apps/m-project-owner
Build Command: cd ../.. && pnpm install --filter @kealee/m-project-owner... && pnpm build --filter @kealee/m-project-owner
Install Command: cd ../.. && pnpm install --filter @kealee/m-project-owner...
Output Directory: .next
Framework: Next.js
```

### 6. m-architect (Architect Dashboard)
```
Project Name: kealee-architect
Root Directory: apps/m-architect
Build Command: cd ../.. && pnpm install --filter @kealee/m-architect... && pnpm build --filter @kealee/m-architect
Install Command: cd ../.. && pnpm install --filter @kealee/m-architect...
Output Directory: .next
Framework: Next.js
```

---

## 🔑 Environment Variables (All Apps)

### Required for All:
```env
NEXT_PUBLIC_API_URL=https://your-api-name.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=production
```

### Additional for m-permits-inspections:
```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...
```

### Additional for m-architect:
```env
NEXT_PUBLIC_OPENAI_API_KEY=sk-...
```

---

## 📊 Expected URLs

| App | URL |
|-----|-----|
| os-admin | https://kealee-admin.vercel.app |
| os-pm | https://kealee-pm.vercel.app |
| m-ops-services | https://kealee-ops-services.vercel.app |
| m-permits-inspections | https://kealee-permits.vercel.app |
| m-project-owner | https://kealee-project-owner.vercel.app |
| m-architect | https://kealee-architect.vercel.app |

---

## ✅ Deployment Steps (Each App)

1. Go to: https://vercel.com/new
2. Import: `UseniSajor/kealee-platform-v10`
3. Copy-paste configuration from above
4. Add environment variables
5. Click "Deploy"
6. Wait 3-5 minutes
7. ✅ Done!

---

## 🎯 Quick Deploy Order

1. **os-admin** (admin dashboard) - 5 min
2. **os-pm** (PM dashboard) - 5 min
3. **m-ops-services** (customer portal) - 5 min
4. **m-permits-inspections** (permits) - 5 min
5. **m-project-owner** (project owner) - 5 min
6. **m-architect** (architect tools) - 5 min

**Total Time: ~30 minutes**
