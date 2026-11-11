/*
# Harden word library access

1. Purpose
- Make the shared word library read-only for signed-in users.
- Remove anonymous access and all client-side write access.
- Lock the bulk loading function's search_path and remove remote execution after the initial load.

2. Modified tables
- `public.word_library`
- Anonymous users lose all table privileges.
- Authenticated users retain SELECT only.
- Existing rows and columns are not changed or deleted.

3. Modified function
- `public.bulk_insert_word_library(json)` keeps its existing behavior, but its search path is fixed to `public`.
- EXECUTE is revoked from PUBLIC, anon, and authenticated because the initial data load is complete.

4. Security
- RLS remains enabled.
- The existing authenticated SELECT policy remains unchanged.
- No data is deleted.
*/

REVOKE ALL ON TABLE public.word_library FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.word_library FROM authenticated;
GRANT SELECT ON TABLE public.word_library TO authenticated;

ALTER FUNCTION public.bulk_insert_word_library(json) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.bulk_insert_word_library(json) FROM PUBLIC, anon, authenticated;