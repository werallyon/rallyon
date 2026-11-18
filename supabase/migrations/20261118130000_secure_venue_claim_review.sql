-- Platform-admin-only review for durable venue claim requests.
-- Admin authorization is sourced exclusively from Supabase app_metadata, which
-- end users cannot modify through the normal Auth user-update API.
begin;

create policy venue_claim_requests_admin_read
  on public.venue_claim_requests
  for select
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create or replace function public.review_venue_claim_request(
  p_request_id uuid,
  p_status text,
  p_review_notes text default ''
)
returns public.venue_claim_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claim public.venue_claim_requests;
  v_updated_venue_id uuid;
begin
  if auth.uid() is null
    or (auth.jwt() -> 'app_metadata' ->> 'role') is distinct from 'admin'
  then
    raise exception 'Platform administrator access required'
      using errcode = '42501';
  end if;

  if p_status is null or p_status not in ('APPROVED', 'DENIED', 'NEEDS_VERIFICATION') then
    raise exception 'Invalid venue claim review status'
      using errcode = '22023';
  end if;

  if length(coalesce(p_review_notes, '')) > 2000 then
    raise exception 'Review notes must be 2000 characters or fewer'
      using errcode = '22023';
  end if;

  select *
    into v_claim
    from public.venue_claim_requests
   where id = p_request_id
   for update;

  if not found then
    raise exception 'Venue claim request not found'
      using errcode = 'P0002';
  end if;

  if v_claim.status <> 'PENDING' then
    raise exception 'Venue claim request has already been reviewed'
      using errcode = '40001';
  end if;

  if p_status = 'APPROVED' then
    update public.venues
       set claimed = true,
           claimed_by_user_id = v_claim.applicant_user_id,
           updated_at = now()
     where id = v_claim.venue_id
       and claimed = false
       and claimed_by_user_id is null
    returning id into v_updated_venue_id;

    if v_updated_venue_id is null then
      raise exception 'Venue is no longer available to claim'
        using errcode = '23505';
    end if;
  end if;

  update public.venue_claim_requests
     set status = p_status,
         reviewed_at = now(),
         reviewed_by = auth.uid(),
         review_notes = coalesce(p_review_notes, '')
   where id = p_request_id
  returning * into v_claim;

  return v_claim;
end;
$$;

revoke all on function public.review_venue_claim_request(uuid, text, text)
  from public, anon;
grant execute on function public.review_venue_claim_request(uuid, text, text)
  to authenticated;

commit;
