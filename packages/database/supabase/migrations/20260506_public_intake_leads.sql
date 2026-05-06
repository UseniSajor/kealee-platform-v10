-- ─────────────────────────────────────────────────────────────────────────────
-- public_intake_leads
-- Stores public web intake submissions from the concept/design flow.
-- Created: 2026-05-06
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public_intake_leads (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_path      TEXT        NOT NULL,
  client_name       TEXT        NOT NULL,
  contact_email     TEXT        NOT NULL,
  contact_phone     TEXT,
  project_address   TEXT        NOT NULL,
  budget_range      TEXT        NOT NULL DEFAULT 'Not provided',
  source            TEXT        NOT NULL DEFAULT 'web-main',
  -- Status lifecycle: new → paid → concept_ready | failed
  status            TEXT        NOT NULL DEFAULT 'new',
  requires_payment  BOOLEAN     NOT NULL DEFAULT true,
  payment_amount    INTEGER     NOT NULL DEFAULT 0,  -- in cents
  -- metadata: raw form data from intake submission
  metadata          JSONB,
  -- form_data: extended data including conceptOutput after generation
  form_data         JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_public_intake_leads_status        ON public_intake_leads (status);
CREATE INDEX IF NOT EXISTS idx_public_intake_leads_contact_email ON public_intake_leads (contact_email);
CREATE INDEX IF NOT EXISTS idx_public_intake_leads_project_path  ON public_intake_leads (project_path);
CREATE INDEX IF NOT EXISTS idx_public_intake_leads_created_at    ON public_intake_leads (created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_public_intake_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_public_intake_leads_updated_at'
  ) THEN
    CREATE TRIGGER trg_public_intake_leads_updated_at
      BEFORE UPDATE ON public_intake_leads
      FOR EACH ROW EXECUTE FUNCTION update_public_intake_leads_updated_at();
  END IF;
END $$;

-- Row Level Security
ALTER TABLE public_intake_leads ENABLE ROW LEVEL SECURITY;

-- Service-role bypass (used by server-side API routes)
CREATE POLICY "service_role_all" ON public_intake_leads
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read their own leads
CREATE POLICY "intake_leads_select_own_email" ON public_intake_leads
  FOR SELECT
  TO authenticated
  USING (contact_email = auth.email());
