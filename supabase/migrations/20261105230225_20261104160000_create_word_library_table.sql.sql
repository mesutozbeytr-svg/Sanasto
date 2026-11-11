/*
# Create word_library table

1. New Tables
- `word_library` — shared, read-only dictionary of 17,570 Finnish–Turkish words compiled from FreeDict, Kotus, and FrequencyWords.
  - `id` (uuid, primary key)
  - `finnish` (text, not null) — Finnish headword
  - `turkish` (text, not null) — Turkish translation(s)
  - `word_type` (text, not null, default 'other') — part of speech
  - `level` (text, nullable) — estimated CEFR level A1–C2
  - `level_verified` (boolean, not null, default false) — whether level is confirmed
  - `frequency_rank` (integer, nullable) — frequency rank in Finnish corpus
  - `frequency_count` (integer, nullable) — frequency count in Finnish corpus
  - `has_kotus_validation` (boolean, not null, default false) — validated against Kotus word list
  - `source` (text, not null) — data source(s)
  - `license` (text, not null) — license info

2. Indexes
- `word_library_freq_idx` on (frequency_rank) — speeds up frequency-ordered queries
- `word_library_finnish_idx` on (finnish) — speeds up alphabetical sort and search
- `word_library_level_idx` on (level) — speeds up level filtering

3. Security
- Enable RLS on `word_library`.
- Grant SELECT to `authenticated` only (the app requires sign-in).
- Read-only: no INSERT/UPDATE/DELETE policies for client roles.
- `service_role` gets SELECT so edge functions can read if needed.
- The existing `bulk_insert_word_library(json)` SECURITY DEFINER function will be used for the initial data load.
*/

CREATE TABLE IF NOT EXISTS public.word_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finnish text NOT NULL,
  turkish text NOT NULL,
  word_type text NOT NULL DEFAULT 'other',
  level text,
  level_verified boolean NOT NULL DEFAULT false,
  frequency_rank integer,
  frequency_count integer,
  has_kotus_validation boolean NOT NULL DEFAULT false,
  source text NOT NULL,
  license text NOT NULL DEFAULT 'CC BY-SA 3.0'
);

ALTER TABLE public.word_library ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS word_library_freq_idx ON public.word_library (frequency_rank);
CREATE INDEX IF NOT EXISTS word_library_finnish_idx ON public.word_library (finnish);
CREATE INDEX IF NOT EXISTS word_library_level_idx ON public.word_library (level);

GRANT SELECT ON public.word_library TO authenticated;
GRANT SELECT ON public.word_library TO service_role;

DROP POLICY IF EXISTS "authenticated_read_word_library" ON public.word_library;
CREATE POLICY "authenticated_read_word_library"
ON public.word_library FOR SELECT
TO authenticated USING (true);