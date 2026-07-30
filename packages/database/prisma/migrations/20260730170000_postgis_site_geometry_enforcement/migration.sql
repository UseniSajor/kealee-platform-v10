-- PostGIS is a hard dependency for production site-feasibility calculations.
-- GeoJSON remains the versioned source record; these columns are queryable,
-- indexed spatial projections populated by the engineering worker.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    RAISE EXCEPTION 'PostGIS is required for Kealee site feasibility';
  END IF;
END $$;

ALTER TABLE "site_source_datasets"
  ADD COLUMN IF NOT EXISTS "spatialGeometry" extensions.geometry(Geometry);
ALTER TABLE "site_constraints"
  ADD COLUMN IF NOT EXISTS "spatialGeometry" extensions.geometry(Geometry);
ALTER TABLE "feasibility_scenario_options"
  ADD COLUMN IF NOT EXISTS "spatialGeometry" extensions.geometry(Geometry);

CREATE INDEX IF NOT EXISTS "site_source_datasets_spatial_gist_idx"
  ON "site_source_datasets" USING GIST ("spatialGeometry");
CREATE INDEX IF NOT EXISTS "site_constraints_spatial_gist_idx"
  ON "site_constraints" USING GIST ("spatialGeometry");
CREATE INDEX IF NOT EXISTS "feasibility_scenario_options_spatial_gist_idx"
  ON "feasibility_scenario_options" USING GIST ("spatialGeometry");
