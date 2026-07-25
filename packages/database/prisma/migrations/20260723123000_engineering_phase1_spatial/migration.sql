-- Phase 1 engineering persistence. PostGIS remains an indexed spatial projection
-- of the versioned GeoJSON; Prisma continues to own business metadata.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'postgis') THEN
    CREATE EXTENSION IF NOT EXISTS postgis;
  END IF;
END $$;

CREATE TYPE "EngineeringValueClassification" AS ENUM (
  'INFORMATIONAL','EXTRACTED','CUSTOMER_PROVIDED','OFFICIAL_GIS',
  'SURVEYED','VERIFIED','ENGINEER_APPROVED','SEALED'
);
CREATE TYPE "EngineeringVerificationStatus" AS ENUM ('UNVERIFIED','NEEDS_VERIFICATION','VERIFIED','REJECTED');
CREATE TYPE "EngineeringStageStatus" AS ENUM (
  'NOT_STARTED','WAITING_FOR_INPUT','READY','PROCESSING','NEEDS_VERIFICATION',
  'NEEDS_PROFESSIONAL_REVIEW','BLOCKED','FAILED','COMPLETE','SUPERSEDED'
);

CREATE TABLE "engineering_projects" (
  "id" TEXT PRIMARY KEY, "organizationId" TEXT NOT NULL, "projectId" TEXT NOT NULL,
  "sitePlanWorkflowId" TEXT, "jurisdictionCode" TEXT NOT NULL, "digitalTwinId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE', "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "engineering_projects_organizationId_projectId_key" ON "engineering_projects"("organizationId","projectId");
CREATE INDEX "engineering_projects_jurisdictionCode_status_idx" ON "engineering_projects"("jurisdictionCode","status");

CREATE TABLE "engineering_stages" (
  "id" TEXT PRIMARY KEY, "engineeringProjectId" TEXT NOT NULL, "stageCode" TEXT NOT NULL,
  "status" "EngineeringStageStatus" NOT NULL DEFAULT 'NOT_STARTED', "attempt" INTEGER NOT NULL DEFAULT 1,
  "inputs" JSONB NOT NULL, "outputs" JSONB NOT NULL, "sourceProvenance" JSONB NOT NULL,
  "confidence" DECIMAL(5,4) NOT NULL, "blockingIssues" JSONB NOT NULL, "assignedPartyId" TEXT,
  "startedAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3), "calculationVersion" TEXT NOT NULL,
  "auditHistory" JSONB NOT NULL, "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "engineering_stages_idempotencyKey_key" ON "engineering_stages"("idempotencyKey");
CREATE UNIQUE INDEX "engineering_stages_engineeringProjectId_stageCode_attempt_key" ON "engineering_stages"("engineeringProjectId","stageCode","attempt");
CREATE INDEX "engineering_stages_engineeringProjectId_status_idx" ON "engineering_stages"("engineeringProjectId","status");

CREATE TABLE "engineering_artifact_values" (
  "id" TEXT PRIMARY KEY, "engineeringProjectId" TEXT NOT NULL, "artifactType" TEXT NOT NULL,
  "logicalKey" TEXT NOT NULL, "version" INTEGER NOT NULL, "value" JSONB NOT NULL, "unit" TEXT NOT NULL,
  "classification" "EngineeringValueClassification" NOT NULL, "sourceDocumentId" TEXT, "sourceDataId" TEXT,
  "sourceLocation" JSONB, "extractionMethod" TEXT NOT NULL, "rawText" TEXT,
  "confidence" DECIMAL(5,4) NOT NULL, "verificationStatus" "EngineeringVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
  "verifiedById" TEXT, "verifiedAt" TIMESTAMP(3), "toolVersion" TEXT NOT NULL, "supersedesId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "engineering_artifact_values_project_type_key_version_key" ON "engineering_artifact_values"("engineeringProjectId","artifactType","logicalKey","version");
CREATE INDEX "engineering_artifact_values_project_verification_idx" ON "engineering_artifact_values"("engineeringProjectId","verificationStatus");

CREATE TABLE "engineering_geometries" (
  "id" TEXT PRIMARY KEY, "engineeringProjectId" TEXT NOT NULL, "geometryType" TEXT NOT NULL,
  "layerCode" TEXT NOT NULL, "revision" INTEGER NOT NULL, "geometryGeoJson" JSONB NOT NULL,
  "crs" TEXT NOT NULL, "unit" TEXT NOT NULL,
  "classification" "EngineeringValueClassification" NOT NULL, "sourceRefs" JSONB NOT NULL,
  "confidence" DECIMAL(5,4) NOT NULL, "verificationStatus" "EngineeringVerificationStatus" NOT NULL,
  "calculationVersion" TEXT NOT NULL, "supersedesId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "engineering_geometries_project_layer_revision_id_key" ON "engineering_geometries"("engineeringProjectId","layerCode","revision","id");
CREATE INDEX "engineering_geometries_project_layer_revision_idx" ON "engineering_geometries"("engineeringProjectId","layerCode","revision");
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    ALTER TABLE "engineering_geometries" ADD COLUMN "spatialGeometry" geometry(Geometry);
    CREATE INDEX "engineering_geometries_spatial_gist_idx"
      ON "engineering_geometries" USING GIST ("spatialGeometry");
  END IF;
END $$;

CREATE TABLE "engineering_calculations" (
  "id" TEXT PRIMARY KEY, "engineeringProjectId" TEXT NOT NULL, "calculationType" TEXT NOT NULL,
  "version" INTEGER NOT NULL, "formula" TEXT NOT NULL, "inputs" JSONB NOT NULL,
  "intermediateResults" JSONB NOT NULL, "result" JSONB NOT NULL, "unit" TEXT NOT NULL,
  "assumptions" JSONB NOT NULL, "missingInformation" JSONB NOT NULL, "sourceRefs" JSONB NOT NULL,
  "jurisdictionCode" TEXT NOT NULL, "jurisdictionRuleVersion" TEXT NOT NULL,
  "calculationVersion" TEXT NOT NULL, "professionalReviewStatus" TEXT NOT NULL,
  "supersedesId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "engineering_calculations_project_type_version_key" ON "engineering_calculations"("engineeringProjectId","calculationType","version");
CREATE INDEX "engineering_calculations_project_review_idx" ON "engineering_calculations"("engineeringProjectId","professionalReviewStatus");

CREATE TABLE "engineering_drawing_packages" (
  "id" TEXT PRIMARY KEY, "engineeringProjectId" TEXT NOT NULL, "revision" INTEGER NOT NULL,
  "classification" "EngineeringValueClassification" NOT NULL, "status" TEXT NOT NULL,
  "dxfDocumentId" TEXT, "pdfDocumentId" TEXT, "previewDocumentId" TEXT, "reportDocumentId" TEXT,
  "manifest" JSONB NOT NULL, "validationReport" JSONB NOT NULL, "sourceRefs" JSONB NOT NULL,
  "contentHash" TEXT, "lockedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "engineering_drawing_packages_project_revision_key" ON "engineering_drawing_packages"("engineeringProjectId","revision");
CREATE INDEX "engineering_drawing_packages_project_status_idx" ON "engineering_drawing_packages"("engineeringProjectId","status");

CREATE TABLE "engineering_drawing_sheets" (
  "id" TEXT PRIMARY KEY, "drawingPackageId" TEXT NOT NULL, "sheetNumber" TEXT NOT NULL,
  "title" TEXT NOT NULL, "status" TEXT NOT NULL, "documentId" TEXT, "manifest" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "engineering_drawing_sheets_package_sheet_key" ON "engineering_drawing_sheets"("drawingPackageId","sheetNumber");

CREATE TABLE "engineering_redlines" (
  "id" TEXT PRIMARY KEY, "drawingPackageId" TEXT NOT NULL, "professionalReviewId" TEXT NOT NULL,
  "assignedToId" TEXT, "discipline" TEXT NOT NULL, "sheetNumber" TEXT, "geometry" JSONB,
  "comment" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'OPEN', "resolution" TEXT,
  "resolvedById" TEXT, "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "engineering_redlines_package_status_idx" ON "engineering_redlines"("drawingPackageId","status");
CREATE INDEX "engineering_redlines_review_status_idx" ON "engineering_redlines"("professionalReviewId","status");

CREATE TABLE "engineering_cost_records" (
  "id" TEXT PRIMARY KEY, "engineeringProjectId" TEXT NOT NULL, "stageCode" TEXT NOT NULL,
  "costType" TEXT NOT NULL, "amountUsd" DECIMAL(12,4) NOT NULL, "processingMs" INTEGER,
  "humanMinutes" INTEGER, "provider" TEXT, "metadata" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "engineering_cost_records_project_occurred_idx" ON "engineering_cost_records"("engineeringProjectId","occurredAt");
CREATE INDEX "engineering_cost_records_stage_cost_idx" ON "engineering_cost_records"("stageCode","costType");

-- These public-schema tables are server-only. RLS is defense in depth and no
-- anon/authenticated grants are issued by this migration.
ALTER TABLE "engineering_projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "engineering_stages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "engineering_artifact_values" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "engineering_geometries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "engineering_calculations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "engineering_drawing_packages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "engineering_drawing_sheets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "engineering_redlines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "engineering_cost_records" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON "engineering_projects", "engineering_stages", "engineering_artifact_values",
      "engineering_geometries", "engineering_calculations", "engineering_drawing_packages",
      "engineering_drawing_sheets", "engineering_redlines", "engineering_cost_records" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "engineering_projects", "engineering_stages", "engineering_artifact_values",
      "engineering_geometries", "engineering_calculations", "engineering_drawing_packages",
      "engineering_drawing_sheets", "engineering_redlines", "engineering_cost_records" FROM authenticated;
  END IF;
END $$;
