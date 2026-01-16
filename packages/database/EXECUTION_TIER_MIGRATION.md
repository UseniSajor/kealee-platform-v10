# Execution Tier Migration - Schema Update

## Summary

Added `ExecutionTier` enum and `executionTier` field to Project model to support tiered execution based on project value.

## Schema Changes

### 1. New Enum: ExecutionTier

```prisma
enum ExecutionTier {
  LOW
  STANDARD
  HIGH
}
```

### 2. Project Model Update

**Added Field**:
```prisma
executionTier ExecutionTier @default(STANDARD)
```

**Location**: After `status` field, before budget/timeline fields

## Migration Commands

### Generate Migration

```bash
cd packages/database
pnpm prisma migrate dev --name add_project_execution_tier
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

## Expected Migration SQL

```sql
-- CreateEnum: ExecutionTier
CREATE TYPE "ExecutionTier" AS ENUM ('LOW', 'STANDARD', 'HIGH');

-- AlterTable: Add executionTier to Project
ALTER TABLE "Project" ADD COLUMN "executionTier" "ExecutionTier" NOT NULL DEFAULT 'STANDARD';
```

## Execution Tier Mapping

When creating a project from a lead, `executionTier` is computed from `Lead.estimatedValue`:

- **0–150k** => `LOW`
- **150k–350k** => `STANDARD`
- **350k–500k** => `HIGH`
- **No value/null** => `STANDARD` (default)

## Usage

### API Updates

The `createProjectFromLead()` method now automatically computes and sets `executionTier`:

```typescript
// Computed automatically in project.service.ts
let executionTier: ExecutionTier = ExecutionTier.STANDARD
if (lead.estimatedValue) {
  const value = lead.estimatedValue.toNumber()
  if (value < 150000) {
    executionTier = ExecutionTier.LOW
  } else if (value >= 150000 && value < 350000) {
    executionTier = ExecutionTier.STANDARD
  } else if (value >= 350000 && value <= 500000) {
    executionTier = ExecutionTier.HIGH
  }
}
```

### Future Impact

The `executionTier` field will be used for:

1. **Default milestone template selection** (later job)
   - LOW tier: Simplified milestone templates
   - STANDARD tier: Standard milestone templates
   - HIGH tier: Comprehensive milestone templates

2. **Reporting cadence** (later job)
   - LOW tier: Weekly reports
   - STANDARD tier: Bi-weekly reports
   - HIGH tier: Weekly reports with additional checkpoints

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
pnpm prisma migrate resolve --rolled-back add_project_execution_tier
```

Then manually revert the SQL changes:

```sql
ALTER TABLE "Project" DROP COLUMN "executionTier";
DROP TYPE "ExecutionTier";
```

---

**Migration Name**: `add_project_execution_tier`  
**Date**: January 2026  
**Status**: Ready for deployment
