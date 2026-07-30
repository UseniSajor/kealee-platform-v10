-- Canonical site intelligence and deterministic feasibility persistence.
-- GeoJSON remains the versioned business record. PostGIS columns are indexed
-- projections and are added only after the separate PostGIS activation migration.

CREATE TYPE "SiteSourceDatasetType" AS ENUM (
  'SURVEY','PARCEL','ZONING','EASEMENT','FLOOD','WETLAND','UTILITY',
  'TOPO','LIDAR','SOILS','AERIAL','USER_UPLOAD'
);
CREATE TYPE "SiteConstraintType" AS ENUM (
  'PROPERTY_LINE','SETBACK','EASEMENT','FLOODPLAIN','WETLAND','BUFFER',
  'UTILITY','RIGHT_OF_WAY','CRITICAL_AREA','SLOPE_LIMIT','EXCLUSION_ZONE'
);
CREATE TYPE "SiteConstraintSeverity" AS ENUM ('INFORMATIONAL','WARNING','BLOCKING');
CREATE TYPE "FeasibilityScenarioStatus" AS ENUM (
  'DRAFT','SOLVING','SOLVED','NEEDS_REVIEW','APPROVED','REJECTED','SUPERSEDED'
);
CREATE TYPE "FeasibilityTypology" AS ENUM (
  'SINGLE_FAMILY','TOWNHOME','GARDEN_MULTIFAMILY','WRAP_PODIUM_MULTIFAMILY',
  'SURFACE_PARKING','SMALL_MIXED_USE'
);
CREATE TYPE "FeasibilityReviewStatus" AS ENUM (
  'NOT_REQUESTED','PENDING','CHANGES_REQUESTED','REVIEWED'
);

CREATE TABLE "site_source_datasets" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "parcelId" TEXT,
  "type" "SiteSourceDatasetType" NOT NULL,
  "provider" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "license" TEXT,
  "retrievedAt" TIMESTAMP(3) NOT NULL,
  "effectiveDate" TIMESTAMP(3),
  "crs" TEXT NOT NULL,
  "linearUnit" TEXT NOT NULL,
  "checksum" TEXT NOT NULL,
  "confidence" DECIMAL(5,4) NOT NULL,
  "rawArtifactId" TEXT,
  "metadata" JSONB,
  "version" INTEGER NOT NULL DEFAULT 1,
  "supersedesId" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "site_source_datasets_parcelId_fkey"
    FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE SET NULL
);
CREATE UNIQUE INDEX "site_source_datasets_org_project_type_checksum_key"
  ON "site_source_datasets"("organizationId","projectId","type","checksum");
CREATE INDEX "site_source_datasets_org_project_type_idx"
  ON "site_source_datasets"("organizationId","projectId","type");
CREATE INDEX "site_source_datasets_parcel_effective_idx"
  ON "site_source_datasets"("parcelId","effectiveDate");

CREATE TABLE "site_constraints" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "parcelId" TEXT,
  "sourceDatasetId" TEXT,
  "type" "SiteConstraintType" NOT NULL,
  "geometryGeoJson" JSONB NOT NULL,
  "crs" TEXT NOT NULL,
  "linearUnit" TEXT NOT NULL,
  "ruleReference" TEXT,
  "severity" "SiteConstraintSeverity" NOT NULL DEFAULT 'WARNING',
  "confidence" DECIMAL(5,4) NOT NULL,
  "effectiveDate" TIMESTAMP(3),
  "metadata" JSONB,
  "version" INTEGER NOT NULL DEFAULT 1,
  "supersedesId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "site_constraints_parcelId_fkey"
    FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE SET NULL,
  CONSTRAINT "site_constraints_sourceDatasetId_fkey"
    FOREIGN KEY ("sourceDatasetId") REFERENCES "site_source_datasets"("id") ON DELETE SET NULL
);
CREATE INDEX "site_constraints_org_project_type_idx"
  ON "site_constraints"("organizationId","projectId","type");
CREATE INDEX "site_constraints_parcel_severity_idx"
  ON "site_constraints"("parcelId","severity");
CREATE INDEX "site_constraints_source_dataset_idx" ON "site_constraints"("sourceDatasetId");

CREATE TABLE "site_terrain_models" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "parcelId" TEXT,
  "sourceDatasetId" TEXT NOT NULL,
  "crs" TEXT NOT NULL,
  "linearUnit" TEXT NOT NULL,
  "demArtifactId" TEXT,
  "pointCloudArtifactId" TEXT,
  "slopeRasterArtifactId" TEXT,
  "contourArtifactId" TEXT,
  "contourInterval" DECIMAL(10,3),
  "surfaceStatistics" JSONB NOT NULL,
  "processingVersion" TEXT NOT NULL,
  "confidence" DECIMAL(5,4) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "site_terrain_models_parcelId_fkey"
    FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE SET NULL,
  CONSTRAINT "site_terrain_models_sourceDatasetId_fkey"
    FOREIGN KEY ("sourceDatasetId") REFERENCES "site_source_datasets"("id") ON DELETE RESTRICT
);
CREATE INDEX "site_terrain_models_org_project_idx"
  ON "site_terrain_models"("organizationId","projectId");
CREATE INDEX "site_terrain_models_parcel_idx" ON "site_terrain_models"("parcelId");
CREATE INDEX "site_terrain_models_source_dataset_idx" ON "site_terrain_models"("sourceDatasetId");

ALTER TABLE "feasibility_scenarios"
  ADD COLUMN "parentScenarioId" TEXT,
  ADD COLUMN "typology" "FeasibilityTypology",
  ADD COLUMN "siteFitStatus" "FeasibilityScenarioStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "inputs" JSONB,
  ADD COLUMN "objectiveWeights" JSONB,
  ADD COLUMN "ruleSetVersion" TEXT,
  ADD COLUMN "solverVersion" TEXT,
  ADD COLUMN "randomSeed" INTEGER,
  ADD COLUMN "metrics" JSONB,
  ADD COLUMN "score" DOUBLE PRECISION,
  ADD COLUMN "warnings" JSONB,
  ADD COLUMN "reviewStatus" "FeasibilityReviewStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
  ADD COLUMN "selectedOptionId" TEXT,
  ADD CONSTRAINT "feasibility_scenarios_parentScenarioId_fkey"
    FOREIGN KEY ("parentScenarioId") REFERENCES "feasibility_scenarios"("id") ON DELETE SET NULL;
CREATE INDEX "feasibility_scenarios_study_site_fit_status_idx"
  ON "feasibility_scenarios"("studyId","siteFitStatus");
CREATE INDEX "feasibility_scenarios_parent_scenario_idx"
  ON "feasibility_scenarios"("parentScenarioId");

CREATE TABLE "feasibility_scenario_options" (
  "id" TEXT PRIMARY KEY,
  "scenarioId" TEXT NOT NULL,
  "ordinal" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "geometryGeoJson" JSONB NOT NULL,
  "buildingModel" JSONB NOT NULL,
  "siteCoverage" DOUBLE PRECISION NOT NULL,
  "far" DOUBLE PRECISION NOT NULL,
  "grossFloorArea" DECIMAL(14,2) NOT NULL,
  "netRentableArea" DECIMAL(14,2),
  "unitCount" INTEGER NOT NULL,
  "unitMix" JSONB NOT NULL,
  "parkingSpaces" INTEGER NOT NULL,
  "circulationArea" DECIMAL(14,2),
  "landscapeArea" DECIMAL(14,2),
  "imperviousArea" DECIMAL(14,2),
  "preliminaryCutFill" JSONB,
  "earthworkConfidence" DECIMAL(5,4),
  "estimateId" TEXT,
  "proFormaReference" TEXT,
  "score" DOUBLE PRECISION NOT NULL,
  "validationReport" JSONB NOT NULL,
  "geoJsonArtifactId" TEXT,
  "dxfArtifactId" TEXT,
  "ifcArtifactId" TEXT,
  "pdfArtifactId" TEXT,
  "solverVersion" TEXT NOT NULL,
  "inputHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "feasibility_scenario_options_scenarioId_fkey"
    FOREIGN KEY ("scenarioId") REFERENCES "feasibility_scenarios"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "feasibility_scenario_options_scenario_ordinal_key"
  ON "feasibility_scenario_options"("scenarioId","ordinal");
CREATE INDEX "feasibility_scenario_options_scenario_score_idx"
  ON "feasibility_scenario_options"("scenarioId","score");

CREATE TABLE "geometry_validation_runs" (
  "id" TEXT PRIMARY KEY,
  "scenarioOptionId" TEXT NOT NULL,
  "ruleSetVersion" TEXT NOT NULL,
  "solverVersion" TEXT NOT NULL,
  "inputHash" TEXT NOT NULL,
  "inputs" JSONB NOT NULL,
  "results" JSONB NOT NULL,
  "errors" JSONB NOT NULL,
  "warnings" JSONB NOT NULL,
  "valid" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "geometry_validation_runs_scenarioOptionId_fkey"
    FOREIGN KEY ("scenarioOptionId") REFERENCES "feasibility_scenario_options"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "geometry_validation_runs_option_input_hash_key"
  ON "geometry_validation_runs"("scenarioOptionId","inputHash");
CREATE INDEX "geometry_validation_runs_option_created_idx"
  ON "geometry_validation_runs"("scenarioOptionId","createdAt");
CREATE INDEX "geometry_validation_runs_valid_created_idx"
  ON "geometry_validation_runs"("valid","createdAt");

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    ALTER TABLE "site_constraints"
      ADD COLUMN "spatialGeometry" extensions.geometry(Geometry);
    CREATE INDEX "site_constraints_spatial_gist_idx"
      ON "site_constraints" USING GIST ("spatialGeometry");
    ALTER TABLE "feasibility_scenario_options"
      ADD COLUMN "spatialGeometry" extensions.geometry(Geometry);
    CREATE INDEX "feasibility_scenario_options_spatial_gist_idx"
      ON "feasibility_scenario_options" USING GIST ("spatialGeometry");
  END IF;
END $$;

ALTER TABLE "site_source_datasets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "site_constraints" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "site_terrain_models" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "feasibility_scenario_options" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "geometry_validation_runs" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON "site_source_datasets", "site_constraints", "site_terrain_models",
      "feasibility_scenario_options", "geometry_validation_runs" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "site_source_datasets", "site_constraints", "site_terrain_models",
      "feasibility_scenario_options", "geometry_validation_runs" FROM authenticated;
  END IF;
END $$;
