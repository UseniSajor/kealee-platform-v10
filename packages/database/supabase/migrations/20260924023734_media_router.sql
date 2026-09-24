-- Route Marketing OS visual generation through the shared Kealee Media Router.
UPDATE marketing_os_agents
SET
  tools = '["higgsfield","seedance","veo","replicate","runway","elevenlabs","media_archive"]'::jsonb,
  updated_at = now()
WHERE key = 'video';
