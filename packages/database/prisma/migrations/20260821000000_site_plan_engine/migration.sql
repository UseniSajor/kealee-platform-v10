-- Site Plan Engine — Prince George's County
--
-- These tables already existed in schema.prisma but appeared in no migration, so
-- they were never created in any database. This migration brings the database in
-- line with the schema and adds the provenance columns the reliability model
-- needs.
--
-- ADDITIVE AND NON-DESTRUCTIVE. Creates new types and tables only. It drops
-- nothing, alters no existing column, and touches no existing row. Every
-- statement is IF NOT EXISTS so it is safe to re-run.

-- ── Enums ───────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "SiteAccuracyClass" AS ENUM ('SURVEY_GRADE','MAPPING_GRADE','APPROXIMATE','SCHEMATIC','UNKNOWN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SiteSourceDatasetType" AS ENUM ('SURVEY','PARCEL','ZONING','EASEMENT','FLOOD','WETLAND','UTILITY','TOPO','LIDAR','SOILS','AERIAL','USER_UPLOAD');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SiteConstraintType" AS ENUM ('PROPERTY_LINE','SETBACK','EASEMENT','FLOODPLAIN','WETLAND','BUFFER','UTILITY','RIGHT_OF_WAY','CRITICAL_AREA','SLOPE_LIMIT','EXCLUSION_ZONE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SiteConstraintSeverity" AS ENUM ('INFORMATIONAL','WARNING','BLOCKING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SitePlanStageCode" AS ENUM ('PARCEL_RESOLUTION','DOCUMENT_COLLECTION','FEASIBILITY','PLAN_GENERATION','COMPLIANCE_AUDIT','PROFESSIONAL_REVIEW','SUBMITTED_TO_JURISDICTION','SUBMISSION_CORRECTIONS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SitePlanStageStatus" AS ENUM ('NOT_STARTED','READY','IN_PROGRESS','BLOCKED','AWAITING_REVIEW','APPROVED','REJECTED','COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ComplianceOutcome" AS ENUM ('PASS','WARNING','FAIL','NOT_APPLICABLE','MISSING_DATA','PROFESSIONAL_DETERMINATION_REQUIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ProfessionalReviewDecision" AS ENUM ('PENDING','CHANGES_REQUESTED','APPROVED','REJECTED','SUPERSEDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "JurisdictionRuleKind" AS ENUM ('CHECK','INPUT_SCHEMA','SOURCE_REGISTRY','COMPILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Versioned jurisdiction rule packs ────────────────────────────────────────
-- Every rule carries its source URL, effective date and last-verified date so no
-- requirement is ever hard-coded without explanation.

CREATE TABLE IF NOT EXISTS "jurisdiction_rule_versions" (
  "id"                  TEXT PRIMARY KEY,
  "jurisdictionCode"    TEXT NOT NULL,
  "agency"              TEXT NOT NULL,
  "ruleKey"             TEXT NOT NULL,
  "version"             INTEGER NOT NULL,
  "kind"                "JurisdictionRuleKind" NOT NULL DEFAULT 'CHECK',
  "projectTypes"        TEXT[] NOT NULL DEFAULT '{}',
  "permitTypes"         TEXT[] NOT NULL DEFAULT '{}',
  "applicability"       JSONB NOT NULL,
  "requirements"        JSONB NOT NULL,
  "sourceUrl"           TEXT NOT NULL,
  "sourceTitle"         TEXT NOT NULL,
  "effectiveDate"       TIMESTAMP(3),
  "lastVerifiedAt"      TIMESTAMP(3) NOT NULL,
  "supersededAt"        TIMESTAMP(3),
  "confidence"          DECIMAL(5,4) NOT NULL,
  "humanReviewRequired" BOOLEAN NOT NULL DEFAULT false,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "jurisdiction_rule_versions_key" ON "jurisdiction_rule_versions"("jurisdictionCode","ruleKey","version");
CREATE INDEX IF NOT EXISTS "jurisdiction_rule_versions_active_idx" ON "jurisdiction_rule_versions"("jurisdictionCode","supersededAt");
CREATE INDEX IF NOT EXISTS "jurisdiction_rule_versions_kind_idx" ON "jurisdiction_rule_versions"("jurisdictionCode","kind","supersededAt");
CREATE INDEX IF NOT EXISTS "jurisdiction_rule_versions_agency_idx" ON "jurisdiction_rule_versions"("agency");

-- ── Site source datasets ────────────────────────────────────────────────────
-- reliabilityLevel: 0 unverified, 1 preliminary GIS/LiDAR, 2 professional.
-- verticalDatum NULL is meaningful — most parcel/zoning layers carry no elevation.

CREATE TABLE IF NOT EXISTS "site_source_datasets" (
  "id"                        TEXT PRIMARY KEY,
  "organizationId"            TEXT NOT NULL,
  "projectId"                 TEXT NOT NULL,
  "parcelId"                  TEXT,
  "type"                      "SiteSourceDatasetType" NOT NULL,
  "provider"                  TEXT NOT NULL,
  "sourceUrl"                 TEXT,
  "license"                   TEXT,
  "retrievedAt"               TIMESTAMP(3) NOT NULL,
  "effectiveDate"             TIMESTAMP(3),
  "crs"                       TEXT NOT NULL,
  "linearUnit"                TEXT NOT NULL,
  "horizontalDatum"           TEXT,
  "verticalDatum"             TEXT,
  "accuracyClass"             "SiteAccuracyClass" NOT NULL DEFAULT 'UNKNOWN',
  "reliabilityLevel"          INTEGER NOT NULL DEFAULT 1,
  "responsibleProfessionalId" TEXT,
  "checksum"                  TEXT NOT NULL,
  "confidence"                DECIMAL(5,4) NOT NULL,
  "rawArtifactId"             TEXT,
  "metadata"                  JSONB,
  "version"                   INTEGER NOT NULL DEFAULT 1,
  "supersedesId"              TEXT,
  "createdBy"                 TEXT NOT NULL,
  "createdAt"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "site_source_datasets_reliability_range" CHECK ("reliabilityLevel" BETWEEN 0 AND 2)
);
CREATE UNIQUE INDEX IF NOT EXISTS "site_source_datasets_dedupe" ON "site_source_datasets"("organizationId","projectId","type","checksum");
CREATE INDEX IF NOT EXISTS "site_source_datasets_project_idx" ON "site_source_datasets"("organizationId","projectId","type");
CREATE INDEX IF NOT EXISTS "site_source_datasets_parcel_idx" ON "site_source_datasets"("parcelId","effectiveDate");

-- ── Site constraints ────────────────────────────────────────────────────────
-- GeoJSON is the versioned business record; PostGIS may project it for indexing.

CREATE TABLE IF NOT EXISTS "site_constraints" (
  "id"              TEXT PRIMARY KEY,
  "organizationId"  TEXT NOT NULL,
  "projectId"       TEXT NOT NULL,
  "parcelId"        TEXT,
  "sourceDatasetId" TEXT,
  "type"            "SiteConstraintType" NOT NULL,
  "geometryGeoJson" JSONB NOT NULL,
  "crs"             TEXT NOT NULL,
  "linearUnit"      TEXT NOT NULL,
  "ruleReference"   TEXT,
  "severity"        "SiteConstraintSeverity" NOT NULL DEFAULT 'WARNING',
  "confidence"      DECIMAL(5,4) NOT NULL,
  "effectiveDate"   TIMESTAMP(3),
  "metadata"        JSONB,
  "version"         INTEGER NOT NULL DEFAULT 1,
  "supersedesId"    TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "site_constraints_project_idx" ON "site_constraints"("organizationId","projectId","type");
CREATE INDEX IF NOT EXISTS "site_constraints_parcel_idx" ON "site_constraints"("parcelId","severity");
CREATE INDEX IF NOT EXISTS "site_constraints_source_idx" ON "site_constraints"("sourceDatasetId");

-- ── Terrain ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "site_terrain_models" (
  "id"                    TEXT PRIMARY KEY,
  "organizationId"        TEXT NOT NULL,
  "projectId"             TEXT NOT NULL,
  "parcelId"              TEXT,
  "sourceDatasetId"       TEXT NOT NULL,
  "crs"                   TEXT NOT NULL,
  "linearUnit"            TEXT NOT NULL,
  "demArtifactId"         TEXT,
  "pointCloudArtifactId"  TEXT,
  "slopeRasterArtifactId" TEXT,
  "contourArtifactId"     TEXT,
  "contourInterval"       DECIMAL(10,3),
  "surfaceStatistics"     JSONB NOT NULL,
  "processingVersion"     TEXT NOT NULL,
  "confidence"            DECIMAL(5,4) NOT NULL,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "site_terrain_models_project_idx" ON "site_terrain_models"("organizationId","projectId");
CREATE INDEX IF NOT EXISTS "site_terrain_models_parcel_idx" ON "site_terrain_models"("parcelId");
CREATE INDEX IF NOT EXISTS "site_terrain_models_source_idx" ON "site_terrain_models"("sourceDatasetId");

-- ── Workflow ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "site_plan_workflows" (
  "id"                         TEXT PRIMARY KEY,
  "organizationId"             TEXT NOT NULL,
  "projectId"                  TEXT NOT NULL,
  "propertyId"                 TEXT,
  "parcelId"                   TEXT,
  "productId"                  TEXT,
  "currentStage"               "SitePlanStageCode" NOT NULL DEFAULT 'PARCEL_RESOLUTION',
  "status"                     TEXT NOT NULL DEFAULT 'ACTIVE',
  "version"                    INTEGER NOT NULL DEFAULT 0,
  "professionalReviewRequired" BOOLEAN NOT NULL DEFAULT true,
  "releasedAt"                 TIMESTAMP(3),
  "metadata"                   JSONB,
  "createdAt"                  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "site_plan_workflows_project" ON "site_plan_workflows"("organizationId","projectId");
CREATE INDEX IF NOT EXISTS "site_plan_workflows_status_idx" ON "site_plan_workflows"("organizationId","status","updatedAt");

CREATE TABLE IF NOT EXISTS "site_plan_stage_executions" (
  "id"              TEXT PRIMARY KEY,
  "workflowId"      TEXT NOT NULL,
  "stage"           "SitePlanStageCode" NOT NULL,
  "status"          "SitePlanStageStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "attempt"         INTEGER NOT NULL DEFAULT 1,
  "prerequisites"   JSONB NOT NULL,
  "inputs"          JSONB,
  "outputs"         JSONB,
  "blockers"        JSONB,
  "assignedPartyId" TEXT,
  "startedAt"       TIMESTAMP(3),
  "completedAt"     TIMESTAMP(3),
  "reviewedById"    TEXT,
  "reviewedAt"      TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "site_plan_stage_executions_attempt" ON "site_plan_stage_executions"("workflowId","stage","attempt");
CREATE INDEX IF NOT EXISTS "site_plan_stage_executions_stage_idx" ON "site_plan_stage_executions"("workflowId","stage","status");
CREATE INDEX IF NOT EXISTS "site_plan_stage_executions_status_idx" ON "site_plan_stage_executions"("status","updatedAt");

CREATE TABLE IF NOT EXISTS "site_plan_compliance_results" (
  "id"                    TEXT PRIMARY KEY,
  "workflowId"            TEXT NOT NULL,
  "stageExecutionId"      TEXT NOT NULL,
  "ruleVersionId"         TEXT NOT NULL,
  "outcome"               "ComplianceOutcome" NOT NULL,
  "inputs"                JSONB NOT NULL,
  "result"                JSONB NOT NULL,
  "remediation"           TEXT,
  "responsibleDiscipline" TEXT,
  "blocksSubmission"      BOOLEAN NOT NULL DEFAULT false,
  "calculationVersion"    TEXT,
  "confidence"            DECIMAL(5,4) NOT NULL,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "site_plan_compliance_results_rule" ON "site_plan_compliance_results"("stageExecutionId","ruleVersionId");
CREATE INDEX IF NOT EXISTS "site_plan_compliance_results_outcome_idx" ON "site_plan_compliance_results"("workflowId","outcome");
CREATE INDEX IF NOT EXISTS "site_plan_compliance_results_blocking_idx" ON "site_plan_compliance_results"("blocksSubmission","createdAt");

-- ── Professional review ─────────────────────────────────────────────────────
-- Content hashes bind a decision to exactly the bytes that were reviewed, so a
-- package cannot be altered after sign-off and still present as approved. No
-- seal is ever applied by the platform.

CREATE TABLE IF NOT EXISTS "professional_review_records" (
  "id"                       TEXT PRIMARY KEY,
  "workflowId"               TEXT NOT NULL,
  "professionalAssignmentId" TEXT NOT NULL,
  "jurisdictionCode"         TEXT NOT NULL,
  "discipline"               TEXT NOT NULL,
  "licenseNumber"            TEXT NOT NULL,
  "licenseVerifiedAt"        TIMESTAMP(3),
  "decision"                 "ProfessionalReviewDecision" NOT NULL DEFAULT 'PENDING',
  "sourceDocumentId"         TEXT,
  "sealedDocumentId"         TEXT,
  "sourceContentHash"        TEXT,
  "sealedContentHash"        TEXT,
  "declaration"              TEXT,
  "decidedAt"                TIMESTAMP(3),
  "expiresAt"                TIMESTAMP(3),
  "metadata"                 JSONB,
  "createdAt"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "professional_review_records_decision_idx" ON "professional_review_records"("workflowId","decision");
CREATE INDEX IF NOT EXISTS "professional_review_records_assignment_idx" ON "professional_review_records"("professionalAssignmentId");

-- ── Backfill for pre-existing rows, if any environment already had these ─────

ALTER TABLE "site_source_datasets" ADD COLUMN IF NOT EXISTS "horizontalDatum" TEXT;
ALTER TABLE "site_source_datasets" ADD COLUMN IF NOT EXISTS "verticalDatum" TEXT;
ALTER TABLE "site_source_datasets" ADD COLUMN IF NOT EXISTS "accuracyClass" "SiteAccuracyClass" NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "site_source_datasets" ADD COLUMN IF NOT EXISTS "reliabilityLevel" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "site_source_datasets" ADD COLUMN IF NOT EXISTS "responsibleProfessionalId" TEXT;
