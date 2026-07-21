-- Marketing Campaign System Schema
-- Tracks all weekly campaigns, leads, and performance

BEGIN;

-- Marketing campaigns table (52 weeks × 7 days = 364/year)
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id TEXT PRIMARY KEY,
  week_number INTEGER NOT NULL,
  product_id TEXT NOT NULL,
  secondary_product TEXT,
  campaign_type TEXT NOT NULL,                    -- 'feature_spotlight', 'success_story', etc.
  persona_id TEXT NOT NULL,                       -- 'homeowners', 'contractors', etc.
  theme TEXT,
  scheduled_day TEXT NOT NULL,                    -- 'Monday', 'Tuesday', etc.
  channels TEXT[] DEFAULT ARRAY['email'],         -- 'email', 'sms', 'web', 'slack'
  email_subject TEXT,
  email_body TEXT,
  message_template TEXT,
  status TEXT DEFAULT 'scheduled',                -- 'scheduled', 'sent', 'completed'
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

-- Campaign performance tracking
CREATE TABLE IF NOT EXISTS campaign_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT REFERENCES marketing_campaigns(id),
  sent_count INTEGER,
  delivered_count INTEGER,
  open_count INTEGER,
  click_count INTEGER,
  conversion_count INTEGER,
  leads_generated INTEGER,
  revenue_generated NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Link leads to campaigns
ALTER TABLE public_intake_leads
ADD COLUMN IF NOT EXISTS campaign_id TEXT,
ADD COLUMN IF NOT EXISTS campaign_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS persona_type TEXT;

-- Add persona detection based on form data
-- This gets populated during lead intake form submission
-- persona_type = 'homeowners' | 'contractors' | 'architects' | 'property_managers'

-- Campaign performance metrics aggregated by week
CREATE TABLE IF NOT EXISTS campaign_weekly_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number INTEGER NOT NULL UNIQUE,
  primary_product TEXT,
  total_campaigns INTEGER,
  total_sent INTEGER,
  total_opens INTEGER,
  total_clicks INTEGER,
  total_conversions INTEGER,
  total_leads INTEGER,
  total_revenue NUMERIC,
  average_open_rate NUMERIC,
  average_click_rate NUMERIC,
  average_conversion_rate NUMERIC,
  roi NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Persona engagement tracking
CREATE TABLE IF NOT EXISTS persona_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id TEXT NOT NULL,
  campaign_id TEXT,
  engagement_type TEXT,                  -- 'email_open', 'link_click', 'signup', 'purchase'
  user_id TEXT,
  email TEXT,
  value NUMERIC,                         -- For revenue tracking
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_campaigns_week ON marketing_campaigns(week_number);
CREATE INDEX IF NOT EXISTS idx_campaigns_product ON marketing_campaigns(product_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_persona ON marketing_campaigns(persona_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_day ON marketing_campaigns(scheduled_day);
CREATE INDEX IF NOT EXISTS idx_intake_campaign_id ON public_intake_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_intake_persona ON public_intake_leads(persona_type);
CREATE INDEX IF NOT EXISTS idx_persona_engagement_type ON persona_engagement(engagement_type);
CREATE INDEX IF NOT EXISTS idx_persona_engagement_persona ON persona_engagement(persona_id);

COMMIT;
