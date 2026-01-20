# Database Migration Guide

This guide explains how to run database migrations for the Kealee Platform using Prisma.

## Quick Start

### Run Migrations (Production Mode)

```bash
# Unix/Linux/macOS
cd packages/database
export DATABASE_URL="postgresql://user:password@host:port/database"
../../scripts/run-database-migrations.sh

# Windows PowerShell
cd packages/database
$env:DATABASE_URL = "postgresql://user:password@host:port/database"
..\..\scripts\run-database-migrations.ps1
```

### Run Migrations (Development Mode)

```bash
# Creates new migration and applies it
MIGRATION_MODE=dev ./scripts/run-database-migrations.sh
```

## Prerequisites

### 1. Environment Variables

Set the `DATABASE_URL` environment variable:

```bash
# Unix/Linux/macOS
export DATABASE_URL="postgresql://user:password@host:port/database"

# Windows PowerShell
$env:DATABASE_URL = "postgresql://user:password@host:port/database"
```

Or create a `.env` file in `packages/database/`:

```env
DATABASE_URL=postgresql://user:password@host:port/database
```

### 2. Required Tools

- **Node.js** (v18+)
- **pnpm** (v8+)
- **PostgreSQL Client Tools** (optional, for backups and integrity checks)
  - `pg_dump` - for database backups
  - `psql` - for integrity checks

### 3. Install Dependencies

```bash
# From root directory
pnpm install

# Or from database package
cd packages/database
pnpm install
```

## Migration Modes

### Development Mode (`dev`)

Creates a new migration file and applies it:

```bash
MIGRATION_MODE=dev ./scripts/run-database-migrations.sh
```

**Use when:**
- Developing new features
- Schema changes need to be versioned
- Working in local development

**What it does:**
1. Compares current schema with database
2. Creates a new migration file in `prisma/migrations/`
3. Applies the migration
4. Generates Prisma Client

### Production Mode (`deploy`)

Applies pending migrations without creating new ones:

```bash
MIGRATION_MODE=deploy ./scripts/run-database-migrations.sh
```

**Use when:**
- Deploying to staging/production
- Migrations already exist
- CI/CD pipelines

**What it does:**
1. Checks for pending migrations
2. Applies all pending migrations
3. Generates Prisma Client

## Migration Process

The script performs the following steps:

### 1. Backup Database

Creates a SQL backup before running migrations:

```bash
# Backup location
backups/db_backup_<database>_<timestamp>.sql
```

**Skip backup:**
```bash
SKIP_BACKUP=true ./scripts/run-database-migrations.sh
```

### 2. Generate Prisma Client

Generates the Prisma Client based on the current schema:

```bash
npx prisma generate --schema=./prisma/schema.prisma
```

### 3. Check Migration Status

Checks if there are pending migrations:

```bash
npx prisma migrate status --schema=./prisma/schema.prisma
```

### 4. Run Migrations

Applies pending migrations:

```bash
# Production mode
npx prisma migrate deploy --schema=./prisma/schema.prisma

# Development mode
npx prisma migrate dev --schema=./prisma/schema.prisma --name="migration_name"
```

### 5. Verify Migration Status

Confirms all migrations were applied successfully.

### 6. Data Integrity Checks

Runs SQL queries to check for:
- Orphaned records
- Foreign key violations
- Missing relationships

**Skip integrity checks:**
```bash
SKIP_INTEGRITY_CHECK=true ./scripts/run-database-migrations.sh
```

### 7. Generate Report

Creates a migration report with:
- Migration status
- Database statistics
- Rollback instructions

## Manual Migration Commands

### Check Migration Status

```bash
cd packages/database
npx prisma migrate status --schema=./prisma/schema.prisma
```

### Create New Migration

```bash
cd packages/database
npx prisma migrate dev --schema=./prisma/schema.prisma --name="add_new_table"
```

### Apply Pending Migrations

```bash
cd packages/database
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

### Reset Database (WARNING: Drops all data)

```bash
cd packages/database
npx prisma migrate reset --schema=./prisma/schema.prisma
```

### Generate Prisma Client

```bash
cd packages/database
npx prisma generate --schema=./prisma/schema.prisma
```

## Backup and Restore

### Create Backup

```bash
# Using pg_dump
pg_dump "$DATABASE_URL" > backup.sql

# Or use the migration script (automatic)
./scripts/run-database-migrations.sh
```

### Restore from Backup

```bash
# Restore entire database
psql "$DATABASE_URL" < backup.sql

# Or restore specific tables
psql "$DATABASE_URL" -c "\COPY table_name FROM 'backup.csv' CSV HEADER"
```

## Troubleshooting

### Migration Fails

1. **Check error message:**
   ```bash
   npx prisma migrate status --schema=./prisma/schema.prisma
   ```

2. **Restore from backup:**
   ```bash
   psql "$DATABASE_URL" < backups/db_backup_*.sql
   ```

3. **Check database connection:**
   ```bash
   psql "$DATABASE_URL" -c "SELECT 1;"
   ```

### Schema Drift

If your database schema doesn't match Prisma schema:

```bash
# Check differences
npx prisma db pull --schema=./prisma/schema.prisma

# Or push schema directly (not recommended for production)
npx prisma db push --schema=./prisma/schema.prisma
```

### Migration Conflicts

If migrations conflict:

1. **Check migration history:**
   ```bash
   ls -la packages/database/prisma/migrations/
   ```

2. **Resolve conflicts manually:**
   - Edit migration files
   - Or create a new migration to fix issues

3. **Mark migration as applied:**
   ```bash
   npx prisma migrate resolve --applied <migration_name>
   ```

### Prisma Client Not Generated

```bash
cd packages/database
npx prisma generate --schema=./prisma/schema.prisma
```

## Best Practices

### 1. Always Backup Before Migrations

```bash
# Automatic backup (recommended)
./scripts/run-database-migrations.sh

# Or manual backup
pg_dump "$DATABASE_URL" > backup.sql
```

### 2. Test Migrations Locally First

```bash
# Use development mode
MIGRATION_MODE=dev ./scripts/run-database-migrations.sh
```

### 3. Review Migration Files

Before applying to production:

```bash
# Check migration SQL
cat packages/database/prisma/migrations/<migration_name>/migration.sql
```

### 4. Use Transactions

Prisma migrations run in transactions automatically. If a migration fails, it will rollback.

### 5. Monitor Migration Performance

```bash
# Check migration execution time
time npx prisma migrate deploy --schema=./prisma/schema.prisma
```

### 6. Keep Migrations Small

- One logical change per migration
- Avoid large data migrations in schema migrations
- Use separate scripts for data migrations

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Database Migrations

on:
  push:
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: pnpm install
      - run: |
          cd packages/database
          export DATABASE_URL="${{ secrets.DATABASE_URL }}"
          ../../scripts/run-database-migrations.sh
```

### Railway Deployment

Railway automatically runs migrations if configured:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd packages/database && npx prisma migrate deploy && cd ../.. && pnpm start"
  }
}
```

## Migration Report

After running migrations, a report is generated:

```
migration-report_<timestamp>.md
```

The report includes:
- Migration status
- Database statistics
- Rollback instructions
- Next steps

## Support

For migration issues:
1. Check Prisma documentation: https://www.prisma.io/docs
2. Review migration logs
3. Check database connection
4. Verify environment variables
5. Contact DevOps team if needed
