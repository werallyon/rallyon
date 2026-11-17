-- Auth only creates the profile for a brand-new auth.users row.
-- Remove ON CONFLICT so the Auth role does not need profile SELECT privileges
-- or a SELECT RLS policy merely to create the profile.
revoke select (id) on table public.profiles from supabase_auth_admin;

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
  );

  return new;
end;
$function$;

alter function public.handle_new_user() security invoker;
