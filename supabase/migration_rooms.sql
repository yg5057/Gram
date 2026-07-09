-- 1) 방 테이블 + users.group_id
create table public.groups (
  id bigint generated always as identity primary key,
  code text not null unique,
  created_at timestamptz not null default now()
);

alter table public.users
  add column group_id bigint references public.groups (id);

-- 2) 내 방 id를 돌려주는 함수 (security definer라 RLS 재귀를 피한다)
create or replace function public.my_group_id()
returns bigint
language sql stable security definer
set search_path = public
as $$
  select group_id from users where id = auth.uid()
$$;

-- 3) 방 만들기: 랜덤 코드 생성 → 방 생성 → 나를 입장시키고 코드 반환
--    색상도 방 단위로 배정한다 (방 안에서 안 겹치게).
create or replace function public.create_group()
returns text
language plpgsql security definer
set search_path = public
as $$
declare
  -- 헷갈리는 문자(0/O, 1/I) 제외 31자
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  new_code text;
  gid bigint;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if (select group_id from users where id = auth.uid()) is not null then
    raise exception 'ALREADY_IN_GROUP';
  end if;

  loop
    new_code := (
      select string_agg(substr(alphabet, (floor(random() * 31))::int + 1, 1), '')
      from generate_series(1, 6)
    );
    begin
      insert into groups (code) values (new_code) returning id into gid;
      exit;
    exception when unique_violation then
      -- 코드 충돌 시 재시도
    end;
  end loop;

  update users set group_id = gid, color = '#FF6B9D' where id = auth.uid();
  return new_code;
end;
$$;

-- 4) 코드로 입장: 정원(8명) 체크 후 입장, 방에서 안 쓰인 색 배정
create or replace function public.join_group(p_code text)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  palette constant text[] := array[
    '#FF6B9D', '#5B8DEF', '#4CC9A0', '#FFB84C',
    '#9B6BFF', '#F87171', '#38BDF8', '#FACC15'
  ];
  gid bigint;
  member_count int;
  new_color text;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if (select group_id from users where id = auth.uid()) is not null then
    raise exception 'ALREADY_IN_GROUP';
  end if;

  -- 동시 입장 시 정원 초과를 막기 위해 방 행을 잠근다
  select id into gid from groups
  where code = upper(trim(p_code))
  for update;
  if gid is null then
    raise exception 'GROUP_NOT_FOUND';
  end if;

  select count(*) into member_count from users where group_id = gid;
  if member_count >= 8 then
    raise exception 'GROUP_FULL';
  end if;

  select p into new_color
  from unnest(palette) as p
  where p not in (select color from users where group_id = gid)
  limit 1;

  update users
  set group_id = gid, color = coalesce(new_color, palette[1])
  where id = auth.uid();
end;
$$;

-- 5) RLS를 "같은 방 사람만 서로 보인다"로 교체
drop policy "authenticated can read profiles" on public.users;
create policy "read own or same-group profiles"
  on public.users for select to authenticated
  using (
    id = auth.uid()
    or (group_id is not null and group_id = public.my_group_id())
  );

drop policy "authenticated can read weights" on public.weights;
create policy "read own or same-group weights"
  on public.weights for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.users u
      where u.id = weights.user_id
        and u.group_id is not null
        and u.group_id = public.my_group_id()
    )
  );

alter table public.groups enable row level security;

-- 내 방 정보(초대 코드)만 조회 가능. 생성/입장은 위 함수가 처리.
create policy "read own group"
  on public.groups for select to authenticated
  using (id = public.my_group_id());
