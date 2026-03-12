-- =============================================================================
-- KEALEE PLATFORM — ENGAGEMENT HARDENING MIGRATION (ADDITIVE ONLY)
-- =============================================================================
-- Phase:     Schema Hardening v1 — Engagement Canonical Layer
-- Branch:    claude/document-platform-architecture-XLEUw
-- Date:      2026-03-12
-- Author:    Claude Code (schema audit implementation)
--
-- IMPORTANT: All changes are strictly ADDITIVE.
--   • No existing columns are dropped or renamed.
--   • No existing NOT NULL constraints are added to pre-existing columns.
--   • No existing tables are dropped.
--   • All new FK columns are nullable with ON DELETE SET NULL.
--   • All new tables use UUID primary keys consistent with platform convention.
--
-- Apply order matters — new enum types and the engagements table must exist
-- before foreign-key columns are added to existing tables.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- PART 1 — NEW ENUM TYPES
-- ---------------------------------------------------------------------------
-- NOTE: Prisma manages enum types via its own migration runner. These DDL
-- statements are provided as the canonical reference for manual or
-- emergency application. In normal workflow, run:
--   npx prisma migrate dev --name engagement_hardening_v1
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE "OrgType" AS ENUM (
    'OWNER_CLIENT',
    'CONTRACTOR_FIRM',
    'ARCHITECTURE_FIRM',
    'ENGINEERING_FIRM',
    'DESIGN_BUILD',
    'DEVELOPER',
    'INVESTOR',
    'SUBCONTRACTOR',
    'GOVERNMENT',
    'NONPROFIT',
    'KEALEE_INTERNAL',
    'PLATFORM'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "OrgStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'PENDING_REVIEW',
    'ARCHIVED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "VerificationStatus" AS ENUM (
    'UNVERIFIED',
    'PENDING',
    'IN_REVIEW',
    'VERIFIED',
    'REJECTED',
    'SUSPENDED',
    'EXPIRED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ProjectType" AS ENUM (
    'RESIDENTIAL_SINGLE_FAMILY',
    'RESIDENTIAL_MULTI_UNIT',
    'MULTIFAMILY',
    'MIXED_USE',
    'COMMERCIAL_RETAIL',
    'COMMERCIAL_OFFICE',
    'COMMERCIAL_INDUSTRIAL',
    'INSTITUTIONAL',
    'AFFORDABLE_HOUSING',
    'ACCESSORY_DWELLING_UNIT',
    'RENOVATION_REMODEL',
    'NEW_CONSTRUCTION',
    'INFRASTRUCTURE',
    'INTERIOR_ONLY',
    'LANDSCAPE'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ConstructionReadinessStatus" AS ENUM (
    'NOT_STARTED',
    'DESIGN_IN_PROGRESS',
    'PERMITS_PENDING',
    'PERMITS_SUBMITTED',
    'CONSTRUCTION_READY',
    'UNDER_CONSTRUCTION',
    'CONSTRUCTION_COMPLETE',
    'CLOSED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DeliveryModel" AS ENUM (
    'MARKETPLACE',
    'DIRECT',
    'SUBSCRIPTION',
    'SAAS',
    'ONE_TIME_PURCHASE',
    'GOVERNMENT_CONTRACT'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AssignmentMode" AS ENUM (
    'ROTATING_QUEUE',
    'SPONSORED',
    'DIRECT_ASSIGN',
    'OWNER_NOMINATED',
    'SELF_SELECTED',
    'AI_MATCHED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "EngagementType" AS ENUM (
    'MARKETPLACE_PROJECT',
    'PRECON_DESIGN',
    'ARCHITECT_SERVICE',
    'ENGINEER_SERVICE',
    'PM_SERVICE',
    'PERMIT_SERVICE',
    'SOFTWARE',
    'ALACARTE',
    'DEVELOPMENT_SERVICES',
    'GOVERNMENT_CONTRACT',
    'INTERNAL'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "EngagementStatus" AS ENUM (
    'LEAD_CAPTURED',
    'LEAD_QUALIFIED',
    'PROPOSAL_SENT',
    'BIDDING_OPEN',
    'BID_EVALUATION',
    'AWARDED',
    'CONTRACT_PENDING',
    'CONTRACT_ACTIVE',
    'TRIAL',
    'SUBSCRIPTION_ACTIVE',
    'SUBSCRIPTION_PAUSED',
    'SUBSCRIPTION_CANCELLED',
    'COMPLETED',
    'LOST',
    'ARCHIVED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- PART 2 — NEW TABLES
-- ---------------------------------------------------------------------------

-- 2a. engagements — canonical commercial-relationship anchor
CREATE TABLE IF NOT EXISTS "engagements" (
  "id"                   TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "type"                 "EngagementType"  NOT NULL,
  "status"               "EngagementStatus" NOT NULL DEFAULT 'LEAD_CAPTURED',
  "deliveryModel"        "DeliveryModel"   NOT NULL,
  "assignmentMode"       "AssignmentMode"  NOT NULL DEFAULT 'ROTATING_QUEUE',

  -- Participants
  "initiatorUserId"      TEXT,
  "initiatorOrgId"       TEXT,
  "assignedToUserId"     TEXT,
  "awardedToUserId"      TEXT,

  -- Subject
  "projectId"            TEXT,
  "servicePlanId"        TEXT,

  -- Financials
  "totalValue"           DECIMAL(14,2),
  "currency"             TEXT         NOT NULL DEFAULT 'USD',

  -- Source attribution
  "sourceLeadId"         TEXT,
  "sourceFunnelId"       TEXT,
  "sourceCampaignSlug"   TEXT,
  "referralCode"         TEXT,

  -- UTM tracking
  "utmSource"            TEXT,
  "utmMedium"            TEXT,
  "utmCampaign"          TEXT,
  "utmContent"           TEXT,
  "utmTerm"              TEXT,

  -- Lifecycle timestamps
  "leadCapturedAt"       TIMESTAMP(3),
  "leadQualifiedAt"      TIMESTAMP(3),
  "proposalSentAt"       TIMESTAMP(3),
  "awardedAt"            TIMESTAMP(3),
  "contractSignedAt"     TIMESTAMP(3),
  "completedAt"          TIMESTAMP(3),
  "cancelledAt"          TIMESTAMP(3),
  "archivedAt"           TIMESTAMP(3),

  -- Metadata
  "metadata"             JSONB,

  -- Timestamps
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "engagements_pkey" PRIMARY KEY ("id"),

  CONSTRAINT "engagements_initiatorUserId_fkey"
    FOREIGN KEY ("initiatorUserId") REFERENCES "User"("id") ON DELETE SET NULL,

  CONSTRAINT "engagements_initiatorOrgId_fkey"
    FOREIGN KEY ("initiatorOrgId") REFERENCES "Org"("id") ON DELETE SET NULL,

  CONSTRAINT "engagements_assignedToUserId_fkey"
    FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL,

  CONSTRAINT "engagements_awardedToUserId_fkey"
    FOREIGN KEY ("awardedToUserId") REFERENCES "User"("id") ON DELETE SET NULL,

  CONSTRAINT "engagements_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL,

  CONSTRAINT "engagements_servicePlanId_fkey"
    FOREIGN KEY ("servicePlanId") REFERENCES "ServicePlan"("id") ON DELETE SET NULL
);

-- 2b. engagement_notes
CREATE TABLE IF NOT EXISTS "engagement_notes" (
  "id"           TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "engagementId" TEXT        NOT NULL,
  "authorId"     TEXT        NOT NULL,
  "content"      TEXT        NOT NULL,
  "isInternal"   BOOLEAN     NOT NULL DEFAULT true,
  "metadata"     JSONB,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "engagement_notes_pkey" PRIMARY KEY ("id"),

  CONSTRAINT "engagement_notes_engagementId_fkey"
    FOREIGN KEY ("engagementId") REFERENCES "engagements"("id") ON DELETE CASCADE,

  CONSTRAINT "engagement_notes_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT
);

-- 2c. engagement_activities
CREATE TABLE IF NOT EXISTS "engagement_activities" (
  "id"           TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "engagementId" TEXT        NOT NULL,
  "actorId"      TEXT,
  "actorOrgId"   TEXT,
  "action"       TEXT        NOT NULL,
  "fromStatus"   "EngagementStatus",
  "toStatus"     "EngagementStatus",
  "description"  TEXT,
  "metadata"     JSONB,
  "occurredAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "engagement_activities_pkey" PRIMARY KEY ("id"),

  CONSTRAINT "engagement_activities_engagementId_fkey"
    FOREIGN KEY ("engagementId") REFERENCES "engagements"("id") ON DELETE CASCADE,

  CONSTRAINT "engagement_activities_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL,

  CONSTRAINT "engagement_activities_actorOrgId_fkey"
    FOREIGN KEY ("actorOrgId") REFERENCES "Org"("id") ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- PART 3 — NEW COLUMNS ON EXISTING TABLES (all nullable, additive only)
-- ---------------------------------------------------------------------------

-- 3a. Org — classification fields
ALTER TABLE "Org"
  ADD COLUMN IF NOT EXISTS "orgType"   "OrgType",
  ADD COLUMN IF NOT EXISTS "orgStatus" "OrgStatus",
  ADD COLUMN IF NOT EXISTS "website"   TEXT,
  ADD COLUMN IF NOT EXISTS "phone"     TEXT;

-- 3b. Project — canonical classification
ALTER TABLE "Project"
  ADD COLUMN IF NOT EXISTS "projectType"           "ProjectType",
  ADD COLUMN IF NOT EXISTS "constructionReadiness" "ConstructionReadinessStatus";

-- 3c. Lead — engagement linkage
ALTER TABLE "Lead"
  ADD COLUMN IF NOT EXISTS "engagementId" TEXT,
  ADD CONSTRAINT "Lead_engagementId_fkey"
    FOREIGN KEY ("engagementId") REFERENCES "engagements"("id") ON DELETE SET NULL;

-- 3d. Quote — engagement linkage
ALTER TABLE "Quote"
  ADD COLUMN IF NOT EXISTS "engagementId" TEXT,
  ADD CONSTRAINT "Quote_engagementId_fkey"
    FOREIGN KEY ("engagementId") REFERENCES "engagements"("id") ON DELETE SET NULL;

-- 3e. BidSubmission — engagement linkage
ALTER TABLE "BidSubmission"
  ADD COLUMN IF NOT EXISTS "engagementId" TEXT,
  ADD CONSTRAINT "BidSubmission_engagementId_fkey"
    FOREIGN KEY ("engagementId") REFERENCES "engagements"("id") ON DELETE SET NULL;

-- 3f. ContractAgreement — engagement linkage
ALTER TABLE "ContractAgreement"
  ADD COLUMN IF NOT EXISTS "engagementId" TEXT,
  ADD CONSTRAINT "ContractAgreement_engagementId_fkey"
    FOREIGN KEY ("engagementId") REFERENCES "engagements"("id") ON DELETE SET NULL;

-- 3g. PMServiceSubscription — engagement linkage
ALTER TABLE "PMServiceSubscription"
  ADD COLUMN IF NOT EXISTS "engagementId" TEXT,
  ADD CONSTRAINT "PMServiceSubscription_engagementId_fkey"
    FOREIGN KEY ("engagementId") REFERENCES "engagements"("id") ON DELETE SET NULL;

-- 3h. PermitServiceSubscription — engagement linkage
ALTER TABLE "PermitServiceSubscription"
  ADD COLUMN IF NOT EXISTS "engagementId" TEXT,
  ADD CONSTRAINT "PermitServiceSubscription_engagementId_fkey"
    FOREIGN KEY ("engagementId") REFERENCES "engagements"("id") ON DELETE SET NULL;

-- 3i. ALaCarteService — engagement linkage
ALTER TABLE "ALaCarteService"
  ADD COLUMN IF NOT EXISTS "engagementId" TEXT,
  ADD CONSTRAINT "ALaCarteService_engagementId_fkey"
    FOREIGN KEY ("engagementId") REFERENCES "engagements"("id") ON DELETE SET NULL;

-- 3j. software_subscriptions — engagement linkage
ALTER TABLE "software_subscriptions"
  ADD COLUMN IF NOT EXISTS "engagementId" TEXT,
  ADD CONSTRAINT "software_subscriptions_engagementId_fkey"
    FOREIGN KEY ("engagementId") REFERENCES "engagements"("id") ON DELETE SET NULL;

-- 3k. ConceptPackageOrder — engagement linkage
-- (table name: check actual mapped name — likely "ConceptPackageOrder")
ALTER TABLE "ConceptPackageOrder"
  ADD COLUMN IF NOT EXISTS "engagementId" TEXT,
  ADD CONSTRAINT "ConceptPackageOrder_engagementId_fkey"
    FOREIGN KEY ("engagementId") REFERENCES "engagements"("id") ON DELETE SET NULL;

-- 3l. PlatformFee — engagement linkage
ALTER TABLE "PlatformFee"
  ADD COLUMN IF NOT EXISTS "engagementId" TEXT,
  ADD CONSTRAINT "PlatformFee_engagementId_fkey"
    FOREIGN KEY ("engagementId") REFERENCES "engagements"("id") ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- PART 4 — INDEXES
-- ---------------------------------------------------------------------------

-- engagements
CREATE INDEX IF NOT EXISTS "engagements_initiatorUserId_idx"
  ON "engagements"("initiatorUserId");
CREATE INDEX IF NOT EXISTS "engagements_initiatorOrgId_idx"
  ON "engagements"("initiatorOrgId");
CREATE INDEX IF NOT EXISTS "engagements_projectId_idx"
  ON "engagements"("projectId");
CREATE INDEX IF NOT EXISTS "engagements_type_idx"
  ON "engagements"("type");
CREATE INDEX IF NOT EXISTS "engagements_status_idx"
  ON "engagements"("status");
CREATE INDEX IF NOT EXISTS "engagements_type_status_idx"
  ON "engagements"("type", "status");
CREATE INDEX IF NOT EXISTS "engagements_status_createdAt_idx"
  ON "engagements"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "engagements_awardedToUserId_idx"
  ON "engagements"("awardedToUserId");

-- engagement_notes
CREATE INDEX IF NOT EXISTS "engagement_notes_engagementId_idx"
  ON "engagement_notes"("engagementId");
CREATE INDEX IF NOT EXISTS "engagement_notes_authorId_idx"
  ON "engagement_notes"("authorId");

-- engagement_activities
CREATE INDEX IF NOT EXISTS "engagement_activities_engagementId_idx"
  ON "engagement_activities"("engagementId");
CREATE INDEX IF NOT EXISTS "engagement_activities_occurredAt_idx"
  ON "engagement_activities"("occurredAt");

-- Org classification indexes
CREATE INDEX IF NOT EXISTS "Org_orgType_idx"
  ON "Org"("orgType");
CREATE INDEX IF NOT EXISTS "Org_orgStatus_idx"
  ON "Org"("orgStatus");

-- Project classification indexes
CREATE INDEX IF NOT EXISTS "Project_projectType_idx"
  ON "Project"("projectType");
CREATE INDEX IF NOT EXISTS "Project_constructionReadiness_idx"
  ON "Project"("constructionReadiness");

-- FK indexes on existing tables
CREATE INDEX IF NOT EXISTS "Lead_engagementId_idx"           ON "Lead"("engagementId");
CREATE INDEX IF NOT EXISTS "Quote_engagementId_idx"          ON "Quote"("engagementId");
CREATE INDEX IF NOT EXISTS "BidSubmission_engagementId_idx"  ON "BidSubmission"("engagementId");
CREATE INDEX IF NOT EXISTS "ContractAgreement_engagementId_idx" ON "ContractAgreement"("engagementId");
CREATE INDEX IF NOT EXISTS "PMServiceSubscription_engagementId_idx"     ON "PMServiceSubscription"("engagementId");
CREATE INDEX IF NOT EXISTS "PermitServiceSubscription_engagementId_idx" ON "PermitServiceSubscription"("engagementId");
CREATE INDEX IF NOT EXISTS "ALaCarteService_engagementId_idx"            ON "ALaCarteService"("engagementId");
CREATE INDEX IF NOT EXISTS "software_subscriptions_engagementId_idx"    ON "software_subscriptions"("engagementId");
CREATE INDEX IF NOT EXISTS "ConceptPackageOrder_engagementId_idx"        ON "ConceptPackageOrder"("engagementId");
CREATE INDEX IF NOT EXISTS "PlatformFee_engagementId_idx"                ON "PlatformFee"("engagementId");

-- ---------------------------------------------------------------------------
-- PART 5 — updatedAt trigger for new tables (matches platform convention)
-- ---------------------------------------------------------------------------
-- The platform uses Prisma's @updatedAt which sets the value in application
-- code. If running raw SQL outside Prisma, add DB-level triggers:

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
  CREATE TRIGGER "engagements_updated_at"
    BEFORE UPDATE ON "engagements"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER "engagement_notes_updated_at"
    BEFORE UPDATE ON "engagement_notes"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;

-- =============================================================================
-- ROLLBACK SCRIPT (for emergency use only — see docs for consequences)
-- =============================================================================
-- To roll back ONLY the new tables and new columns (preserves enums):
--
-- BEGIN;
-- ALTER TABLE "PlatformFee"              DROP COLUMN IF EXISTS "engagementId";
-- ALTER TABLE "ConceptPackageOrder"      DROP COLUMN IF EXISTS "engagementId";
-- ALTER TABLE "software_subscriptions"   DROP COLUMN IF EXISTS "engagementId";
-- ALTER TABLE "ALaCarteService"          DROP COLUMN IF EXISTS "engagementId";
-- ALTER TABLE "PermitServiceSubscription" DROP COLUMN IF EXISTS "engagementId";
-- ALTER TABLE "PMServiceSubscription"    DROP COLUMN IF EXISTS "engagementId";
-- ALTER TABLE "ContractAgreement"        DROP COLUMN IF EXISTS "engagementId";
-- ALTER TABLE "BidSubmission"            DROP COLUMN IF EXISTS "engagementId";
-- ALTER TABLE "Quote"                    DROP COLUMN IF EXISTS "engagementId";
-- ALTER TABLE "Lead"                     DROP COLUMN IF EXISTS "engagementId";
-- ALTER TABLE "Project" DROP COLUMN IF EXISTS "constructionReadiness";
-- ALTER TABLE "Project" DROP COLUMN IF EXISTS "projectType";
-- ALTER TABLE "Org" DROP COLUMN IF EXISTS "phone";
-- ALTER TABLE "Org" DROP COLUMN IF EXISTS "website";
-- ALTER TABLE "Org" DROP COLUMN IF EXISTS "orgStatus";
-- ALTER TABLE "Org" DROP COLUMN IF EXISTS "orgType";
-- DROP TABLE IF EXISTS "engagement_activities";
-- DROP TABLE IF EXISTS "engagement_notes";
-- DROP TABLE IF EXISTS "engagements";
-- -- Do NOT drop enum types as other code may reference them after deployment.
-- COMMIT;
-- =============================================================================
