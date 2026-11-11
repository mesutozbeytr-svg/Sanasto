/*
# Track completed individual game types per word

1. Modified table
- `words`: new column `completed_game_types` (text array, not null, default empty array).

2. What it stores
- For each word, the list of individual game types (for example "choose-word", "listen-type") in which the word has been answered correctly at least once.
- A word becomes "learned" automatically only when every individual game type is present in this list. Wrong answers, unfinished games and repeated answers in the same game never add to the list.

3. Existing data
- Existing rows receive an empty list. No word, category, user record or learning status is changed.

4. Security
- No new table and no new policy. The existing row-level security on `words` (owner-only select, insert, update, delete) and the existing table grants for the `authenticated` role already cover this column.

5. Notes
- The migration is additive and safe to re-run because it uses IF NOT EXISTS.
*/

ALTER TABLE words ADD COLUMN IF NOT EXISTS completed_game_types text[] NOT NULL DEFAULT '{}';
