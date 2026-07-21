# Pipeline Stages Migration - Schema Updates

## Summary

Enhanced Lead model with better pipeline stage tracking and improved SalesTask model (separate from PM Task).

## Schema Changes

### 1. Lead Model - Pipeline Stage Enhancements

**Added Field**:
- `stageChangedAt DateTime?` - Tracks last stage transition timestamp

**Updated Timestamp Fields** (clarified purpose):
- `qualifiedAt` - When moved to QUALIFIED stage
- `scopedAt` - When moved to SCOPED stage
- `quotedAt` - When moved to QUOTED stage
- `wonAt` - When moved to WON stage
- `lostAt` - When moved to LOST stage
- `lostReason` - Reason for loss

**New Index**:
- `@@index([stageChangedAt])` - For querying recent stage changes

### 2. SalesTask Model - Enhanced Tracking

**Added Fields**:
- `startedAt DateTime?` - When task was started
- `completedAt DateTime?` - When task was completed
- `timeSpent Int?` - Minutes spent on task (for reporting)

**New Indexes**:
- `@@index([type])` - For filtering by task type
- `@@index([createdAt])` - For chronological sorting

### Complete Updated Models

#### Lead Model
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

#### SalesTask Model
```prisma
model SalesTask {
  // ... existing fields ...
  
  // Task completion tracking
  startedAt   DateTime?
  completedAt DateTime?
  timeSpent   Int? // Minutes spent on task
  
  // ... relationships ...
  
  @@index([type]) // New index
  @@index([createdAt]) // New index
}
```

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

The migration will:

1. **Add to Lead table**:
   ```sql
   ALTER TABLE "Lead" ADD COLUMN "stageChangedAt" TIMESTAMP(3);
   CREATE INDEX "Lead_stageChangedAt_idx" ON "Lead"("stageChangedAt");
   ```

2. **Add to SalesTask table**:
   ```sql
   ALTER TABLE "SalesTask" ADD COLUMN "startedAt" TIMESTAMP(3);
   ALTER TABLE "SalesTask" ADD COLUMN "completedAt" TIMESTAMP(3);
   ALTER TABLE "SalesTask" ADD COLUMN "timeSpent" INTEGER;
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
```

### SalesTask vs PM Task

**SalesTask** (Sales domain):
- Linked to `Lead`
- Types: FOLLOW_UP, SCOPE_CALL, SITE_VISIT, QUOTE_PREP, CLOSE
- Tracks sales activities in pipeline
- Assigned to sales reps

**Task** (PM domain):
- Linked to `ServiceRequest`
- PM operational tasks
- Assigned to project managers
- Different lifecycle and purpose

### Stage Transition Tracking

Use timestamps to track stage progression:
- `stageChangedAt` - Always updated on stage change
- Stage-specific timestamps (`qualifiedAt`, `scopedAt`, etc.) - Set when entering that stage
- Query recent stage changes: `WHERE stageChangedAt > ...`

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
pnpm prisma migrate resolve --rolled-back migrate_pipeline_stages_to_lead
```

Then manually revert the SQL changes.

---

**Migration Name**: `migrate_pipeline_stages_to_lead`  
**Date**: January 2026  
**Status**: Ready for deployment
