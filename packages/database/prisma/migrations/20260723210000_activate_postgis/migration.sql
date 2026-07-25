-- Activate native spatial support on PostgreSQL hosts that provide PostGIS.
-- Supabase includes `extensions` in the database search_path.
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

DO $$
BEGIN
  IF to_regclass('public.engineering_geometries') IS NOT NULL THEN
    ALTER TABLE public.engineering_geometries
      ADD COLUMN IF NOT EXISTS "spatialGeometry" extensions.geometry(Geometry);
    CREATE INDEX IF NOT EXISTS engineering_geometries_spatial_gist_idx
      ON public.engineering_geometries USING GIST ("spatialGeometry");
  END IF;
END $$;
