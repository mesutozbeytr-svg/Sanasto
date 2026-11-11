/*
# Revoke unused anonymous access to vocabulary tables

1. Changes
- Removes all table privileges granted to the `anon` role on `categories`, `subcategories`, and `words`.

2. Why
- The app requires sign-in, so every data request runs as `authenticated`.
- Row level security already blocked `anon`, but the unused grants widened the attack surface.

3. Security
- No policies are changed. `authenticated` keeps its owner-scoped access.
- Idempotent: revoking an absent privilege is a no-op.

4. Notes
- No data is modified or deleted.
*/

REVOKE SELECT, INSERT, UPDATE, DELETE ON categories FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON subcategories FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON words FROM anon;
