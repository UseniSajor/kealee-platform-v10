# 🗄️ Railway Staging Database Setup Guide

**Goal:** Create separate staging database for safe testing  
**Time Required:** 15-20 minutes  
**Cost:** Free (Supabase allows 2 free projects)

---

## 🎯 **WHY SEPARATE DATABASE?**

### **Shared Database (Current):**
```
┌─────────────────────────────────────┐
│  Production API                     │
│         ↓                           │
│  ┌──────────────────────┐          │
│  │  Supabase Database   │          │
│  │  (Shared)            │          │
│  └──────────────────────┘          │
│         ↑                           │
│  Staging API                        │
└─────────────────────────────────────┘
⚠️ Risk: Staging can corrupt production data!
```

### **Separate Database (Recommended):**
```
┌─────────────────────────────────────┐
│  Production API                     │
│         ↓                           │
│  ┌──────────────────────┐          │
│  │  Production Database │          │
│  └──────────────────────┘          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Staging API                        │
│         ↓                           │
│  ┌──────────────────────┐          │
│  │  Staging Database    │          │
│  │  (Test data)         │          │
│  └──────────────────────┘          │
└─────────────────────────────────────┘
✅ Safe: Complete isolation!
```

---

## 📋 **OPTION 1: CREATE SEPARATE SUPABASE PROJECT**

### **Step 1: Create New Supabase Project**

1. Go to: https://app.supabase.com
2. Click **"New Project"**
3. Fill in details:
   ```
   Name: kealee-platform-staging
   Database Password: [generate strong password]
   Region: Same as production (for consistency)
   Pricing Plan: Free
   ```
4. Click **"Create new project"**
5. ⏳ Wait 2-3 minutes for provisioning

---

### **Step 2: Get Staging Database Credentials**

1. Once project is ready, click **"Settings"** (gear icon)
2. Go to **"Database"** section
3. Find **"Connection string"** → **"URI"**
4. Copy the connection string:
   ```
   postgresql://postgres:[PASSWORD]@db.staging-project-id.supabase.co:6543/postgres
   ```
5. Replace `[PASSWORD]` with your staging database password

---

### **Step 3: Run Migrations on Staging Database**

**Important:** Apply same schema as production!

```bash
# In your project root
cd "c:\Kealee-Platform v10"

# Set staging database URL temporarily
$env:DATABASE_URL="postgresql://postgres:[PASSWORD]@db.staging-project.supabase.co:6543/postgres"

# Run Prisma migrations
cd packages/database
pnpm db:push

# Or if using migration files
pnpm db:migrate
```

**Verify migrations:**
1. Go to Supabase staging project
2. Click **"Table Editor"**
3. Verify all tables exist (User, Organization, etc.)

---

### **Step 4: Seed Test Data (Optional)**

Create test data for staging:

```bash
# Create seed script: packages/database/scripts/seed-staging.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create test organization
  const org = await prisma.organization.create({
    data: {
      name: 'Test Organization',
      slug: 'test-org',
      type: 'CONTRACTOR'
    }
  })
  
  // Create test user
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      fullName: 'Test User',
      supabaseUserId: 'test-user-id'
    }
  })
  
  console.log('✅ Staging database seeded!')
}

main()
```

**Run seed:**
```bash
# With staging DATABASE_URL set
pnpm tsx packages/database/scripts/seed-staging.ts
```

---

### **Step 5: Update Railway Staging Variables**

1. Go to Railway Dashboard: https://railway.app/dashboard
2. Click your project → **`api-staging`** service
3. Click **"Variables"** tab
4. Update these variables:

```env
# Old (shared database)
DATABASE_URL=postgresql://postgres:password@db.production.supabase.co:6543/postgres

# New (separate staging database)
DATABASE_URL=postgresql://postgres:staging_password@db.staging-project.supabase.co:6543/postgres

# Also update Supabase variables
SUPABASE_URL=https://staging-project-id.supabase.co
SUPABASE_ANON_KEY=eyJ...  # Get from staging project
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Get from staging project
```

5. Click **"Add"** to save
6. Railway will **auto-redeploy** with new database

---

### **Step 6: Test Staging with New Database**

```bash
# Health check
curl https://api-staging-production-xxxx.up.railway.app/health

# Should return:
{"status":"ok","timestamp":1737241234567}
```

**Test database connection:**
1. Open Vercel preview app
2. Try to login/signup
3. Check Railway staging logs for database queries
4. Verify data appears in Supabase staging project

---

## 📋 **OPTION 2: CREATE RAILWAY POSTGRES DATABASE**

**Alternative:** Use Railway's built-in PostgreSQL

### **Step 1: Create Railway Postgres Service**

1. Railway Dashboard → Your Project
2. Click **"+ New"** → **"Database"** → **"PostgreSQL"**
3. Name it: **`postgres-staging`**
4. Railway provisions database (2-3 min)

---

### **Step 2: Get Connection Details**

1. Click **`postgres-staging`** service
2. Go to **"Variables"** tab
3. Railway auto-creates these variables:
   ```
   DATABASE_URL
   PGHOST
   PGPORT
   PGUSER
   PGPASSWORD
   PGDATABASE
   ```
4. Copy the **`DATABASE_URL`**

---

### **Step 3: Reference from Staging API**

1. Click **`api-staging`** service
2. **"Variables"** tab
3. Click **"+ New Variable"** → **"Reference"**
4. Select: `postgres-staging.DATABASE_URL`
5. This creates a reference (auto-updates if DB changes)

---

### **Step 4: Run Migrations**

Same as Supabase option above - use the Railway DATABASE_URL.

---

## 🔄 **KEEPING DATABASES IN SYNC**

### **Problem:** Staging and production schemas drift apart

**Solution:** Migration workflow

### **Workflow:**

```bash
# 1. Develop locally
cd packages/database
# Edit schema.prisma

# 2. Create migration
pnpm db:migrate:dev
# Creates migration file

# 3. Test on staging first
# Deploy to staging → Railway runs migrations

# 4. Verify in staging
# Test thoroughly with staging database

# 5. Deploy to production
# Merge to main → Railway runs same migrations on production
```

---

### **Automated Migration Script:**

```bash
# scripts/migrate-databases.sh

#!/bin/bash
echo "🔄 Migrating databases..."

# Staging
echo "📦 Migrating staging database..."
DATABASE_URL=$STAGING_DATABASE_URL pnpm db:migrate

# Production (run carefully!)
echo "🚀 Migrating production database..."
DATABASE_URL=$PRODUCTION_DATABASE_URL pnpm db:migrate

echo "✅ All databases migrated!"
```

---

## 💰 **COST COMPARISON**

### **Supabase:**

| Option | Projects | Cost |
|--------|----------|------|
| Shared Database | 1 | Free |
| Separate Databases | 2 | Free (both on free tier) |

**Limits per free project:**
- 500 MB database
- 50,000 monthly active users
- 2 GB file storage

---

### **Railway PostgreSQL:**

| Option | Cost |
|--------|------|
| No Railway DB | $0 (use Supabase) |
| Add Railway Postgres | ~$5-10/month (usage-based) |

**Note:** Railway charges for actual usage, no free tier for databases.

---

## 🎯 **RECOMMENDED SETUP**

### **For Your Current Stage:**

```yaml
Production:
  Database: Supabase Project 1 (existing)
  Cost: Free

Staging:
  Option A: Same Supabase (Phase 1)
  Option B: Separate Supabase Project (Phase 2)
  Cost: Free

Recommendation: Start with shared, move to separate before launch
```

---

## 🧪 **TESTING STRATEGY**

### **With Shared Database:**

```bash
✅ DO:
- Read operations (safe)
- Test UI flows
- Verify API responses
- Test authentication

❌ DON'T:
- Delete production data
- Test payment processing (use Stripe test mode)
- Mass data operations
- Schema migrations
```

---

### **With Separate Database:**

```bash
✅ DO:
- Everything! Completely isolated
- Test destructive operations
- Test migrations
- Load testing
- Delete/modify data freely
```

---

## 🔧 **TROUBLESHOOTING**

### **Issue: Staging can't connect to database**

**Check:**
1. DATABASE_URL is set correctly in Railway
2. Password doesn't have special characters (URL encode if needed)
3. Firewall/whitelist (Supabase allows all by default)
4. Railway logs show connection error details

---

### **Issue: Migrations fail on staging**

**Check:**
1. Schema.prisma is up to date
2. Prisma client is generated: `pnpm db:generate`
3. Migration files exist in `packages/database/prisma/migrations/`
4. Database user has permission to create tables

---

### **Issue: Different data between environments**

**This is expected with separate databases!**

**Solution:**
- Seed staging with test data
- Or periodically sync: dump production → restore to staging (careful!)

---

## ✅ **SETUP CHECKLIST**

### **Phase 1: Shared Database (Quick Start)**
- [ ] Use same DATABASE_URL for both environments
- [ ] Test carefully (no destructive operations)
- [ ] Document which database is being used

### **Phase 2: Separate Database (Production Ready)**
- [ ] Create new Supabase project OR Railway Postgres
- [ ] Get new DATABASE_URL
- [ ] Run migrations on new database
- [ ] Seed test data
- [ ] Update Railway staging variables
- [ ] Test connection
- [ ] Update documentation

---

## 📚 **ENVIRONMENT VARIABLES SUMMARY**

### **Current Setup (Shared):**

```env
# Production (api)
DATABASE_URL=postgresql://postgres:password@db.prod.supabase.co:6543/postgres

# Staging (api-staging)
DATABASE_URL=postgresql://postgres:password@db.prod.supabase.co:6543/postgres  # SAME!
```

---

### **Recommended Setup (Separate):**

```env
# Production (api)
DATABASE_URL=postgresql://postgres:prod_pass@db.prod-id.supabase.co:6543/postgres
SUPABASE_URL=https://prod-id.supabase.co
SUPABASE_ANON_KEY=eyJ_prod_key...

# Staging (api-staging)
DATABASE_URL=postgresql://postgres:staging_pass@db.staging-id.supabase.co:6543/postgres
SUPABASE_URL=https://staging-id.supabase.co
SUPABASE_ANON_KEY=eyJ_staging_key...
```

---

## 🎓 **BEST PRACTICES**

1. **Start simple** - Use shared database initially
2. **Move to separate** - Before production launch
3. **Keep schemas in sync** - Use migration files
4. **Seed staging** - With realistic test data
5. **Document clearly** - Which database each environment uses
6. **Never test payments in production** - Always use test mode
7. **Backup regularly** - Especially before migrations

---

## 🆘 **QUICK DECISION GUIDE**

**Use Shared Database if:**
- ✅ Just getting started
- ✅ Low-risk testing only
- ✅ Tight timeline
- ✅ Small team

**Use Separate Database if:**
- ✅ Going to production
- ✅ Testing migrations
- ✅ Need to test destructive operations
- ✅ Compliance/security requirements
- ✅ Multiple developers

---

## 🚀 **NEXT STEPS**

### **Right Now (Phase 1):**

```bash
# Use shared database
# Set same DATABASE_URL for staging as production
# Get staging working quickly
```

### **Before Production Launch (Phase 2):**

```bash
1. Create separate Supabase project
2. Run migrations
3. Seed test data
4. Update Railway staging variables
5. Test thoroughly
6. Document the setup
```

---

**Your staging API MUST have a database connection to function properly!** 🗄️

**Choose the approach that fits your current needs, but plan to separate before launch.** 🎯
