-- ─────────────────────────────────────────────────────────────────────────────
-- PASCAL EDITOR — scene persistence, versions, uploads, render jobs
-- Generated: 2026-05-09
-- Mirror of the Prisma models added in commit f052d027 (which shipped without
-- the SQL counterpart, breaking every /api/editor/* route in production).
--
-- Apply with:  psql "$DATABASE_URL" -f 20260509_pascal_editor.sql
-- Idempotent — safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ── Enums ────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PascalRenderMode') THEN
    CREATE TYPE "PascalRenderMode" AS ENUM ('SKETCH', 'STANDARD', 'REALISTIC', 'CINEMATIC');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PascalRenderStatus') THEN
    CREATE TYPE "PascalRenderStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PascalUploadType') THEN
    CREATE TYPE "PascalUploadType" AS ENUM ('PHOTO', 'FLOOR_PLAN', 'SKETCH', 'PDF', 'INSPIRATION');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PascalProjectType') THEN
    CREATE TYPE "PascalProjectType" AS ENUM (
      'ADDITION','KITCHEN_REMODEL','BATH_REMODEL','WHOLE_HOUSE','BASEMENT','ADU',
      'GARAGE','DECK','NEW_CONSTRUCTION','COMMERCIAL','EXTERIOR','INTERIOR_RENO'
    );
  END IF;
END
$$;

-- ── pascal_scenes ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pascal_scenes (
  id                 TEXT                PRIMARY KEY,
  user_id            TEXT,
  project_id         TEXT,
  name               TEXT                NOT NULL,
  project_type       "PascalProjectType" NOT NULL DEFAULT 'ADDITION',
  scene_data         JSONB               NOT NULL,
  total_sq_ft        DOUBLE PRECISION,
  room_count         INTEGER,
  wall_length_ft     DOUBLE PRECISION,
  floor_count        INTEGER,
  door_count         INTEGER,
  window_count       INTEGER,
  exterior_perim_ft  DOUBLE PRECISION,
  style              TEXT,
  address            TEXT,
  is_public          BOOLEAN             NOT NULL DEFAULT FALSE,
  is_template        BOOLEAN             NOT NULL DEFAULT FALSE,
  is_deleted         BOOLEAN             NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMPTZ         NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ         NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pascal_scenes_user_id      ON pascal_scenes (user_id);
CREATE INDEX IF NOT EXISTS idx_pascal_scenes_project_id   ON pascal_scenes (project_id);
CREATE INDEX IF NOT EXISTS idx_pascal_scenes_project_type ON pascal_scenes (project_type);
CREATE INDEX IF NOT EXISTS idx_pascal_scenes_created_at   ON pascal_scenes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pascal_scenes_active       ON pascal_scenes (id) WHERE is_deleted = FALSE;

-- ── pascal_scene_versions ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pascal_scene_versions (
  id          TEXT        PRIMARY KEY,
  scene_id    TEXT        NOT NULL REFERENCES pascal_scenes (id) ON DELETE CASCADE,
  label       TEXT,
  scene_data  JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pascal_scene_versions_scene_id   ON pascal_scene_versions (scene_id);
CREATE INDEX IF NOT EXISTS idx_pascal_scene_versions_created_at ON pascal_scene_versions (created_at DESC);

-- ── pascal_scene_uploads ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pascal_scene_uploads (
  id                 TEXT                PRIMARY KEY,
  scene_id           TEXT                NOT NULL REFERENCES pascal_scenes (id) ON DELETE CASCADE,
  upload_type        "PascalUploadType"  NOT NULL,
  file_name          TEXT                NOT NULL,
  file_url           TEXT                NOT NULL,
  file_size_mb       DOUBLE PRECISION,
  mime_type          TEXT,
  vision_result      JSONB,
  vision_status      TEXT,                                    -- pending | processing | completed | failed
  geometry_extracted BOOLEAN             NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMPTZ         NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pascal_scene_uploads_scene_id ON pascal_scene_uploads (scene_id);

-- ── pascal_render_jobs ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pascal_render_jobs (
  id              TEXT                  PRIMARY KEY,
  scene_id        TEXT                  NOT NULL REFERENCES pascal_scenes (id) ON DELETE CASCADE,
  user_id         TEXT,
  render_mode     "PascalRenderMode"    NOT NULL DEFAULT 'REALISTIC',
  style           TEXT,
  prompt          TEXT,
  room_type       TEXT,
  input_image_url TEXT,
  output_urls     TEXT[]                NOT NULL DEFAULT ARRAY[]::TEXT[],
  status          "PascalRenderStatus"  NOT NULL DEFAULT 'PENDING',
  error_msg       TEXT,
  external_job_id TEXT,
  model_version   TEXT,
  duration_ms     INTEGER,
  created_at      TIMESTAMPTZ           NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ           NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pascal_render_jobs_scene_id ON pascal_render_jobs (scene_id);
CREATE INDEX IF NOT EXISTS idx_pascal_render_jobs_user_id  ON pascal_render_jobs (user_id);
CREATE INDEX IF NOT EXISTS idx_pascal_render_jobs_status   ON pascal_render_jobs (status);

-- ── updated_at trigger (matches the convention used by other Kealee tables) ─

CREATE OR REPLACE FUNCTION pascal_set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pascal_scenes_updated_at ON pascal_scenes;
CREATE TRIGGER trg_pascal_scenes_updated_at
  BEFORE UPDATE ON pascal_scenes
  FOR EACH ROW EXECUTE FUNCTION pascal_set_updated_at();

DROP TRIGGER IF EXISTS trg_pascal_render_jobs_updated_at ON pascal_render_jobs;
CREATE TRIGGER trg_pascal_render_jobs_updated_at
  BEFORE UPDATE ON pascal_render_jobs
  FOR EACH ROW EXECUTE FUNCTION pascal_set_updated_at();

COMMIT;
