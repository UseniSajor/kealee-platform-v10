-- Creates the Storage buckets documented in packages/storage/src/storage.ts's
-- header comment that were never actually provisioned in Supabase:
-- documents, permits, receipts, site-photos (all actively referenced by
-- uploadDocument/uploadFile call sites) plus profiles (documented, not yet
-- called anywhere, but part of the intended 7-bucket design — cheap to add
-- now rather than hit the same "bucket not found" surprise later).
--
-- Public, matching every other bucket already live in this project
-- (capture-assets, concept-uploads, designs, marketing-media,
-- replicate-archive are all public: true) and matching what uploadFile()
-- actually requires — it calls storage.getPublicUrl() unconditionally, not
-- createSignedUrl(), so a private bucket here would accept uploads but hand
-- back a broken URL. See docs/audits/2026-07-17-supabase-schema-drift-handoff.md
-- for the private-vs-public follow-up this doesn't attempt to fix.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('documents', 'documents', true, 26214400,
    ARRAY['application/pdf','application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg','image/png']),
  ('permits', 'permits', true, 26214400,
    ARRAY['application/pdf','image/jpeg','image/png']),
  ('receipts', 'receipts', true, 15728640,
    ARRAY['application/pdf','image/jpeg','image/png','image/heic']),
  ('site-photos', 'site-photos', true, 26214400,
    ARRAY['image/jpeg','image/png','image/webp','image/heic']),
  ('profiles', 'profiles', true, 5242880,
    ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;
