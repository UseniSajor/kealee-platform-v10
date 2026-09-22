-- contact_inquiries — the shared inbound-lead table.
--
-- Three routes have been writing to this table since they were built:
--   /api/intake/lead                   (contractor inquiry)
--   /api/intake/soft-capture           (partial intake capture)
--   /api/design-professionals/register (professional signup)
-- and services/worker's marketing-sequences job reads it to enqueue nurture.
--
-- The table was never created. Every one of those writes goes through
-- storeContactInquiry(), which swallows the failure with a console.warn and
-- returns false so the caller can "degrade gracefully" — so the routes kept
-- answering 200 while every lead was discarded. The worker logged
-- "Could not find the table 'public.contact_inquiries' in the schema cache"
-- on every run.
--
-- Columns are the union of what those four callers actually read and write.

CREATE TABLE IF NOT EXISTS contact_inquiries (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Nullable: soft capture inserts `name || null` when the form has no name yet.
  name          TEXT,
  email         TEXT        NOT NULL,
  phone         TEXT,
  -- Nullable: the design-professional route inserts `bio ?? null`.
  message       TEXT,
  budget_range  TEXT,
  timeline      TEXT,
  -- 'soft_capture' | 'contractor-inquiry' | 'design-professional' | other.
  -- marketing-sequences filters on source=eq.soft_capture.
  source        TEXT        NOT NULL DEFAULT 'web-main',
  -- marketing-sequences PATCHes nurtureQueued/nurtureQueuedAt in here, so it
  -- must default to an object rather than NULL or that merge writes null.
  metadata      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- marketing-sequences scans source + created_at on every run.
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_source_created
  ON contact_inquiries (source, created_at);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_email
  ON contact_inquiries (email);

CREATE OR REPLACE FUNCTION update_contact_inquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_contact_inquiries_updated_at'
  ) THEN
    CREATE TRIGGER trg_contact_inquiries_updated_at
      BEFORE UPDATE ON contact_inquiries
      FOR EACH ROW EXECUTE FUNCTION update_contact_inquiries_updated_at();
  END IF;
END $$;

ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Every writer is a server-side route using the service role. No anon policy:
-- these forms post to an API route, never to PostgREST from the browser.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'contact_inquiries' AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY "service_role_all" ON contact_inquiries
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
