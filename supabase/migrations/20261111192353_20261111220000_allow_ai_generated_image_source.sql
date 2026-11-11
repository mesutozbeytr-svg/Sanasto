/*
# Allow AI-generated word images

1. Purpose
- Allow successfully generated AI images to be saved on vocabulary words.
- Fix the mismatch between the application's supported image source values and the database constraint.

2. Modified table
- `public.words`
- `image_source` accepts the existing image source values plus `ai_generated`.
- No rows, columns, or existing image URLs are changed.

3. Security
- The existing row-level security policies and grants are unchanged.
- Users can only update words they already own under the existing policies.

4. Important notes
- The constraint is recreated with the same existing values and the new `ai_generated` value.
- The migration is idempotent and does not delete user data.
*/

ALTER TABLE public.words DROP CONSTRAINT IF EXISTS words_image_source_check;

ALTER TABLE public.words
  ADD CONSTRAINT words_image_source_check CHECK (
    image_source IS NULL OR image_source IN (
      'upload', 'link', 'ai', 'ai_generated', 'search', 'twemoji', 'openmoji', 'wikimedia', 'google_ai_mode'
    )
  );