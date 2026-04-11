create table entry_concepts (
  entry_id    uuid references entries(id) on delete cascade,
  concept_id  uuid references concepts(id) on delete cascade,
  confidence  float not null check (confidence between 0 and 1),
  primary key (entry_id, concept_id)
);
