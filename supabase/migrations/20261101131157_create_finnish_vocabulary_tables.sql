/*
# Create categories, subcategories and words tables

Plain-English summary
- Adds the data needed for the Finnish vocabulary app. Every row belongs to the user who created it, so each person only sees their own words and categories.

1. New Tables
- `categories`: main topics such as "Ev" or "Hayvanlar". Name must be unique per user (case-insensitive).
- `subcategories`: topics inside a main category. Name must be unique inside its parent category.
- `words`: Finnish word, Turkish meaning, word type, level (A1-B2), category, subcategory, image link, example sentence, grammar note, favorite flag, learning status, correct/wrong counters and last study date.

2. Security
- Row Level Security is enabled on all three tables.
- Only the signed-in owner can read, add, change or delete their rows.
- Grants are given only to the `authenticated` role (sign-in is required).

3. Important notes
- Deleting a main category does not delete its words; their category is cleared instead (set to empty), so no study data is lost.
- Deleting a subcategory likewise clears the subcategory on words.
- Words without an image are allowed and are treated as drafts by the app.
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 80),
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS categories_user_name_unique ON categories (user_id, lower(name));
CREATE INDEX IF NOT EXISTS categories_user_id_idx ON categories (user_id);

CREATE TABLE IF NOT EXISTS subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 80),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS subcategories_category_name_unique ON subcategories (category_id, lower(name));
CREATE INDEX IF NOT EXISTS subcategories_user_id_idx ON subcategories (user_id);

CREATE TABLE IF NOT EXISTS words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  finnish text NOT NULL CHECK (char_length(btrim(finnish)) BETWEEN 1 AND 120),
  turkish text NOT NULL CHECK (char_length(btrim(turkish)) BETWEEN 1 AND 300),
  word_type text NOT NULL DEFAULT 'other' CHECK (word_type IN (
    'noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition',
    'conjunction', 'numeral', 'interjection', 'phrase', 'other'
  )),
  level text NOT NULL DEFAULT 'A1' CHECK (level IN ('A1', 'A2', 'B1', 'B2')),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id uuid REFERENCES subcategories(id) ON DELETE SET NULL,
  image_url text,
  image_source text CHECK (image_source IS NULL OR image_source IN ('upload', 'link', 'ai', 'search')),
  image_credit text,
  example_fi text,
  example_tr text,
  grammar_note text,
  is_favorite boolean NOT NULL DEFAULT false,
  learning_status text NOT NULL DEFAULT 'not_studied' CHECK (learning_status IN (
    'not_studied', 'learning', 'learned', 'review'
  )),
  correct_count integer NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
  wrong_count integer NOT NULL DEFAULT 0 CHECK (wrong_count >= 0),
  last_studied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS words_user_id_idx ON words (user_id);
CREATE INDEX IF NOT EXISTS words_user_finnish_idx ON words (user_id, lower(finnish));
CREATE INDEX IF NOT EXISTS words_category_idx ON words (category_id);
CREATE INDEX IF NOT EXISTS words_subcategory_idx ON words (subcategory_id);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON subcategories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON words TO authenticated;

DROP POLICY IF EXISTS "select_own_categories" ON categories;
CREATE POLICY "select_own_categories" ON categories FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_categories" ON categories;
CREATE POLICY "insert_own_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_categories" ON categories;
CREATE POLICY "update_own_categories" ON categories FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_categories" ON categories;
CREATE POLICY "delete_own_categories" ON categories FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_subcategories" ON subcategories;
CREATE POLICY "select_own_subcategories" ON subcategories FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_subcategories" ON subcategories;
CREATE POLICY "insert_own_subcategories" ON subcategories FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_subcategories" ON subcategories;
CREATE POLICY "update_own_subcategories" ON subcategories FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_subcategories" ON subcategories;
CREATE POLICY "delete_own_subcategories" ON subcategories FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_words" ON words;
CREATE POLICY "select_own_words" ON words FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_words" ON words;
CREATE POLICY "insert_own_words" ON words FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_words" ON words;
CREATE POLICY "update_own_words" ON words FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_words" ON words;
CREATE POLICY "delete_own_words" ON words FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
