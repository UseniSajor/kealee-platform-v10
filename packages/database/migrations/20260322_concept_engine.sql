-- ─────────────────────────────────────────────────────────────────────────────
-- CONCEPT ENGINE TABLES
-- Stores floor plans, concept packages, and architect review tasks
-- Generated: 2026-03-22
-- ─────────────────────────────────────────────────────────────────────────────

-- ── concept_floorplans ────────────────────────────────────────────────────────
-- Stores generated floor plan JSON and SVG for each intake submission.
-- intake_id references public_intake_leads.id (UUID) or the intake_submissions
-- intake_id column if that table exists in your schema.
CREATE TABLE IF NOT EXISTS concept_floorplans (
  id                  TEXT        PRIMARY KEY,
  intake_id           TEXT        NOT NULL,
  project_id          TEXT,
  twin_id             TEXT,
  capture_session_id  TEXT,
  floorplan_json      JSONB       NOT NULL,
  svg_url             TEXT,
  svg_inline          TEXT,       -- inline SVG string (fallback when storage not configured)
  version             INTEGER     NOT NULL DEFAULT 1,
  status              TEXT        NOT NULL DEFAULT 'generated',  -- generated | archived | superseded
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_concept_floorplans_intake_id   ON concept_floorplans (intake_id);
CREATE INDEX IF NOT EXISTS idx_concept_floorplans_project_id  ON concept_floorplans (project_id);
CREATE INDEX IF NOT EXISTS idx_concept_floorplans_status      ON concept_floorplans (status);
CREATE INDEX IF NOT EXISTS idx_concept_floorplans_created_at  ON concept_floorplans (created_at DESC);

-- ── concept_packages ──────────────────────────────────────────────────────────
-- Stores the full homeowner deliverables package + architect handoff payload.
CREATE TABLE IF NOT EXISTS concept_packages (
  id                    TEXT        PRIMARY KEY,
  intake_id             TEXT        NOT NULL,
  project_id            TEXT,
  twin_id               TEXT,
  floorplan_id          TEXT        REFERENCES concept_floorplans (id) ON DELETE SET NULL,
  package_json          JSONB       NOT NULL,    -- HomeownerDeliverables
  architect_handoff_json JSONB      NOT NULL,    -- ArchitectHandoff
  status                TEXT        NOT NULL DEFAULT 'generated',  -- generated | delivered | archived
  delivery_url          TEXT,
  delivered_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_concept_packages_intake_id    ON concept_packages (intake_id);
CREATE INDEX IF NOT EXISTS idx_concept_packages_floorplan_id ON concept_packages (floorplan_id);
CREATE INDEX IF NOT EXISTS idx_concept_packages_status       ON concept_packages (status);
CREATE INDEX IF NOT EXISTS idx_concept_packages_created_at   ON concept_packages (created_at DESC);

-- ── architect_review_tasks ────────────────────────────────────────────────────
-- Tracks architect review lifecycle for each concept package.
CREATE TABLE IF NOT EXISTS architect_review_tasks (
  id                  BIGSERIAL   PRIMARY KEY,
  intake_id           TEXT        NOT NULL,
  concept_package_id  TEXT        REFERENCES concept_packages (id) ON DELETE CASCADE,
  assigned_architect  TEXT,
  review_status       TEXT        NOT NULL DEFAULT 'pending',  -- pending | in_review | changes_requested | approved
  notes               TEXT,
  revision_count      INTEGER     NOT NULL DEFAULT 0,
  architect_signoff   TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_architect_review_tasks_intake_id          ON architect_review_tasks (intake_id);
CREATE INDEX IF NOT EXISTS idx_architect_review_tasks_concept_package_id ON architect_review_tasks (concept_package_id);
CREATE INDEX IF NOT EXISTS idx_architect_review_tasks_review_status      ON architect_review_tasks (review_status);
CREATE INDEX IF NOT EXISTS idx_architect_review_tasks_assigned_architect ON architect_review_tasks (assigned_architect);

-- ── updated_at auto-update triggers ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_concept_floorplans_updated_at'
  ) THEN
    CREATE TRIGGER trg_concept_floorplans_updated_at
      BEFORE UPDATE ON concept_floorplans
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_concept_packages_updated_at'
  ) THEN
    CREATE TRIGGER trg_concept_packages_updated_at
      BEFORE UPDATE ON concept_packages
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_architect_review_tasks_updated_at'
  ) THEN
    CREATE TRIGGER trg_architect_review_tasks_updated_at
      BEFORE UPDATE ON architect_review_tasks
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
