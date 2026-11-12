# P0-C Database Validation and P0-A Coordination

Preparation only. No database was changed. PR #18 remains open/draft and unmerged.

## Safety boundary

- Use only a disposable Supabase project or local Supabase instance.
- Do not apply this migration to production.
- Do not merge PR #18 or change main.
- Prefer a fresh disposable project with schema-only setup and synthetic users. Do not use a production-derived database branch unless separately approved and confirmed to contain no production rows.

## 1. Exact migration SQL from PR #18

File: supabase/migrations/20261112120000_p0c_relational_favorite_teams.sql

    -- P0-C relational favorite teams; additive and not applied to production.
    create table if not exists public.user_favorite_teams (
      user_id uuid not null references auth.users(id) on delete cascade,
      team_id text not null,
      team_name text not null,
      sport_id text not null default 'OTHER',
      league text not null default 'OTHER',
      abbrev text not null default '',
      logo text not null default '',
      color text,
      sort_order integer not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      primary key (user_id, team_id),
      constraint user_favorite_teams_team_id_nonempty check (length(btrim(team_id)) > 0),
      constraint user_favorite_teams_team_name_nonempty check (length(btrim(team_name)) > 0)
    );
    create index if not exists user_favorite_teams_team_id_idx on public.user_favorite_teams(team_id);
    create index if not exists user_favorite_teams_user_sort_idx on public.user_favorite_teams(user_id, sort_order);
    alter table public.user_favorite_teams enable row level security;
    drop policy if exists user_favorite_teams_select_own on public.user_favorite_teams;
    create policy user_favorite_teams_select_own on public.user_favorite_teams for select to authenticated using ((select auth.uid()) = user_id);
    drop policy if exists user_favorite_teams_insert_own on public.user_favorite_teams;
    create policy user_favorite_teams_insert_own on public.user_favorite_teams for insert to authenticated with check ((select auth.uid()) = user_id);
    drop policy if exists user_favorite_teams_update_own on public.user_favorite_teams;
    create policy user_favorite_teams_update_own on public.user_favorite_teams for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
    drop policy if exists user_favorite_teams_delete_own on public.user_favorite_teams;
    create policy user_favorite_teams_delete_own on public.user_favorite_teams for delete to authenticated using ((select auth.uid()) = user_id);
    revoke all on table public.user_favorite_teams from anon;
    grant select, insert, update, delete on table public.user_favorite_teams to authenticated;
    insert into public.user_favorite_teams (user_id, team_id, team_name, sport_id, league, abbrev, logo, color, sort_order)
    select p.id, nullif(btrim(team.value ->> 'id'), ''), nullif(btrim(team.value ->> 'name'), ''),
     coalesce(nullif(btrim(team.value ->> 'sportId'), ''), 'OTHER'), coalesce(nullif(btrim(team.value ->> 'league'), ''), 'OTHER'),
     coalesce(team.value ->> 'abbrev', ''), coalesce(team.value ->> 'logo', ''), nullif(team.value ->> 'color', ''), (team.ordinality - 1)::integer
    from public.profiles p
    cross join lateral jsonb_array_elements(case when jsonb_typeof(p.favorite_teams::jsonb) = 'array' then p.favorite_teams::jsonb else '[]'::jsonb end) with ordinality as team(value, ordinality)
    where nullif(btrim(team.value ->> 'id'), '') is not null and nullif(btrim(team.value ->> 'name'), '') is not null
    on conflict (user_id, team_id) do nothing;

## Execution order

1. Provision a disposable Supabase Auth schema and the same public.profiles table/constraints as the target schema.
2. Inspect the profiles.id and profiles.favorite_teams column metadata and representative values.
3. Create synthetic Auth users and ensure each has a matching profiles row.
4. Populate the fixtures below.
5. Apply the migration using the migration runner in the disposable project.
6. Run backfill comparisons and RLS tests.
7. Only after database checks pass, test PR #18 application code against this disposable project.

## Assumptions and edge-case behavior

Assumptions:
- auth.users exists and auth.users.id is UUID.
- public.profiles exists, has id UUID corresponding to auth.users.id, and has favorite_teams.
- favorite_teams is JSON/JSONB or text containing valid JSON. Every non-null value must be castable to jsonb.
- Team objects use id, name, sportId, league, abbrev, logo, and optional color.

Behavior:
- Existing users: scans every profile row; only JSON arrays produce favorite rows.
- SQL NULL, JSON null, empty arrays, and non-array JSON roots produce no rows.
- Duplicate team IDs per user: the composite primary key plus ON CONFLICT DO NOTHING leaves one row. The current INSERT...SELECT has no ORDER BY, so the winning duplicate's metadata is not guaranteed; do not rely on first-occurrence behavior.
- Missing/blank id or name: skipped.
- Missing/blank sportId or league: OTHER; missing abbrev/logo: empty strings; missing/empty color: SQL NULL.
- Malformed array elements such as strings, numbers, nulls, or objects missing id/name are ignored by the required-field filter.
- Invalid JSON text fails the migration at the jsonb cast; it is not silently skipped.
- Non-empty but semantically invalid team IDs are not validated against a canonical teams table. Only blank IDs are rejected; there is no team-catalog FK.
- Orphaned profile IDs absent from auth.users cause the FK insert to fail.
- Rerun: table/index creation is guarded; policies are dropped/recreated; backfill conflicts are ignored. Existing relational rows are not refreshed. This is approximately idempotent for a matching schema, but CREATE TABLE IF NOT EXISTS does not repair an incompatible pre-existing table.
- Empty database: not standalone-safe. The expected public.profiles table and columns must exist first. Plain PostgreSQL without Supabase auth schema/roles is unsupported.
- Populated database: additive if assumptions hold; legacy column is retained and not rewritten. Invalid JSON text, orphan IDs, incompatible types, or schema drift can still fail the migration.

## 2. Schema and source-data inspection

Run before migration, read-only:

    select table_schema, table_name, column_name, data_type, udt_name, is_nullable
    from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name in ('id', 'favorite_teams')
    order by ordinal_position;

    select count(*) as profile_rows,
           count(*) filter (where favorite_teams is null) as sql_null_favorites,
           count(*) filter (where favorite_teams is not null) as non_null_favorites
    from public.profiles;

    select id, favorite_teams::text as favorite_teams_raw
    from public.profiles
    where favorite_teams is not null
    order by id
    limit 20;

If favorite_teams is text, validate every non-null value as JSON before migration. On PostgreSQL versions supporting pg_input_is_valid:

    select id, favorite_teams
    from public.profiles
    where favorite_teams is not null
      and not pg_input_is_valid(favorite_teams::text, 'jsonb');

If unavailable, validate with a disposable copy and guarded parser. Stop if the type/format is not JSON/JSONB or valid JSON text. Sample output may contain personal data; do not paste it into public PR comments.

## 3. Backfill fixtures and checks

Create three disposable Auth users through Supabase Auth (A, B, C). Record their actual UUIDs as <A_UUID>, <B_UUID>, and <C_UUID>. Each must have a matching profiles row. For a JSONB column, use:

    update public.profiles
    set favorite_teams = '[
      {"id":"nfl-kc","name":"Kansas City Chiefs","sportId":"FOOTBALL","league":"NFL","abbrev":"KC","logo":"kc.svg","color":"#E31837"},
      {"id":"mls-austin","name":"Austin FC","sportId":"SOCCER","league":"MLS","abbrev":"ATX","logo":"atx.svg"},
      {"id":"nfl-kc","name":"Kansas City Chiefs","sportId":"FOOTBALL","league":"NFL","abbrev":"KC","logo":"kc.svg","color":"#E31837"},
      {"id":"   ","name":"Blank ID"},
      {"id":"missing-name"},
      "not-an-object",
      null
    ]'::jsonb
    where id = '<A_UUID>'::uuid;

    update public.profiles set favorite_teams = '[]'::jsonb
    where id = '<B_UUID>'::uuid;

    update public.profiles
    set favorite_teams = '[{"id":"valid-c","name":"Valid C"},{"id":"bad-no-name"},{"name":"bad-no-id"},42,{}]'::jsonb
    where id = '<C_UUID>'::uuid;

Expected: A has exactly nfl-kc and mls-austin; the duplicate nfl-kc collapses to one row. Since the duplicate fixture is identical, its winner is immaterial. The SQL does not currently guarantee which metadata copy wins when duplicate IDs carry different values. The two surviving rows retain relative selection order, although sort_order may have a gap because it uses original JSON ordinality. B has zero rows. C has exactly valid-c. Missing optional fields default as described above. Add separate users for SQL NULL and JSON null; both should yield zero rows. Test malformed JSON text (for example '{not-json') only in a separate disposable text-column rehearsal; expected outcome is migration failure.

Inspect migrated rows:

    select user_id, team_id, team_name, sport_id, league, abbrev, logo, color, sort_order
    from public.user_favorite_teams
    where user_id in ('<A_UUID>'::uuid, '<B_UUID>'::uuid, '<C_UUID>'::uuid)
    order by user_id, sort_order;

Compare expected source rows to actual rows; this query should return zero rows:

    with source_rows as (
      select p.id as user_id,
             nullif(btrim(t.value ->> 'id'), '') as team_id,
             nullif(btrim(t.value ->> 'name'), '') as team_name,
             coalesce(nullif(btrim(t.value ->> 'sportId'), ''), 'OTHER') as sport_id,
             coalesce(nullif(btrim(t.value ->> 'league'), ''), 'OTHER') as league,
             coalesce(t.value ->> 'abbrev', '') as abbrev,
             coalesce(t.value ->> 'logo', '') as logo,
             nullif(t.value ->> 'color', '') as color,
             (t.ordinality - 1)::integer as source_order
      from public.profiles p
      cross join lateral jsonb_array_elements(
        case when jsonb_typeof(p.favorite_teams::jsonb) = 'array'
             then p.favorite_teams::jsonb else '[]'::jsonb end
      ) with ordinality as t(value, ordinality)
      where p.id in ('<A_UUID>'::uuid, '<B_UUID>'::uuid, '<C_UUID>'::uuid)
        and nullif(btrim(t.value ->> 'id'), '') is not null
        and nullif(btrim(t.value ->> 'name'), '') is not null
    ), expected as (
      select distinct on (user_id, team_id)
             user_id, team_id, team_name, sport_id, league, abbrev, logo, color, source_order
      from source_rows
      order by user_id, team_id, source_order
    ), actual as (
      select user_id, team_id, team_name, sport_id, league, abbrev, logo, color,
             sort_order as source_order
      from public.user_favorite_teams
      where user_id in ('<A_UUID>'::uuid, '<B_UUID>'::uuid, '<C_UUID>'::uuid)
    )
    select 'missing_from_relational' as discrepancy, *
    from (select * from expected except select * from actual) d
    union all
    select 'unexpected_in_relational' as discrepancy, *
    from (select * from actual except select * from expected) d;

Run before editing either source or relational records. Rehearse repeat execution only in a disposable reset. ON CONFLICT intentionally does not refresh existing relational rows.

## 4. RLS and ownership validation

Use two disposable Auth users A and B. Seed one row each as database owner:

    insert into public.user_favorite_teams
      (user_id, team_id, team_name, sport_id, league, abbrev, logo, sort_order)
    values
      ('<A_UUID>'::uuid, 'rls-a', 'A team', 'FOOTBALL', 'NFL', 'A', '', 0),
      ('<B_UUID>'::uuid, 'rls-b', 'B team', 'FOOTBALL', 'NFL', 'B', '', 0)
    on conflict (user_id, team_id) do update set team_name = excluded.team_name;

As A, in one SQL session:

    begin;
    set local role authenticated;
    select set_config('request.jwt.claim.sub', '<A_UUID>', true);

    -- Expected: 1 visible row (A only).
    select count(*) from public.user_favorite_teams
    where user_id in ('<A_UUID>'::uuid, '<B_UUID>'::uuid);

    -- Own insert succeeds.
    insert into public.user_favorite_teams (user_id, team_id, team_name)
    values ('<A_UUID>'::uuid, 'rls-a2', 'A second team');

    -- B-owned update and delete each affect zero rows.
    update public.user_favorite_teams set team_name = 'forbidden'
    where user_id = '<B_UUID>'::uuid and team_id = 'rls-b';
    delete from public.user_favorite_teams
    where user_id = '<B_UUID>'::uuid and team_id = 'rls-b';

    -- Reassigning an owned row to B must fail WITH CHECK.
    update public.user_favorite_teams set user_id = '<B_UUID>'::uuid
    where user_id = '<A_UUID>'::uuid and team_id = 'rls-a';

    rollback;

The ownership-reassignment UPDATE is expected to raise an RLS error; run it separately so the transaction-abort state does not prevent the other checks. Likewise, test the forbidden insert separately; it must fail:

    begin;
    set local role authenticated;
    select set_config('request.jwt.claim.sub', '<A_UUID>', true);
    insert into public.user_favorite_teams (user_id, team_id, team_name)
    values ('<B_UUID>'::uuid, 'rls-a-for-b', 'forbidden');
    rollback;

Repeat with B's UUID. A and B must each see, insert, update, and delete only their own rows. UPDATE/DELETE against the other user's row should affect zero rows; INSERT for another owner and UPDATE that changes user_id must fail. Verify anon has no table privileges. Then repeat at API level in two independent browser sessions using the publishable/anon key, never service_role.

## 5. P0-A (#13) coordination

PR #16 and PR #18 both change src/services/authService.ts and src/services/profileService.ts. Both are open/draft and based on main; do not merge either as part of this work.

Integration rules:
1. Preserve P0-A's auth-state sequencing: no temporary Auth-metadata profile; keep its auth revision/stale-hydration guard; hydrate canonical profile before notifying subscribers. The coordinated P0-A/P0-C branches now reject canonical profile loading failures; they do not fall back to mergeAuthUserWithProfile(authUser). Preserve that fail-closed behavior when the branches are integrated.
2. Preserve P0-A's source-of-truth decision: mutable profile attributes come from public.profiles, not Auth user_metadata.
3. Make favoriteTeams the explicit P0-C exception: public.user_favorite_teams is canonical. Do not write favoriteTeams back to profiles.favorite_teams. After profile hydration, load relational favorites and set User.favoriteTeams from that result.
4. A successful empty relational result is authoritative. Keep legacy JSON only as a temporary fallback when the relational query fails because the migration is not yet deployed.
5. Combine updateUser deliberately: ordinary fields use P0-A updateProfile; favorite teams use P0-C replaceFavoriteTeams; preserve optimistic UI behavior and P0-A session/device permission state; surface persistence errors.
6. Do not drop profiles.favorite_teams in either PR. Any cleanup requires a later separately reviewed migration after rollout and comparison.

Before merge, create an integration branch from the then-current main after the P0-A decision is settled, manually reconcile both files, run full CI, and repeat disposable sign-up/edit/sign-out/sign-in plus backfill/RLS tests. No production migration is included in this coordination.

## 6. Current status

- GitHub Actions RallyOn Build Check #117 passed on the coordinated P0-C branch head: regression tests, Edge Function type check, TypeScript type check, and production build.
- Hosted SQL validation was performed on the isolated RallyOn-Validation project (ref: ihkijbflltlrizswipeb), never production. It has two recorded migrations: p0_validation_base_profiles and p0c_relational_favorite_teams. The base profile schema/trigger was manually reconstructed from read-only production schema findings; it is not a recovered copy of the exact production bootstrap migration.
- The P0-C table's columns, composite primary key, check constraints, indexes, and four owner-scoped RLS policies were inspected and match this migration's intended definitions.
- Two synthetic Auth users were created directly in auth.users (not through the GoTrue signup API); both received one profile row from the bootstrap trigger. This validates the database trigger path, not a complete Auth API signup/session flow.
- Initial backfill produced two expected rows for user A. A transaction-scoped edge-case rehearsal then covered duplicate IDs, blank/missing required fields, scalar/null array elements, and a JSON null root. The duplicate collapsed, invalid elements were skipped, and the non-array root produced no rows. The transaction was rolled back.
- Re-running the exact backfill INSERT ... ON CONFLICT DO NOTHING preserved the existing relational rows. This validates repeatability for already-backfilled rows, not all possible legacy-data conditions.
- RLS SQL tests using SET ROLE and request.jwt.claim.sub showed one-user visibility, blocked cross-user profile/favorite updates, successful own favorite insertion, and no anonymous visibility. Those were SQL role/claim tests, not REST API tests with independent real sessions.
- A privilege audit found authenticated had REFERENCES, TRIGGER, and TRUNCATE grants on the newly created table in addition to CRUD. The migration now revokes all from anon and authenticated before granting only CRUD to authenticated. The hosted validation project has been aligned and verified to expose only those four authenticated privileges and none to anon.
- Supabase security advisors also report a mutable search_path on public.set_profiles_updated_at (base-schema function) and disabled leaked-password protection; the unused team_id index notice is expected until queried by a workload. These are recorded for follow-up; no production changes are authorized.
- Remaining: execute actual GoTrue signup/API and independent-session REST tests; exercise the React services against the hosted project; test auth lifecycle/session transitions and legacy-query failure vs successful-empty behavior; reconcile production migration-history drift before claiming a clean local replay.
- Production Supabase untouched. PR #16 and PR #18 remain open, draft, and unmerged.
