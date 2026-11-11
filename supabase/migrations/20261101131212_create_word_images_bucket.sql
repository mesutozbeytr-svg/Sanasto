/*
# Create word image storage bucket

Plain-English summary
- Creates a storage area called "word-images" where users can upload pictures for their words.

1. New Storage
- Bucket `word-images`: public for reading (so pictures display in the app), limited to 5 MB per file and to common image types (PNG, JPEG, WEBP, GIF).

2. Security
- Each user can only upload, replace, list and delete files inside their own folder (named after their user id).
- Nobody can change files that belong to another user.

3. Important notes
- Files are stored as <user id>/<random name>, so the ownership check is enforced by the path itself.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'word-images',
  'word-images',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "word_images_select_own" ON storage.objects;
CREATE POLICY "word_images_select_own" ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'word-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "word_images_insert_own" ON storage.objects;
CREATE POLICY "word_images_insert_own" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'word-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "word_images_update_own" ON storage.objects;
CREATE POLICY "word_images_update_own" ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'word-images' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'word-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "word_images_delete_own" ON storage.objects;
CREATE POLICY "word_images_delete_own" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'word-images' AND (storage.foldername(name))[1] = auth.uid()::text);
