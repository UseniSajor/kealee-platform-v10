# Contractor Capacity Migration - Schema Changes

## Summary

Added contractor capacity and throttling fields to `MarketplaceProfile` to support pipeline distribution logic for jobs ≤ $500k.

## Schema Changes

### MarketplaceProfile Model Updates

**New Fields Added**:
- `maxConcurrentProjects Int @default(3)` - Maximum active projects contractor can handle simultaneously
- `maxPipelineValue Decimal @default(500000) @db.Decimal(12, 2)` - Maximum total pipeline value (default $500k)
- `acceptingLeads Boolean @default(true)` - Whether contractor is currently accepting new leads
- `subscriptionTier String?` - Subscription tier (e.g., "free", "basic", "pro", "enterprise")

**New Indexes Added**:
- `@@index([acceptingLeads])` - For filtering contractors accepting leads
- `@@index([subscriptionTier])` - For filtering by subscription tier

### Updated Model

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
  subscriptionTier       String? // e.g., "free", "basic", "pro", "enterprise"

  user         User     @relation(fields: [userId], references: [id])
  distributedLeads Lead[] @relation("LeadDistribution")
  awardedLeads    Lead[] @relation("LeadAwarded")
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

The migration will add:

1. **New Columns to MarketplaceProfile**:
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

When distributing leads, check:
1. `acceptingLeads = true`
2. Current active projects < `maxConcurrentProjects`
3. Current pipeline value + new lead value ≤ `maxPipelineValue`
4. Optional: Filter by `subscriptionTier` for premium distribution

### Default Values

- **maxConcurrentProjects**: 3 (can be adjusted per contractor)
- **maxPipelineValue**: $500,000 (default limit for pipeline distribution)
- **acceptingLeads**: true (contractors accept leads by default)
- **subscriptionTier**: null (optional, can be set based on subscription)

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
pnpm prisma migrate resolve --rolled-back add_contractor_capacity_fields
```

Then revert schema.prisma changes.

---

**Migration Name**: `add_contractor_capacity_fields`  
**Date**: January 2026  
**Status**: Ready for deployment
