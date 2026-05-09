-- ─────────────────────────────────────────────────────────────────────────────
-- Storage bucket: concept-videos
-- Used by /api/concept/video to mirror Sora 2 binary output (and to host
-- Veo / Kling outputs for the customer portal video player).
--
-- Apply directly in Supabase SQL editor or via prisma migrate deploy.
-- Idempotent — safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create bucket (Supabase storage). Public read is required so the customer
-- browser can render the <video src="…"> tag without signing every URL.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'concept-videos',
  'concept-videos',
  TRUE,
  157286400, -- 150 MB max per object (Sora 1080p / 20s caps well under this)
  ARRAY['video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO UPDATE
  SET public            = EXCLUDED.public,
      file_size_limit   = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. RLS policies. Service role (used by /api/concept/video on the server)
-- bypasses RLS automatically, so we only need a permissive SELECT for the
-- public anon role to render the <video> tag in the customer portal.

DO $$
BEGIN
  -- Public read access (URLs are unguessable UUID-prefixed paths)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'concept_videos_public_read'
  ) THEN
    CREATE POLICY concept_videos_public_read
      ON storage.objects
      FOR SELECT
      TO anon, authenticated
      USING (bucket_id = 'concept-videos');
  END IF;

  -- Authenticated users may NOT upload directly — only the service role
  -- (the API route) can write. We omit INSERT/UPDATE/DELETE policies so they
  -- default-deny for non-service-role callers.
END
$$;
