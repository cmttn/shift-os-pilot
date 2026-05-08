DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_authenticated_uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'club-assets');

CREATE POLICY "allow_authenticated_updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'club-assets');

CREATE POLICY "allow_authenticated_reads"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'club-assets');

CREATE POLICY "allow_public_reads"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'club-assets');

CREATE POLICY "allow_authenticated_deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'club-assets');

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'club-assets',
  'club-assets',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
