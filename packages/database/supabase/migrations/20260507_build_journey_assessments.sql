-- ─────────────────────────────────────────────────────────────────────────────
-- build_journey_assessments
-- Captures where a user is in their build journey when they visit /build.
-- Used to route them to the correct next product (concept → drawings → permit
-- → contractor match → build management) and to track conversion.
-- Created: 2026-05-07
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS build_journey_assessments (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Contact (optional — captured when user clicks a CTA)
  email                 TEXT,
  name                  TEXT,
  phone                 TEXT,

  -- Project details
  project_type          TEXT        NOT NULL,  -- 'kitchen' | 'addition' | 'whole-house' | 'bathroom' | 'whole-house' | 'new-construction' | etc.
  project_address       TEXT,
  budget_range          TEXT,

  -- Journey state: what the user already has
  has_concept           BOOLEAN     NOT NULL DEFAULT false,
  has_drawings          BOOLEAN     NOT NULL DEFAULT false,
  has_permit            BOOLEAN     NOT NULL DEFAULT false,
  has_contractor        BOOLEAN     NOT NULL DEFAULT false,

  -- Link to an existing concept intake if they have one
  concept_intake_id     UUID        REFERENCES public_intake_leads(id) ON DELETE SET NULL,

  -- Routing outcome — what Kealee recommended as next step
  -- Values: 'design_concept' | 'professional_drawings' | 'permit_filing' | 'contractor_match' | 'build_management'
  recommended_step      TEXT        NOT NULL DEFAULT 'design_concept',

  -- Conversion tracking
  -- status: 'assessed' → 'converted' (clicked CTA) | 'abandoned'
  status                TEXT        NOT NULL DEFAULT 'assessed',
  converted_intake_id   UUID        REFERENCES public_intake_leads(id) ON DELETE SET NULL,

  source                TEXT        NOT NULL DEFAULT 'build-page'
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_build_journey_email
  ON build_journey_assessments (email);

CREATE INDEX IF NOT EXISTS idx_build_journey_project_type
  ON build_journey_assessments (project_type);

CREATE INDEX IF NOT EXISTS idx_build_journey_recommended_step
  ON build_journey_assessments (recommended_step);

CREATE INDEX IF NOT EXISTS idx_build_journey_status
  ON build_journey_assessments (status);

CREATE INDEX IF NOT EXISTS idx_build_journey_created_at
  ON build_journey_assessments (created_at DESC);

-- ── Auto-update trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_build_journey_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_build_journey_updated_at
  BEFORE UPDATE ON build_journey_assessments
  FOR EACH ROW EXECUTE FUNCTION update_build_journey_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE build_journey_assessments ENABLE ROW LEVEL SECURITY;

-- Service role bypass (all server-side API routes use service role)
CREATE POLICY "service_role_all" ON build_journey_assessments
  FOR ALL USING (auth.role() = 'service_role');

-- Anonymous visitors can insert (no account required on /build page)
CREATE POLICY "anon_insert" ON build_journey_assessments
  FOR INSERT WITH CHECK (true);
