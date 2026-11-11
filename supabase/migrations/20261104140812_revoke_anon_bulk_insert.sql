/*
# Revoke anon EXECUTE on bulk_insert_word_library after data loading

Data loading is complete. Revoke the temporary anon access to the bulk insert function.
The function remains available to authenticated users (service_role bypasses RLS).
*/

REVOKE EXECUTE ON FUNCTION bulk_insert_word_library(json) FROM anon;
