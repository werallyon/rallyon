-- Venue-owned game-time specials. Public fans can only read currently active offers;
-- only the authenticated owner of a claimed venue can create or manage its offers.
begin;

create table public.venue_promotions (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  game_id uuid references public.games(id) on delete set null,
  title text not null check (length(btrim(title)) between 2 and 120),
  description text not null default '',
  promotion_type text not null check (
    promotion_type in ('CHECK_IN_DISCOUNT','GAME_SPECIAL','FOOD_SPECIAL','DRINK_SPECIAL','TIME_LIMITED','FREE_ITEM','GROUP_OFFER','WATCH_PARTY')
  ),
  discount_value text,
  terms text not null default '',
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','SCHEDULED','EXPIRED','PAUSED')),
  claims_count integer not null default 0 check (claims_count >= 0),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint venue_promotions_valid_window check (end_at > start_at)
);

create index venue_promotions_public_active_idx
  on public.venue_promotions (venue_id, start_at, end_at)
  where status in ('ACTIVE','SCHEDULED');
create index venue_promotions_game_idx
  on public.venue_promotions (game_id)
  where game_id is not null;

alter table public.venue_promotions enable row level security;

create policy venue_promotions_public_active_read
  on public.venue_promotions
  for select
  to anon, authenticated
  using (
    status in ('ACTIVE','SCHEDULED')
    and start_at <= now()
    and end_at > now()
    and exists (
      select 1 from public.venues v
      where v.id = venue_promotions.venue_id
        and v.claimed = true
        and v.claimed_by_user_id = venue_promotions.created_by
    )
  );

create policy venue_promotions_owner_read
  on public.venue_promotions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.venues v
      where v.id = venue_promotions.venue_id
        and v.claimed = true
        and v.claimed_by_user_id = (select auth.uid())
    )
  );

create policy venue_promotions_owner_insert
  on public.venue_promotions
  for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.venues v
      where v.id = venue_promotions.venue_id
        and v.claimed = true
        and v.claimed_by_user_id = (select auth.uid())
    )
  );

create policy venue_promotions_owner_update
  on public.venue_promotions
  for update
  to authenticated
  using (
    exists (
      select 1 from public.venues v
      where v.id = venue_promotions.venue_id
        and v.claimed = true
        and v.claimed_by_user_id = (select auth.uid())
    )
  )
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.venues v
      where v.id = venue_promotions.venue_id
        and v.claimed = true
        and v.claimed_by_user_id = (select auth.uid())
    )
  );

create policy venue_promotions_owner_delete
  on public.venue_promotions
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.venues v
      where v.id = venue_promotions.venue_id
        and v.claimed = true
        and v.claimed_by_user_id = (select auth.uid())
    )
  );

revoke all on public.venue_promotions from public, anon, authenticated;
grant select on public.venue_promotions to anon, authenticated;
grant insert (
  venue_id, game_id, title, description, promotion_type, discount_value,
  terms, start_at, end_at, status, created_by
) on public.venue_promotions to authenticated;
grant update (
  title, description, promotion_type, discount_value, terms, start_at, end_at, status
) on public.venue_promotions to authenticated;
grant delete on public.venue_promotions to authenticated;

commit;
