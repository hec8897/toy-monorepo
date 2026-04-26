-- user_concepts.first_seen_entry_id
-- "이 사용자가 어떤 entry에서 처음 이 개념을 만났는지" 기록.
-- Day 13 마인드맵 델타 머지에서 신규 노드 추출에 사용.

-- 1. 컬럼 추가
alter table user_concepts
  add column first_seen_entry_id uuid
  references entries(id) on delete set null;

-- 2. 기존 데이터 백필 — 가장 오래된 entry 기준
-- entry_concepts에 created_at이 없어 entries.created_at으로 JOIN
update user_concepts uc
set first_seen_entry_id = sub.first_entry_id
from (
  select e.user_id, ec.concept_id,
         (array_agg(ec.entry_id order by e.created_at asc))[1] as first_entry_id
  from entry_concepts ec
  join entries e on e.id = ec.entry_id
  group by e.user_id, ec.concept_id
) sub
where uc.user_id = sub.user_id
  and uc.concept_id = sub.concept_id;

-- 3. 인덱스 (델타 추출 쿼리 최적화)
create index user_concepts_first_seen_idx
  on user_concepts(user_id, first_seen_entry_id);
