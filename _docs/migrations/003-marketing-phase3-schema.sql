-- Marketing Automation Phase 3 Schema Changes
-- Adds ROI tracking, bi-directional conversion sync, Nextdoor integration

BEGIN;

-- Add columns for Phase 3 tracking
ALTER TABLE public_intake_leads
ADD COLUMN IF NOT EXISTS gclid TEXT,                           -- Google Click ID
ADD COLUMN IF NOT EXISTS facebook_lead_id TEXT,                -- Facebook Lead Ads ID
ADD COLUMN IF NOT EXISTS meta_form_id TEXT,                    -- Meta form that generated lead
ADD COLUMN IF NOT EXISTS source_channel TEXT,                  -- 'web'|'meta'|'google'|'facebook'|'nextdoor'|'zapier'
ADD COLUMN IF NOT EXISTS converted_to_deal_at TIMESTAMPTZ;

-- Nextdoor performance tracking
CREATE TABLE IF NOT EXISTS nextdoor_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  zip_code TEXT,
  leads_count INTEGER DEFAULT 0,
  paid_leads INTEGER DEFAULT 0,
  revenue_generated NUMERIC,
  cost_per_lead NUMERIC,
  roi NUMERIC,
  ad_campaign_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(neighborhood, city, state)
);

-- Create ROI tracking table
CREATE TABLE IF NOT EXISTS marketing_roi_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_year TEXT NOT NULL UNIQUE,       -- "2024-05" format
  total_leads INTEGER DEFAULT 0,
  paid_leads INTEGER DEFAULT 0,
  qualified_leads INTEGER DEFAULT 0,
  won_deals INTEGER DEFAULT 0,
  total_spend_cents INTEGER DEFAULT 0,  -- In cents (USD * 100)
  deal_value_cents INTEGER DEFAULT 0,   -- In cents
  cost_per_lead NUMERIC,
  cost_per_qualified NUMERIC,
  cost_per_deal NUMERIC,
  roi NUMERIC,
  -- Channel breakdown
  web_leads INTEGER DEFAULT 0,
  facebook_leads INTEGER DEFAULT 0,
  google_leads INTEGER DEFAULT 0,
  nextdoor_leads INTEGER DEFAULT 0,
  referral_leads INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for Phase 3
CREATE INDEX IF NOT EXISTS idx_intake_leads_source_channel ON public_intake_leads(source_channel);
CREATE INDEX IF NOT EXISTS idx_intake_leads_converted_at ON public_intake_leads(converted_to_deal_at);
CREATE INDEX IF NOT EXISTS idx_intake_leads_gclid ON public_intake_leads(gclid);
CREATE INDEX IF NOT EXISTS idx_intake_leads_facebook_lead_id ON public_intake_leads(facebook_lead_id);
CREATE INDEX IF NOT EXISTS idx_nextdoor_performance_city ON nextdoor_performance(city);
CREATE INDEX IF NOT EXISTS idx_nextdoor_performance_neighborhood ON nextdoor_performance(neighborhood);
CREATE INDEX IF NOT EXISTS idx_marketing_roi_metrics_month ON marketing_roi_metrics(month_year);

COMMIT;
