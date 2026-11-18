-- Add trustworthy provenance to public game-day specials without opening owner writes.
begin;

alter table public.venue_promotions
  alter column created_by drop not null,
  add column source_type text not null default 'VENUE_CONFIRMED'
    check (source_type in ('VENUE_CONFIRMED', 'OFFICIAL_PUBLIC_SOURCE', 'COMMUNITY_REPORTED')),
  add column source_url text,
  add column source_label text,
  add column verified_at timestamptz,
  add column verified_by uuid references auth.users(id) on delete restrict;

alter table public.venue_promotions
  add constraint venue_promotions_source_provenance_check
  check (
    (source_type = 'VENUE_CONFIRMED' and created_by is not null)
    or (
      source_type = 'OFFICIAL_PUBLIC_SOURCE'
      and source_url is not null
      and source_url ~ '^https?://[^[:space:]]+
      and source_label is not null
      and length(btrim(source_label)) > 0
      and verified_at is not null
      and verified_by is not null
    )
    or (
      source_type = 'COMMUNITY_REPORTED'
      and source_label is not null
      and length(btrim(source_label)) > 0
      and (
        (verified_at is null and verified_by is null)
        or (verified_at is not null and verified_by is not null)
      )
    )
  );

comment on column public.venue_promotions.source_type is
  'VENUE_CONFIRMED is owner-entered; OFFICIAL_PUBLIC_SOURCE is reviewed public advertising; COMMUNITY_REPORTED is a community submission requiring review before public display.';
comment on column public.venue_promotions.verified_at is
  'Timestamp of human review or venue confirmation. Not an offer start/end time.';
comment on column public.venue_promotions.verified_by is
  'Authenticated reviewer/venue confirmer. Never supplied by an anonymous client.';

drop policy if exists venue_promotions_public_active_read on public.venue_promotions;
create policy venue_promotions_public_active_read
  on public.venue_promotions
  for select
  to anon, authenticated
  using (
    status in ('ACTIVE','SCHEDULED')
    and start_at <= now()
    and end_at > now()
    and (
      (
        source_type = 'VENUE_CONFIRMED'
        and exists (
          select 1 from public.venues v
          where v.id = venue_promotions.venue_id
            and v.claimed = true
            and v.claimed_by_user_id = venue_promotions.created_by
        )
      )
      or (
        source_type in ('OFFICIAL_PUBLIC_SOURCE', 'COMMUNITY_REPORTED')
        and verified_at is not null
        and verified_by is not null
      )
    )
  );

-- A venue owner may only edit/delete offers that their own account created.
-- This prevents a venue owner from rewriting centrally sourced or reviewed offers.
drop policy if exists venue_promotions_owner_update on public.venue_promotions;
create policy venue_promotions_owner_update
  on public.venue_promotions
  for update
  to authenticated
  using (
    source_type = 'VENUE_CONFIRMED'
    and created_by = (select auth.uid())
    and exists (
      select 1 from public.venues v
      where v.id = venue_promotions.venue_id
        and v.claimed = true
        and v.claimed_by_user_id = (select auth.uid())
    )
  )
  with check (
    source_type = 'VENUE_CONFIRMED'
    and created_by = (select auth.uid())
    and exists (
      select 1 from public.venues v
      where v.id = venue_promotions.venue_id
        and v.claimed = true
        and v.claimed_by_user_id = (select auth.uid())
    )
  );

drop policy if exists venue_promotions_owner_delete on public.venue_promotions;
create policy venue_promotions_owner_delete
  on public.venue_promotions
  for delete
  to authenticated
  using (
    source_type = 'VENUE_CONFIRMED'
    and created_by = (select auth.uid())
    and exists (
      select 1 from public.venues v
      where v.id = venue_promotions.venue_id
        and v.claimed = true
        and v.claimed_by_user_id = (select auth.uid())
    )
  );

-- Owner insert/update grants intentionally exclude all provenance fields.
-- Trusted ingestion/moderation uses the server-side service role; community
-- submissions remain private until verified_at and verified_by are set.
commit;

      and source_label is not null
      and length(btrim(source_label)) > 0
      and verified_at is not null
      and verified_by is not null
    )
    or (
      source_type = 'COMMUNITY_REPORTED'
      and source_label is not null
      and length(btrim(source_label)) > 0
      and (
        (verified_at is null and verified_by is null)
        or (verified_at is not null and verified_by is not null)
      )
    )
  );

comment on column public.venue_promotions.source_type is
  'VENUE_CONFIRMED is owner-entered; OFFICIAL_PUBLIC_SOURCE is reviewed public advertising; COMMUNITY_REPORTED is a community submission requiring review before public display.';
comment on column public.venue_promotions.verified_at is
  'Timestamp of human review or venue confirmation. Not an offer start/end time.';
comment on column public.venue_promotions.verified_by is
  'Authenticated reviewer/venue confirmer. Never supplied by an anonymous client.';

drop policy if exists venue_promotions_public_active_read on public.venue_promotions;
create policy venue_promotions_public_active_read
  on public.venue_promotions
  for select
  to anon, authenticated
  using (
    status in ('ACTIVE','SCHEDULED')
    and start_at <= now()
    and end_at > now()
    and (
      (
        source_type = 'VENUE_CONFIRMED'
        and exists (
          select 1 from public.venues v
          where v.id = venue_promotions.venue_id
            and v.claimed = true
            and v.claimed_by_user_id = venue_promotions.created_by
        )
      )
      or (
        source_type in ('OFFICIAL_PUBLIC_SOURCE', 'COMMUNITY_REPORTED')
        and verified_at is not null
        and verified_by is not null
      )
    )
  );

-- Owner insert/update grants intentionally exclude all provenance fields.
-- Trusted ingestion/moderation uses the server-side service role; community
-- submissions remain private until verified_at and verified_by are set.
commit;
