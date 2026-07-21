-- marketing_drip_queue — Resend nurture sequences (pre-payment + post-concept upsell)
-- Idempotent: safe to run multiple times.

CREATE TABLE IF NOT EXISTS marketing_drip_queue (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         text NOT NULL,
  email           text NOT NULL,
  name            text,
  service_label   text,
  funnel_url      text,
  sequence_step   integer NOT NULL DEFAULT 1,
  send_at         timestamptz NOT NULL,
  sent_at         timestamptz,
  status          text NOT NULL DEFAULT 'pending',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mdrip_status_send
  ON marketing_drip_queue (status, send_at);

CREATE INDEX IF NOT EXISTS idx_mdrip_lead_id
  ON marketing_drip_queue (lead_id);

-- public_intake_leads — scoring + funnel columns used by web-main crons
ALTER TABLE public_intake_leads
  ADD COLUMN IF NOT EXISTS lead_score integer,
  ADD COLUMN IF NOT EXISTS routing_tag text,
  ADD COLUMN IF NOT EXISTS lead_tier text,
  ADD COLUMN IF NOT EXISTS lead_route text,
  ADD COLUMN IF NOT EXISTS ghl_contact_id text,
  ADD COLUMN IF NOT EXISTS sms_alert_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_session_id text;

CREATE INDEX IF NOT EXISTS idx_public_intake_leads_source
  ON public_intake_leads (source);

CREATE INDEX IF NOT EXISTS idx_public_intake_leads_routing_tag
  ON public_intake_leads (routing_tag);

CREATE INDEX IF NOT EXISTS idx_public_intake_leads_lead_tier
  ON public_intake_leads (lead_tier);
