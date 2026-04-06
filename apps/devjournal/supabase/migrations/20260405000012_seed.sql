-- ================================================================
-- Seed Data (개발/테스트용)
-- ================================================================

-- 1. 테스트 유저 (auth.users)
insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, aud, role
) values (
  '00000000-0000-0000-0000-000000000001',
  'test@devjournal.dev',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password: test1234
  now(), now(), now(),
  'authenticated', 'authenticated'
);

-- 2. user_profiles
insert into user_profiles (id, display_name, timezone) values (
  '00000000-0000-0000-0000-000000000001',
  '테스트 개발자',
  'Asia/Seoul'
);

-- 3. concepts (embedding은 768차원 0벡터, 실제 환경에서는 Ollama가 생성)
insert into concepts (id, name, category, description, aliases, embedding) values
(
  '10000000-0000-0000-0000-000000000001',
  'useCallback',
  'tool',
  'React Hook. 함수를 메모이제이션하여 불필요한 리렌더링을 방지한다.',
  array['use-callback', 'useCallback hook'],
  array_fill(0, array[768])::extensions.vector(768)
),
(
  '10000000-0000-0000-0000-000000000002',
  'useMemo',
  'tool',
  'React Hook. 계산 비용이 높은 값을 메모이제이션한다.',
  array['use-memo', 'useMemo hook'],
  array_fill(0, array[768])::extensions.vector(768)
),
(
  '10000000-0000-0000-0000-000000000003',
  'Memoization',
  'concept',
  '동일한 입력에 대해 결과를 캐싱하여 재계산을 생략하는 최적화 기법.',
  array['memoize', '메모이제이션'],
  array_fill(0, array[768])::extensions.vector(768)
),
(
  '10000000-0000-0000-0000-000000000004',
  'React Hooks',
  'framework',
  'React 16.8에서 도입된 함수형 컴포넌트에서 상태와 사이드이펙트를 관리하는 API.',
  array['hooks', 'react hook'],
  array_fill(0, array[768])::extensions.vector(768)
);

-- 4. connections (개념 간 관계)
insert into connections (from_id, to_id, strength, relation_type) values
(
  '10000000-0000-0000-0000-000000000001', -- useCallback
  '10000000-0000-0000-0000-000000000003', -- Memoization
  0.9, 'is_implementation_of'
),
(
  '10000000-0000-0000-0000-000000000002', -- useMemo
  '10000000-0000-0000-0000-000000000003', -- Memoization
  0.9, 'is_implementation_of'
),
(
  '10000000-0000-0000-0000-000000000001', -- useCallback
  '10000000-0000-0000-0000-000000000002', -- useMemo
  0.8, 'is_related_to'
),
(
  '10000000-0000-0000-0000-000000000001', -- useCallback
  '10000000-0000-0000-0000-000000000004', -- React Hooks
  0.7, 'is_part_of'
),
(
  '10000000-0000-0000-0000-000000000002', -- useMemo
  '10000000-0000-0000-0000-000000000004', -- React Hooks
  0.7, 'is_part_of'
);

-- 5. entries
insert into entries (id, user_id, content, title, summary, analysis_status, analyzed_at) values (
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'useCallback과 useMemo의 차이를 공부했다. 둘 다 메모이제이션을 활용하지만, useCallback은 함수를 캐싱하고 useMemo는 계산된 값을 캐싱한다. 자식 컴포넌트에 콜백을 props로 넘길 때는 useCallback을 써야 불필요한 리렌더링을 막을 수 있다.',
  'useCallback vs useMemo 정리',
  'useCallback은 함수, useMemo는 값을 메모이제이션한다. 둘 다 Memoization 개념의 React 구현체.',
  'completed',
  now()
);

-- 6. entry_concepts
insert into entry_concepts (entry_id, concept_id, confidence) values
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 0.95),
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 0.92),
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 0.85),
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 0.75);

-- 7. user_concepts
insert into user_concepts (user_id, concept_id, review_count, mastery_level) values
('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, 'learning'),
('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 1, 'learning'),
('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 2, 'familiar'),
('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 3, 'familiar');
