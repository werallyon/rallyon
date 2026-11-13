-- Isolated P0-A validation baseline. This is deliberately separate from
-- production migrations under /supabase/migrations.
-- Mirrors the production profiles columns, PK/FK, signup bootstrap, and owner RLS.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  first_name text,
  last_name text,
  display_name text,
  avatar_url text,
  onboarding_completed boolean not null default false,
  onboarding_step text not null default 'welcome',
  home_city text,
  home_state text,
  home_zip text,
  latitude double precision,
  longitude double precision,
  favorite_sports text[] not null default '{}',
  favorite_leagues text[] not null default '{}',
  favorite_teams jsonb not null default '[]'::jsonb,
  preferred_experience text[] not null default '{}',
  current_intent text,
  preferences jsonb not null default '{}'::jsonb,
  privacy_settings jsonb not null default '{}'::jsonb,
  notification_preferences jsonb not null default '{}'::jsonb,
  saved_venue_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy profiles_select_own
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy profiles_insert_own
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
create policy profiles_update_own
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;

-- Mirrors the current signup bootstrap behavior. Auth metadata is used only
-- to initialize the new row; application reads must use public.profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (
    id, username, first_name, last_name, display_name, avatar_url,
    onboarding_completed, onboarding_step
  )
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'firstName',
    new.raw_user_meta_data->>'lastName',
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'displayName'),
    coalesce(new.raw_user_meta_data->>'avatar', new.raw_user_meta_data->>'profilePhotoUrl'),
    coalesce((new.raw_user_meta_data->>'onboardingCompleted')::boolean, false),
    coalesce(new.raw_user_meta_data->>'onboardingStep', 'welcome')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
