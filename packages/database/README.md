# Database Deployment Guide

## Overview

This guide covers deploying Prisma migrations to the Railway PostgreSQL databases (staging and production).

**⚠️ IMPORTANT:** Before deploying, ensure you've set up proper environment isolation. See [RAILWAY_ENVIRONMENT_SETUP.md](../../RAILWAY_ENVIRONMENT_SETUP.md) for complete setup instructions.

---

## Prerequisites

1. **Railway Account**: Access to Railway dashboard
2. **Database URLs**: Separate `DATABASE_URL` for staging and production from Railway
3. **Prisma CLI**: Installed via `pnpm install`
4. **Schema Valid**: Prisma schema must be valid (run `npx prisma format`)
5. **Environment Isolation**: Staging and production must have separate databases (see [RAILWAY_ENVIRONMENT_SETUP.md](../../RAILWAY_ENVIRONMENT_SETUP.md))

---

## Migration Files

### Current Migrations

Located in: `packages/database/prisma/migrations/`

1. `20260115073113_add_lead_pipeline_fields` - Lead pipeline fields
2. `20260115073116_add_contractor_capacity_fields` - Contractor capacity
3. `20260115073200_migrate_pipeline_stages_to_lead` - Pipeline stages migration
4. `20260115073511_migrate_pipeline_stages_to_lead` - Pipeline stages (duplicate)
5. `20260115074000_add_project_execution_tier` - Execution tier enum
6. `20260115074723_add_project_execution_tier` - Execution tier (duplicate)
7. `configure_immutable_audit_logs.sql` - Audit logs configuration

### Migration Order

Migrations are applied in chronological order based on timestamp:
- `20260115073113` → `20260115073116` → `20260115073200` → `20260115073511` → `20260115074000` → `20260115074723`

**Note:** Some migrations appear to be duplicates. Prisma will skip already-applied migrations.

---

## Deployment Methods

### Method 1: Automated Script (Recommended)

#### Linux/Mac:
```bash
cd packages/database
export DATABASE_URL="postgresql://user:password@host:port/database"
bash deploy-production.sh
```

#### Windows:
```cmd
cd packages\database
set DATABASE_URL=postgresql://user:password@host:port/database
deploy-production.bat
```

#### Using npm script:
```bash
cd packages/database
export DATABASE_URL="postgresql://user:password@host:port/database"
npm run db:deploy:production
```

### Method 2: Manual Commands

```bash
cd packages/database

# 1. Verify schema is valid
npx prisma format --schema=./prisma/schema.prisma

# 2. Generate Prisma Client
npx prisma generate --schema=./prisma/schema.prisma

# 3. Check migration status
npx prisma migrate status --schema=./prisma/schema.prisma

# 4. Deploy migrations
npx prisma migrate deploy --schema=./prisma/schema.prisma

# 5. Verify schema matches database
npx prisma db pull --schema=./prisma/schema.prisma --force
```

---

## Railway Deployment

### ⚠️ CRITICAL: Environment Isolation

**Before deploying, verify environment isolation:**

```bash
# Run verification script
bash scripts/verify-railway-env-isolation.sh
```

**Key Requirements:**
- Staging must use `staging-postgres.internal` as hostname
- Production must use `production-postgres.internal` as hostname
- DATABASE_URL values must be **different** for each environment
- Never share the same database between staging and production

See [RAILWAY_ENVIRONMENT_SETUP.md](../../RAILWAY_ENVIRONMENT_SETUP.md) for complete setup.

### Step 1: Get Database URL

**For Staging:**
1. Log into Railway dashboard
2. Switch to **Staging** environment
3. Navigate to `staging-postgres` service
4. Go to **Variables** tab
5. Copy `DATABASE_URL` value
6. Update hostname to `staging-postgres.internal`

**For Production:**
1. Log into Railway dashboard
2. Switch to **Production** environment
3. Navigate to `production-postgres` service
4. Go to **Variables** tab
5. Copy `DATABASE_URL` value
6. Update hostname to `production-postgres.internal`

### Step 2: Set Environment Variable

**Railway (via Dashboard) - RECOMMENDED:**
- Go to your API service (`kealee-platform-v10`)
- Switch to the correct environment (staging or production)
- Go to **Variables** tab
- Add/Update `DATABASE_URL` variable
- Use the PostgreSQL service's **internal** connection string (with `.internal` hostname)

**Railway (via CLI):**
```bash
# For staging
railway variables set DATABASE_URL="postgresql://user:password@staging-postgres.internal:5432/railway" --environment staging

# For production
railway variables set DATABASE_URL="postgresql://user:password@production-postgres.internal:5432/railway" --environment production
```

**Local (for testing):**
```bash
export DATABASE_URL="postgresql://user:password@host:port/database"
```

### Step 3: Run Migrations

**For Staging (can use dev mode for testing):**
```bash
cd packages/database
export DATABASE_URL="<your-staging-database-url>"
pnpm db:migrate:dev
```

**For Production (must use deploy mode):**
```bash
cd packages/database
export DATABASE_URL="<your-production-database-url>"
pnpm db:migrate:deploy
```

**Note:** Railway automatically runs `prisma migrate deploy` during deployment (configured in `services/api/railway.json`).

### Step 4: Verify Deployment

```bash
# Check migration status
npx prisma migrate status --schema=./prisma/schema.prisma

# List tables
npx prisma db execute --stdin --schema=./prisma/schema.prisma <<< "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"

# Open Prisma Studio (optional)
npx prisma studio --schema=./prisma/schema.prisma
```

---

## Verification Checklist

After deployment, verify:

- [ ] All migrations applied successfully
- [ ] No migration errors in output
- [ ] Schema matches database (`prisma db pull` shows no differences)
- [ ] All tables exist
- [ ] All indexes created
- [ ] Foreign keys established
- [ ] Enums created correctly
- [ ] Database connection works

---

## Rollback Procedure

### If Migration Fails

1. **Check Error Message**: Identify which migration failed
2. **Review Migration SQL**: Check `prisma/migrations/<migration-name>/migration.sql`
3. **Fix Schema**: Update `schema.prisma` if needed
4. **Create New Migration**: `npx prisma migrate dev --name fix_migration`
5. **Redeploy**: Run deployment script again

### Manual Rollback (Emergency)

```sql
-- Connect to database
psql $DATABASE_URL

-- List recent migrations
SELECT * FROM "_prisma_migrations" ORDER BY finished_at DESC LIMIT 10;

-- Manually rollback (if needed)
-- WARNING: Only do this if you know what you're doing
DELETE FROM "_prisma_migrations" WHERE migration_name = '<migration-name>';
```

---

## Troubleshooting

### Error: "Migration failed to apply"

**Cause:** Migration SQL has errors or conflicts with existing data

**Solution:**
1. Check migration SQL file
2. Test migration on local database first
3. Fix schema and create new migration
4. Redeploy

### Error: "Schema is out of sync"

**Cause:** Database schema doesn't match Prisma schema

**Solution:**
```bash
# Pull current database schema
npx prisma db pull --schema=./prisma/schema.prisma

# Compare with schema.prisma
# Fix differences
# Create new migration
npx prisma migrate dev --name sync_schema
```

### Error: "DATABASE_URL not set"

**Cause:** Environment variable missing

**Solution:**
```bash
# Set environment variable
export DATABASE_URL="postgresql://user:password@host:port/database"

# Or use .env file
echo "DATABASE_URL=postgresql://user:password@host:port/database" > .env
```

### Error: "Connection refused"

**Cause:** Database not accessible or wrong URL

**Solution:**
1. Verify DATABASE_URL is correct
2. Check Railway PostgreSQL service is running
3. Verify network access (Railway internal vs external)
4. Check firewall rules

### Error: "Migration already applied"

**Cause:** Migration was already run

**Solution:** This is normal - Prisma will skip already-applied migrations

---

## Testing Database

After deployment, test critical functionality:

```bash
# Test connection
npx prisma db execute --stdin --schema=./prisma/schema.prisma <<< "SELECT 1;"

# Test table creation
npx prisma db execute --stdin --schema=./prisma/schema.prisma <<< "SELECT COUNT(*) FROM \"User\";"

# Test foreign keys
npx prisma db execute --stdin --schema=./prisma/schema.prisma <<< "SELECT COUNT(*) FROM \"OrgMember\";"

# Test indexes
npx prisma db execute --stdin --schema=./prisma/schema.prisma <<< "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' LIMIT 10;"
```

---

## Post-Deployment

### 1. Run Seed Script

```bash
cd packages/database
export DATABASE_URL="<production-database-url>"
npm run db:seed
```

### 2. Verify Seed Data

```bash
# Check admin user created
npx prisma db execute --stdin --schema=./prisma/schema.prisma <<< "SELECT email FROM \"User\" WHERE email = 'admin@kealee.com';"

# Check roles created
npx prisma db execute --stdin --schema=./prisma/schema.prisma <<< "SELECT key FROM \"Role\";"

# Check service plans created
npx prisma db execute --stdin --schema=./prisma/schema.prisma <<< "SELECT name FROM \"ServicePlan\";"
```

### 3. Test Application

- Test user registration
- Test login
- Test API endpoints
- Test database queries

---

## Best Practices

1. **Always Backup**: Create database backup before migrations
2. **Test Locally**: Test migrations on local database first
3. **Review SQL**: Review migration SQL files before deploying
4. **Deploy During Low Traffic**: Schedule deployments during low-traffic periods
5. **Monitor**: Watch for errors during deployment
6. **Verify**: Always verify deployment succeeded
7. **Document**: Document any manual changes made

---

## Railway-Specific Notes

### Internal vs External Connection

Railway provides two connection strings:
- **Internal**: Use within Railway services (faster, no SSL) - Use `.internal` hostname
- **External**: Use from outside Railway (requires SSL)

**Always use internal connection strings** for Railway service-to-service communication:
- Staging: `staging-postgres.internal`
- Production: `production-postgres.internal`

### Environment Variables

Railway automatically sets `DATABASE_URL` for services connected to PostgreSQL, but you should:
1. **Verify** it uses the correct `.internal` hostname
2. **Ensure** staging and production have different values
3. **Update** if it uses public hostname instead of `.internal`

### Automated Deployments

Railway automatically runs migrations during deployment. The `services/api/railway.json` is configured with:

```json
{
  "deploy": {
    "startCommand": "cd packages/database && pnpm db:migrate:deploy && cd ../.. && pnpm start"
  }
}
```

This ensures:
- ✅ Migrations run before the service starts
- ✅ Uses `prisma migrate deploy` (safe for production)
- ✅ Fails fast if migrations fail

---

## Support

If you encounter issues:

1. Check Railway logs: `railway logs`
2. Check Prisma migration status: `npx prisma migrate status`
3. Review migration SQL files
4. Check database connection
5. Verify environment variables

---

**Last Updated:** January 19, 2025  
**Version:** 1.0.0
