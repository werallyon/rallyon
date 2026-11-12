-- Exact P0-C migration logic, isolated from production migration history.
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
create policy user_favorite_teams_select_own on public.user_favorite_teams for select to authenticated using ((select auth.uid()) = user_id);
create policy user_favorite_teams_insert_own on public.user_favorite_teams for insert to authenticated with check ((select auth.uid()) = user_id);
create policy user_favorite_teams_update_own on public.user_favorite_teams for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
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
