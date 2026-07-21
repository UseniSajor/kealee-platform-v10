-- Marketing Automation Phase 1 Schema Changes
-- Adds lead scoring, routing, GHL integration, SMS tracking

BEGIN;

-- Add columns to public_intake_leads
ALTER TABLE public_intake_leads
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS routing_tag TEXT DEFAULT 'pending',  -- 'hot'|'medium'|'cold'|'nurture'|'pending'
ADD COLUMN IF NOT EXISTS ghl_contact_id TEXT,
ADD COLUMN IF NOT EXISTS sms_alert_sent_at TIMESTAMPTZ;

-- Create GHL sync audit log
CREATE TABLE IF NOT EXISTS ghl_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id UUID REFERENCES public_intake_leads(id) ON DELETE CASCADE,
  ghl_contact_id TEXT,
  action TEXT,                    -- 'create'|'update'|'stage_move'|'error'
  ghl_response JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create SMS alert log
CREATE TABLE IF NOT EXISTS sms_alert_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id UUID REFERENCES public_intake_leads(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  status TEXT,                     -- 'sent'|'failed'|'bounced'
  twilio_message_id TEXT,
  error_message TEXT
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_intake_leads_lead_score ON public_intake_leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_intake_leads_routing_tag ON public_intake_leads(routing_tag);
CREATE INDEX IF NOT EXISTS idx_intake_leads_ghl_contact_id ON public_intake_leads(ghl_contact_id);
CREATE INDEX IF NOT EXISTS idx_ghl_sync_log_intake_id ON ghl_sync_log(intake_id);
CREATE INDEX IF NOT EXISTS idx_ghl_sync_log_created_at ON ghl_sync_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_alert_log_intake_id ON sms_alert_log(intake_id);

COMMIT;
