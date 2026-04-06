create table user_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone     text default 'Asia/Seoul',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
