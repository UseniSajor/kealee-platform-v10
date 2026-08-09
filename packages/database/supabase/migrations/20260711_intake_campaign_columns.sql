-- Columns the weekly-campaign send path stamps on each emailed lead
-- (apps/web-main/lib/marketing/campaign-runner.ts → sendTodaysCampaigns).
-- Without these, "Start campaign" (send:true) errors on the lead query.
ALTER TABLE public.public_intake_leads
  ADD COLUMN IF NOT EXISTS campaign_id      text,
  ADD COLUMN IF NOT EXISTS campaign_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS persona_type     text;

-- Speeds up the "eligible leads" lookup (status='new' AND campaign_id IS NULL)
CREATE INDEX IF NOT EXISTS public_intake_leads_campaign_null_idx
  ON public.public_intake_leads (status)
  WHERE campaign_id IS NULL;
