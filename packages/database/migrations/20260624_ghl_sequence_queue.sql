-- ghl_sequence_queue — multi-step GHL nurture sequences (cron /api/cron/sequences)
CREATE TABLE IF NOT EXISTS ghl_sequence_queue (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id      text,
  ghl_contact_id  text,
  sequence_id     text NOT NULL,
  step_index      integer NOT NULL DEFAULT 0,
  step_type       text NOT NULL,
  payload         jsonb NOT NULL DEFAULT '{}',
  scheduled_at    timestamptz NOT NULL,
  status          text NOT NULL DEFAULT 'pending',
  processed_at    timestamptz,
  error_message   text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ghl_seq_status_scheduled
  ON ghl_sequence_queue (status, scheduled_at);
