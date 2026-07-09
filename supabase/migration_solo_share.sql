-- 혼자 쓰기 모드 + 기록 공유 설정
-- Supabase 대시보드 → SQL Editor에서 실행

-- 1) users에 설정 컬럼 추가
--    solo: 방 없이 혼자 쓰기를 선택했는지 (온보딩 스킵 여부)
--    share_weights: 내 몸무게를 방 멤버에게 공유할지
alter table public.users
  add column solo boolean not null default false,
  add column share_weights boolean not null default true;

-- 2) 기록 공유를 끈 멤버의 몸무게는 같은 방이어도 본인만 볼 수 있게
drop policy "read own or same-group weights" on public.weights;
create policy "read own or shared same-group weights"
  on public.weights for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.users u
      where u.id = weights.user_id
        and u.group_id is not null
        and u.group_id = public.my_group_id()
        and u.share_weights
    )
  );
