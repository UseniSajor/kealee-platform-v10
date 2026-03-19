-- Sprint 7: Full Restructure Migration
-- Adds: ProjectConceptValidation, ProjectPhoto, DeveloperServiceRequest
-- Adds fields to: ContractorProfile (slug, profileVisibility, listingTier)
-- Adds fields to: MarketplaceProfile (listingTier)
-- Adds fields to: Project (dcsScore, designRoute, budgetEstimated)
-- New enums: ConceptValidationStatus, DesignRoute, DevServiceType, DevServiceStatus, ListingTier, ProfileVisibility
--
-- Table name notes (no @@map on these models → Prisma uses PascalCase model name):
--   ContractorProfile → "ContractorProfile"
--   MarketplaceProfile → "MarketplaceProfile"
--   Project → "Project"

-- New Enums
CREATE TYPE "concept_validation_status" AS ENUM ('PENDING', 'PAID', 'IN_REVIEW', 'DELIVERED');
CREATE TYPE "design_route"              AS ENUM ('AI_ONLY', 'ARCHITECT_REQUIRED');
CREATE TYPE "dev_service_type"          AS ENUM ('FEASIBILITY_STUDY', 'PRO_FORMA', 'CAPITAL_STACK', 'ENTITLEMENTS');
CREATE TYPE "dev_service_status"        AS ENUM ('PENDING', 'PAID', 'IN_PROGRESS', 'DELIVERED');
CREATE TYPE "listing_tier"              AS ENUM ('BASIC', 'PRO', 'PREMIUM');
CREATE TYPE "profile_visibility"        AS ENUM ('PUBLIC', 'HIDDEN');

-- CreateTable: project_concept_validations
CREATE TABLE "project_concept_validations" (
    "id"                   TEXT NOT NULL,
    "projectId"            TEXT NOT NULL,
    "status"               "concept_validation_status" NOT NULL DEFAULT 'PENDING',
    "dcsScore"             INTEGER,
    "designRoute"          "design_route",
    "aiConceptJson"        JSONB,
    "floorPlanUrl"         TEXT,
    "feasibilityConfirmed" BOOLEAN,
    "zoningConfirmed"      BOOLEAN,
    "structuralRisk"       TEXT,
    "costBandLow"          INTEGER,
    "costBandHigh"         INTEGER,
    "permitRisk"           TEXT,
    "contractorScopeNotes" TEXT,
    "staffReviewedAt"      TIMESTAMP(3),
    "staffReviewedBy"      TEXT,
    "stripePaymentId"      TEXT,
    "deliveredAt"          TIMESTAMP(3),
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3) NOT NULL,
    CONSTRAINT "project_concept_validations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "project_concept_validations_projectId_key" ON "project_concept_validations"("projectId");
CREATE INDEX "project_concept_validations_status_idx" ON "project_concept_validations"("status");

-- CreateTable: project_photos
CREATE TABLE "project_photos" (
    "id"         TEXT NOT NULL,
    "projectId"  TEXT NOT NULL,
    "s3Key"      TEXT NOT NULL,
    "url"        TEXT NOT NULL,
    "filename"   TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_photos_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "project_photos_projectId_idx" ON "project_photos"("projectId");

-- CreateTable: developer_service_requests
CREATE TABLE "developer_service_requests" (
    "id"              TEXT NOT NULL,
    "userId"          TEXT NOT NULL,
    "serviceType"     "dev_service_type" NOT NULL,
    "status"          "dev_service_status" NOT NULL DEFAULT 'PENDING',
    "projectDetails"  JSONB,
    "propertyAddress" TEXT,
    "stripePaymentId" TEXT,
    "deliverableUrl"  TEXT,
    "assignedStaffId" TEXT,
    "requestedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt"     TIMESTAMP(3),
    CONSTRAINT "developer_service_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "developer_service_requests_userId_idx"  ON "developer_service_requests"("userId");
CREATE INDEX "developer_service_requests_status_idx"  ON "developer_service_requests"("status");

-- Alter ContractorProfile: add slug, profileVisibility, listingTier
-- Note: No @@map on ContractorProfile → table name is "ContractorProfile" (PascalCase)
ALTER TABLE "ContractorProfile" ADD COLUMN IF NOT EXISTS "slug"              TEXT;
ALTER TABLE "ContractorProfile" ADD COLUMN IF NOT EXISTS "profileVisibility" "profile_visibility" NOT NULL DEFAULT 'PUBLIC';
ALTER TABLE "ContractorProfile" ADD COLUMN IF NOT EXISTS "listingTier"       "listing_tier"       NOT NULL DEFAULT 'BASIC';
CREATE UNIQUE INDEX IF NOT EXISTS "ContractorProfile_slug_key" ON "ContractorProfile"("slug");

-- Alter MarketplaceProfile: add listingTier
-- Note: No @@map on MarketplaceProfile → table name is "MarketplaceProfile" (PascalCase)
ALTER TABLE "MarketplaceProfile" ADD COLUMN IF NOT EXISTS "listingTier" "listing_tier" NOT NULL DEFAULT 'BASIC';

-- Alter Project: add dcsScore, designRoute, budgetEstimated
-- Note: No @@map on Project → table name is "Project" (PascalCase)
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "dcsScore"        INTEGER;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "designRoute"     "design_route";
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "budgetEstimated" INTEGER;
