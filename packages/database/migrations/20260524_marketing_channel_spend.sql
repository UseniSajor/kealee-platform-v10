-- Daily marketing spend by provider (Google, Meta, SaaS) for channel ROI
CREATE TABLE IF NOT EXISTS marketing_channel_spend (
  spend_date    DATE         NOT NULL,
  provider      TEXT         NOT NULL,
  spend_cents   BIGINT       NOT NULL DEFAULT 0,
  currency      TEXT         NOT NULL DEFAULT 'USD',
  synced_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  metadata      JSONB,
  PRIMARY KEY (spend_date, provider)
);

CREATE INDEX IF NOT EXISTS idx_marketing_channel_spend_date
  ON marketing_channel_spend (spend_date DESC);

COMMENT ON TABLE marketing_channel_spend IS 'Daily ad/SaaS spend; providers: google_ads, meta_ads, marketing_saas';
