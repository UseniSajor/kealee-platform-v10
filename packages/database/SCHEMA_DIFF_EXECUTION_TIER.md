# Schema Diff: Execution Tier Addition

## Summary

Added `ExecutionTier` enum and `executionTier` field to Project model to support tiered execution based on project value.

## Exact Schema Changes

### 1. New Enum: ExecutionTier

**Added**:
```prisma
enum ExecutionTier {
  LOW
  STANDARD
  HIGH
}
```

**Location**: After `ProjectMemberRole` enum, before `model Project`

### 2. Project Model - Execution Tier Field

**Added Field**:
```prisma
executionTier ExecutionTier @default(STANDARD)
```

**Location**: After `status ProjectStatus @default(DRAFT)`, before budget/timeline fields

### Complete Updated Section

```prisma
enum ProjectMemberRole {
  OWNER
  CONTRACTOR
  PROJECT_MANAGER
  MEMBER
  VIEWER
}

enum ExecutionTier {
  LOW
  STANDARD
  HIGH
}

model Project {
  id         String  @id @default(uuid())
  orgId      String?
  ownerId    String
  propertyId String?

  name             String
  description      String?
  category         ProjectCategory
  categoryMetadata Json?

  status ProjectStatus @default(DRAFT)

  // Execution tier (computed from lead.estimatedValue)
  executionTier ExecutionTier @default(STANDARD)

  // Budget & timeline
  budgetTotal Decimal?  @db.Decimal(12, 2)
  startDate   DateTime?
  endDate     DateTime?

  // ... rest of model
}
```

## API Updates

### Project Service (`project.service.ts`)

**Import Update**:
```typescript
import { ProjectMemberRole, ProjectStatus, ExecutionTier, Prisma } from '@prisma/client'
```

**Computation Logic** (in `createProjectFromLead`):
```typescript
// Compute execution tier from lead.estimatedValue
// 0–150k => LOW
// 150k–350k => STANDARD
// 350k–500k => HIGH
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

**Project Creation** (updated):
```typescript
const project = await tx.project.create({
  data: {
    // ... other fields
    executionTier: executionTier,
    // ... rest of data
  },
})
```

**Audit/Event Logging** (updated):
- Added `projectExecutionTier` to audit `after` payload
- Added `projectExecutionTier` to event payload

## Execution Tier Mapping

| Lead.estimatedValue Range | ExecutionTier |
|---------------------------|--------------|
| 0 - $149,999              | LOW          |
| $150,000 - $349,999       | STANDARD     |
| $350,000 - $500,000      | HIGH         |
| null/undefined            | STANDARD (default) |

## Future Usage

The `executionTier` field will impact:

1. **Default milestone template selection** (later job)
   - LOW: Simplified templates (fewer milestones)
   - STANDARD: Standard templates (balanced milestones)
   - HIGH: Comprehensive templates (detailed milestones)

2. **Reporting cadence** (later job)
   - LOW: Weekly reports
   - STANDARD: Bi-weekly reports
   - HIGH: Weekly reports + additional checkpoints

## Migration Commands

```bash
cd packages/database

# Generate migration
pnpm prisma migrate dev --name add_project_execution_tier

# Apply migration (production)
pnpm prisma migrate deploy

# Generate Prisma Client
pnpm prisma generate
```

## Expected Migration SQL

```sql
-- CreateEnum: ExecutionTier
CREATE TYPE "ExecutionTier" AS ENUM ('LOW', 'STANDARD', 'HIGH');

-- AlterTable: Add executionTier to Project
ALTER TABLE "Project" ADD COLUMN "executionTier" "ExecutionTier" NOT NULL DEFAULT 'STANDARD';
```

## Validation

✅ **Schema Validation**: PASSED
```bash
cd packages/database
pnpm prisma validate
# Result: The schema at prisma\schema.prisma is valid 🚀
```

## Notes

- **Default Value**: All existing projects will have `executionTier = STANDARD` after migration
- **Computation**: Only computed when creating from lead; can be manually updated later
- **Backward Compatible**: Default value ensures existing code continues to work

---

**Migration Name**: `add_project_execution_tier`  
**Status**: ✅ Schema Valid, Ready for Migration  
**Date**: January 2026
