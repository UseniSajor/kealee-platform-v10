# 🗄️ Database Migration Deployment Guide

## Overview
Safe database migration strategy for Kealee Platform across all environments.

---

## 🎯 Migration Strategy

### Development
```bash
prisma migrate dev
```
- Creates migration files
- Applies to local database
- Regenerates Prisma Client

### Staging/Production
```bash
prisma migrate deploy
```
- Applies pending migrations only
- No migration file creation
- Safe for CI/CD

---

## 📋 Migration Workflow

### Step 1: Create Migration (Development)

```bash
# Navigate to database package
cd packages/database

# Create new migration
pnpm db:migrate:dev --name add_escrow_system

# This will:
# 1. Generate SQL migration file
# 2. Apply to local database
# 3. Regenerate Prisma Client
```

**Migration file created:**
```
prisma/migrations/20260122000000_add_escrow_system/
  └── migration.sql
```

### Step 2: Review Migration

```bash
# View the generated SQL
cat prisma/migrations/20260122000000_add_escrow_system/migration.sql
```

**Example migration.sql:**
```sql
-- CreateTable
CREATE TABLE "EscrowAgreement" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "escrowAccountNumber" TEXT NOT NULL,
    "totalContractAmount" DECIMAL(10,2) NOT NULL,
    "currentBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING_DEPOSIT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "EscrowAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EscrowAgreement_contractId_key" ON "EscrowAgreement"("contractId");

-- AddForeignKey
ALTER TABLE "EscrowAgreement" ADD CONSTRAINT "EscrowAgreement_contractId_fkey" 
  FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

### Step 3: Test Migration

```bash
# Reset database and reapply all migrations
pnpm db:migrate:reset

# Verify schema
pnpm db:studio

# Run tests
pnpm test
```

### Step 4: Commit Migration

```bash
# Add migration files
git add prisma/migrations/

# Commit with descriptive message
git commit -m "feat(db): Add escrow management system schema"

# Push to repository
git push origin main
```

---

## 🚂 Railway Deployment

### Automatic Migration (Recommended)

**Railway automatically runs migrations using Release Command:**

1. **Check railway.json:**
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm --filter @kealee/database db:generate && pnpm --filter @kealee/api build"
  },
  "deploy": {
    "releaseCommand": "pnpm --filter @kealee/database db:migrate:deploy",
    "startCommand": "node services/api/dist/index.js"
  }
}
```

2. **Deploy triggers migration:**
```bash
git push origin main
# Railway automatically:
# 1. Builds API
# 2. Runs release command (migrations)
# 3. Starts API service
```

3. **Check migration logs:**
```bash
railway logs -s api-staging --filter "migrate"

# Look for:
✓ Prisma Migrate applied 1 migration:
  ✓ 20260122000000_add_escrow_system
```

### Manual Migration (If Needed)

**If automatic migration fails:**

```bash
# Connect to Railway
railway login
railway link

# Run migration manually
railway run pnpm --filter @kealee/database db:migrate:deploy

# Or connect directly to database
railway connect Postgres
# Then run migrations locally against Railway database
```

---

## 🔒 Safe Migration Practices

### 1. Backward Compatible Migrations

**✅ SAFE Operations:**
- Adding new tables
- Adding nullable columns
- Adding indexes
- Creating new relationships (if nullable)

```sql
-- ✅ Safe: Adding nullable column
ALTER TABLE "User" ADD COLUMN "phoneNumber" TEXT;

-- ✅ Safe: Adding new table
CREATE TABLE "AuditLog" (...);

-- ✅ Safe: Adding index
CREATE INDEX "User_email_idx" ON "User"("email");
```

**❌ DANGEROUS Operations:**
- Dropping tables/columns
- Renaming columns
- Changing column types
- Adding NOT NULL columns without defaults
- Breaking foreign keys

```sql
-- ❌ Dangerous: Dropping column
ALTER TABLE "User" DROP COLUMN "oldField";

-- ❌ Dangerous: Changing type
ALTER TABLE "User" ALTER COLUMN "age" TYPE INTEGER;

-- ❌ Dangerous: Adding NOT NULL without default
ALTER TABLE "User" ADD COLUMN "required" TEXT NOT NULL;
```

### 2. Multi-Step Migrations

**For breaking changes, use multiple deployments:**

**Step 1 (Deploy 1): Add new column**
```sql
ALTER TABLE "User" ADD COLUMN "fullName" TEXT;
```

**Step 2 (Deploy 2): Backfill data**
```sql
UPDATE "User" SET "fullName" = CONCAT("firstName", ' ', "lastName");
```

**Step 3 (Deploy 3): Make NOT NULL**
```sql
ALTER TABLE "User" ALTER COLUMN "fullName" SET NOT NULL;
```

**Step 4 (Deploy 4): Drop old columns**
```sql
ALTER TABLE "User" DROP COLUMN "firstName";
ALTER TABLE "User" DROP COLUMN "lastName";
```

### 3. Test on Staging First

```bash
# 1. Deploy to staging
git push origin main
# Railway deploys to staging

# 2. Verify migration worked
railway logs -s api-staging

# 3. Test application
curl https://api-staging.kealee.com/health

# 4. If successful, deploy to production
git checkout release
git merge main
git push origin release
```

---

## 📊 Migration Status

### Check Pending Migrations

```bash
# Local
cd packages/database
pnpm db:migrate:status

# Railway
railway run pnpm --filter @kealee/database db:migrate:status
```

**Output:**
```
Database schema is up to date!

Migrations:
✓ 20260101000000_initial_schema
✓ 20260115000000_add_escrow_system
✓ 20260122000000_add_compliance_tracking
```

### View Migration History

```sql
-- Connect to database
psql $DATABASE_URL

-- Query migrations table
SELECT * FROM "_prisma_migrations" ORDER BY "finished_at" DESC;

-- Output:
┌──────────────────────────────────────┬────────────────────┬──────────────┐
│ migration_name                       │ finished_at        │ success      │
├──────────────────────────────────────┼────────────────────┼──────────────┤
│ 20260122000000_add_escrow_system     │ 2026-01-22 10:30   │ true         │
│ 20260115000000_initial_schema        │ 2026-01-15 14:20   │ true         │
└──────────────────────────────────────┴────────────────────┴──────────────┘
```

---

## 🔄 Rollback Strategy

### Option 1: Revert Migration File (Before Deploy)

```bash
# Delete migration file
rm -rf prisma/migrations/20260122000000_bad_migration/

# Reset local database
pnpm db:migrate:reset

# Create new correct migration
pnpm db:migrate:dev --name corrected_migration
```

### Option 2: Create Rollback Migration (After Deploy)

```bash
# Create migration to undo changes
pnpm db:migrate:dev --name rollback_bad_changes

# Write SQL to reverse changes
```

**Example rollback migration:**
```sql
-- Rollback: Remove escrow system
DROP TABLE "EscrowTransaction";
DROP TABLE "EscrowHold";
DROP TABLE "EscrowAgreement";
```

### Option 3: Restore from Backup

```bash
# Railway automatically backs up database
# Restore from backup in Railway dashboard:
# 1. Go to Postgres service
# 2. Click "Backups" tab
# 3. Find backup before bad migration
# 4. Click "Restore"
```

---

## 🐛 Troubleshooting

### Error: "Migration failed to apply"

**Check 1: View error details**
```bash
railway logs -s api-staging --filter "error"
```

**Check 2: Verify database connection**
```bash
railway run psql $DATABASE_URL -c "SELECT version();"
```

**Check 3: Check for conflicting changes**
```bash
# See if database schema differs from migrations
pnpm db:migrate:status
```

**Solution:**
```bash
# If schema is out of sync, mark migrations as applied
railway run pnpm --filter @kealee/database db:migrate:resolve --applied "20260122000000_migration_name"
```

### Error: "Migration already applied"

**This usually means:**
- Migration was partially applied
- Database state is inconsistent

**Solution:**
```bash
# Mark as rolled back, then reapply
railway run pnpm --filter @kealee/database db:migrate:resolve --rolled-back "20260122000000_migration_name"
railway run pnpm --filter @kealee/database db:migrate:deploy
```

### Error: "Foreign key constraint fails"

**Cause:** Data exists that violates new constraint

**Solution: Add migration with data cleanup**
```sql
-- First, fix existing data
UPDATE "Table" SET "foreignKey" = NULL WHERE "foreignKey" NOT IN (SELECT "id" FROM "RelatedTable");

-- Then add constraint
ALTER TABLE "Table" ADD CONSTRAINT "fk_name" FOREIGN KEY ("foreignKey") REFERENCES "RelatedTable"("id");
```

---

## 📋 Pre-Deployment Checklist

Before running migrations in production:

- [ ] Migrations tested in development
- [ ] Migrations applied to staging successfully
- [ ] Staging environment tested (UAT passed)
- [ ] Database backup created (Railway automatic)
- [ ] Rollback plan documented
- [ ] Team notified of deployment
- [ ] Maintenance window scheduled (if needed)
- [ ] Monitoring dashboard ready

---

## 🚀 Deployment Commands

### Staging Deployment

```bash
# 1. Push to main branch
git push origin main

# 2. Railway auto-deploys
# Watch logs: https://railway.app

# 3. Verify migration
railway logs -s api-staging --filter "migrate"

# 4. Check health
curl https://api-staging.kealee.com/health
```

### Production Deployment

```bash
# 1. Merge main → release
git checkout release
git merge main

# 2. Push to production
git push origin release

# 3. Railway auto-deploys to production
# Watch logs: https://railway.app

# 4. Verify migration
railway logs -s api-production --filter "migrate"

# 5. Check health
curl https://api.kealee.com/health

# 6. Monitor for 1 hour
railway logs -s api-production --tail
```

---

## 📊 Migration Scripts

### Create package.json scripts

**Add to `packages/database/package.json`:**

```json
{
  "scripts": {
    "db:generate": "prisma generate --schema=./prisma/schema.prisma",
    "db:migrate:dev": "prisma migrate dev --schema=./prisma/schema.prisma",
    "db:migrate:deploy": "prisma migrate deploy --schema=./prisma/schema.prisma",
    "db:migrate:status": "prisma migrate status --schema=./prisma/schema.prisma",
    "db:migrate:reset": "prisma migrate reset --schema=./prisma/schema.prisma --force",
    "db:push": "prisma db push --schema=./prisma/schema.prisma",
    "db:studio": "prisma studio --schema=./prisma/schema.prisma",
    "db:seed": "ts-node prisma/seed.ts"
  }
}
```

### Create migration helper script

**Create `scripts/migrate.sh`:**

```bash
#!/bin/bash

# Kealee Platform - Database Migration Helper

set -e

ENVIRONMENT=${1:-staging}

echo "🗄️  Deploying migrations to $ENVIRONMENT..."

if [ "$ENVIRONMENT" = "production" ]; then
  echo "⚠️  WARNING: Deploying to PRODUCTION!"
  read -p "Are you sure? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    echo "Migration cancelled."
    exit 1
  fi
fi

# Run migration
railway run --service api-$ENVIRONMENT \
  pnpm --filter @kealee/database db:migrate:deploy

echo "✅ Migration complete!"
echo "📊 Checking status..."

# Check status
railway run --service api-$ENVIRONMENT \
  pnpm --filter @kealee/database db:migrate:status

echo "🎉 Done!"
```

**Make executable:**
```bash
chmod +x scripts/migrate.sh
```

**Usage:**
```bash
# Deploy to staging
./scripts/migrate.sh staging

# Deploy to production
./scripts/migrate.sh production
```

---

## 📚 Additional Resources

- **Prisma Migrate Docs:** https://www.prisma.io/docs/concepts/components/prisma-migrate
- **Railway Deploy Docs:** https://docs.railway.app/deploy/deployments
- **Database Best Practices:** https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate

---

**Next Step:** Run UAT tests (see `UAT_TESTING_GUIDE.md`)
