-- marketing_campaigns + intake campaign columns (idempotent)
-- See _docs/migrations/004-marketing-campaigns-schema.sql

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id TEXT PRIMARY KEY,
  week_number INTEGER NOT NULL,
  product_id TEXT NOT NULL,
  secondary_product TEXT,
  campaign_type TEXT NOT NULL,
  persona_id TEXT NOT NULL,
  theme TEXT,
  scheduled_day TEXT NOT NULL,
  channels TEXT[] DEFAULT ARRAY['email'],
  email_subject TEXT,
  email_body TEXT,
  message_template TEXT,
  status TEXT DEFAULT 'scheduled',
  sent_at TIMESTAMPTZ,
  recipients_count INTEGER DEFAULT 0,
  open_rate NUMERIC,
  click_rate NUMERIC,
  conversion_rate NUMERIC,
  leads_generated INTEGER DEFAULT 0,
  attributed_revenue NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_week ON marketing_campaigns(week_number);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_day ON marketing_campaigns(scheduled_day);

ALTER TABLE public_intake_leads
  ADD COLUMN IF NOT EXISTS campaign_id TEXT,
  ADD COLUMN IF NOT EXISTS campaign_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS persona_type TEXT;

CREATE INDEX IF NOT EXISTS idx_intake_campaign_id ON public_intake_leads(campaign_id);
