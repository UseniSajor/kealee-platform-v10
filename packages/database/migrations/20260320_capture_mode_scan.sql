-- Migration: Add capture_mode, scan_enabled, scan_completed to capture_sessions
-- Date: 2026-03-20

ALTER TABLE capture_sessions
  ADD COLUMN IF NOT EXISTS capture_mode text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS scan_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scan_completed boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_capture_sessions_capture_mode ON capture_sessions(capture_mode);
CREATE INDEX IF NOT EXISTS idx_capture_sessions_scan_enabled ON capture_sessions(scan_enabled) WHERE scan_enabled = true;
