-- Row-level security for intelligence twin tables (service_role bypasses RLS)

BEGIN;

CREATE OR REPLACE FUNCTION intelligence_is_admin() RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    lower(auth.jwt() -> 'app_metadata' ->> 'role') IN (
      'admin', 'super_admin', 'ops', 'marketing_admin'
    ),
    false
  );
$$ LANGUAGE sql STABLE SET search_path = public;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'property_twins',
    'lead_twins',
    'loop_runs',
    'loop_steps',
    'opportunity_scores',
    'marketing_segments',
    'campaign_recommendations',
    'property_intelligence_runs',
    'agent_memory',
    'project_twins',
    'capital_twins',
    'intelligence_runs',
    'project_decisions',
    'parcel_outreach_targets',
    'parcel_outreach_queue'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS intelligence_admin_all ON %I', table_name);
    EXECUTE format(
      'CREATE POLICY intelligence_admin_all ON %I FOR ALL USING (intelligence_is_admin()) WITH CHECK (intelligence_is_admin())',
      table_name
    );
    EXECUTE format('REVOKE ALL ON TABLE %I FROM anon', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO authenticated', table_name);
    EXECUTE format('GRANT ALL ON TABLE %I TO service_role', table_name);
  END LOOP;
END $$;

COMMIT;
