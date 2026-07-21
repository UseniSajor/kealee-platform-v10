# Schema Diff: Contractor Capacity Fields

## Summary

Added contractor capacity and throttling fields to `MarketplaceProfile` to support pipeline distribution logic for jobs ≤ $500k.

## Exact Schema Changes

### MarketplaceProfile Model Updates

**Fields Added**:
```prisma
// Contractor capacity and throttling
maxConcurrentProjects Int     @default(3) // Maximum active projects at once
maxPipelineValue      Decimal @default(500000) @db.Decimal(12, 2) // Maximum total pipeline value
acceptingLeads        Boolean @default(true) // Whether contractor is accepting new leads
subscriptionTier       String? // e.g., "free", "basic", "pro", "enterprise"
```

**Indexes Added**:
```prisma
@@index([acceptingLeads])
@@index([subscriptionTier])
```

### Complete Updated Model

```prisma
model MarketplaceProfile {
  id           String   @id @default(uuid())
  userId       String   @unique
  businessName String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Contractor capacity and throttling
  maxConcurrentProjects Int     @default(3) // Maximum active projects at once
  maxPipelineValue      Decimal @default(500000) @db.Decimal(12, 2) // Maximum total pipeline value
  acceptingLeads        Boolean @default(true) // Whether contractor is accepting new leads
  subscriptionTier      String? // e.g., "free", "basic", "pro", "enterprise"

  user             User    @relation(fields: [userId], references: [id])
  distributedLeads Lead[]  @relation("LeadDistribution")
  awardedLeads     Lead[]  @relation("LeadAwarded")
  quotes           Quote[]

  @@index([userId])
  @@index([acceptingLeads])
  @@index([subscriptionTier])
}
```

## Migration Commands

### Generate Migration

```bash
cd packages/database
pnpm prisma migrate dev --name add_contractor_capacity_fields
```

This will:
1. Create migration file: `prisma/migrations/YYYYMMDDHHMMSS_add_contractor_capacity_fields/migration.sql`
2. Apply migration to development database
3. Generate Prisma Client

### Apply Migration (Production)

```bash
cd packages/database
pnpm prisma migrate deploy
```

### Generate Prisma Client Only

```bash
cd packages/database
pnpm prisma generate
```

### Validate Schema

```bash
cd packages/database
pnpm prisma validate
```

## Expected Migration SQL

The migration will add:

1. **New Columns**:
   ```sql
   ALTER TABLE "MarketplaceProfile" ADD COLUMN "maxConcurrentProjects" INTEGER NOT NULL DEFAULT 3;
   ALTER TABLE "MarketplaceProfile" ADD COLUMN "maxPipelineValue" DECIMAL(12,2) NOT NULL DEFAULT 500000;
   ALTER TABLE "MarketplaceProfile" ADD COLUMN "acceptingLeads" BOOLEAN NOT NULL DEFAULT true;
   ALTER TABLE "MarketplaceProfile" ADD COLUMN "subscriptionTier" TEXT;
   ```

2. **New Indexes**:
   ```sql
   CREATE INDEX "MarketplaceProfile_acceptingLeads_idx" ON "MarketplaceProfile"("acceptingLeads");
   CREATE INDEX "MarketplaceProfile_subscriptionTier_idx" ON "MarketplaceProfile"("subscriptionTier");
   ```

## Usage Notes

### Capacity Checking Logic

When distributing leads to contractors, check:

1. **Accepting Leads**: `acceptingLeads = true`
2. **Concurrent Projects**: Count of active projects < `maxConcurrentProjects`
3. **Pipeline Value**: Sum of `estimatedValue` for leads in pipeline ≤ `maxPipelineValue`
4. **Subscription Tier** (optional): Filter by `subscriptionTier` for premium distribution

### Example Query

```typescript
// Find contractors eligible for lead distribution
const eligibleContractors = await prisma.marketplaceProfile.findMany({
  where: {
    acceptingLeads: true,
    // Additional checks:
    // - Count active projects < maxConcurrentProjects
    // - Sum pipeline value < maxPipelineValue
  },
  include: {
    distributedLeads: {
      where: {
        stage: { in: ['QUALIFIED', 'SCOPED', 'QUOTED'] }
      }
    }
  }
})
```

### Default Values

- **maxConcurrentProjects**: `3` - Can be adjusted per contractor based on capacity
- **maxPipelineValue**: `500000` ($500k) - Default limit for pipeline distribution
- **acceptingLeads**: `true` - Contractors accept leads by default
- **subscriptionTier**: `null` - Optional, can be set based on subscription plan

## Validation

✅ **Schema Validation**: PASSED
```bash
cd packages/database
pnpm prisma validate
# Result: The schema at prisma\schema.prisma is valid 🚀
```

## Notes

- **Backward Compatible**: All new fields have defaults, so existing records will work
- **Indexed Fields**: `acceptingLeads` and `subscriptionTier` are indexed for efficient filtering
- **Decimal Precision**: `maxPipelineValue` uses `DECIMAL(12, 2)` to support values up to $999,999,999.99
- **Nullable Tier**: `subscriptionTier` is optional to support free-tier contractors

---

**Migration Name**: `add_contractor_capacity_fields`  
**Status**: ✅ Schema Valid, Ready for Migration  
**Date**: January 2026
