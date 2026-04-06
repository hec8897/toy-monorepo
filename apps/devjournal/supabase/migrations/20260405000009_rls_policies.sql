-- RLS 활성화
alter table user_profiles  enable row level security;
alter table entries         enable row level security;
alter table concepts        enable row level security;
alter table connections     enable row level security;
alter table user_concepts   enable row level security;
alter table entry_concepts  enable row level security;

-- user_profiles: 읽기는 모든 인증 사용자, 쓰기는 자신만
create policy "user_profiles: authenticated users can read"
  on user_profiles for select
  to authenticated
  using (true);

create policy "user_profiles: users can insert own profile"
  on user_profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "user_profiles: users can update own profile"
  on user_profiles for update
  to authenticated
  using (id = auth.uid());

-- entries: 자신의 글 + 퍼블리시된 글 읽기, 쓰기는 자신만
create policy "entries: users can read own or published"
  on entries for select
  to authenticated
  using (user_id = auth.uid() or is_published = true);

create policy "entries: users can insert own entries"
  on entries for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "entries: users can update own entries"
  on entries for update
  to authenticated
  using (user_id = auth.uid());

create policy "entries: users can delete own entries"
  on entries for delete
  to authenticated
  using (user_id = auth.uid());

-- concepts: 읽기는 모든 인증 사용자, 쓰기는 service_role만
create policy "concepts: authenticated users can read"
  on concepts for select
  to authenticated
  using (true);

-- connections: 읽기는 모든 인증 사용자, 쓰기는 service_role만
create policy "connections: authenticated users can read"
  on connections for select
  to authenticated
  using (true);

-- user_concepts: 자신만 읽기/쓰기
create policy "user_concepts: users can read own"
  on user_concepts for select
  to authenticated
  using (user_id = auth.uid());

create policy "user_concepts: users can insert own"
  on user_concepts for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "user_concepts: users can update own"
  on user_concepts for update
  to authenticated
  using (user_id = auth.uid());

-- entry_concepts: entry 소유자 + published 읽기, 쓰기는 service_role만
create policy "entry_concepts: owner or published can read"
  on entry_concepts for select
  to authenticated
  using (
    exists (
      select 1 from entries e
      where e.id = entry_id
        and (e.user_id = auth.uid() or e.is_published = true)
    )
  );
