# P0-B — Canonical Sports / Leagues / Teams Model

## Decision

Introduce RallyOn-owned reference entities in three levels:

`sports → leagues → teams`

Use UUID primary keys internally. Keep human/provider-facing codes as alternate identifiers, never as relational foreign keys. A league belongs to exactly one sport; a team belongs to exactly one league in this first iteration. If a future entity genuinely participates in multiple competitions, model that through a separate team/league membership relation rather than weakening identity constraints.

## Schema

- `sports`: stable code/slug, display name, broad category, active flag.
- `leagues`: FK to sport, sport-scoped unique code and slug, country/competition metadata.
- `teams`: FK to league, league-scoped unique slug, display/short names, abbreviation, branding and location metadata.
- `sport_provider_ids`, `league_provider_ids`, `team_provider_ids`: one-to-many external identity mappings. `(provider, external_id)` is unique within each entity type. Provider IDs are not exposed to ordinary clients.
- `games`: nullable `league_id`, `home_team_id`, `away_team_id` FKs added alongside the current text/JSONB fields.

## Why provider mappings are separate

A canonical entity can be supplied by ESPN today and another provider tomorrow. Storing a single external ID on the canonical row creates provider lock-in and cannot represent cross-provider identity. Separate mapping tables make provider migration and reconciliation explicit and enforce uniqueness without JSON indexes or provider-specific columns.

## Existing application integration points

1. `src/types.ts`: current `SportsLeague`, `SportsType`, `SportsTeam`, `SportsGame`, and `TeamReference` are string/embedded-object oriented. Add canonical IDs and provider identity metadata in a later application PR while retaining legacy fields during transition.
2. `src/services/sports/sportsRegistry.ts`: current registry is the natural source of supported sport/league codes and display metadata. Seed/reference synchronization should derive from this registry rather than duplicating a second hand-maintained list.
3. `src/services/sports/espnProvider.ts` and `commercialProvider.ts`: normalize provider competition/team IDs through the mapping tables before writing games.
4. `src/services/sports/sportsService.ts`: resolve provider event participants to canonical IDs; preserve raw provider payloads for diagnostics.
5. `src/services/teamPreferenceService.ts`: favorite-team matching currently compares names/abbreviations. Prefer canonical team UUID equality, with current text matching as a compatibility fallback.
6. `src/services/gameService.ts` and venue programming: use canonical game/team IDs when present; continue reading existing game JSONB until all consumers are migrated.

## Migration and rollout

1. Apply schema migration in a non-production Supabase environment first.
2. Seed `sports` and `leagues` from the supported registry with deterministic codes/slugs and idempotent upserts.
3. Ingest provider identity mappings and canonical teams. Do not infer a team match from a display name alone where league/provider context is missing or ambiguous.
4. Backfill `games.league_id` from the existing league code and `home_team_id`/`away_team_id` only when a provider mapping or an unambiguous league-scoped identity is available. Leave unresolved rows NULL and report them.
5. Update sync writers to populate canonical IDs and legacy payloads together.
6. Migrate favorite-team/profile references and venue fan affiliations to canonical team IDs in a separate compatibility-aware step.
7. After all readers/writers and data audits are complete, consider making canonical event references required where the event type supports teams. Do not drop legacy columns in this P0-B migration.

## Integrity, indexes, and RLS

- UUID PKs; restrictive deletes from sport → league → team so referenced taxonomy cannot disappear accidentally.
- Unique sport code/slug; unique league code/slug within sport; unique team slug within league.
- Unique provider/external ID per entity type, with reverse indexes by canonical FK.
- Composite indexes for active league/team browsing and canonical game schedule lookups.
- Public SELECT for sports/leagues/teams to match the existing public-read games model.
- Provider mapping tables deny anon/authenticated access; trusted service-role sync jobs own writes and lookups.
- No client write policies are introduced.

## Scope and explicit non-goals

- No production Supabase changes.
- No destructive rename/drop of `games.league`, `home_team`, or `away_team`.
- No automatic name-only backfill.
- No changes to sports sync scheduling, sync secrets, production-data isolation, venue propagation, or P0-A profile source of truth.
- No UI behavior change in this migration-only PR.

## Touched files

- `supabase/migrations/20261112120000_p0b_canonical_sports_leagues_teams.sql`
- `docs/architecture/p0b-canonical-sports-leagues-teams.md`

## Validation required before merge

- Replay migrations on a disposable Supabase database.
- Verify duplicate provider IDs fail for each entity type.
- Verify sport/league/team FK integrity and unique constraints.
- Verify anon/authenticated can read public taxonomy but cannot read provider mapping tables or write taxonomy.
- Verify existing game reads and sports-sync jobs continue to work with all new game FK columns NULL.
