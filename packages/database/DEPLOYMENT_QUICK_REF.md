# Database Deployment - Quick Reference

## Quick Commands

```bash
# Navigate to database package
cd packages/database

# Set production database URL
export DATABASE_URL="postgresql://user:password@host:port/database"

# Deploy migrations
npm run db:deploy:production

# Or manually
npx prisma migrate deploy --schema=./prisma/schema.prisma

# Check status
npx prisma migrate status --schema=./prisma/schema.prisma

# Generate client
npx prisma generate --schema=./prisma/schema.prisma

# Seed database
npm run db:seed
```

## Migration Files

- `20260115073113_add_lead_pipeline_fields`
- `20260115073116_add_contractor_capacity_fields`
- `20260115073200_migrate_pipeline_stages_to_lead`
- `20260115073511_migrate_pipeline_stages_to_lead`
- `20260115074000_add_project_execution_tier`
- `20260115074723_add_project_execution_tier`
- `configure_immutable_audit_logs.sql`

## Verification

```bash
# Test connection
echo "SELECT 1;" | npx prisma db execute --stdin --schema=./prisma/schema.prisma

# List tables
echo "SELECT tablename FROM pg_tables WHERE schemaname = 'public';" | npx prisma db execute --stdin --schema=./prisma/schema.prisma

# Check migrations
npx prisma migrate status --schema=./prisma/schema.prisma
```

## Troubleshooting

- **Schema errors**: Run `npx prisma format` first
- **Connection errors**: Verify `DATABASE_URL` is correct
- **Migration conflicts**: Check migration SQL files
- **Rollback**: See `README.md` for rollback procedure

See `README.md` for complete documentation.
