/*
# Temporarily grant anon EXECUTE on bulk_insert_word_library for data loading

This migration grants EXECUTE on the bulk_insert_word_library function to the anon role
so we can load curated word data via the REST API with the anon key.
A follow-up migration will revoke this access after loading is complete.
*/

GRANT EXECUTE ON FUNCTION bulk_insert_word_library(json) TO anon;
