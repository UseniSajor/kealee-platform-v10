# Schema Diff: Pipeline Stages Migration to Lead

## Summary

Enhanced Lead model with better pipeline stage transition tracking and improved SalesTask model (clearly separate from PM Task).

## Exact Schema Changes

### 1. Lead Model - Pipeline Stage Tracking Enhancement

**Added Field**:
```prisma
stageChangedAt DateTime? // Last stage change timestamp
```

**Updated Comments** (clarified purpose of existing timestamp fields):
- `qualifiedAt` - When moved to QUALIFIED stage
- `scopedAt` - When moved to SCOPED stage
- `quotedAt` - When moved to QUOTED stage
- `wonAt` - When moved to WON stage
- `lostAt` - When moved to LOST stage
- `lostReason` - Reason for loss

**New Index**:
```prisma
@@index([stageChangedAt])
```

### 2. SalesTask Model - Enhanced Completion Tracking

**Added Fields**:
```prisma
// Task completion tracking
startedAt   DateTime?
completedAt DateTime?
timeSpent   Int? // Minutes spent on task
```

**New Indexes**:
```prisma
@@index([type])
@@index([createdAt])
```

### Complete Updated Models

#### Lead Model (Pipeline Stages)
```prisma
model Lead {
  // ... existing fields ...
  
  // Pipeline stage transitions (tracked via timestamps)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  stageChangedAt DateTime? // Last stage change timestamp
  qualifiedAt DateTime? // When moved to QUALIFIED
  scopedAt    DateTime? // When moved to SCOPED
  quotedAt    DateTime? // When moved to QUOTED
  wonAt       DateTime? // When moved to WON
  lostAt      DateTime? // When moved to LOST
  lostReason  String? // Reason for loss
  
  // ... relationships ...
  
  @@index([stageChangedAt]) // New index
}
```

#### SalesTask Model (Separate from PM Task)
```prisma
model SalesTask {
  id               String @id @default(uuid())
  leadId           String
  assignedToUserId String

  type     SalesTaskType
  status   SalesTaskStatus @default(OPEN)
  slaDueAt DateTime?
  outcome  SalesOutcome?
  notes    String?

  // Task completion tracking
  startedAt   DateTime?
  completedAt DateTime?
  timeSpent   Int? // Minutes spent on task

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relationships
  lead       Lead @relation(fields: [leadId], references: [id], onDelete: Cascade)
  assignedTo User @relation("SalesTaskAssignee", fields: [assignedToUserId], references: [id], onDelete: SetNull)

  @@index([leadId])
  @@index([assignedToUserId])
  @@index([status])
  @@index([slaDueAt])
  @@index([type]) // New index
  @@index([createdAt]) // New index
}
```

### Model Separation: SalesTask vs PM Task

**SalesTask** (Sales Domain - Lead Pipeline):
- Linked to `Lead` (sales pipeline)
- Types: FOLLOW_UP, SCOPE_CALL, SITE_VISIT, QUOTE_PREP, CLOSE
- Tracks sales activities in lead pipeline
- Assigned to sales reps (`assignedToUserId`)
- Purpose: Convert leads through pipeline stages

**Task** (PM Domain - Service Operations):
- Linked to `ServiceRequest` (PM operations)
- PM operational tasks (vendor coordination, permit tracking, etc.)
- Assigned to project managers (`pmId`)
- Purpose: Execute PM services for active projects
- Different lifecycle and domain

## Migration Commands

### Generate Migration

```bash
cd packages/database
pnpm prisma migrate dev --name migrate_pipeline_stages_to_lead
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
-- AlterTable: Add stageChangedAt to Lead
ALTER TABLE "Lead" ADD COLUMN "stageChangedAt" TIMESTAMP(3);

-- CreateIndex: Add index for stageChangedAt
CREATE INDEX "Lead_stageChangedAt_idx" ON "Lead"("stageChangedAt");

-- AlterTable: Add completion tracking fields to SalesTask
ALTER TABLE "SalesTask" ADD COLUMN "startedAt" TIMESTAMP(3);
ALTER TABLE "SalesTask" ADD COLUMN "completedAt" TIMESTAMP(3);
ALTER TABLE "SalesTask" ADD COLUMN "timeSpent" INTEGER;

-- CreateIndex: Add indexes for SalesTask
CREATE INDEX "SalesTask_type_idx" ON "SalesTask"("type");
CREATE INDEX "SalesTask_createdAt_idx" ON "SalesTask"("createdAt");
```

## Usage Notes

### Pipeline Stage Transitions

When updating Lead stage, update both `stage` and `stageChangedAt`:

```typescript
// Example: Move lead to QUALIFIED stage
await prisma.lead.update({
  where: { id: leadId },
  data: {
    stage: 'QUALIFIED',
    stageChangedAt: new Date(),
    qualifiedAt: new Date(), // Stage-specific timestamp
  }
})

// Query recent stage changes
const recentChanges = await prisma.lead.findMany({
  where: {
    stageChangedAt: {
      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
    }
  },
  orderBy: { stageChangedAt: 'desc' }
})
```

### SalesTask Completion Tracking

Track task lifecycle:

```typescript
// Start task
await prisma.salesTask.update({
  where: { id: taskId },
  data: {
    status: 'IN_PROGRESS',
    startedAt: new Date(),
  }
})

// Complete task
await prisma.salesTask.update({
  where: { id: taskId },
  data: {
    status: 'DONE',
    completedAt: new Date(),
    timeSpent: calculateMinutes(startedAt, completedAt),
    outcome: 'CONTACTED',
  }
})
```

## Validation

✅ **Schema Validation**: PASSED
```bash
cd packages/database
pnpm prisma validate
# Result: The schema at prisma\schema.prisma is valid 🚀
```

## Notes

- **Minimal Disruption**: All new fields are nullable, so existing records work without migration
- **Stage Tracking**: `stageChangedAt` provides quick access to last transition time
- **Task Separation**: SalesTask clearly separate from PM Task model
- **Indexed Fields**: New indexes support efficient querying by type and creation date

---

**Migration Name**: `migrate_pipeline_stages_to_lead`  
**Status**: ✅ Schema Valid, Ready for Migration  
**Date**: January 2026
