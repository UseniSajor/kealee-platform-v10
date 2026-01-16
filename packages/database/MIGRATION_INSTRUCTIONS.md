# Migration Instructions

## Overview

Two migrations have been created:
1. `20260115073113_add_lead_pipeline_fields` - Lead pipeline lifecycle support
2. `20260115073116_add_contractor_capacity_fields` - Contractor capacity and throttling

## Migration Status

✅ **Migration SQL files created** (manually, since database connection unavailable)

## Apply Migrations

### Option 1: Using Prisma Migrate (Recommended)

When your database is available:

```bash
cd packages/database

# Apply all pending migrations
pnpm prisma migrate deploy

# Or apply interactively (dev mode)
pnpm prisma migrate dev
```

### Option 2: Manual SQL Execution

If you need to apply manually:

1. **Connect to your PostgreSQL database**
2. **Run the migration SQL files in order**:

```bash
# First migration: Lead pipeline
psql -h localhost -U kealee -d kealee -f prisma/migrations/20260115073113_add_lead_pipeline_fields/migration.sql

# Second migration: Contractor capacity
psql -h localhost -U kealee -d kealee -f prisma/migrations/20260115073116_add_contractor_capacity_fields/migration.sql
```

### Option 3: Using Prisma Migrate Resolve

If migrations were created manually and you want Prisma to recognize them:

```bash
cd packages/database

# Mark migrations as applied (if already run manually)
pnpm prisma migrate resolve --applied 20260115073113_add_lead_pipeline_fields
pnpm prisma migrate resolve --applied 20260115073116_add_contractor_capacity_fields
```

## Verify Migrations

After applying:

```bash
cd packages/database

# Check migration status
pnpm prisma migrate status

# Generate Prisma Client
pnpm prisma generate

# Validate schema
pnpm prisma validate
```

## Migration Details

### Migration 1: add_lead_pipeline_fields

**Creates**:
- `LeadStage` enum (INTAKE, QUALIFIED, SCOPED, QUOTED, WON, LOST)
- `LeadStatus` enum (legacy: NEW, CONTACTED, QUALIFIED, QUOTED, WON, LOST)
- `Lead` table with pipeline fields
- `Quote` table
- `_LeadDistribution` join table (many-to-many)
- All indexes and foreign keys

### Migration 2: add_contractor_capacity_fields

**Adds to MarketplaceProfile**:
- `maxConcurrentProjects` (default: 3)
- `maxPipelineValue` (default: 500000)
- `acceptingLeads` (default: true)
- `subscriptionTier` (nullable)
- Indexes on `acceptingLeads` and `subscriptionTier`

## Rollback

If you need to rollback:

```bash
cd packages/database

# Rollback last migration
pnpm prisma migrate resolve --rolled-back 20260115073116_add_contractor_capacity_fields
pnpm prisma migrate resolve --rolled-back 20260115073113_add_lead_pipeline_fields
```

Then manually revert the SQL changes or restore from backup.

---

**Status**: ✅ Migration files created, ready to apply  
**Date**: January 15, 2026
