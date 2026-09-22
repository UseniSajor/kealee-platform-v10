-- public_intake_leads.source_channel — written but never defined.
--
-- Three inbound lead webhooks insert this column:
--   /api/webhooks/facebook-leads   source_channel: 'facebook'
--   /api/webhooks/nextdoor-leads   source_channel: 'nextdoor'
--   /api/webhooks/reddit-leads     source_channel: 'reddit'
-- and two readers group by it: /api/admin/marketing/dashboard and
-- lib/marketing-agency/analytics.
--
-- It appears in no CREATE TABLE and no ALTER TABLE anywhere in this repo. The
-- name also exists on the intelligence layer's lead-twin table, which is a
-- different table and is why a plain grep suggests it was already defined.
--
-- Confirmed missing in production: the marketing dashboard reported
-- leadsToday=2 with sourceBreakdown={}. That route captures the error into
-- `err7` and never checks it, so `bySource || []` silently degrades to an
-- empty array — a present column with null values would still have produced
-- {"unknown": 2}.
--
-- Consequence: the three lead webhooks fail their insert, so paid ad leads
-- from Facebook, Nextdoor and Reddit are not recorded.
--
-- Left nullable with no default. `source` already carries the coarse origin
-- ('web-main'); source_channel is the finer paid-channel attribution and is
-- genuinely unknown for every row written before this migration.

ALTER TABLE public_intake_leads
  ADD COLUMN IF NOT EXISTS source_channel TEXT;

-- Both readers filter/group by channel over a date range.
CREATE INDEX IF NOT EXISTS idx_public_intake_leads_source_channel
  ON public_intake_leads (source_channel, created_at);
