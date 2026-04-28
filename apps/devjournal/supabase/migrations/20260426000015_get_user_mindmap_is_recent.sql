-- get_user_mindmap에 is_recent 필드 추가
-- 사용자의 가장 최근 일기(entries.created_at desc 1개)로 처음 등장한 개념을
-- 마인드맵 UI에서 강조 표시할 수 있도록 노드 메타에 boolean으로 노출.

create or replace function get_user_mindmap(p_user_id uuid)
returns json language plpgsql security definer as $$
declare
  result json;
  v_latest_entry_id uuid;
begin
  -- 사용자의 가장 최근 일기 ID
  select id into v_latest_entry_id
  from entries
  where user_id = p_user_id and deleted_at is null
  order by created_at desc
  limit 1;

  select json_build_object(
    'nodes', (
      select coalesce(json_agg(json_build_object(
        'id', c.id, 'name', c.name, 'category', c.category,
        'mastery', uc.mastery_level, 'review_count', uc.review_count,
        'is_recent', (
          v_latest_entry_id is not null
          and uc.first_seen_entry_id is not null
          and uc.first_seen_entry_id = v_latest_entry_id
        )
      )), '[]'::json)
      from user_concepts uc join concepts c on c.id = uc.concept_id
      where uc.user_id = p_user_id
    ),
    'edges', (
      select coalesce(json_agg(json_build_object(
        'from', conn.from_id, 'to', conn.to_id,
        'strength', conn.strength, 'type', conn.relation_type
      )), '[]'::json)
      from connections conn
      where conn.from_id in (select concept_id from user_concepts where user_id = p_user_id)
        and conn.to_id   in (select concept_id from user_concepts where user_id = p_user_id)
    )
  ) into result;
  return result;
end;
$$;
