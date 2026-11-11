ALTER TABLE words DROP CONSTRAINT IF EXISTS words_image_source_check;

ALTER TABLE words ADD CONSTRAINT words_image_source_check CHECK (
  image_source IS NULL OR image_source = ANY (ARRAY[
    'upload', 'link', 'ai', 'search', 'twemoji', 'openmoji',
    'wikimedia', 'pixabay', 'pexels', 'unsplash',
    'google_ai_mode', 'gemini'
  ]::text[])
);