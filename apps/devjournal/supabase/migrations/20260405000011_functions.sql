-- 유사 개념 검색 (search_connections Step에서 사용)
create or replace function match_concepts(
  query_embedding extensions.vector(768),
  match_threshold float default 0.6,
  match_count     int   default 10
)
returns table (id uuid, name text, category text, similarity float)
language plpgsql security definer
as $$
begin
  return query
  select c.id, c.name, c.category,
         1 - (c.embedding <=> query_embedding) as similarity
  from concepts c
  where 1 - (c.embedding <=> query_embedding) > match_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 사용자 마인드맵 전체 그래프 조회 (D3.js용)
create or replace function get_user_mindmap(p_user_id uuid)
returns json language plpgsql security definer as $$
declare result json;
begin
  select json_build_object(
    'nodes', (
      select json_agg(json_build_object(
        'id', c.id, 'name', c.name, 'category', c.category,
        'mastery', uc.mastery_level, 'review_count', uc.review_count
      ))
      from user_concepts uc join concepts c on c.id = uc.concept_id
      where uc.user_id = p_user_id
    ),
    'edges', (
      select json_agg(json_build_object(
        'from', conn.from_id, 'to', conn.to_id,
        'strength', conn.strength, 'type', conn.relation_type
      ))
      from connections conn
      where conn.from_id in (select concept_id from user_concepts where user_id = p_user_id)
        and conn.to_id   in (select concept_id from user_concepts where user_id = p_user_id)
    )
  ) into result;
  return result;
end;
$$;
