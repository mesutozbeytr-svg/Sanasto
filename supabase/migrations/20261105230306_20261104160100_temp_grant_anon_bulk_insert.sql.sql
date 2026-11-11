/*
# Temporarily grant EXECUTE on bulk_insert_word_library to anon

1. Purpose
- Allow the data-loading script (using the anon key) to call bulk_insert_word_library for the initial 17,570-word load.
- This is a temporary grant that will be revoked in the next security migration.

2. Security
- EXECUTE granted to anon only for the duration of the data load.
- Will be revoked in the harden_word_library_access migration.
*/

GRANT EXECUTE ON FUNCTION public.bulk_insert_word_library(json) TO anon;