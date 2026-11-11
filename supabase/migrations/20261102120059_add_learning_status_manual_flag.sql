/*
# Add manual learning status flag to words

1. Modified Tables
- `words`: new column `learning_status_manual` (boolean, not null, default false).

2. Purpose
- When a user picks a learning status by hand on a flashcard, the flag is set to true.
- Automatic progress from games will not change the status of a flagged word.
- Existing rows get false, so their current status and progress are kept unchanged.

3. Security
- No change to RLS or grants. The column is covered by the existing policies on `words`.
*/

ALTER TABLE words ADD COLUMN IF NOT EXISTS learning_status_manual boolean NOT NULL DEFAULT false;
