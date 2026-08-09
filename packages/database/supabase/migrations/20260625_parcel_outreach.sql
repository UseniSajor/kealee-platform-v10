-- Parcel owner outreach — proactive property-based marketing (Supabase)
-- Targets identified from GIS/assessor; enriched via skip-trace or intake match; contacted via email/SMS/direct mail.

CREATE TABLE IF NOT EXISTS parcel_outreach_targets (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id           text,
  address             text NOT NULL,
  city                text,
  county              text,
  state               text DEFAULT 'VA',
  zip_code            text,
  jurisdiction        text,
  zoning_code         text,
  lot_size_sqft       integer,
  year_built          integer,
  property_type       text,
  ownership_type      text,
  owner_name          text,
  owner_mailing_address text,
  owner_email         text,
  owner_phone         text,
  enrichment_status   text NOT NULL DEFAULT 'pending',
  enrichment_source   text,
  enrichment_attempts integer NOT NULL DEFAULT 0,
  last_enriched_at    timestamptz,
  intelligence_rule_id text,
  recommended_product text,
  campaign_day        integer,
  outreach_token      text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  property_twin_id    uuid,
  converted_intake_id uuid,
  opted_out           boolean NOT NULL DEFAULT false,
  metadata            jsonb NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parcel_outreach_enrichment
  ON parcel_outreach_targets (enrichment_status, enrichment_attempts);
CREATE INDEX IF NOT EXISTS idx_parcel_outreach_address
  ON parcel_outreach_targets (address);
CREATE INDEX IF NOT EXISTS idx_parcel_outreach_token
  ON parcel_outreach_targets (outreach_token);
CREATE INDEX IF NOT EXISTS idx_parcel_outreach_not_converted
  ON parcel_outreach_targets (converted_intake_id) WHERE converted_intake_id IS NULL;

CREATE TABLE IF NOT EXISTS parcel_outreach_queue (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id       uuid NOT NULL REFERENCES parcel_outreach_targets(id) ON DELETE CASCADE,
  channel         text NOT NULL,
  sequence_step   integer NOT NULL DEFAULT 1,
  payload         jsonb NOT NULL DEFAULT '{}',
  scheduled_at    timestamptz NOT NULL,
  status          text NOT NULL DEFAULT 'pending',
  sent_at         timestamptz,
  error_message   text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parcel_outreach_queue_pending
  ON parcel_outreach_queue (status, scheduled_at);
