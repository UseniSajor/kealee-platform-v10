-- ============================================================
-- Property Twin + Mobile Capture Platform Layer
-- Migration: 20260320_digital_twin_capture.sql
-- Note: `digital_twins` is the Prisma DDTS project-lifecycle table.
--       New property-level spatial twins use `property_twins`.
-- ============================================================

-- ─── PROPERTY TWINS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_twins (
  id                          TEXT PRIMARY KEY,
  project_id                  TEXT,
  intake_id                   TEXT,
  address                     TEXT NOT NULL,
  property_type               TEXT,
  year_built                  INTEGER,
  floor_area_sqft             NUMERIC,
  creation_path               TEXT NOT NULL DEFAULT 'mobile_capture',
  status                      TEXT NOT NULL DEFAULT 'active',
  source_capture_session_ids  TEXT[]  NOT NULL DEFAULT '{}',
  metadata                    JSONB   NOT NULL DEFAULT '{}',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_twins_project_id ON property_twins (project_id);
CREATE INDEX IF NOT EXISTS idx_property_twins_intake_id  ON property_twins (intake_id);
CREATE INDEX IF NOT EXISTS idx_property_twins_status     ON property_twins (status);

-- ─── PROPERTY TWIN SPATIAL NODES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_twin_spatial_nodes (
  id                TEXT PRIMARY KEY,
  twin_id           TEXT NOT NULL REFERENCES property_twins (id) ON DELETE CASCADE,
  node_key          TEXT NOT NULL,
  level             TEXT NOT NULL DEFAULT 'ground',
  area_type         TEXT NOT NULL DEFAULT 'interior',
  label             TEXT NOT NULL,
  sqft              NUMERIC,
  parent_node_key   TEXT,
  observation_count INTEGER NOT NULL DEFAULT 0,
  asset_count       INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (node_key)
);

CREATE INDEX IF NOT EXISTS idx_ptwin_spatial_nodes_twin_id ON property_twin_spatial_nodes (twin_id);

-- ─── PROPERTY TWIN SYSTEM NODES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_twin_system_nodes (
  id                    TEXT PRIMARY KEY,
  twin_id               TEXT NOT NULL REFERENCES property_twins (id) ON DELETE CASCADE,
  system_key            TEXT NOT NULL,
  system_category       TEXT NOT NULL,
  label                 TEXT NOT NULL,
  condition             TEXT,
  estimated_age_years   INTEGER,
  brand                 TEXT,
  model                 TEXT,
  observation_count     INTEGER NOT NULL DEFAULT 0,
  metadata              JSONB NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (system_key)
);

CREATE INDEX IF NOT EXISTS idx_ptwin_system_nodes_twin_id  ON property_twin_system_nodes (twin_id);
CREATE INDEX IF NOT EXISTS idx_ptwin_system_nodes_category ON property_twin_system_nodes (system_category);

-- ─── PROPERTY TWIN OBSERVATIONS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_twin_observations (
  id                TEXT PRIMARY KEY,
  twin_id           TEXT NOT NULL REFERENCES property_twins (id) ON DELETE CASCADE,
  zone              TEXT NOT NULL,
  label             TEXT NOT NULL,
  description       TEXT,
  severity          TEXT DEFAULT 'informational',
  confidence        NUMERIC,
  spatial_node_key  TEXT,
  system_node_key   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ptwin_obs_twin_id  ON property_twin_observations (twin_id);
CREATE INDEX IF NOT EXISTS idx_ptwin_obs_severity ON property_twin_observations (severity);
CREATE INDEX IF NOT EXISTS idx_ptwin_obs_zone     ON property_twin_observations (zone);

-- ─── CAPTURE SESSIONS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS capture_sessions (
  id                          TEXT PRIMARY KEY,
  project_path                TEXT NOT NULL,
  intake_id                   TEXT,
  project_id                  TEXT,
  address                     TEXT NOT NULL,
  client_name                 TEXT,
  created_by_user_id          TEXT,
  capture_token               TEXT NOT NULL UNIQUE,
  token_expires_at            TIMESTAMPTZ NOT NULL,
  required_zones              TEXT[] NOT NULL DEFAULT '{}',
  completed_zones             TEXT[] NOT NULL DEFAULT '{}',
  current_zone                TEXT,
  status                      TEXT NOT NULL DEFAULT 'pending',
  uploaded_assets_count       INTEGER NOT NULL DEFAULT 0,
  voice_notes_count           INTEGER NOT NULL DEFAULT 0,
  walkthrough_video_uploaded  BOOLEAN NOT NULL DEFAULT false,
  progress_percent            INTEGER NOT NULL DEFAULT 0,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at                TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_capture_sessions_intake_id  ON capture_sessions (intake_id);
CREATE INDEX IF NOT EXISTS idx_capture_sessions_project_id ON capture_sessions (project_id);
CREATE INDEX IF NOT EXISTS idx_capture_sessions_token      ON capture_sessions (capture_token);
CREATE INDEX IF NOT EXISTS idx_capture_sessions_status     ON capture_sessions (status);

-- ─── CAPTURE ASSETS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS capture_assets (
  id                  TEXT PRIMARY KEY,
  capture_session_id  TEXT NOT NULL REFERENCES capture_sessions (id) ON DELETE CASCADE,
  zone                TEXT NOT NULL,
  storage_url         TEXT NOT NULL,
  storage_path        TEXT,
  mime_type           TEXT NOT NULL DEFAULT 'image/jpeg',
  file_size_bytes     BIGINT,
  ai_label            TEXT,
  ai_description      TEXT,
  ai_tags             TEXT[] DEFAULT '{}',
  system_category     TEXT,
  upload_status       TEXT NOT NULL DEFAULT 'complete',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_capture_assets_session_id ON capture_assets (capture_session_id);
CREATE INDEX IF NOT EXISTS idx_capture_assets_zone       ON capture_assets (zone);

-- ─── CAPTURE VOICE NOTES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS capture_voice_notes (
  id                    TEXT PRIMARY KEY,
  capture_session_id    TEXT NOT NULL REFERENCES capture_sessions (id) ON DELETE CASCADE,
  zone                  TEXT NOT NULL,
  storage_url           TEXT NOT NULL,
  storage_path          TEXT,
  duration_seconds      INTEGER,
  transcription_status  TEXT NOT NULL DEFAULT 'pending',
  transcription_text    TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_capture_voice_notes_session_id ON capture_voice_notes (capture_session_id);

-- ─── CAPTURE SMS LOG ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS capture_sms_log (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  capture_session_id  TEXT NOT NULL REFERENCES capture_sessions (id) ON DELETE CASCADE,
  phone_number        TEXT NOT NULL,
  message_id          TEXT,
  sent_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_capture_sms_log_session_id ON capture_sms_log (capture_session_id);

-- ─── ROW-LEVEL SECURITY ─────────────────────────────────────────────────────
ALTER TABLE property_twins                ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_twin_spatial_nodes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_twin_system_nodes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_twin_observations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE capture_sessions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE capture_assets                ENABLE ROW LEVEL SECURITY;
ALTER TABLE capture_voice_notes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE capture_sms_log               ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "svc_property_twins"             ON property_twins              FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc_property_twin_spatial"      ON property_twin_spatial_nodes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc_property_twin_system"       ON property_twin_system_nodes  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc_property_twin_obs"          ON property_twin_observations  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc_capture_sessions"           ON capture_sessions            FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc_capture_assets"             ON capture_assets              FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc_capture_voice_notes"        ON capture_voice_notes         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc_capture_sms_log"            ON capture_sms_log             FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Anon access for mobile capture flow
CREATE POLICY "anon_read_capture_sessions"    ON capture_sessions    FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_capture_assets"    ON capture_assets      FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_capture_voice"     ON capture_voice_notes FOR INSERT TO anon WITH CHECK (true);
