# Schema Diff: Lead Pipeline Upgrade

## Summary

Upgraded `Lead` model to support full pipeline lifecycle (INTAKE → QUALIFIED → SCOPED → QUOTED → WON/LOST) for jobs ≤ $500k, while maintaining existing marketplace lead distribution and quotes functionality.

## Exact Schema Changes

### 1. New Enums Added

```prisma
enum LeadStage {
  INTAKE
  QUALIFIED
  SCOPED
  QUOTED
  WON
  LOST
}

// Legacy enum kept for backward compatibility during migration
enum LeadStatus {
  NEW
  CONTACTED
  QUALIFIED
  QUOTED
  WON
  LOST
}
```

### 2. Lead Model (New/Updated)

```prisma
model Lead {
  id String @id @default(uuid())

  // Pipeline stage (new)
  stage LeadStage @default(INTAKE)

  // Legacy status (temporary, for migration)
  status LeadStatus? // Keep for backward compatibility

  // Lead information
  name        String
  email       String?
  phone       String?
  address     String?
  city        String?
  state       String?
  zip         String?
  description String?

  // Pipeline fields
  estimatedValue Decimal? @db.Decimal(12, 2) // Required before WON
  projectType    String? // Later convert to enum

  // Assignment
  assignedSalesRepId String? // FK to User (sales rep)

  // Award
  awardedProfileId String? // FK to MarketplaceProfile (winning contractor)

  // Project creation (gate enforced server-side)
  projectId String? @unique // FK to Project (created after WON) - one-to-one
  project   Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)

  // Timestamps
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  qualifiedAt DateTime?
  scopedAt    DateTime?
  quotedAt    DateTime?
  wonAt       DateTime?
  lostAt      DateTime?
  lostReason  String?

  // Relationships
  assignedSalesRep User?                @relation("LeadSalesRep", fields: [assignedSalesRepId], references: [id], onDelete: SetNull)
  awardedProfile   MarketplaceProfile?  @relation("LeadAwarded", fields: [awardedProfileId], references: [id], onDelete: SetNull)
  distributedTo    MarketplaceProfile[] @relation("LeadDistribution")
  quotes           Quote[]

  @@index([stage])
  @@index([status]) // Legacy index
  @@index([assignedSalesRepId])
  @@index([awardedProfileId])
  @@index([projectId])
  @@index([createdAt])
  @@index([email])
  @@index([phone])
}
```

### 3. Quote Model (New)

```prisma
model Quote {
  id        String @id @default(uuid())
  leadId    String
  profileId String // FK to MarketplaceProfile (contractor who quoted)

  // Quote details
  amount      Decimal @db.Decimal(12, 2)
  description String?
  timeline    String?
  terms       String?

  // Status
  status String @default("pending") // pending, accepted, rejected, withdrawn

  // Timestamps
  submittedAt DateTime  @default(now())
  acceptedAt  DateTime?
  rejectedAt  DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  lead    Lead              @relation(fields: [leadId], references: [id], onDelete: Cascade)
  profile MarketplaceProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@index([leadId])
  @@index([profileId])
  @@index([status])
  @@index([submittedAt])
}
```

### 4. Updated Models

**User Model** - Added relation:
```prisma
assignedLeads Lead[] @relation("LeadSalesRep")
```

**MarketplaceProfile Model** - Added relations:
```prisma
distributedLeads Lead[] @relation("LeadDistribution")
awardedLeads    Lead[] @relation("LeadAwarded")
quotes           Quote[]
```

**Project Model** - Added relation:
```prisma
lead Lead?
```

## Migration Commands

### Generate Migration

```bash
cd packages/database
pnpm prisma migrate dev --name add_lead_pipeline_fields
```

This will:
1. Create migration file: `prisma/migrations/YYYYMMDDHHMMSS_add_lead_pipeline_fields/migration.sql`
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

The migration will create:

1. **Enums**:
   ```sql
   CREATE TYPE "LeadStage" AS ENUM ('INTAKE', 'QUALIFIED', 'SCOPED', 'QUOTED', 'WON', 'LOST');
   CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'QUOTED', 'WON', 'LOST');
   ```

2. **Lead Table**:
   ```sql
   CREATE TABLE "Lead" (
     "id" TEXT NOT NULL,
     "stage" "LeadStage" NOT NULL DEFAULT 'INTAKE',
     "status" "LeadStatus",
     "name" TEXT NOT NULL,
     "email" TEXT,
     "phone" TEXT,
     "address" TEXT,
     "city" TEXT,
     "state" TEXT,
     "zip" TEXT,
     "description" TEXT,
     "estimatedValue" DECIMAL(12,2),
     "projectType" TEXT,
     "assignedSalesRepId" TEXT,
     "awardedProfileId" TEXT,
     "projectId" TEXT,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL,
     "qualifiedAt" TIMESTAMP(3),
     "scopedAt" TIMESTAMP(3),
     "quotedAt" TIMESTAMP(3),
     "wonAt" TIMESTAMP(3),
     "lostAt" TIMESTAMP(3),
     "lostReason" TEXT,
     CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
   );
   ```

3. **Quote Table**:
   ```sql
   CREATE TABLE "Quote" (
     "id" TEXT NOT NULL,
     "leadId" TEXT NOT NULL,
     "profileId" TEXT NOT NULL,
     "amount" DECIMAL(12,2) NOT NULL,
     "description" TEXT,
     "timeline" TEXT,
     "terms" TEXT,
     "status" TEXT NOT NULL DEFAULT 'pending',
     "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "acceptedAt" TIMESTAMP(3),
     "rejectedAt" TIMESTAMP(3),
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL,
     CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
   );
   ```

4. **Join Table** (many-to-many):
   ```sql
   CREATE TABLE "_LeadDistribution" (
     "A" TEXT NOT NULL,
     "B" TEXT NOT NULL
   );
   ```

5. **Indexes**:
   ```sql
   CREATE INDEX "Lead_stage_idx" ON "Lead"("stage");
   CREATE INDEX "Lead_status_idx" ON "Lead"("status");
   CREATE INDEX "Lead_assignedSalesRepId_idx" ON "Lead"("assignedSalesRepId");
   CREATE INDEX "Lead_awardedProfileId_idx" ON "Lead"("awardedProfileId");
   CREATE INDEX "Lead_projectId_idx" ON "Lead"("projectId");
   CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");
   CREATE INDEX "Lead_email_idx" ON "Lead"("email");
   CREATE INDEX "Lead_phone_idx" ON "Lead"("phone");
   CREATE UNIQUE INDEX "Lead_projectId_key" ON "Lead"("projectId");
   ```

6. **Foreign Keys**:
   ```sql
   ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedSalesRepId_fkey" 
     FOREIGN KEY ("assignedSalesRepId") REFERENCES "User"("id") ON DELETE SET NULL;
   ALTER TABLE "Lead" ADD CONSTRAINT "Lead_awardedProfileId_fkey" 
     FOREIGN KEY ("awardedProfileId") REFERENCES "MarketplaceProfile"("id") ON DELETE SET NULL;
   ALTER TABLE "Lead" ADD CONSTRAINT "Lead_projectId_fkey" 
     FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL;
   ALTER TABLE "Quote" ADD CONSTRAINT "Quote_leadId_fkey" 
     FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE;
   ALTER TABLE "Quote" ADD CONSTRAINT "Quote_profileId_fkey" 
     FOREIGN KEY ("profileId") REFERENCES "MarketplaceProfile"("id") ON DELETE CASCADE;
   ```

## Validation

✅ **Schema Validation**: PASSED
```bash
cd packages/database
pnpm prisma validate
# Result: The schema at prisma\schema.prisma is valid 🚀
```

## Notes

- **Legacy Support**: `LeadStatus` enum kept for backward compatibility during migration
- **One-to-One**: `projectId` is `@unique` to enforce one Lead per Project
- **Server-Side Gate**: `projectId` is nullable; server logic enforces creation only after WON stage
- **Many-to-Many**: `distributedTo` uses implicit join table `_LeadDistribution`
- **Required Before WON**: `estimatedValue` is nullable but should be validated server-side before WON stage

---

**Migration Name**: `add_lead_pipeline_fields`  
**Status**: ✅ Schema Valid, Ready for Migration  
**Date**: January 2026
