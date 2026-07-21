-- Canonical marketing/sales data foundation.
-- Additive only: public_intake_leads remains the operational CRM/intake record.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.marketing_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  intake_lead_id uuid REFERENCES public.public_intake_leads(id) ON DELETE SET NULL,
  normalized_email text,
  normalized_phone text,
  company_name text,
  company_domain text,
  contact_name text,
  job_title text,
  seniority text,
  industry text,
  location text,
  source text NOT NULL,
  source_record_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marketing_contacts_identity_present CHECK (
    normalized_email IS NOT NULL OR normalized_phone IS NOT NULL OR source_record_id IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS marketing_contacts_org_email_uidx
  ON public.marketing_contacts (organization_id, normalized_email)
  WHERE normalized_email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS marketing_contacts_org_phone_uidx
  ON public.marketing_contacts (organization_id, normalized_phone)
  WHERE normalized_phone IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS marketing_contacts_source_uidx
  ON public.marketing_contacts (organization_id, source, source_record_id)
  WHERE source_record_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.marketing_campaigns_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  audience jsonb NOT NULL DEFAULT '{}'::jsonb,
  product_keys text[] NOT NULL DEFAULT '{}',
  lead_source text NOT NULL,
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'awaiting_approval', 'approved', 'active', 'paused', 'completed', 'archived'
  )),
  owner_user_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  daily_send_cap integer NOT NULL DEFAULT 0 CHECK (daily_send_cap >= 0),
  target_metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  actual_metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  cost_cents integer NOT NULL DEFAULT 0 CHECK (cost_cents >= 0),
  approval_required boolean NOT NULL DEFAULT true,
  pause_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketing_campaign_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  campaign_id uuid NOT NULL REFERENCES public.marketing_campaigns_v2(id) ON DELETE CASCADE,
  decision text NOT NULL CHECK (decision IN ('approved', 'rejected', 'revoked')),
  decided_by uuid NOT NULL,
  reason text,
  policy_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS marketing_campaign_approval_lookup_idx
  ON public.marketing_campaign_approvals (campaign_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.marketing_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'active', 'paused', 'archived')),
  stop_on_reply boolean NOT NULL DEFAULT true,
  stop_on_opt_out boolean NOT NULL DEFAULT true,
  stop_on_bounce boolean NOT NULL DEFAULT true,
  stop_on_complaint boolean NOT NULL DEFAULT true,
  stop_on_purchase boolean NOT NULL DEFAULT true,
  timezone text NOT NULL DEFAULT 'America/New_York',
  send_window jsonb NOT NULL DEFAULT '{"start":"09:00","end":"17:00","businessDays":[1,2,3,4,5]}'::jsonb,
  max_steps integer NOT NULL DEFAULT 5 CHECK (max_steps BETWEEN 1 AND 20),
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketing_sequence_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  sequence_id uuid NOT NULL REFERENCES public.marketing_sequences(id) ON DELETE CASCADE,
  step_index integer NOT NULL CHECK (step_index >= 0),
  channel text NOT NULL CHECK (channel IN ('email', 'sms', 'call_task', 'linkedin_task', 'meeting_reminder')),
  delay_seconds integer NOT NULL DEFAULT 0 CHECK (delay_seconds >= 0),
  template_key text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  approval_status text NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sequence_id, step_index)
);

CREATE TABLE IF NOT EXISTS public.marketing_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  campaign_id uuid NOT NULL REFERENCES public.marketing_campaigns_v2(id),
  sequence_id uuid NOT NULL REFERENCES public.marketing_sequences(id),
  contact_id uuid NOT NULL REFERENCES public.marketing_contacts(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'stopped', 'held', 'failed')),
  current_step integer NOT NULL DEFAULT 0,
  next_action_at timestamptz,
  stop_reason text,
  started_at timestamptz NOT NULL DEFAULT now(),
  stopped_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, campaign_id, contact_id)
);
CREATE INDEX IF NOT EXISTS marketing_enrollments_due_idx
  ON public.marketing_enrollments (status, next_action_at);

CREATE TABLE IF NOT EXISTS public.marketing_message_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  enrollment_id uuid REFERENCES public.marketing_enrollments(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.marketing_campaigns_v2(id) ON DELETE SET NULL,
  contact_id uuid NOT NULL REFERENCES public.marketing_contacts(id),
  sequence_step_id uuid REFERENCES public.marketing_sequence_steps(id) ON DELETE SET NULL,
  channel text NOT NULL,
  provider text,
  provider_message_id text,
  idempotency_key text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN (
    'blocked', 'queued', 'sent', 'delivered', 'replied', 'bounced', 'complained', 'failed', 'cancelled'
  )),
  policy_decision jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_code text,
  error_message text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS marketing_message_health_idx
  ON public.marketing_message_attempts (organization_id, status, occurred_at DESC);

CREATE TABLE IF NOT EXISTS public.marketing_suppressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid,
  normalized_email text,
  normalized_phone text,
  reason text NOT NULL CHECK (reason IN (
    'opt_out', 'hard_bounce', 'complaint', 'privacy_request', 'manual', 'legal', 'duplicate_risk'
  )),
  scope text NOT NULL DEFAULT 'organization' CHECK (scope IN ('global', 'organization', 'campaign')),
  campaign_id uuid REFERENCES public.marketing_campaigns_v2(id) ON DELETE CASCADE,
  source text NOT NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marketing_suppression_identity_present CHECK (
    normalized_email IS NOT NULL OR normalized_phone IS NOT NULL
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS marketing_suppressions_email_uidx
  ON public.marketing_suppressions (COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid), normalized_email, scope, COALESCE(campaign_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE normalized_email IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.marketing_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  contact_id uuid NOT NULL REFERENCES public.marketing_contacts(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email', 'sms', 'phone')),
  status text NOT NULL CHECK (status IN ('unknown', 'granted', 'denied', 'withdrawn')),
  lawful_basis text,
  source text NOT NULL,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  UNIQUE (organization_id, contact_id, channel)
);

CREATE TABLE IF NOT EXISTS public.marketing_attributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  intake_lead_id uuid REFERENCES public.public_intake_leads(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.marketing_contacts(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.marketing_campaigns_v2(id) ON DELETE SET NULL,
  referral_id uuid,
  touch_type text NOT NULL CHECK (touch_type IN ('first', 'last', 'assisted', 'conversion')),
  source text NOT NULL,
  medium text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  revenue_cents integer NOT NULL DEFAULT 0,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS marketing_attribution_funnel_idx
  ON public.marketing_attributions (organization_id, campaign_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS public.marketing_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid,
  name text NOT NULL,
  partner_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended', 'rejected', 'archived')),
  referral_code text NOT NULL,
  agreement_accepted_at timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, referral_code)
);

CREATE TABLE IF NOT EXISTS public.marketing_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  partner_id uuid NOT NULL REFERENCES public.marketing_partners(id),
  contact_id uuid REFERENCES public.marketing_contacts(id),
  intake_lead_id uuid REFERENCES public.public_intake_leads(id),
  status text NOT NULL DEFAULT 'captured' CHECK (status IN ('captured', 'qualified', 'converted', 'rejected', 'fraud_review')),
  attributed_revenue_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  converted_at timestamptz
);

ALTER TABLE public.marketing_attributions
  ADD CONSTRAINT marketing_attributions_referral_fk
  FOREIGN KEY (referral_id) REFERENCES public.marketing_referrals(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.marketing_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  partner_id uuid NOT NULL REFERENCES public.marketing_partners(id),
  referral_id uuid NOT NULL REFERENCES public.marketing_referrals(id),
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'payable', 'paid', 'reversed', 'held')),
  rule_snapshot jsonb NOT NULL,
  approved_by uuid,
  paid_at timestamptz,
  reversed_at timestamptz,
  reversal_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketing_integration_cursors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  provider text NOT NULL,
  campaign_id uuid REFERENCES public.marketing_campaigns_v2(id),
  cursor_value text,
  status text NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'rate_limited', 'failed', 'disabled')),
  imported_count integer NOT NULL DEFAULT 0,
  import_cap integer NOT NULL DEFAULT 0 CHECK (import_cap >= 0),
  last_success_at timestamptz,
  last_error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider, campaign_id)
);

CREATE TABLE IF NOT EXISTS public.marketing_daily_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  metric_date date NOT NULL,
  campaign_id uuid REFERENCES public.marketing_campaigns_v2(id),
  channel text NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, metric_date, campaign_id, channel)
);

-- Exposed marketing tables are service-role only until staff-facing policies are
-- introduced with a verified auth-user-to-organization membership mapping.
DO $rls$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'marketing_contacts', 'marketing_campaigns_v2', 'marketing_campaign_approvals',
    'marketing_sequences', 'marketing_sequence_steps', 'marketing_enrollments',
    'marketing_message_attempts', 'marketing_suppressions', 'marketing_consents',
    'marketing_attributions', 'marketing_partners', 'marketing_referrals',
    'marketing_commissions', 'marketing_integration_cursors', 'marketing_daily_metrics'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS service_role_all ON public.%I', table_name);
    EXECUTE format(
      'CREATE POLICY service_role_all ON public.%I TO service_role USING (true) WITH CHECK (true)',
      table_name
    );
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', table_name);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', table_name);
  END LOOP;
END
$rls$;

