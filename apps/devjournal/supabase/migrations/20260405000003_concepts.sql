create table concepts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  name_lower  text generated always as (lower(name)) stored,
  category    text not null
              check (category in (
                'language','framework','pattern','principle',
                'tool','concept','algorithm','database','devops','other'
              )),
  description text,
  aliases     text[],
  embedding   extensions.vector(768) not null,
  source      text default 'ai_extracted'
              check (source in ('ai_extracted','user_defined','seed')),
  usage_count int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index concepts_name_lower_unique on concepts(name_lower);
create index concepts_name_trgm on concepts using gin(name extensions.gin_trgm_ops);
