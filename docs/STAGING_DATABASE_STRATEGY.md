# Staging Database Strategy

**Purpose:** Separate staging database from production for safe testing of migrations and schema changes.

---

## Current State

**Problem:** All migrations are tested against production schema.
- ❌ No staging environment separate from production
- ❌ All dev testing happens against production data
- ❌ Schema changes are risky without rollback plan
- ❌ Data backups are not tested

**Impact:**
- Migrations failing in production can cause downtime
- Data loss risk if rollback fails
- Slow queries affect all users, not just staging

---

## Proposed Solution: Supabase Staging Project

### Step 1: Create Staging Database Project in Supabase

**Timeline:** 30 minutes

1. Go to [supabase.com](https://supabase.com) → Dashboard
2. Click **"New Project"**
   - **Name:** `kealee-staging`
   - **Database password:** Generate (save to secure storage)
   - **Region:** Same as production (for consistency)
   - **Organization:** Same as production org
3. Wait for database to initialize (~5 minutes)
4. Copy **Connection String**:
   - Go to **Settings → Database → Connection Pooling**
   - Copy `postgresql://...` string

### Step 2: Wire Staging Database to Railway Staging Environment

**Timeline:** 15 minutes

1. In Railway dashboard, create new **Environment**: `staging`
2. In `staging` environment, set:
   ```bash
   NODE_ENV=staging
   APP_ENV=staging
   DATABASE_URL=postgresql://...@staging-db.supabase.co:...  # Staging connection
   REDIS_URL=redis://...staging...  # Staging Redis (if separate)
   ```
3. Deploy services to staging:
   ```bash
   railway up --environment staging
   ```

### Step 3: Seed Staging Database

**Timeline:** 1-2 hours depending on data size

Two approaches:

#### Option A: Production Snapshot (Recommended for realistic testing)

```bash
# 1. Backup production database
pg_dump \
  postgresql://user:pass@prod.supabase.co:5432/postgres \
  --format=custom > kealee-prod-$(date +%Y%m%d).dump

# 2. Restore to staging
pg_restore \
  --host=staging.supabase.co \
  --username=postgres \
  --dbname=postgres \
  kealee-prod-20260607.dump

# 3. Clean sensitive data (optional)
# Remove: auth tokens, API keys, credit card data
psql postgresql://...@staging.supabase.co:5432/postgres << EOF
DELETE FROM auth.identities WHERE provider = 'stripe';
UPDATE users SET encrypted_password = NULL;
TRUNCATE stripe_webhooks CASCADE;
EOF
```

#### Option B: Minimal Seed Data (Faster for testing)

```bash
# Create minimal test data for migrations
psql postgresql://...@staging.supabase.co:5432/postgres << EOF
-- Insert test org
INSERT INTO orgs (id, name) VALUES ('org-test-123', 'Staging Test Org');

-- Insert test users
INSERT INTO users (id, org_id, email) VALUES 
  ('user-test-1', 'org-test-123', 'test@staging.kealee.com');

-- Insert test projects
INSERT INTO projects (id, org_id, address, city, state) VALUES 
  ('proj-test-1', 'org-test-123', '123 Main St', 'DC', 'MD');
EOF
```

### Step 4: Test Migrations in Staging First

**Timeline:** 10 minutes per migration

Before deploying to production:

```bash
# 1. Pull latest code
git pull origin main

# 2. Connect to staging database
export DATABASE_URL=postgresql://...@staging.supabase.co:...

# 3. Run migration
cd packages/database
npx prisma migrate deploy

# 4. Verify migration success
npx prisma db push --skip-generate
echo "SELECT * FROM _prisma_migrations;" | psql $DATABASE_URL

# 5. Test agentic framework in staging
# Create test bot job in staging API
curl -X POST https://staging-api.railway.internal:3000/api/bots/chain \
  -H "Content-Type: application/json" \
  -d '{...test payload...}'

# 6. If success: proceed to production
# If failure: fix schema, revert migration, retry
```

---

## Database Isolation Strategy

### Connection Strings by Environment

```
Development (local):
  DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres
  → Your local Docker Postgres

Staging (Railway):
  DATABASE_URL=postgresql://user:pass@staging.supabase.co:5432/postgres
  → Supabase staging project
  Node: staging-api.railway.internal:3001

Production (Railway):
  DATABASE_URL=postgresql://user:pass@prod.supabase.co:5432/postgres
  → Supabase production project
  Node: api.railway.internal:3001
```

### Environment Validation

Add to `services/api/src/index.ts`:

```typescript
function validateDatabaseEnvironment() {
  const dbUrl = process.env.DATABASE_URL || '';
  const appEnv = process.env.APP_ENV || 'unknown';

  // Prevent production code from connecting to staging database
  if (appEnv === 'production' && dbUrl.includes('staging')) {
    throw new Error('❌ FATAL: Production app cannot connect to staging database');
  }

  // Prevent staging code from connecting to production database
  if ((appEnv === 'staging' || appEnv === 'development') && dbUrl.includes('@prod')) {
    throw new Error('❌ FATAL: Staging/dev app cannot connect to production database');
  }

  console.log(`✅ Database environment validated: ${appEnv} → ${dbUrl.split('@')[1].split(':')[0]}`);
}

validateDatabaseEnvironment(); // Call at startup
```

---

## Backup & Disaster Recovery

### Automated Backups

**Supabase:** Enabled by default
- Daily backups (up to 7 days retention)
- Point-in-time recovery available on paid plans

**Manual Backup Before Major Changes:**

```bash
# Before deploying agentic framework migration
pg_dump \
  postgresql://user:pass@prod.supabase.co:5432/postgres \
  --format=custom > backups/kealee-prod-preagenticbot-$(date +%Y%m%d).dump
```

### Restore from Backup (if migration fails)

```bash
# 1. Stop production API + Worker
railway down --environment production

# 2. Restore backup
pg_restore \
  --host=prod.supabase.co \
  --username=postgres \
  --dbname=postgres \
  --clean \
  backups/kealee-prod-preagenticbot-20260607.dump

# 3. Restart services
railway up --environment production

# 4. Verify health
curl https://api.kealee.com/health
```

---

## Testing Agentic Framework Migration

### Pre-Migration Checklist

- [ ] Staging database backed up
- [ ] Latest code pulled: `git pull origin main`
- [ ] Schema changes reviewed: `git diff packages/database/prisma/schema.prisma`
- [ ] No conflicting migrations in flight
- [ ] Production backups recent

### Migration Test Procedure

```bash
# 1. In local development, test migration
export DATABASE_URL=postgresql://localhost:5432/postgres
cd packages/database
npx prisma migrate dev --name test-agentic-persistence

# 2. Verify schema in dev
npx prisma db push --skip-generate
npx prisma generate

# 3. Test agentic code can query new models
cd ../..
pnpm --filter @kealee/api build

# 4. Smoke test: create a design bot job in dev
# (curl to local API + check database)

# 5. If successful, deploy to staging
export DATABASE_URL=postgresql://...@staging.supabase.co:...
cd packages/database
npx prisma migrate deploy

# 6. Verify migrations in staging database
echo "SELECT * FROM _prisma_migrations WHERE name LIKE '%agentic%';" | psql $DATABASE_URL

# 7. Test agentic bot in staging API
curl https://staging-api.railway.internal/api/agentic-bots/health

# 8. If all green: proceed to production
# See PRODUCTION_ACTIVATION_PLAN.md Phase 0
```

---

## Monitoring Staging

### Health Check

```bash
curl https://staging-api.railway.internal/health
# Expected: 200 OK
```

### Database Size

```bash
# Monitor staging database size
psql postgresql://...@staging.supabase.co:5432/postgres \
  -c "SELECT pg_size_pretty(pg_database_size('postgres'));"
# Should be similar to production for realistic testing
```

### Query Performance

```bash
# Check slow query log in staging
psql postgresql://...@staging.supabase.co:5432/postgres << EOF
SELECT query, mean_exec_time, calls FROM pg_stat_statements 
WHERE mean_exec_time > 100 
ORDER BY mean_exec_time DESC LIMIT 10;
EOF
```

---

## Cost Impact

| Resource | Monthly Cost |
|----------|--------------|
| Supabase Staging Project | $10 (dedicated postgres) |
| Railway Staging Environment | $50-100 (API + Worker) |
| Redis (Staging) | $10-20 |
| **Total Staging Cost** | **~$70-130/month** |
| **Total Production + Staging** | **~$970-2,930/month** |

---

## Implementation Checklist

### Immediate (This Sprint)
- [ ] Create Supabase staging project
- [ ] Set up Railway staging environment
- [ ] Seed staging database with production snapshot
- [ ] Test migrations in staging first
- [ ] Document validation guards (prod ≠ staging)

### Before Agentic Deployment
- [ ] Run agentic migration in staging
- [ ] Test agentic bots in staging API
- [ ] Verify health checks working
- [ ] Backup production database
- [ ] Create rollback plan

### Ongoing
- [ ] Weekly: Refresh staging data from production
- [ ] Daily: Monitor staging database size
- [ ] Monthly: Review slow queries in staging
- [ ] Quarterly: Test full restore from backup

---

## Summary

With staging database:
- ✅ Safe migration testing before production
- ✅ Realistic data for performance testing
- ✅ Ability to test rollback procedures
- ✅ Separate issue debugging (prod vs. staging)
- ✅ Team can iterate without affecting users

**Next step:** Create staging project in Supabase, then follow "Testing Agentic Framework Migration" above before Phase 0 deployment.

