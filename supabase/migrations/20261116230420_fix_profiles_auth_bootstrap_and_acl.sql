-- Allow the Auth service to create its own profile row without broadening
-- client access or bypassing RLS. Keep the trigger SECURITY INVOKER.
grant usage on schema public to supabase_auth_admin;
grant insert on table public.profiles to supabase_auth_admin;

drop policy if exists profiles_insert_auth_admin on public.profiles;
create policy profiles_insert_auth_admin
  on public.profiles
  for insert
  to supabase_auth_admin
  with check (true);

-- The application only needs owner-scoped read/create/update access.
revoke all privileges on table public.profiles from public, anon, authenticated;
grant select, insert, update on table public.profiles to authenticated;

-- Retain the original timestamp trigger; remove the duplicate trigger.
drop trigger if exists profiles_updated_at on public.profiles;

-- Avoid allowing malformed, user-editable metadata to abort Auth signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
set search_path = public
as $function$
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
    case lower(coalesce(new.raw_user_meta_data->>'onboardingCompleted', ''))
      when 'true' then true
      when 'false' then false
      else false
    end,
    coalesce(new.raw_user_meta_data->>'onboardingStep', 'welcome')
  )
  on conflict (id) do nothing;

  return new;
end;
$function$;

alter function public.handle_new_user() security invoker;
