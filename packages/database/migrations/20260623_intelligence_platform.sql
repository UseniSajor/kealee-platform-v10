-- Kealee v30 Intelligence Platform — Phase 6 extension
-- ProjectTwin, CapitalTwin, IntelligenceRun, ProjectDecision

BEGIN;

DO $$ BEGIN
  CREATE TYPE intelligence_engine_type AS ENUM (
    'property', 'opportunity', 'lead', 'capital', 'project'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE intelligence_loop_type ADD VALUE IF NOT EXISTS 'lead_intelligence';
ALTER TYPE intelligence_loop_type ADD VALUE IF NOT EXISTS 'capital_intelligence';
ALTER TYPE intelligence_loop_type ADD VALUE IF NOT EXISTS 'project_intelligence';
ALTER TYPE intelligence_loop_type ADD VALUE IF NOT EXISTS 'finance_review';

CREATE TABLE IF NOT EXISTS project_twins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT,
  project_id TEXT UNIQUE,
  property_twin_id UUID REFERENCES property_twins(id) ON DELETE SET NULL,
  lead_twin_id UUID REFERENCES lead_twins(id) ON DELETE SET NULL,
  intake_lead_id TEXT,
  name TEXT,
  scope JSONB,
  budget NUMERIC(14, 2),
  estimate_total NUMERIC(14, 2),
  permit_status TEXT,
  project_phase TEXT,
  health_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  missing_items TEXT[] NOT NULL DEFAULT '{}',
  risk_flags TEXT[] NOT NULL DEFAULT '{}',
  metrics JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_twins_org_id_idx ON project_twins (org_id);
CREATE INDEX IF NOT EXISTS project_twins_property_twin_id_idx ON project_twins (property_twin_id);
CREATE INDEX IF NOT EXISTS project_twins_lead_twin_id_idx ON project_twins (lead_twin_id);
CREATE INDEX IF NOT EXISTS project_twins_health_score_idx ON project_twins (health_score);

CREATE TABLE IF NOT EXISTS capital_twins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT,
  project_twin_id UUID REFERENCES project_twins(id) ON DELETE SET NULL,
  property_twin_id UUID REFERENCES property_twins(id) ON DELETE SET NULL,
  lead_twin_id UUID REFERENCES lead_twins(id) ON DELETE SET NULL,
  estimated_property_value NUMERIC(14, 2),
  estimated_mortgage_balance NUMERIC(14, 2),
  estimated_equity NUMERIC(14, 2),
  estimated_ltv DOUBLE PRECISION,
  project_budget NUMERIC(14, 2),
  capital_fit_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  recommended_loan_products TEXT[] NOT NULL DEFAULT '{}',
  funding_gap NUMERIC(14, 2),
  required_documents TEXT[] NOT NULL DEFAULT '{}',
  lender_routing TEXT,
  risk_flags TEXT[] NOT NULL DEFAULT '{}',
  compliance_flags TEXT[] NOT NULL DEFAULT '{}',
  consent_financing BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS capital_twins_project_twin_id_idx ON capital_twins (project_twin_id);
CREATE INDEX IF NOT EXISTS capital_twins_property_twin_id_idx ON capital_twins (property_twin_id);
CREATE INDEX IF NOT EXISTS capital_twins_capital_fit_score_idx ON capital_twins (capital_fit_score);

CREATE TABLE IF NOT EXISTS intelligence_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_type intelligence_engine_type NOT NULL,
  loop_run_id UUID REFERENCES loop_runs(id) ON DELETE SET NULL,
  project_id TEXT,
  property_twin_id UUID REFERENCES property_twins(id) ON DELETE SET NULL,
  lead_twin_id UUID REFERENCES lead_twins(id) ON DELETE SET NULL,
  capital_twin_id UUID REFERENCES capital_twins(id) ON DELETE SET NULL,
  project_twin_id UUID REFERENCES project_twins(id) ON DELETE SET NULL,
  trigger_event TEXT NOT NULL,
  trigger_event_id TEXT,
  input_snapshot JSONB NOT NULL,
  output_snapshot JSONB NOT NULL,
  confidence_score DOUBLE PRECISION NOT NULL,
  requires_human_review BOOLEAN NOT NULL DEFAULT false,
  review_reasons TEXT[] NOT NULL DEFAULT '{}',
  agent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS intelligence_runs_engine_type_idx ON intelligence_runs (engine_type);
CREATE INDEX IF NOT EXISTS intelligence_runs_trigger_event_idx ON intelligence_runs (trigger_event);
CREATE INDEX IF NOT EXISTS intelligence_runs_property_twin_id_idx ON intelligence_runs (property_twin_id);

CREATE TABLE IF NOT EXISTS project_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_twin_id UUID NOT NULL REFERENCES project_twins(id) ON DELETE CASCADE,
  loop_run_id UUID REFERENCES loop_runs(id) ON DELETE SET NULL,
  decision_type TEXT NOT NULL,
  title TEXT NOT NULL,
  context JSONB,
  recommendation TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  decided_by TEXT,
  decided_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_decisions_project_twin_id_idx ON project_decisions (project_twin_id);

ALTER TABLE loop_runs
  ADD COLUMN IF NOT EXISTS project_twin_id UUID REFERENCES project_twins(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS capital_twin_id UUID REFERENCES capital_twins(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS loop_runs_project_twin_id_idx ON loop_runs (project_twin_id);
CREATE INDEX IF NOT EXISTS loop_runs_capital_twin_id_idx ON loop_runs (capital_twin_id);

COMMIT;
