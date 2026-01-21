# Railway Environment Setup - Quick Reference

## ✅ Checklist

### Staging Environment
- [ ] `staging-postgres` service exists and is online
- [ ] `kealee-platform-v10` (or `api-staging`) service exists
- [ ] `DATABASE_URL` points to `staging-postgres.internal`
- [ ] All required environment variables are set

### Production Environment
- [ ] `production-postgres` service exists and is online
- [ ] `kealee-platform-v10` service exists
- [ ] `DATABASE_URL` points to `production-postgres.internal`
- [ ] All required environment variables are set

### Verification
- [ ] Run: `bash scripts/verify-railway-env-isolation.sh`
- [ ] Staging and production DATABASE_URL are different
- [ ] Both use `.internal` hostnames

## 🔧 Quick Fixes

### Fix DATABASE_URL in Railway Dashboard

1. **Staging:**
   - Railway Dashboard → Project → **Staging** environment
   - `kealee-platform-v10` service → **Variables**
   - Set `DATABASE_URL` = `postgresql://user:password@staging-postgres.internal:5432/railway?schema=public`

2. **Production:**
   - Railway Dashboard → Project → **Production** environment
   - `kealee-platform-v10` service → **Variables**
   - Set `DATABASE_URL` = `postgresql://user:password@production-postgres.internal:5432/railway?schema=public`

### Get Internal Connection String

1. Go to PostgreSQL service (e.g., `staging-postgres`)
2. **Variables** tab → Copy `DATABASE_URL`
3. Replace hostname with `[service-name].internal`
   - Example: `containers-us-west-123.railway.app` → `staging-postgres.internal`

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| Deployment fails | Check DATABASE_URL is set and uses `.internal` hostname |
| Staging affects production | Verify DATABASE_URL values are different |
| Connection refused | Use `.internal` hostname, not public hostname |
| Migration errors | Use `prisma migrate deploy` in production, not `migrate dev` |

## 📋 Commands

```bash
# Verify environment isolation
bash scripts/verify-railway-env-isolation.sh

# Check Railway variables (requires Railway CLI)
cd services/api
railway variables --environment staging
railway variables --environment production

# Test database connection
export DATABASE_URL="<your-database-url>"
cd packages/database
pnpm db:migrate:status
```

## 📚 Full Documentation

See [RAILWAY_ENVIRONMENT_SETUP.md](./RAILWAY_ENVIRONMENT_SETUP.md) for complete setup guide.

