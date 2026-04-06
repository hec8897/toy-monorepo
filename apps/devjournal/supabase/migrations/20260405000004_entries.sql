create table entries (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  content          text not null check (char_length(content) >= 10),
  title            text,
  summary          text,
  embedding        extensions.vector(768),

  analysis_status  text not null default 'pending'
                   check (analysis_status in ('pending','processing','completed','failed')),
  analysis_error   text,
  analyzed_at      timestamptz,

  is_published     boolean not null default false,
  published_at     timestamptz,
  slug             text unique,
  seo_title        text,
  seo_description  text,
  seo_tags         text[],

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);
