-- Weekly product email campaigns (Command Center → "Weekly product campaign").
--
-- NOTE: `marketing_campaigns` already exists as the Prisma-managed product
-- catalog (name/slug/headline/benefits) and is wired to a relation, so the
-- weekly-email scheduler gets its own table to avoid a schema collision.
-- Written by apps/web-main/lib/marketing/campaign-runner.ts and read by
-- apps/web-main/lib/marketing-agency/analytics.ts (fetchCampaignsList).

CREATE TABLE IF NOT EXISTS public.marketing_email_campaigns (
  id                 text PRIMARY KEY,
  week_number        integer NOT NULL,
  product_id         text NOT NULL,
  secondary_product  text,
  campaign_type      text NOT NULL,
  persona_id         text,
  theme              text,
  scheduled_day      text,
  channels           text[] NOT NULL DEFAULT '{}',
  status             text NOT NULL DEFAULT 'scheduled',
  email_subject      text,
  email_body         text,
  message_template   text,
  recipients_count   integer NOT NULL DEFAULT 0,
  leads_generated    integer NOT NULL DEFAULT 0,
  sent_at            timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketing_email_campaigns_week_idx
  ON public.marketing_email_campaigns (week_number DESC);
CREATE INDEX IF NOT EXISTS marketing_email_campaigns_day_status_idx
  ON public.marketing_email_campaigns (scheduled_day, status);

-- Service-role only (ops/cron writes); no anon access.
ALTER TABLE public.marketing_email_campaigns ENABLE ROW LEVEL SECURITY;
