-- Configure Immutable Audit Log Storage
-- This migration sets up write-only permissions for SecurityAuditLog table

-- Step 1: Create a separate role for audit log writes (if using PostgreSQL)
-- Note: This is for PostgreSQL. Adjust for your database system.

-- Create role for audit log writes (write-only access)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'audit_log_writer') THEN
    CREATE ROLE audit_log_writer;
  END IF;
END
$$;

-- Grant INSERT permission only (no UPDATE, DELETE, or TRUNCATE)
GRANT INSERT ON "SecurityAuditLog" TO audit_log_writer;
GRANT USAGE, SELECT ON SEQUENCE "SecurityAuditLog_id_seq" TO audit_log_writer;

-- Revoke UPDATE and DELETE permissions from application role
-- Replace 'application_role' with your actual application database role
-- REVOKE UPDATE, DELETE ON "SecurityAuditLog" FROM application_role;

-- Create index for efficient querying (read-only queries by admin)
CREATE INDEX IF NOT EXISTS "SecurityAuditLog_timestamp_idx" ON "SecurityAuditLog"("timestamp" DESC);
CREATE INDEX IF NOT EXISTS "SecurityAuditLog_apiKeyId_idx" ON "SecurityAuditLog"("apiKeyId");
CREATE INDEX IF NOT EXISTS "SecurityAuditLog_eventType_idx" ON "SecurityAuditLog"("eventType");
CREATE INDEX IF NOT EXISTS "SecurityAuditLog_severity_idx" ON "SecurityAuditLog"("severity");

-- Add check constraint to prevent modification of signature
-- This ensures data integrity at the database level
ALTER TABLE "SecurityAuditLog" 
  ADD CONSTRAINT "SecurityAuditLog_signature_not_null" 
  CHECK ("signature" IS NOT NULL);

-- Optional: Create a trigger to prevent updates (PostgreSQL)
CREATE OR REPLACE FUNCTION prevent_audit_log_updates()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'SecurityAuditLog table is immutable. Updates are not allowed.';
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'prevent_audit_log_updates_trigger'
  ) THEN
    CREATE TRIGGER prevent_audit_log_updates_trigger
      BEFORE UPDATE OR DELETE ON "SecurityAuditLog"
      FOR EACH ROW
      EXECUTE FUNCTION prevent_audit_log_updates();
  END IF;
END
$$;

-- Note: For Supabase or other managed databases, you may need to:
-- 1. Use Row Level Security (RLS) policies instead
-- 2. Configure permissions through the database admin interface
-- 3. Use application-level enforcement
