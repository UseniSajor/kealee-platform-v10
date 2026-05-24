-- Storage bucket: marketing-media (homepage + product card images/videos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketing-media',
  'marketing-media',
  TRUE,
  52428800,
  ARRAY['image/jpeg', 'image/webp', 'image/png', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'marketing_media_public_read'
  ) THEN
    CREATE POLICY marketing_media_public_read
      ON storage.objects
      FOR SELECT
      TO anon, authenticated
      USING (bucket_id = 'marketing-media');
  END IF;
END
$$;
