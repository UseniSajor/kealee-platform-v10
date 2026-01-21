# Prisma Migration Commands - Quick Reference

## ⚠️ Important: Prisma CLI is not installed globally

You must use `pnpm` to run Prisma commands from the `packages/database` directory.

## Local Development (Docker Required)

**First, start Docker Desktop and run:**
```powershell
docker-compose up -d
```

**Then run migrations:**
```powershell
cd packages/database
pnpm db:migrate:deploy
```

## Railway Staging

**Get DATABASE_URL from Railway Dashboard:**
1. Go to Railway → Your Project → Staging Environment
2. Select `staging-postgres` service
3. Go to Variables tab
4. Copy the `DATABASE_URL` value

**Run migration:**
```powershell
cd packages/database
$env:DATABASE_URL="postgresql://user:password@host:port/database"
pnpm db:migrate:deploy
```

**Or use the script:**
```powershell
cd packages/database
$env:DATABASE_URL="your-staging-database-url"
bash ../../scripts/db-migrate-staging.sh
```

## Railway Production

**Get DATABASE_URL from Railway Dashboard:**
1. Go to Railway → Your Project → Production Environment
2. Select `production-postgres` service
3. Go to Variables tab
4. Copy the `DATABASE_URL` value

**Run migration:**
```powershell
cd packages/database
$env:DATABASE_URL="postgresql://user:password@host:port/database"
pnpm db:migrate:deploy
```

**Or use the script:**
```powershell
cd packages/database
$env:DATABASE_URL="your-production-database-url"
bash ../../scripts/db-migrate-prod.sh
```

## Common Commands

```powershell
# Navigate to database package
cd packages/database

# Check migration status
pnpm db:migrate:status

# Deploy migrations (production/staging)
pnpm db:migrate:deploy

# Create new migration (local dev only)
pnpm db:migrate:dev

# Generate Prisma Client
pnpm db:generate

# Open Prisma Studio (database GUI)
pnpm db:studio
```

## Troubleshooting

### "prisma: command not found"
**Solution:** Use `pnpm` instead:
```powershell
cd packages/database
pnpm prisma migrate deploy
```

### "Authentication failed"
**Solution:** 
1. Check DATABASE_URL is correct
2. Verify database is accessible
3. For Railway: Use the internal URL from Railway dashboard

### "Docker not running"
**Solution:** 
- Start Docker Desktop
- Run `docker-compose up -d`
- Wait for containers to be ready

## Railway Internal URLs

Railway provides internal URLs that work within Railway's network:
- Staging: `postgresql://user:password@staging-postgres.internal:5432/railway`
- Production: `postgresql://user:password@production-postgres.internal:5432/railway`

These URLs are automatically set in Railway services, but you need to get them from Railway dashboard for local migrations.

