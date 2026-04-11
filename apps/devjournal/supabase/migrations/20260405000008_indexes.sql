-- HNSW 벡터 인덱스
create index concepts_embedding_hnsw
  on concepts using hnsw (embedding extensions.vector_cosine_ops)
  with (m = 16, ef_construction = 64);

create index entries_embedding_hnsw
  on entries using hnsw (embedding extensions.vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- 조회 성능 인덱스
create index entries_user_id_idx on entries(user_id);
create index entries_analysis_status_idx on entries(analysis_status);
create index entries_is_published_idx on entries(is_published) where is_published = true;
create index entries_deleted_at_idx on entries(deleted_at) where deleted_at is null;

create index entry_concepts_concept_id_idx on entry_concepts(concept_id);
create index user_concepts_next_review_idx on user_concepts(next_review_at);
create index connections_to_id_idx on connections(to_id);
