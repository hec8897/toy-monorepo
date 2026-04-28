-- Day 14 Dashboard RPCs
-- KPI streak, 누적 학습 개념(라인 차트), 일별 일기 작성 수(heatmap)
-- 모두 security invoker로 호출자(RLS 정책) 권한 적용

-- ---------------------------------------------------------------------------
-- 1. get_user_streak
-- 오늘부터 거꾸로 일기 작성한 연속 일수.
-- 작성 안 한 날을 만나면 break.
-- 단, 오늘 아직 안 썼지만 어제까지 연속이면 streak 유지
-- (자정 직후 streak 0 표시 회피).
-- ---------------------------------------------------------------------------
create or replace function get_user_streak(p_user_id uuid)
returns int
language plpgsql
security invoker
as $$
declare
  v_streak int := 0;
  v_cursor date := current_date;
begin
  loop
    if exists (
      select 1
      from entries
      where user_id = p_user_id
        and deleted_at is null
        and created_at::date = v_cursor
    ) then
      v_streak := v_streak + 1;
      v_cursor := v_cursor - 1;
    else
      -- 첫 루프(오늘)는 안 썼어도 grace 허용 — 어제부터 다시 검사
      if v_cursor = current_date then
        v_cursor := v_cursor - 1;
        continue;
      end if;
      exit;
    end if;
  end loop;
  return v_streak;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. get_concept_growth(p_user_id, p_days)
-- 최근 p_days 일의 일별 누적 학습 개념 수.
-- 데이터 없는 날도 day_series 로 채워 N개 row 반환.
-- 시작일 이전까지의 누적치(baseline)을 더해 진짜 누적값을 노출.
-- ---------------------------------------------------------------------------
create or replace function get_concept_growth(
  p_user_id uuid,
  p_days int default 90
)
returns table(date date, cumulative int)
language sql
security invoker
as $$
  with day_series as (
    select generate_series(
      current_date - (p_days - 1),
      current_date,
      interval '1 day'
    )::date as day
  ),
  daily as (
    select learned_at::date as day, count(*) as new_count
    from user_concepts
    where user_id = p_user_id
      and learned_at::date >= current_date - (p_days - 1)
    group by 1
  ),
  baseline as (
    select count(*)::int as base
    from user_concepts
    where user_id = p_user_id
      and learned_at::date < current_date - (p_days - 1)
  )
  select
    s.day as date,
    (
      (select base from baseline)
      + sum(coalesce(d.new_count, 0)) over (order by s.day)
    )::int as cumulative
  from day_series s
  left join daily d on d.day = s.day
  order by s.day;
$$;

-- ---------------------------------------------------------------------------
-- 3. get_entry_heatmap(p_user_id, p_days)
-- 최근 p_days 일의 일별 일기 작성 수.
-- 0인 날은 응답에 포함되지 않음 (프론트에서 채움).
-- ---------------------------------------------------------------------------
create or replace function get_entry_heatmap(
  p_user_id uuid,
  p_days int default 91
)
returns table(date date, count int)
language sql
security invoker
as $$
  select
    created_at::date as date,
    count(*)::int as count
  from entries
  where user_id = p_user_id
    and deleted_at is null
    and created_at::date >= current_date - (p_days - 1)
  group by 1
  order by 1;
$$;
