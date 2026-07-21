# All Migrations Summary

## Migration Files Created

### 1. `20260115073113_add_lead_pipeline_fields`
**Purpose**: Add Lead pipeline lifecycle support

**Creates**:
- `LeadStage` enum (INTAKE, QUALIFIED, SCOPED, QUOTED, WON, LOST)
- `LeadStatus` enum (legacy)
- `Lead` table with pipeline fields
- `Quote` table
- `_LeadDistribution` join table
- All indexes and foreign keys

**Status**: ✅ Created

---

### 2. `20260115073116_add_contractor_capacity_fields`
**Purpose**: Add contractor capacity and throttling to MarketplaceProfile

**Adds to MarketplaceProfile**:
- `maxConcurrentProjects` (default: 3)
- `maxPipelineValue` (default: 500000)
- `acceptingLeads` (default: true)
- `subscriptionTier` (nullable)
- Indexes on `acceptingLeads` and `subscriptionTier`

**Status**: ✅ Created

---

### 3. `20260115073200_migrate_pipeline_stages_to_lead`
**Purpose**: Enhance pipeline stage tracking and SalesTask completion tracking

**Adds to Lead**:
- `stageChangedAt` timestamp field
- Index on `stageChangedAt`

**Adds to SalesTask**:
- `startedAt` timestamp
- `completedAt` timestamp
- `timeSpent` (minutes)
- Indexes on `type` and `createdAt`

**Status**: ✅ Created

---

## Apply All Migrations

### When Database is Available

```bash
cd packages/database

# Apply all pending migrations
pnpm prisma migrate deploy

# Or apply interactively (dev mode)
pnpm prisma migrate dev
```

### Migration Order

Migrations will be applied in chronological order:
1. `20260115073113_add_lead_pipeline_fields` (first)
2. `20260115073116_add_contractor_capacity_fields` (second)
3. `20260115073200_migrate_pipeline_stages_to_lead` (third)

### Verify After Migration

```bash
cd packages/database

# Check migration status
pnpm prisma migrate status

# Generate Prisma Client
pnpm prisma generate

# Validate schema
pnpm prisma validate
```

---

**Total Migrations**: 3  
**Status**: ✅ All migration files created, ready to apply  
**Date**: January 15, 2026
