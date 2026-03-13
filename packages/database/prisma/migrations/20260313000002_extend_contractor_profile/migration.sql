-- Migration: 20260313000002_extend_contractor_profile
-- Additive: adds 10 extended profile columns to ContractorProfile for P3.
-- All columns have safe defaults; no data migration required.

ALTER TABLE "ContractorProfile"
  ADD COLUMN IF NOT EXISTS "website"               TEXT,
  ADD COLUMN IF NOT EXISTS "teamSize"              INTEGER,
  ADD COLUMN IF NOT EXISTS "serviceRadius"         INTEGER,
  ADD COLUMN IF NOT EXISTS "serviceStates"         TEXT[]   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "serviceCities"         TEXT[]   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "serviceCategories"     TEXT[]   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "commercialFocus"       BOOLEAN  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "residentialFocus"      BOOLEAN  NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "emergencyServices"     BOOLEAN  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "preferredProjectSizes" TEXT[]   NOT NULL DEFAULT '{}';
