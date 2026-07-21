-- P9: National Marketplace Launch System
-- Migration: 20260314000001_p9_marketplace_launch
-- Adds: ContractorOnboarding, ServiceRegion, MarketplaceLaunchConfig, LaunchCohort

-- ── Enums ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "ContractorOnboardingStage" AS ENUM (
    'REGISTRATION',
    'EMAIL_VERIFIED',
    'PROFILE_BASIC',
    'PROFILE_SERVICES',
    'DOCUMENTS_UPLOADED',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'ACTIVE'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ── LaunchCohort (no FK deps, create first) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS "launch_cohorts" (
    "id"          TEXT         NOT NULL,
    "name"        TEXT         NOT NULL,
    "regionSlug"  TEXT         NOT NULL,
    "targetSize"  INTEGER      NOT NULL DEFAULT 25,
    "currentSize" INTEGER      NOT NULL DEFAULT 0,
    "openedAt"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "closedAt"    TIMESTAMPTZ,
    "isActive"    BOOLEAN      NOT NULL DEFAULT TRUE,
    "inviteCode"  TEXT,
    "notes"       TEXT,
    "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT "launch_cohorts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "launch_cohorts_inviteCode_key"
  ON "launch_cohorts"("inviteCode");

CREATE INDEX IF NOT EXISTS "launch_cohorts_regionSlug_idx"  ON "launch_cohorts"("regionSlug");
CREATE INDEX IF NOT EXISTS "launch_cohorts_isActive_idx"    ON "launch_cohorts"("isActive");

-- ── ContractorOnboarding ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "contractor_onboardings" (
    "id"                TEXT                        NOT NULL,
    "userId"            TEXT                        NOT NULL,
    "email"             TEXT                        NOT NULL,
    "stage"             "ContractorOnboardingStage" NOT NULL DEFAULT 'REGISTRATION',
    "completedStages"   TEXT[]                      NOT NULL DEFAULT ARRAY[]::TEXT[],
    "profileId"         TEXT,
    "formData"          JSONB                       NOT NULL DEFAULT '{}',
    "inviteSource"      TEXT,
    "inviteCode"        TEXT,
    "cohortId"          TEXT,
    "assignedRegion"    TEXT,
    "approvedAt"        TIMESTAMPTZ,
    "rejectedAt"        TIMESTAMPTZ,
    "rejectionReason"   TEXT,
    "lastActivityAt"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "completedAt"       TIMESTAMPTZ,
    "createdAt"         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updatedAt"         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT "contractor_onboardings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "contractor_onboardings_userId_key"
  ON "contractor_onboardings"("userId");

CREATE INDEX IF NOT EXISTS "contractor_onboardings_stage_idx"          ON "contractor_onboardings"("stage");
CREATE INDEX IF NOT EXISTS "contractor_onboardings_cohortId_idx"       ON "contractor_onboardings"("cohortId");
CREATE INDEX IF NOT EXISTS "contractor_onboardings_assignedRegion_idx" ON "contractor_onboardings"("assignedRegion");
CREATE INDEX IF NOT EXISTS "contractor_onboardings_createdAt_idx"      ON "contractor_onboardings"("createdAt");

ALTER TABLE "contractor_onboardings"
  ADD CONSTRAINT "contractor_onboardings_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "contractor_onboardings"
  ADD CONSTRAINT "contractor_onboardings_cohortId_fkey"
    FOREIGN KEY ("cohortId") REFERENCES "launch_cohorts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── ServiceRegion ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "service_regions" (
    "id"                      TEXT         NOT NULL,
    "name"                    TEXT         NOT NULL,
    "slug"                    TEXT         NOT NULL,
    "cities"                  TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
    "states"                  TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
    "zipCodes"                TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
    "isLaunched"              BOOLEAN      NOT NULL DEFAULT FALSE,
    "launchedAt"              TIMESTAMPTZ,
    "isActive"                BOOLEAN      NOT NULL DEFAULT TRUE,
    "targetContractorCount"   INTEGER      NOT NULL DEFAULT 50,
    "currentContractorCount"  INTEGER      NOT NULL DEFAULT 0,
    "targetLeadsPerWeek"      INTEGER      NOT NULL DEFAULT 20,
    "costIndexMultiplier"     DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "timezone"                TEXT         NOT NULL DEFAULT 'America/New_York',
    "notes"                   TEXT,
    "createdAt"               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updatedAt"               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT "service_regions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "service_regions_name_key" ON "service_regions"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "service_regions_slug_key" ON "service_regions"("slug");

-- ── MarketplaceLaunchConfig ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "marketplace_launch_config" (
    "id"          TEXT         NOT NULL,
    "key"         TEXT         NOT NULL,
    "value"       JSONB        NOT NULL,
    "description" TEXT,
    "category"    TEXT         NOT NULL DEFAULT 'general',
    "isActive"    BOOLEAN      NOT NULL DEFAULT TRUE,
    "updatedBy"   TEXT,
    "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT "marketplace_launch_config_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "marketplace_launch_config_key_key"
  ON "marketplace_launch_config"("key");

CREATE INDEX IF NOT EXISTS "marketplace_launch_config_category_idx"
  ON "marketplace_launch_config"("category");
