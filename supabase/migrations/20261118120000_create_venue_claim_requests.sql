-- Durable, authenticated venue claim requests. Approval is deliberately separate:
-- submitting a request never grants venue ownership or operator permissions.
begin;

create table public.venue_claim_requests (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  applicant_user_id uuid not null references auth.users(id) on delete cascade,
  applicant_name text not null check (length(btrim(applicant_name)) between 2 and 120),
  applicant_email text not null check (length(btrim(applicant_email)) between 3 and 320),
  applicant_phone text not null check (length(btrim(applicant_phone)) between 7 and 40),
  applicant_role text not null check (length(btrim(applicant_role)) between 2 and 100),
  verification_method text not null check (verification_method in ('PHONE_CALL','BUSINESS_EMAIL','UTILITY_BILL','MANUAL_AUDIT')),
  notes text not null default '' check (length(notes) <= 2000),
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','DENIED','NEEDS_VERIFICATION')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  review_notes text not null default '',
  created_at timestamptz not null default now(),
  constraint venue_claim_review_consistency check (
    (status = 'PENDING' and reviewed_at is null and reviewed_by is null)
    or (status <> 'PENDING' and reviewed_at is not null and reviewed_by is not null)
  )
);

create unique index venue_claim_one_pending_per_venue
  on public.venue_claim_requests (venue_id)
  where status = 'PENDING';
create index venue_claim_requests_applicant_idx
  on public.venue_claim_requests (applicant_user_id, created_at desc);

alter table public.venue_claim_requests enable row level security;
revoke all on public.venue_claim_requests from public, anon, authenticated;
grant select on public.venue_claim_requests to authenticated;
grant insert (
  venue_id, applicant_user_id, applicant_name, applicant_email,
  applicant_phone, applicant_role, verification_method, notes
) on public.venue_claim_requests to authenticated;

create policy venue_claim_requests_read_own
  on public.venue_claim_requests for select to authenticated
  using (applicant_user_id = (select auth.uid()));

create policy venue_claim_requests_insert_own_unclaimed
  on public.venue_claim_requests for insert to authenticated
  with check (
    applicant_user_id = (select auth.uid())
    and status = 'PENDING'
    and reviewed_at is null
    and reviewed_by is null
    and exists (
      select 1 from public.venues v
      where v.id = venue_claim_requests.venue_id
        and v.claimed = false
    )
  );

commit;
