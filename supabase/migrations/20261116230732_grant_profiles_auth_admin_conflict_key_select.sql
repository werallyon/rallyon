-- INSERT ... ON CONFLICT (id) needs read access to the conflict key.
-- Grant only the key column, not profile-row contents, to the Auth trigger role.
grant select (id) on table public.profiles to supabase_auth_admin;
