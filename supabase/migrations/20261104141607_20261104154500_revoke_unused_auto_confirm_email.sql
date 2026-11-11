/*
# Revoke unused email confirmation function access

1. Purpose
- Prevent remote callers from executing the existing `public.auto_confirm_email()` SECURITY DEFINER function.

2. Scope
- The function is not referenced by the application source or tracked migrations.
- The function itself is not deleted, so this change does not remove database data or objects.

3. Security
- EXECUTE is revoked from PUBLIC, anon, and authenticated.
- No tables, rows, columns, or policies are changed.
*/

REVOKE EXECUTE ON FUNCTION public.auto_confirm_email() FROM PUBLIC, anon, authenticated;