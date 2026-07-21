-- P10: Construction OS Expansion
-- Migration: 20260314000002_p10_construction_os
-- Adds: OSFeatureTier enum, ConstructionOSFeature, ProjectOSAccess

DO $$ BEGIN
  CREATE TYPE "OSFeatureTier" AS ENUM ('STANDARD', 'PRO', 'ENTERPRISE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ── ConstructionOSFeature ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "construction_os_features" (
    "id"          TEXT           NOT NULL,
    "slug"        TEXT           NOT NULL,
    "name"        TEXT           NOT NULL,
    "description" TEXT,
    "phase"       INTEGER        NOT NULL DEFAULT 1,
    "tier"        "OSFeatureTier" NOT NULL DEFAULT 'STANDARD',
    "isEnabled"   BOOLEAN        NOT NULL DEFAULT TRUE,
    "createdAt"   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    "updatedAt"   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT "construction_os_features_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "construction_os_features_slug_key"
  ON "construction_os_features"("slug");

CREATE INDEX IF NOT EXISTS "construction_os_features_phase_idx"     ON "construction_os_features"("phase");
CREATE INDEX IF NOT EXISTS "construction_os_features_tier_idx"      ON "construction_os_features"("tier");
CREATE INDEX IF NOT EXISTS "construction_os_features_isEnabled_idx" ON "construction_os_features"("isEnabled");

-- ── ProjectOSAccess ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "project_os_access" (
    "id"            TEXT            NOT NULL,
    "projectId"     TEXT            NOT NULL,
    "orgId"         TEXT,
    "phase"         INTEGER         NOT NULL DEFAULT 1,
    "tier"          "OSFeatureTier" NOT NULL DEFAULT 'STANDARD',
    "enabledSlugs"  TEXT[]          NOT NULL DEFAULT ARRAY[]::TEXT[],
    "disabledSlugs" TEXT[]          NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt"     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "updatedAt"     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT "project_os_access_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "project_os_access_projectId_key"
  ON "project_os_access"("projectId");

CREATE INDEX IF NOT EXISTS "project_os_access_orgId_idx" ON "project_os_access"("orgId");
CREATE INDEX IF NOT EXISTS "project_os_access_phase_idx" ON "project_os_access"("phase");
