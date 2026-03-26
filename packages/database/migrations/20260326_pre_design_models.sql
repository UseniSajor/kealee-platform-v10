-- AI Pre-Design Models Migration
-- Generated: 2026-03-26
-- Run against Railway PostgreSQL

-- Enums
DO $$ BEGIN
  CREATE TYPE "PreDesignProjectType" AS ENUM ('INTERIOR_ADDITION', 'EXTERIOR_FACADE', 'LANDSCAPE_OUTDOOR');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "PreDesignTier" AS ENUM ('STARTER', 'VISUALIZATION', 'PRE_DESIGN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "PreDesignStatus" AS ENUM ('DRAFT', 'PENDING_PAYMENT', 'PROCESSING', 'COMPLETED', 'FAILED', 'ARCHITECT_ROUTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "PreDesignCaptureMode" AS ENUM ('PHOTOS', 'SMARTSCAN', 'PRO_SCAN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ExecutionRoute" AS ENUM ('AI_ONLY', 'ARCHITECT_RECOMMENDED', 'ARCHITECT_REQUIRED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ArchitectEngagementStatus" AS ENUM ('NEW', 'MATCHING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ProjectConceptPreDesign
CREATE TABLE IF NOT EXISTS "ProjectConceptPreDesign" (
  "id"                   TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "projectId"            TEXT,
  "intakeId"             TEXT,
  "projectType"          "PreDesignProjectType" NOT NULL,
  "tier"                 "PreDesignTier" NOT NULL,
  "status"               "PreDesignStatus" NOT NULL DEFAULT 'DRAFT',
  "captureMode"          "PreDesignCaptureMode",
  "captureQualityScore"  INTEGER,
  "confidenceScore"      DOUBLE PRECISION,
  "complexityScore"      DOUBLE PRECISION,
  "requiresArchitect"    BOOLEAN NOT NULL DEFAULT false,
  "architectRouted"      BOOLEAN NOT NULL DEFAULT false,
  "executionRoute"       "ExecutionRoute",
  "conceptSummary"       JSONB,
  "styleProfile"         JSONB,
  "budgetRange"          JSONB,
  "feasibilitySummary"   JSONB,
  "zoningSummary"        JSONB,
  "buildabilitySummary"  JSONB,
  "scopeOfWork"          JSONB,
  "systemsImpact"        JSONB,
  "estimateFramework"    JSONB,
  "outputImages"         JSONB,
  "outputVideoUrl"       TEXT,
  "outputPdfUrl"         TEXT,
  "outputJsonUrl"        TEXT,
  "outputDxfUrl"         TEXT,
  "outputSketchupUrl"    TEXT,
  "stripeSessionId"      TEXT,
  "stripePaymentId"      TEXT,
  "pricePaidCents"       INTEGER,
  "exportPackageVersion" INTEGER NOT NULL DEFAULT 1,
  "createdAt"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ProjectConceptPreDesign_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProjectConceptPreDesign_projectId_idx" ON "ProjectConceptPreDesign"("projectId");
CREATE INDEX IF NOT EXISTS "ProjectConceptPreDesign_intakeId_idx"  ON "ProjectConceptPreDesign"("intakeId");
CREATE INDEX IF NOT EXISTS "ProjectConceptPreDesign_status_idx"    ON "ProjectConceptPreDesign"("status");
CREATE INDEX IF NOT EXISTS "ProjectConceptPreDesign_tier_idx"      ON "ProjectConceptPreDesign"("tier");

-- ArchitectEngagement
CREATE TABLE IF NOT EXISTS "ArchitectEngagement" (
  "id"                   TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "projectId"            TEXT,
  "preDesignId"          TEXT NOT NULL,
  "status"               "ArchitectEngagementStatus" NOT NULL DEFAULT 'NEW',
  "intakePackageUrl"     TEXT,
  "intakeSummary"        JSONB,
  "targetSoftware"       JSONB,
  "estimatedPriceRange"  JSONB,
  "assignedArchitectId"  TEXT,
  "assignedAt"           TIMESTAMPTZ,
  "notes"                TEXT,
  "metadata"             JSONB,
  "createdAt"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ArchitectEngagement_pkey"          PRIMARY KEY ("id"),
  CONSTRAINT "ArchitectEngagement_preDesignId_key" UNIQUE ("preDesignId"),
  CONSTRAINT "ArchitectEngagement_preDesignId_fkey"
    FOREIGN KEY ("preDesignId") REFERENCES "ProjectConceptPreDesign"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ArchitectEngagement_projectId_idx" ON "ArchitectEngagement"("projectId");
CREATE INDEX IF NOT EXISTS "ArchitectEngagement_status_idx"    ON "ArchitectEngagement"("status");
