/*
# Allow public read for AI-generated word images

1. Purpose
- AI-generated images (from Cloudflare FLUX.1 via the generate-word-image edge function)
  are stored under the `ai/` path in the `word-images` bucket.
- These images are public educational illustrations with no per-user ownership.
- The edge function uploads using the service role (bypasses RLS), but the frontend
  needs to read them via the anon key to display in the app.

2. Security changes
- Adds a SELECT policy on `storage.objects` allowing everyone (anon + authenticated)
  to read objects in the `word-images` bucket whose path starts with `ai/`.
- No write access is granted here; only the service role (edge function) writes to `ai/`.
*/

DROP POLICY IF EXISTS "word_images_select_ai_public" ON storage.objects;
CREATE POLICY "word_images_select_ai_public" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'word-images' AND (storage.foldername(name))[1] = 'ai');
