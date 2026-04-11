create table connections (
  from_id       uuid not null references concepts(id) on delete cascade,
  to_id         uuid not null references concepts(id) on delete cascade,
  strength      float not null default 0.5 check (strength between 0 and 1),
  relation_type text not null default 'is_related_to'
                check (relation_type in (
                  'is_related_to', 'is_prerequisite_of', 'is_implementation_of',
                  'is_part_of', 'is_alternative_to', 'is_opposite_of', 'is_used_with'
                )),
  created_by    text default 'ai' check (created_by in ('ai','user')),
  primary key (from_id, to_id)
);
