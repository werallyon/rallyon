alter table public.games
  alter column home_team drop not null,
  alter column away_team drop not null;

alter table public.games
  add column if not exists sport text,
  add column if not exists event_type text not null default 'GAME',
  add column if not exists participants jsonb not null default '[]'::jsonb;

update public.games
set sport = case
  when league in ('NFL','NCAA_FB') then 'FOOTBALL'
  when league in ('NBA','NCAA_BB') then 'BASKETBALL'
  when league = 'MLB' then 'BASEBALL'
  when league = 'NHL' then 'HOCKEY'
  when league in ('MLS','EPL','LALIGA','BUNDESLIGA','SERIEA','LIGUE1','UCL','UEL','NWSL','WSL') then 'SOCCER'
  when league = 'UFC' then 'MMA'
  when league in ('ATP','WTA') then 'TENNIS'
  when league in ('PGA','LPGA','LIV') then 'GOLF'
  when league in ('F1','NASCAR','INDYCAR') then 'RACING'
  else 'OTHER'
end
where sport is null;

update public.games
set event_type = case
  when league = 'UFC' then 'FIGHT'
  when league in ('ATP','WTA') then 'MATCH'
  when league in ('PGA','LPGA','LIV') then 'TOURNAMENT'
  when league in ('F1','NASCAR','INDYCAR') then 'RACE'
  else 'GAME'
end;

alter table public.games
  add constraint games_sport_check
  check (sport in ('FOOTBALL','BASKETBALL','BASEBALL','HOCKEY','SOCCER','MMA','TENNIS','GOLF','RACING','OTHER'));

alter table public.games
  add constraint games_event_type_check
  check (event_type in ('GAME','MATCH','FIGHT','TOURNAMENT','RACE'));

create index if not exists games_sport_start_time_idx
  on public.games (sport, start_time);

create index if not exists games_event_type_start_time_idx
  on public.games (event_type, start_time);
