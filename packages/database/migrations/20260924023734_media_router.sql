-- Mirror of supabase/migrations/20260924023734_media_router.sql for the
-- package-level migration runner used by legacy deployments.
UPDATE marketing_os_agents
SET
  tools = '["higgsfield","seedance","veo","replicate","runway","elevenlabs","media_archive"]'::jsonb,
  updated_at = now()
WHERE key = 'video';
