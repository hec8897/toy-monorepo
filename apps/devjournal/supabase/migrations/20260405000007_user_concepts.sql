create table user_concepts (
  user_id          uuid not null references auth.users(id) on delete cascade,
  concept_id       uuid not null references concepts(id) on delete cascade,
  learned_at       timestamptz not null default now(),
  review_count     int not null default 0,
  last_reviewed_at timestamptz,
  ease_factor      float not null default 2.5,
  next_review_at   timestamptz,
  mastery_level    text not null default 'learning'
                   check (mastery_level in ('learning','familiar','mastered')),
  primary key (user_id, concept_id)
);
