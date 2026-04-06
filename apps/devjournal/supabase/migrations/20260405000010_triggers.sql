-- updated_at 자동 갱신 함수
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- user_profiles
create trigger user_profiles_updated_at
  before update on user_profiles
  for each row execute function update_updated_at();

-- concepts
create trigger concepts_updated_at
  before update on concepts
  for each row execute function update_updated_at();

-- entries
create trigger entries_updated_at
  before update on entries
  for each row execute function update_updated_at();
