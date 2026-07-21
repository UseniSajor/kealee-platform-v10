-- Marketing Automation Phase 2 Schema Changes
-- Adds AI qualification, Calendly events, lead notes

BEGIN;

-- Add columns to public_intake_leads
ALTER TABLE public_intake_leads
ADD COLUMN IF NOT EXISTS ai_qualification_score REAL,
ADD COLUMN IF NOT EXISTS ai_qualification_recommendation TEXT,  -- 'qualify'|'nurture'|'reject'
ADD COLUMN IF NOT EXISTS qualified_at TIMESTAMPTZ;

-- Create lead_notes table (for AI classification + inbound SMS replies)
CREATE TABLE IF NOT EXISTS lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id UUID NOT NULL REFERENCES public_intake_leads(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  note_type TEXT NOT NULL,                    -- 'sms_reply'|'ai_classification'|'manual'|'call_result'
  ai_classified_as TEXT,                      -- 'urgent'|'followup'|'closed'|'escalate'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create calendly_events table
CREATE TABLE IF NOT EXISTS calendly_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id UUID NOT NULL REFERENCES public_intake_leads(id) ON DELETE CASCADE,
  calendly_event_id TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  guest_email TEXT,
  guest_name TEXT,
  status TEXT DEFAULT 'scheduled',             -- 'scheduled'|'confirmed'|'cancelled'|'completed'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for Phase 2 queries
CREATE INDEX IF NOT EXISTS idx_intake_leads_ai_qualification ON public_intake_leads(ai_qualification_recommendation);
CREATE INDEX IF NOT EXISTS idx_intake_leads_qualified_at ON public_intake_leads(qualified_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_notes_intake_id ON lead_notes(intake_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_note_type ON lead_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_calendly_events_intake_id ON calendly_events(intake_id);
CREATE INDEX IF NOT EXISTS idx_calendly_events_scheduled_at ON calendly_events(scheduled_at);

COMMIT;
