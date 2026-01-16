# Lead Pipeline Migration - Schema Changes

## Summary

Upgraded `Lead` model to support full pipeline lifecycle (INTAKE → QUALIFIED → SCOPED → QUOTED → WON/LOST) for jobs ≤ $500k, while maintaining existing marketplace lead distribution and quotes functionality.

## Schema Changes

### 1. New Enums

**LeadStage** (Primary):
```prisma
enum LeadStage {
  INTAKE
  QUALIFIED
  SCOPED
  QUOTED
  WON
  LOST
}
```

**LeadStatus** (Legacy, kept for backward compatibility):
```prisma
enum LeadStatus {
  NEW
  CONTACTED
  QUALIFIED
  QUOTED
  WON
  LOST
}
```

### 2. Lead Model Updates

**New Fields Added**:
- `stage LeadStage @default(INTAKE)` - Primary pipeline stage
- `status LeadStatus?` - Legacy status (nullable, for migration)
- `estimatedValue Decimal? @db.Decimal(12, 2)` - Required before WON
- `projectType String?` - Project type (later convert to enum)
- `assignedSalesRepId String?` - FK to User (sales rep assignment)
- `awardedProfileId String?` - FK to MarketplaceProfile (winning contractor)
- `projectId String?` - FK to Project (created after WON, gate enforced server-side)

**New Timestamp Fields**:
- `qualifiedAt DateTime?`
- `scopedAt DateTime?`
- `quotedAt DateTime?`
- `wonAt DateTime?`
- `lostAt DateTime?`
- `lostReason String?`

**New Relationships**:
- `assignedSalesRep User? @relation("LeadSalesRep")`
- `awardedProfile MarketplaceProfile? @relation("LeadAwarded")`
- `distributedTo MarketplaceProfile[] @relation("LeadDistribution")` (many-to-many)
- `quotes Quote[]` (one-to-many)

**New Indexes**:
- `@@index([stage])`
- `@@index([status])` (legacy)
- `@@index([assignedSalesRepId])`
- `@@index([awardedProfileId])`
- `@@index([projectId])`
- `@@index([createdAt])`
- `@@index([email])`
- `@@index([phone])`

### 3. Quote Model (New)

Created `Quote` model to support marketplace quote functionality:
- Links to `Lead` and `MarketplaceProfile`
- Stores quote amount, description, timeline, terms
- Tracks quote status (pending, accepted, rejected, withdrawn)

### 4. Updated Relationships

**User Model**:
- Added `assignedLeads Lead[] @relation("LeadSalesRep")`

**MarketplaceProfile Model**:
- Added `distributedLeads Lead[] @relation("LeadDistribution")`
- Added `awardedLeads Lead[] @relation("LeadAwarded")`
- Added `quotes Quote[]`

## Migration Commands

### Generate Migration

```bash
cd packages/database
pnpm prisma migrate dev --name add_lead_pipeline_fields
```

### Apply Migration (Production)

```bash
cd packages/database
pnpm prisma migrate deploy
```

### Generate Prisma Client

```bash
cd packages/database
pnpm prisma generate
```

## Migration SQL Preview

The migration will create:

1. **Enums**:
   - `LeadStage` enum
   - `LeadStatus` enum (legacy)

2. **Tables**:
   - `Lead` table with all new fields
   - `Quote` table
   - `_LeadDistribution` join table (many-to-many)

3. **Indexes**:
   - All indexes as specified above

4. **Foreign Keys**:
   - `Lead.assignedSalesRepId` → `User.id`
   - `Lead.awardedProfileId` → `MarketplaceProfile.id`
   - `Lead.projectId` → `Project.id`
   - `Quote.leadId` → `Lead.id`
   - `Quote.profileId` → `MarketplaceProfile.id`

## Data Migration Notes

After schema migration, you may need to:

1. **Migrate existing Lead data** (if any):
   ```sql
   -- Map old status values to new stage values
   UPDATE "Lead" SET stage = 'INTAKE' WHERE status IS NULL;
   UPDATE "Lead" SET stage = 'QUALIFIED' WHERE status = 'QUALIFIED';
   UPDATE "Lead" SET stage = 'QUOTED' WHERE status = 'QUOTED';
   UPDATE "Lead" SET stage = 'WON' WHERE status = 'WON';
   UPDATE "Lead" SET stage = 'LOST' WHERE status = 'LOST';
   ```

2. **Set default values** for existing leads:
   ```sql
   UPDATE "Lead" SET stage = 'INTAKE' WHERE stage IS NULL;
   ```

## Validation

After migration, validate schema:

```bash
cd packages/database
pnpm prisma validate
```

## Rollback

If needed, rollback migration:

```bash
cd packages/database
pnpm prisma migrate resolve --rolled-back add_lead_pipeline_fields
```

Then revert schema.prisma changes.

---

**Migration Name**: `add_lead_pipeline_fields`  
**Date**: January 2026  
**Status**: Ready for deployment
