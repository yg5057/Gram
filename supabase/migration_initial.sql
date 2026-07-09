-- 초기 스키마
-- 실행 순서: migration_initial.sql → migration_rooms.sql → migration_solo_share.sql
-- 주의: 새 Supabase 프로젝트를 셋업할 때만 처음부터 순서대로 실행한다.

-- 1) 프로필: auth.users와 1:1. 가입 시 앱에서 insert한다.
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  color text not null,
  start_weight numeric,
  goal_weight numeric,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

-- 읽기는 로그인한 누구나 (이후 migration_rooms.sql에서 "같은 방만"으로 교체됨)
create policy "authenticated can read profiles"
  on public.users for select to authenticated
  using (true);

-- 쓰기는 본인 행만
create policy "insert own profile"
  on public.users for insert to authenticated
  with check (id = auth.uid());

create policy "update own profile"
  on public.users for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- 2) 몸무게 기록: 유저당 하루 한 건 (upsert onConflict user_id,date)
create table public.weights (
  user_id uuid not null references public.users (id) on delete cascade,
  date date not null,
  weight numeric not null,
  created_at timestamptz not null default now(),
  primary key (user_id, date)
);

alter table public.weights enable row level security;

-- 읽기는 로그인한 누구나 (이후 migration_rooms.sql에서 "같은 방만"으로 교체됨)
create policy "authenticated can read weights"
  on public.weights for select to authenticated
  using (true);

-- 쓰기는 본인 기록만
create policy "insert own weights"
  on public.weights for insert to authenticated
  with check (user_id = auth.uid());

create policy "update own weights"
  on public.weights for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
