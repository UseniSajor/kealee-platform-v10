-- Kealee v30 Intelligence Layer — Phase 1
-- PropertyTwin, LeadTwin, OpportunityScore, LoopRun, LoopStep, AgentMemory

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE intelligence_loop_type AS ENUM (
    'property_intelligence',
    'marketing_intelligence',
    'opportunity_scoring',
    'campaign_routing',
    'lead_nurture'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE intelligence_loop_status AS ENUM (
    'pending',
    'running',
    'completed',
    'failed',
    'awaiting_review',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE intelligence_step_status AS ENUM (
    'pending',
    'running',
    'completed',
    'failed',
    'skipped'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS property_twins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT,
  parcel_id TEXT,
  address TEXT NOT NULL,
  jurisdiction TEXT,
  zoning JSONB,
  lot_size DOUBLE PRECISION,
  building_size DOUBLE PRECISION,
  year_built INTEGER,
  property_type TEXT,
  ownership_type TEXT,
  assessed_value NUMERIC(14, 2),
  last_sale_date TIMESTAMPTZ,
  permit_history JSONB,
  risk_flags TEXT[] NOT NULL DEFAULT '{}',
  opportunity_flags TEXT[] NOT NULL DEFAULT '{}',
  recommended_products TEXT[] NOT NULL DEFAULT '{}',
  latest_scores JSONB,
  data_sources TEXT[] NOT NULL DEFAULT '{}',
  data_quality_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  property_summary TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS property_twins_org_id_idx ON property_twins (org_id);
CREATE INDEX IF NOT EXISTS property_twins_parcel_id_idx ON property_twins (parcel_id);
CREATE INDEX IF NOT EXISTS property_twins_jurisdiction_idx ON property_twins (jurisdiction);
CREATE INDEX IF NOT EXISTS property_twins_data_quality_score_idx ON property_twins (data_quality_score);

CREATE TABLE IF NOT EXISTS lead_twins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT,
  property_twin_id UUID REFERENCES property_twins(id) ON DELETE SET NULL,
  crm_contact_id TEXT,
  email TEXT,
  phone TEXT,
  name TEXT,
  lead_type TEXT,
  segment TEXT,
  crm_status TEXT,
  source_channel TEXT,
  interaction_history JSONB,
  compliance_flags TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_twins_org_id_idx ON lead_twins (org_id);
CREATE INDEX IF NOT EXISTS lead_twins_property_twin_id_idx ON lead_twins (property_twin_id);
CREATE INDEX IF NOT EXISTS lead_twins_crm_contact_id_idx ON lead_twins (crm_contact_id);

CREATE TABLE IF NOT EXISTS loop_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loop_type intelligence_loop_type NOT NULL,
  status intelligence_loop_status NOT NULL DEFAULT 'pending',
  trigger_event_type TEXT,
  trigger_event_id TEXT,
  property_twin_id UUID REFERENCES property_twins(id) ON DELETE SET NULL,
  lead_twin_id UUID REFERENCES lead_twins(id) ON DELETE SET NULL,
  org_id TEXT,
  context JSONB,
  result JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS loop_runs_loop_type_idx ON loop_runs (loop_type);
CREATE INDEX IF NOT EXISTS loop_runs_status_idx ON loop_runs (status);
CREATE INDEX IF NOT EXISTS loop_runs_property_twin_id_idx ON loop_runs (property_twin_id);
CREATE INDEX IF NOT EXISTS loop_runs_lead_twin_id_idx ON loop_runs (lead_twin_id);

CREATE TABLE IF NOT EXISTS loop_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loop_run_id UUID NOT NULL REFERENCES loop_runs(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  agent_id TEXT,
  status intelligence_step_status NOT NULL DEFAULT 'pending',
  input JSONB,
  output JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS loop_steps_loop_run_id_idx ON loop_steps (loop_run_id);

CREATE TABLE IF NOT EXISTS opportunity_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_twin_id UUID NOT NULL REFERENCES property_twins(id) ON DELETE CASCADE,
  loop_run_id UUID REFERENCES loop_runs(id) ON DELETE SET NULL,
  total_opportunity_score DOUBLE PRECISION NOT NULL,
  product_scores JSONB NOT NULL,
  urgency_score DOUBLE PRECISION NOT NULL,
  revenue_potential NUMERIC(14, 2),
  conversion_likelihood DOUBLE PRECISION,
  estimated_project_value NUMERIC(14, 2),
  recommended_priority TEXT NOT NULL,
  recommended_next_action TEXT,
  data_quality_score DOUBLE PRECISION NOT NULL,
  score_explanation TEXT NOT NULL,
  confidence_score DOUBLE PRECISION NOT NULL,
  requires_human_review BOOLEAN NOT NULL DEFAULT false,
  review_reasons TEXT[] NOT NULL DEFAULT '{}',
  crm_updates JSONB,
  digital_twin_updates JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS opportunity_scores_property_twin_id_idx ON opportunity_scores (property_twin_id);
CREATE INDEX IF NOT EXISTS opportunity_scores_total_opportunity_score_idx ON opportunity_scores (total_opportunity_score);
CREATE INDEX IF NOT EXISTS opportunity_scores_recommended_priority_idx ON opportunity_scores (recommended_priority);

CREATE TABLE IF NOT EXISTS marketing_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_twin_id UUID REFERENCES lead_twins(id) ON DELETE CASCADE,
  property_twin_id UUID,
  segment_key TEXT NOT NULL,
  audience_segment TEXT NOT NULL,
  confidence_score DOUBLE PRECISION,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketing_segments_segment_key_idx ON marketing_segments (segment_key);
CREATE INDEX IF NOT EXISTS marketing_segments_lead_twin_id_idx ON marketing_segments (lead_twin_id);
CREATE INDEX IF NOT EXISTS marketing_segments_property_twin_id_idx ON marketing_segments (property_twin_id);

CREATE TABLE IF NOT EXISTS campaign_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_twin_id UUID NOT NULL REFERENCES property_twins(id) ON DELETE CASCADE,
  loop_run_id UUID REFERENCES loop_runs(id) ON DELETE SET NULL,
  recommended_campaign TEXT NOT NULL,
  recommended_channel TEXT NOT NULL,
  recommended_offer TEXT,
  recommended_message_angle TEXT,
  sales_priority TEXT,
  nurture_sequence TEXT,
  suppression_flags TEXT[] NOT NULL DEFAULT '{}',
  compliance_flags TEXT[] NOT NULL DEFAULT '{}',
  confidence_score DOUBLE PRECISION NOT NULL,
  requires_human_review BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_recommendations_property_twin_id_idx ON campaign_recommendations (property_twin_id);

CREATE TABLE IF NOT EXISTS property_intelligence_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_twin_id UUID NOT NULL REFERENCES property_twins(id) ON DELETE CASCADE,
  loop_run_id UUID REFERENCES loop_runs(id) ON DELETE SET NULL,
  input_context JSONB NOT NULL,
  output JSONB NOT NULL,
  property_summary TEXT,
  property_type TEXT,
  ownership_type TEXT,
  confidence_score DOUBLE PRECISION NOT NULL,
  requires_human_review BOOLEAN NOT NULL DEFAULT false,
  data_quality_score DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS property_intelligence_runs_property_twin_id_idx ON property_intelligence_runs (property_twin_id);

CREATE TABLE IF NOT EXISTS agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  loop_run_id UUID REFERENCES loop_runs(id) ON DELETE SET NULL,
  memory_key TEXT NOT NULL,
  content JSONB NOT NULL,
  confidence DOUBLE PRECISION,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_id, entity_type, entity_id, memory_key)
);

CREATE INDEX IF NOT EXISTS agent_memory_entity_type_entity_id_idx ON agent_memory (entity_type, entity_id);

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

COMMIT;
