# PR #22 exact migration validation

This isolated Supabase CLI project reconstructs the documented production profile contract with synthetic Auth users and favorite-team JSON. It never connects to a hosted Supabase project and contains no production data or credentials.

## Exact migration execution

The CI workflow copies the executable contents of the root PR #22 migration files into this project's migration directory (renaming only their version prefixes to order them after the synthetic schema/fixture migrations), then runs a fresh local database reset:

- `supabase/migrations/20261114150000_p0c_relational_favorite_teams.sql`
- `supabase/migrations/20261114151000_p0_auth_rls_review_remediation.sql`

This ensures the preflight and RPC migrations tested are the exact files proposed for integration, not a separately maintained SQL copy. The fixture schema is a synthetic reconstruction of the documented production profile contract. It is not a production schema dump and does not prove production migration history.

## Safety

- Supabase CLI workdir is `validation` and uses non-default loopback ports.
- No project linking, access token, hosted URL, database password, or production data is used.
- The test starts a local Docker-backed stack, resets only that stack, checks schema/data/RLS, and stops the stack even after failure.
- Never change this workdir to a hosted project or use these reset commands against a shared database.
