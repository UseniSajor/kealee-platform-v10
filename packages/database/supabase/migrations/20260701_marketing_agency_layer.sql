-- Marketing agency access layer for external marketing partners
-- Safe asset library, workspace config, tasks, audit log

BEGIN;

CREATE TYPE marketing_approval_status AS ENUM (
  'draft',
  'submitted',
  'needs_revision',
  'approved',
  'rejected',
  'published'
);

CREATE TYPE marketing_asset_type AS ENUM (
  'logo',
  'service_image',
  'concept_photo',
  'before_after_simulation',
  'video_script',
  'reel_script',
  'ad_copy',
  'social_caption',
  'landing_section',
  'pdf',
  'case_study_template'
);

CREATE TABLE IF NOT EXISTS marketing_agency_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_asset_id UUID,
  content_item_id UUID,
  asset_type marketing_asset_type NOT NULL,
  service_type TEXT,
  city TEXT,
  county TEXT,
  campaign TEXT,
  approval_status marketing_approval_status NOT NULL DEFAULT 'draft',
  generated_by_ai BOOLEAN NOT NULL DEFAULT false,
  public_safe BOOLEAN NOT NULL DEFAULT false,
  contains_customer_data BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  title TEXT,
  body TEXT,
  storage_url TEXT,
  thumbnail_url TEXT,
  labels TEXT[] NOT NULL DEFAULT ARRAY['Concept visual', 'Representative example'],
  revision_notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_workspace_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_workspace_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote TEXT NOT NULL,
  attribution TEXT NOT NULL,
  service_type TEXT,
  approval_status marketing_approval_status NOT NULL DEFAULT 'approved',
  public_safe BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_agency_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID,
  campaign TEXT,
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_agency_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_agency_assets_status ON marketing_agency_assets(approval_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_agency_assets_creator ON marketing_agency_assets(created_by, approval_status);
CREATE INDEX IF NOT EXISTS idx_marketing_agency_tasks_assignee ON marketing_agency_tasks(assignee_id, status);

-- Default workspace config (brand guide, services, targets)
INSERT INTO marketing_workspace_config (key, value)
VALUES (
  'default',
  '{
    "brandGuide": {
      "name": "Kealee",
      "tagline": "Design, permits, and preconstruction — simplified",
      "voice": "Clear, confident, homeowner-friendly",
      "colors": { "primary": "#1B4D3E", "accent": "#C4A35A" }
    },
    "approvedMessaging": [
      "Get permit-ready concepts without the guesswork.",
      "From idea to approved plans — Kealee guides every step."
    ],
    "services": [
      "ADU design & permits",
      "Kitchen & bath remodel concepts",
      "Permit packages",
      "Preconstruction planning"
    ],
    "targetLocations": ["Montgomery County MD", "Prince George County MD", "Fairfax County VA", "DC"],
    "leadCapacityPerDay": 50
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION marketing_agency_is_admin() RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    lower(auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin', 'marketing_admin'),
    false
  );
$$ LANGUAGE sql STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION marketing_agency_is_partner() RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    lower(auth.jwt() -> 'app_metadata' ->> 'role') IN ('marketing_agency', 'zem_marketing'),
    false
  );
$$ LANGUAGE sql STABLE SET search_path = public;

ALTER TABLE marketing_agency_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_workspace_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_workspace_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_agency_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_agency_audit_log ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY marketing_agency_assets_admin ON marketing_agency_assets
  FOR ALL USING (marketing_agency_is_admin()) WITH CHECK (marketing_agency_is_admin());

-- Agency: read approved/published or own records
CREATE POLICY marketing_agency_assets_partner_select ON marketing_agency_assets
  FOR SELECT USING (
    marketing_agency_is_partner() AND (
      approval_status IN ('approved', 'published')
      OR created_by = auth.uid()
    )
  );

-- Agency: insert own drafts
CREATE POLICY marketing_agency_assets_partner_insert ON marketing_agency_assets
  FOR INSERT WITH CHECK (
    marketing_agency_is_partner()
    AND created_by = auth.uid()
    AND approval_status IN ('draft', 'submitted')
    AND contains_customer_data = false
  );

-- Agency: update own non-approved rows only
CREATE POLICY marketing_agency_assets_partner_update ON marketing_agency_assets
  FOR UPDATE USING (
    marketing_agency_is_partner()
    AND created_by = auth.uid()
    AND approval_status IN ('draft', 'needs_revision', 'submitted')
  ) WITH CHECK (
    marketing_agency_is_partner()
    AND created_by = auth.uid()
    AND approval_status IN ('draft', 'needs_revision', 'submitted')
    AND contains_customer_data = false
  );

CREATE POLICY marketing_workspace_config_read ON marketing_workspace_config
  FOR SELECT USING (marketing_agency_is_admin() OR marketing_agency_is_partner());

CREATE POLICY marketing_workspace_config_admin ON marketing_workspace_config
  FOR ALL USING (marketing_agency_is_admin()) WITH CHECK (marketing_agency_is_admin());

CREATE POLICY marketing_testimonials_read ON marketing_workspace_testimonials
  FOR SELECT USING (
    (marketing_agency_is_admin() OR marketing_agency_is_partner())
    AND approval_status IN ('approved', 'published')
    AND public_safe = true
  );

CREATE POLICY marketing_tasks_partner ON marketing_agency_tasks
  FOR SELECT USING (
    marketing_agency_is_admin()
    OR (marketing_agency_is_partner() AND assignee_id = auth.uid())
  );

CREATE POLICY marketing_tasks_admin ON marketing_agency_tasks
  FOR ALL USING (marketing_agency_is_admin()) WITH CHECK (marketing_agency_is_admin());

CREATE POLICY marketing_audit_admin ON marketing_agency_audit_log
  FOR ALL USING (marketing_agency_is_admin()) WITH CHECK (marketing_agency_is_admin());

GRANT SELECT, INSERT, UPDATE ON marketing_agency_assets TO authenticated;
GRANT SELECT ON marketing_workspace_config TO authenticated;
GRANT SELECT ON marketing_workspace_testimonials TO authenticated;
GRANT SELECT ON marketing_agency_tasks TO authenticated;
GRANT ALL ON marketing_agency_assets TO service_role;
GRANT ALL ON marketing_workspace_config TO service_role;
GRANT ALL ON marketing_workspace_testimonials TO service_role;
GRANT ALL ON marketing_agency_tasks TO service_role;
GRANT ALL ON marketing_agency_audit_log TO service_role;

COMMIT;
