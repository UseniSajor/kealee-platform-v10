-- Supabase only: link intake leads to intelligence twins
-- Run in Supabase SQL Editor (public_intake_leads lives on Supabase, not Railway Postgres)

ALTER TABLE public_intake_leads
  ADD COLUMN IF NOT EXISTS property_twin_id UUID,
  ADD COLUMN IF NOT EXISTS lead_twin_id UUID,
  ADD COLUMN IF NOT EXISTS intelligence_segment TEXT,
  ADD COLUMN IF NOT EXISTS intelligence_priority TEXT,
  ADD COLUMN IF NOT EXISTS intelligence_metadata JSONB;

CREATE INDEX IF NOT EXISTS idx_public_intake_leads_property_twin
  ON public_intake_leads (property_twin_id);
CREATE INDEX IF NOT EXISTS idx_public_intake_leads_lead_twin
  ON public_intake_leads (lead_twin_id);
