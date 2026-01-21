# Database Schema Migration Status

## 🔍 How to Check Migration Status

### Quick Check

```bash
# From root directory
cd packages/database
pnpm prisma migrate status
```

Or use the script:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-db-migration-status.ps1
```

### What to Look For

**✅ All Applied:**
```
Database schema is up to date!
All migrations have been applied.
```

**⚠️ Pending Migrations:**
```
The following migrations have not yet been applied:
- 20260115073113_add_lead_pipeline_fields
- 20260115073116_add_contractor_capacity_fields
```

**❌ Schema Out of Sync:**
```
Database schema is not in sync with the Prisma schema.
```

---

## 📋 Current Migrations

Based on migration files found:

1. ✅ `20260115073113_add_lead_pipeline_fields`
2. ✅ `20260115073116_add_contractor_capacity_fields`
3. ✅ `20260115073200_migrate_pipeline_stages_to_lead`
4. ✅ `20260115073511_migrate_pipeline_stages_to_lead`
5. ✅ `20260115074000_add_project_execution_tier`
6. ✅ `20260115074723_add_project_execution_tier`

---

## 🚀 Apply Pending Migrations

### Development Database

```bash
# From root
pnpm db:migrate

# Or from database package
cd packages/database
pnpm prisma migrate dev
```

### Production Database (Railway)

```bash
# From root
cd packages/database
pnpm prisma migrate deploy

# Or use the script
pnpm db:migrate:deploy
```

### Push Schema (Quick Sync - Dev Only)

```bash
# From root
pnpm db:push

# Or from database package
cd packages/database
pnpm prisma db push
```

**⚠️ Warning:** `db push` is for development only. Use `migrate deploy` for production.

---

## ✅ Verification Steps

1. **Check Migration Status:**
   ```bash
   cd packages/database
   pnpm prisma migrate status
   ```

2. **Verify Schema Sync:**
   ```bash
   cd packages/database
   pnpm prisma db pull
   # Compare with schema.prisma
   ```

3. **Check Database Tables:**
   ```bash
   cd packages/database
   pnpm prisma studio
   # Opens Prisma Studio to view database
   ```

---

## 📊 Migration Commands Reference

| Command | Purpose | Environment |
|---------|---------|-------------|
| `pnpm db:migrate` | Create and apply migration | Development |
| `pnpm db:migrate:deploy` | Apply pending migrations | Production |
| `pnpm db:push` | Push schema changes (no migration) | Development only |
| `pnpm db:migrate:status` | Check migration status | Any |
| `pnpm db:studio` | Open Prisma Studio | Any |

---

## 🔧 Troubleshooting

### Issue: "Migration not found"

**Solution:**
```bash
cd packages/database
pnpm prisma migrate resolve --applied <migration_name>
```

### Issue: "Schema drift detected"

**Solution:**
1. Review schema changes
2. Create new migration: `pnpm db:migrate`
3. Apply: `pnpm db:migrate:deploy`

### Issue: "Database connection failed"

**Solution:**
1. Check `DATABASE_URL` environment variable
2. Verify database is running
3. Check network connectivity

---

**Last Updated:** 2026-01-21
**Status:** ⏳ Check migration status to verify

