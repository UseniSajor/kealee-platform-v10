-- Migration: Add Kealee Site Visit Scan mode + site_visit fields
-- Date: 2026-03-20

-- Rename 'standard' capture_mode to 'self_capture' (align with new 3-mode system)
UPDATE capture_sessions SET capture_mode = 'self_capture' WHERE capture_mode = 'standard';

-- Update column default
ALTER TABLE capture_sessions ALTER COLUMN capture_mode SET DEFAULT 'self_capture';

-- Add site visit columns
ALTER TABLE capture_sessions
  ADD COLUMN IF NOT EXISTS site_visit_requested boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS site_visit_status text NOT NULL DEFAULT 'not_scheduled',
  ADD COLUMN IF NOT EXISTS site_visit_fee numeric(10,2) NOT NULL DEFAULT 125.00,
  ADD COLUMN IF NOT EXISTS preferred_visit_window text;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_capture_sessions_site_visit ON capture_sessions(site_visit_requested) WHERE site_visit_requested = true;
CREATE INDEX IF NOT EXISTS idx_capture_sessions_site_visit_status ON capture_sessions(site_visit_status);
