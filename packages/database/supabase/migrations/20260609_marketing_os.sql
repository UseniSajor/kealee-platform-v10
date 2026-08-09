-- Kealee Marketing OS
-- National market intelligence, programmatic SEO, content, media, distribution,
-- AI search optimization, agent orchestration, and performance attribution.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE marketing_os_record_status AS ENUM ('draft', 'active', 'stale', 'archived');
CREATE TYPE marketing_os_job_status AS ENUM ('queued', 'running', 'awaiting_approval', 'completed', 'failed', 'cancelled');
CREATE TYPE marketing_os_content_status AS ENUM ('research', 'draft', 'review', 'approved', 'scheduled', 'published', 'failed', 'archived');
CREATE TYPE marketing_os_asset_kind AS ENUM ('image', 'video', 'audio', 'document');
CREATE TYPE marketing_os_channel AS ENUM (
  'website',
  'direct',
  'organic',
  'paid_search',
  'referral',
  'email',
  'youtube',
  'instagram',
  'linkedin',
  'facebook',
  'tiktok'
);

CREATE TABLE IF NOT EXISTS marketing_os_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fips_code TEXT NOT NULL UNIQUE,
  abbreviation TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  status marketing_os_record_status NOT NULL DEFAULT 'active',
  source_url TEXT,
  source_updated_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_os_counties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID NOT NULL REFERENCES marketing_os_states(id) ON DELETE CASCADE,
  fips_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  county_type TEXT NOT NULL DEFAULT 'county',
  population BIGINT,
  land_area_sq_miles NUMERIC,
  status marketing_os_record_status NOT NULL DEFAULT 'active',
  source_url TEXT,
  source_updated_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (state_id, slug)
);

CREATE TABLE IF NOT EXISTS marketing_os_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID NOT NULL REFERENCES marketing_os_states(id) ON DELETE CASCADE,
  county_id UUID REFERENCES marketing_os_counties(id) ON DELETE SET NULL,
  place_fips_code TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  population BIGINT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  timezone TEXT,
  status marketing_os_record_status NOT NULL DEFAULT 'active',
  source_url TEXT,
  source_updated_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (state_id, slug)
);

CREATE TABLE IF NOT EXISTS marketing_os_permit_offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID NOT NULL REFERENCES marketing_os_states(id) ON DELETE CASCADE,
  county_id UUID REFERENCES marketing_os_counties(id) ON DELETE SET NULL,
  city_id UUID REFERENCES marketing_os_cities(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  jurisdiction_name TEXT NOT NULL,
  jurisdiction_type TEXT NOT NULL CHECK (jurisdiction_type IN ('state', 'county', 'city', 'town', 'borough', 'district', 'other')),
  website_url TEXT,
  application_url TEXT,
  fee_schedule_url TEXT,
  phone TEXT,
  email TEXT,
  address JSONB,
  office_hours JSONB,
  online_submission_available BOOLEAN,
  status marketing_os_record_status NOT NULL DEFAULT 'active',
  source_updated_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_os_planning_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID NOT NULL REFERENCES marketing_os_states(id) ON DELETE CASCADE,
  county_id UUID REFERENCES marketing_os_counties(id) ON DELETE SET NULL,
  city_id UUID REFERENCES marketing_os_cities(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  website_url TEXT,
  zoning_map_url TEXT,
  comprehensive_plan_url TEXT,
  phone TEXT,
  email TEXT,
  address JSONB,
  status marketing_os_record_status NOT NULL DEFAULT 'active',
  source_updated_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_os_project_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  residential BOOLEAN NOT NULL DEFAULT true,
  commercial BOOLEAN NOT NULL DEFAULT false,
  status marketing_os_record_status NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_os_construction_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID REFERENCES marketing_os_states(id) ON DELETE CASCADE,
  county_id UUID REFERENCES marketing_os_counties(id) ON DELETE CASCADE,
  city_id UUID REFERENCES marketing_os_cities(id) ON DELETE CASCADE,
  project_type_id UUID NOT NULL REFERENCES marketing_os_project_types(id) ON DELETE CASCADE,
  cost_basis TEXT NOT NULL,
  unit TEXT NOT NULL,
  low_cost NUMERIC(14,2),
  median_cost NUMERIC(14,2),
  high_cost NUMERIC(14,2),
  labor_cost NUMERIC(14,2),
  material_cost NUMERIC(14,2),
  equipment_cost NUMERIC(14,2),
  currency TEXT NOT NULL DEFAULT 'USD',
  effective_date DATE NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT,
  methodology TEXT,
  confidence_score NUMERIC(5,4) CHECK (confidence_score BETWEEN 0 AND 1),
  status marketing_os_record_status NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (state_id IS NOT NULL OR county_id IS NOT NULL OR city_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS marketing_os_permit_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_office_id UUID NOT NULL REFERENCES marketing_os_permit_offices(id) ON DELETE CASCADE,
  project_type_id UUID REFERENCES marketing_os_project_types(id) ON DELETE SET NULL,
  permit_type TEXT NOT NULL,
  fee_name TEXT NOT NULL,
  calculation_method TEXT NOT NULL,
  flat_fee NUMERIC(14,2),
  minimum_fee NUMERIC(14,2),
  maximum_fee NUMERIC(14,2),
  rate NUMERIC(14,6),
  rate_unit TEXT,
  effective_date DATE,
  expires_at DATE,
  source_url TEXT,
  raw_formula JSONB,
  confidence_score NUMERIC(5,4) CHECK (confidence_score BETWEEN 0 AND 1),
  status marketing_os_record_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_os_zoning_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_department_id UUID REFERENCES marketing_os_planning_departments(id) ON DELETE CASCADE,
  state_id UUID NOT NULL REFERENCES marketing_os_states(id) ON DELETE CASCADE,
  county_id UUID REFERENCES marketing_os_counties(id) ON DELETE CASCADE,
  city_id UUID REFERENCES marketing_os_cities(id) ON DELETE CASCADE,
  zoning_code TEXT NOT NULL,
  zoning_name TEXT,
  allowed_uses JSONB NOT NULL DEFAULT '[]'::jsonb,
  conditional_uses JSONB NOT NULL DEFAULT '[]'::jsonb,
  setbacks JSONB NOT NULL DEFAULT '{}'::jsonb,
  height_limit_feet NUMERIC,
  lot_coverage_percent NUMERIC,
  floor_area_ratio NUMERIC,
  parking_requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
  adu_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_url TEXT,
  effective_date DATE,
  confidence_score NUMERIC(5,4) CHECK (confidence_score BETWEEN 0 AND 1),
  status marketing_os_record_status NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_os_market_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID REFERENCES marketing_os_states(id) ON DELETE CASCADE,
  county_id UUID REFERENCES marketing_os_counties(id) ON DELETE CASCADE,
  city_id UUID REFERENCES marketing_os_cities(id) ON DELETE CASCADE,
  project_type_id UUID REFERENCES marketing_os_project_types(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  report_period_start DATE,
  report_period_end DATE,
  summary TEXT,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_citations JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_by TEXT,
  content_item_id UUID,
  status marketing_os_record_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_os_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  base_url TEXT,
  jurisdiction_scope TEXT,
  authentication_type TEXT NOT NULL DEFAULT 'none',
  schedule_cron TEXT,
  parser_key TEXT NOT NULL,
  terms_url TEXT,
  robots_policy JSONB,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, parser_key)
);

CREATE TABLE IF NOT EXISTS marketing_os_ingestion_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES marketing_os_sources(id) ON DELETE CASCADE,
  job_id TEXT,
  status marketing_os_job_status NOT NULL DEFAULT 'queued',
  cursor JSONB,
  records_seen INTEGER NOT NULL DEFAULT 0,
  records_inserted INTEGER NOT NULL DEFAULT 0,
  records_updated INTEGER NOT NULL DEFAULT 0,
  records_rejected INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error TEXT,
  diagnostics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_os_source_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES marketing_os_sources(id) ON DELETE CASCADE,
  ingestion_run_id UUID REFERENCES marketing_os_ingestion_runs(id) ON DELETE SET NULL,
  canonical_url TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  mime_type TEXT,
  title TEXT,
  raw_storage_url TEXT,
  extracted_text TEXT,
  extracted_data JSONB,
  fetched_at TIMESTAMPTZ NOT NULL,
  source_updated_at TIMESTAMPTZ,
  status marketing_os_record_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (canonical_url, content_hash)
);

CREATE TABLE IF NOT EXISTS marketing_os_content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'market_report', 'case_study', 'landing_page', 'email_campaign', 'county_overview', 'permit_guide', 'adu_guide', 'addition_guide', 'kitchen_guide', 'bathroom_guide', 'deck_guide', 'commercial_guide', 'multifamily_guide', 'cost_guide')),
  state_id UUID REFERENCES marketing_os_states(id) ON DELETE SET NULL,
  county_id UUID REFERENCES marketing_os_counties(id) ON DELETE SET NULL,
  city_id UUID REFERENCES marketing_os_cities(id) ON DELETE SET NULL,
  project_type_id UUID REFERENCES marketing_os_project_types(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  status marketing_os_content_status NOT NULL DEFAULT 'research',
  current_version INTEGER NOT NULL DEFAULT 0,
  canonical_url TEXT,
  primary_keyword TEXT,
  search_intent TEXT,
  target_audience TEXT,
  author_agent TEXT,
  approval_required BOOLEAN NOT NULL DEFAULT true,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE marketing_os_market_reports
  ADD CONSTRAINT marketing_os_market_reports_content_item_fk
  FOREIGN KEY (content_item_id) REFERENCES marketing_os_content_items(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS marketing_os_content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID NOT NULL REFERENCES marketing_os_content_items(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  body_markdown TEXT NOT NULL,
  body_html TEXT,
  seo_title TEXT,
  meta_description TEXT,
  schema_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  internal_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_citations JSONB NOT NULL DEFAULT '[]'::jsonb,
  fact_checks JSONB NOT NULL DEFAULT '[]'::jsonb,
  quality_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_by_agent TEXT NOT NULL,
  model TEXT,
  prompt_hash TEXT,
  change_summary TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (content_item_id, version)
);

CREATE TABLE IF NOT EXISTS marketing_os_seo_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID NOT NULL UNIQUE REFERENCES marketing_os_content_items(id) ON DELETE CASCADE,
  route_pattern TEXT NOT NULL,
  pathname TEXT NOT NULL UNIQUE,
  indexable BOOLEAN NOT NULL DEFAULT true,
  robots_directive TEXT NOT NULL DEFAULT 'index,follow',
  hreflang JSONB NOT NULL DEFAULT '{}'::jsonb,
  breadcrumb_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  entity_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  faq_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  sitemap_priority NUMERIC(2,1) NOT NULL DEFAULT 0.7,
  sitemap_change_frequency TEXT NOT NULL DEFAULT 'monthly',
  last_generated_at TIMESTAMPTZ,
  last_published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_os_internal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_page_id UUID NOT NULL REFERENCES marketing_os_seo_pages(id) ON DELETE CASCADE,
  target_page_id UUID NOT NULL REFERENCES marketing_os_seo_pages(id) ON DELETE CASCADE,
  anchor_text TEXT NOT NULL,
  link_context TEXT,
  relevance_score NUMERIC(5,4) CHECK (relevance_score BETWEEN 0 AND 1),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_page_id, target_page_id, anchor_text)
);

CREATE TABLE IF NOT EXISTS marketing_os_media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID REFERENCES marketing_os_content_items(id) ON DELETE SET NULL,
  asset_kind marketing_os_asset_kind NOT NULL,
  purpose TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT,
  external_job_id TEXT,
  status marketing_os_job_status NOT NULL DEFAULT 'queued',
  prompt TEXT,
  script TEXT,
  source_asset_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  output_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  storage_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  duration_seconds NUMERIC,
  aspect_ratio TEXT,
  locale TEXT NOT NULL DEFAULT 'en-US',
  rights_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  generation_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS marketing_os_social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel marketing_os_channel NOT NULL,
  account_external_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  credential_reference TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
  token_expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (channel, account_external_id)
);

CREATE TABLE IF NOT EXISTS marketing_os_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID REFERENCES marketing_os_content_items(id) ON DELETE CASCADE,
  media_asset_id UUID REFERENCES marketing_os_media_assets(id) ON DELETE SET NULL,
  social_account_id UUID REFERENCES marketing_os_social_accounts(id) ON DELETE SET NULL,
  channel marketing_os_channel NOT NULL,
  status marketing_os_job_status NOT NULL DEFAULT 'queued',
  external_id TEXT,
  external_url TEXT,
  caption TEXT,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  approval_required BOOLEAN NOT NULL DEFAULT true,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_os_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID REFERENCES marketing_os_content_items(id) ON DELETE CASCADE,
  publication_id UUID REFERENCES marketing_os_publications(id) ON DELETE CASCADE,
  channel marketing_os_channel,
  metric_date DATE NOT NULL,
  impressions BIGINT NOT NULL DEFAULT 0,
  reach BIGINT NOT NULL DEFAULT 0,
  views BIGINT NOT NULL DEFAULT 0,
  engagements BIGINT NOT NULL DEFAULT 0,
  clicks BIGINT NOT NULL DEFAULT 0,
  leads BIGINT NOT NULL DEFAULT 0,
  conversions BIGINT NOT NULL DEFAULT 0,
  revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
  spend NUMERIC(14,2) NOT NULL DEFAULT 0,
  average_position NUMERIC(8,3),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (content_item_id, publication_id, channel, metric_date)
);

CREATE TABLE IF NOT EXISTS marketing_os_knowledge_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  canonical_name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  same_as JSONB NOT NULL DEFAULT '[]'::jsonb,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  authority_score NUMERIC(6,3) NOT NULL DEFAULT 0,
  status marketing_os_record_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_type, slug)
);

CREATE TABLE IF NOT EXISTS marketing_os_knowledge_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity_id UUID NOT NULL REFERENCES marketing_os_knowledge_entities(id) ON DELETE CASCADE,
  target_entity_id UUID NOT NULL REFERENCES marketing_os_knowledge_entities(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  confidence_score NUMERIC(5,4) CHECK (confidence_score BETWEEN 0 AND 1),
  citations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_entity_id, target_entity_id, relation_type)
);

CREATE TABLE IF NOT EXISTS marketing_os_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_version_id UUID REFERENCES marketing_os_content_versions(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES marketing_os_knowledge_entities(id) ON DELETE SET NULL,
  source_document_id UUID REFERENCES marketing_os_source_documents(id) ON DELETE SET NULL,
  claim TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_title TEXT,
  publisher TEXT,
  published_at TIMESTAMPTZ,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  quote_excerpt TEXT,
  confidence_score NUMERIC(5,4) CHECK (confidence_score BETWEEN 0 AND 1),
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_os_ai_search_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engine TEXT NOT NULL,
  query TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en-US',
  observed_at TIMESTAMPTZ NOT NULL,
  kealee_mentioned BOOLEAN NOT NULL DEFAULT false,
  kealee_position INTEGER,
  cited_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  competitors JSONB NOT NULL DEFAULT '[]'::jsonb,
  response_excerpt TEXT,
  sentiment TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_os_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  instructions TEXT NOT NULL,
  model_provider TEXT NOT NULL,
  model TEXT NOT NULL,
  tools JSONB NOT NULL DEFAULT '[]'::jsonb,
  approval_policy TEXT NOT NULL DEFAULT 'risk_based',
  enabled BOOLEAN NOT NULL DEFAULT true,
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_os_agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES marketing_os_agents(id) ON DELETE CASCADE,
  parent_run_id UUID REFERENCES marketing_os_agent_runs(id) ON DELETE SET NULL,
  workflow_key TEXT NOT NULL,
  job_id TEXT,
  status marketing_os_job_status NOT NULL DEFAULT 'queued',
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  tool_calls JSONB NOT NULL DEFAULT '[]'::jsonb,
  token_usage JSONB NOT NULL DEFAULT '{}'::jsonb,
  cost_usd NUMERIC(12,6),
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_os_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  steps JSONB NOT NULL,
  approval_policy TEXT NOT NULL DEFAULT 'risk_based',
  enabled BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_os_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES marketing_os_workflows(id) ON DELETE SET NULL,
  job_type TEXT NOT NULL,
  queue_name TEXT NOT NULL,
  external_job_id TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  status marketing_os_job_status NOT NULL DEFAULT 'queued',
  priority INTEGER NOT NULL DEFAULT 0,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_os_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  signature_valid BOOLEAN NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_marketing_os_counties_state ON marketing_os_counties(state_id);
CREATE INDEX IF NOT EXISTS idx_marketing_os_cities_geo ON marketing_os_cities(state_id, county_id);
CREATE INDEX IF NOT EXISTS idx_marketing_os_costs_geo_project ON marketing_os_construction_costs(state_id, county_id, city_id, project_type_id, effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_os_fees_office_project ON marketing_os_permit_fees(permit_office_id, project_type_id);
CREATE INDEX IF NOT EXISTS idx_marketing_os_zoning_geo ON marketing_os_zoning_data(state_id, county_id, city_id, zoning_code);
CREATE INDEX IF NOT EXISTS idx_marketing_os_content_status ON marketing_os_content_items(status, content_type, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_os_pages_path ON marketing_os_seo_pages(pathname);
CREATE INDEX IF NOT EXISTS idx_marketing_os_publications_schedule ON marketing_os_publications(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_marketing_os_metrics_date ON marketing_os_performance_metrics(metric_date DESC, channel);
CREATE INDEX IF NOT EXISTS idx_marketing_os_jobs_status ON marketing_os_jobs(queue_name, status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_marketing_os_agent_runs_status ON marketing_os_agent_runs(status, created_at DESC);

CREATE OR REPLACE FUNCTION marketing_os_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'marketing_os_states', 'marketing_os_counties', 'marketing_os_cities',
    'marketing_os_permit_offices', 'marketing_os_planning_departments',
    'marketing_os_project_types', 'marketing_os_construction_costs',
    'marketing_os_permit_fees', 'marketing_os_zoning_data',
    'marketing_os_market_reports', 'marketing_os_sources',
    'marketing_os_content_items', 'marketing_os_seo_pages',
    'marketing_os_media_assets', 'marketing_os_social_accounts',
    'marketing_os_publications', 'marketing_os_knowledge_entities',
    'marketing_os_agents', 'marketing_os_workflows', 'marketing_os_jobs'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I', table_name);
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION marketing_os_set_updated_at()',
      table_name
    );
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION marketing_os_is_admin() RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    lower(auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin', 'marketing_admin'),
    false
  );
$$ LANGUAGE sql STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION increment_marketing_os_source_failure(source_uuid UUID)
RETURNS VOID AS $$
  UPDATE marketing_os_sources
  SET consecutive_failures = consecutive_failures + 1,
      last_run_at = now(),
      updated_at = now()
  WHERE id = source_uuid;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION increment_marketing_os_source_failure(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_marketing_os_source_failure(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION marketing_os_is_admin() TO anon, authenticated, service_role;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'marketing_os_states', 'marketing_os_counties', 'marketing_os_cities',
    'marketing_os_permit_offices', 'marketing_os_planning_departments',
    'marketing_os_project_types', 'marketing_os_construction_costs',
    'marketing_os_permit_fees', 'marketing_os_zoning_data',
    'marketing_os_market_reports', 'marketing_os_sources',
    'marketing_os_ingestion_runs', 'marketing_os_source_documents',
    'marketing_os_content_items', 'marketing_os_content_versions',
    'marketing_os_seo_pages', 'marketing_os_internal_links',
    'marketing_os_media_assets', 'marketing_os_social_accounts',
    'marketing_os_publications', 'marketing_os_performance_metrics',
    'marketing_os_knowledge_entities', 'marketing_os_knowledge_edges',
    'marketing_os_citations', 'marketing_os_ai_search_observations',
    'marketing_os_agents', 'marketing_os_agent_runs',
    'marketing_os_workflows', 'marketing_os_jobs',
    'marketing_os_webhook_events'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS marketing_os_admin_all ON %I', table_name);
    EXECUTE format(
      'CREATE POLICY marketing_os_admin_all ON %I FOR ALL USING (marketing_os_is_admin()) WITH CHECK (marketing_os_is_admin())',
      table_name
    );
    EXECUTE format(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO authenticated, service_role',
      table_name
    );
  END LOOP;
END $$;

-- Public read is limited to published SEO content and active geographic facts.
GRANT SELECT ON
  marketing_os_states,
  marketing_os_counties,
  marketing_os_cities,
  marketing_os_project_types,
  marketing_os_content_items,
  marketing_os_content_versions,
  marketing_os_seo_pages
TO anon;

CREATE POLICY marketing_os_public_states ON marketing_os_states FOR SELECT USING (status = 'active');
CREATE POLICY marketing_os_public_counties ON marketing_os_counties FOR SELECT USING (status = 'active');
CREATE POLICY marketing_os_public_cities ON marketing_os_cities FOR SELECT USING (status = 'active');
CREATE POLICY marketing_os_public_project_types ON marketing_os_project_types FOR SELECT USING (status = 'active');
CREATE POLICY marketing_os_public_content ON marketing_os_content_items FOR SELECT USING (status = 'published');
CREATE POLICY marketing_os_public_versions ON marketing_os_content_versions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM marketing_os_content_items item
    WHERE item.id = content_item_id
      AND item.status = 'published'
      AND item.current_version = version
  )
);
CREATE POLICY marketing_os_public_pages ON marketing_os_seo_pages FOR SELECT USING (
  indexable = true
  AND EXISTS (
    SELECT 1 FROM marketing_os_content_items item
    WHERE item.id = content_item_id AND item.status = 'published'
  )
);

-- System configuration, not sample content. Safe to re-run.
INSERT INTO marketing_os_agents (key, name, role, instructions, model_provider, model, tools, approval_policy)
VALUES
  ('cmo', 'CMO Agent', 'Portfolio strategy and growth governance', 'Set measurable priorities, allocate workflows, enforce approval policy, and optimize qualified pipeline and revenue.', 'openai', 'gpt-4.1', '["analytics","workflow_dispatch","notifications"]', 'risk_based'),
  ('seo', 'SEO Agent', 'Programmatic search architecture', 'Create non-duplicative page plans, metadata, schema, internal links, and search monitoring grounded in market intelligence.', 'openai', 'gpt-4.1', '["seo_pages","knowledge_graph","sitemaps","citations"]', 'risk_based'),
  ('research', 'Research Agent', 'Citation-backed market intelligence', 'Use supplied authoritative sources only. Attach evidence, URL, accessed date, and confidence to every material claim.', 'openai', 'gpt-4.1', '["source_documents","market_intelligence","citations"]', 'risk_based'),
  ('content', 'Content Agent', 'Versioned construction content production', 'Create useful construction content from approved facts without inventing prices, fees, rules, testimonials, or results.', 'openai', 'gpt-4.1', '["content_versions","brand_rules","citations"]', 'risk_based'),
  ('editor', 'Editor Agent', 'Evidence, quality, and compliance review', 'Reject unsupported claims, duplicate pages, thin content, unsafe advice, and content that does not satisfy the target intent.', 'openai', 'gpt-4.1', '["fact_checks","quality_scores","approval_gates"]', 'required'),
  ('video', 'Video Agent', 'Multi-provider video and narration production', 'Turn approved source content into channel-specific scripts, shot plans, captions, narration, and provider jobs.', 'openai', 'gpt-4.1', '["runway","kling","veo","elevenlabs","media_archive"]', 'risk_based'),
  ('social', 'Social Agent', 'Policy-compliant social distribution', 'Adapt approved assets to each channel, enforce credentials and approval policy, publish, and synchronize performance.', 'openai', 'gpt-4.1', '["youtube","instagram","linkedin","facebook","tiktok"]', 'required'),
  ('conversion', 'Conversion Agent', 'Lead and revenue optimization', 'Improve transparent CTAs, lead routing, lifecycle messaging, conversion, and attributed revenue using Kealee systems.', 'openai', 'gpt-4.1', '["public_intake_leads","resend","stripe","analytics"]', 'risk_based')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  instructions = EXCLUDED.instructions,
  model_provider = EXCLUDED.model_provider,
  model = EXCLUDED.model,
  tools = EXCLUDED.tools,
  approval_policy = EXCLUDED.approval_policy,
  updated_at = now();

INSERT INTO marketing_os_workflows (key, name, description, trigger_type, trigger_config, steps, approval_policy)
VALUES
  ('national-market-refresh', 'National market refresh', 'Fetch, normalize, enrich, and verify enabled market intelligence sources.', 'schedule', '{"cron":"0 3 * * *"}', '[{"job":"market.ingest"},{"job":"market.enrich"},{"job":"search.monitor"}]', 'risk_based'),
  ('programmatic-seo-publish', 'Programmatic SEO publish', 'Research, draft, edit, approve, publish, link, and submit indexable guide pages.', 'event', '{"event":"market_record_verified"}', '[{"agent":"research"},{"agent":"seo"},{"agent":"content"},{"agent":"editor"},{"job":"content.publish"}]', 'required'),
  ('content-to-video', 'Content to video', 'Convert approved content into narrated channel-ready video variants.', 'event', '{"event":"content_approved"}', '[{"agent":"video"},{"job":"video.generate"},{"job":"video.poll"}]', 'risk_based'),
  ('social-distribution', 'Social distribution', 'Publish approved content and media, then synchronize channel metrics.', 'event', '{"event":"media_approved"}', '[{"agent":"social"},{"job":"social.publish"},{"job":"social.sync_metrics"}]', 'required'),
  ('growth-optimization', 'Growth optimization', 'Roll up analytics and let CMO and Conversion agents recommend measurable changes.', 'schedule', '{"cron":"0 10 * * 1"}', '[{"job":"analytics.rollup"},{"agent":"conversion"},{"agent":"cmo"}]', 'risk_based')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  trigger_type = EXCLUDED.trigger_type,
  trigger_config = EXCLUDED.trigger_config,
  steps = EXCLUDED.steps,
  approval_policy = EXCLUDED.approval_policy,
  version = marketing_os_workflows.version + 1,
  updated_at = now();

COMMIT;
