ALTER TABLE words DROP CONSTRAINT IF EXISTS words_level_check;
ALTER TABLE words ADD CONSTRAINT words_level_check CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2'));