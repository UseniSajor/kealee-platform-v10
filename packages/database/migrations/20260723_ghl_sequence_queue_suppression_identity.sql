-- Adds contact identity to ghl_sequence_queue so the send-time processor
-- (/api/cron/sequences) can check marketing_suppressions / marketing_consents
-- before dispatching an sms/email step. Additive and nullable: existing
-- pending rows enrolled before this migration have no identity to check and
-- are sent as before (see route comment for the compatibility note).
ALTER TABLE ghl_sequence_queue
  ADD COLUMN IF NOT EXISTS normalized_email text,
  ADD COLUMN IF NOT EXISTS normalized_phone text;

CREATE INDEX IF NOT EXISTS idx_ghl_seq_normalized_email ON ghl_sequence_queue (normalized_email);
CREATE INDEX IF NOT EXISTS idx_ghl_seq_normalized_phone ON ghl_sequence_queue (normalized_phone);
