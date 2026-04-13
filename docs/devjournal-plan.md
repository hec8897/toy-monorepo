# DevJournal — 프로젝트 계획서

> Claude Code에 이 파일을 전달해 프로젝트 컨텍스트를 공유하세요.
> "이 파일을 읽고 devjournal 프로젝트 셋업을 도와줘"
>
> **최종 업데이트:** 2026-04-05 (DB / Backend / Frontend / AI Agent 4개 에이전트 분석 반영)

---

## 프로젝트 개요

개발자가 배운 지식을 일기 형식으로 기록하면, Claude AI가 핵심 개념을 추출하고 기존 지식과 마인드맵으로 연결해주는 학습 저널 앱. 블로그로 퍼블리시하면 SEO/AI 검색엔진에 노출됨.

**목표:** 2주 내 백엔드~프론트 풀스택 구현 + PWA 앱 확장 고려

---

## 확정된 기술 스택

| 레이어   | 기술                                       | 이유                                                 |
| -------- | ------------------------------------------ | ---------------------------------------------------- |
| Frontend | Next.js 14 App Router                      | SSG 블로그 + CSR 앱 혼용, SEO                        |
| Backend  | NestJS                                     | DI 구조로 Agent Tool 모듈 분리                       |
| Database | Supabase (PostgreSQL)                      | pgvector 임베딩 검색, Auth 내장                      |
| AI       | **Google Gemini Flash** (function calling) | 무료 tier (15 RPM, 1M tokens/일), tool_use 동일 지원 |
| 임베딩   | **Ollama `nomic-embed-text`** (768차원)    | 로컬 무료, 인터넷 불필요                             |
| 마인드맵 | D3.js force-directed graph                 | 커스텀 지식 그래프 시각화                            |
| 에디터   | **Tiptap v2**                              | 코드블록 하이라이팅, 헤드리스 구조                   |
| 스트리밍 | SSE (Server-Sent Events)                   | 단방향 분석 결과 실시간 전달                         |
| 앱 확장  | PWA → Capacitor                            | 웹뷰 앱, 추가 코드 최소화                            |

> WebSocket 미사용. 분석 흐름이 단방향(서버→클라이언트)이라 SSE로 충분.

---

## 모노레포 구조

NX 워크스페이스 기반 모노레포. 기존 프로젝트와 공존.

```
toy-monorepo/
├── apps/
│   ├── backend/          ← 기존 NestJS (올리브영 크롤러) — 수정 금지
│   ├── frontend/         ← 기존 Next.js — 수정 금지
│   ├── portfolio/        ← 기존 포트폴리오 — 수정 금지
│   └── devjournal/       ← 신규 개발 대상
│       ├── frontend/     ← Next.js App Router (NX: devjournal-frontend)
│       ├── backend/      ← NestJS (NX: devjournal-backend, 포트 3002)
│       └── supabase/     ← 마이그레이션 DDL
│           └── migrations/
│               ├── 20260405000001_extensions.sql
│               ├── 20260405000002_user_profiles.sql
│               ├── 20260405000003_concepts.sql
│               ├── 20260405000004_entries.sql
│               ├── 20260405000005_entry_concepts.sql
│               ├── 20260405000006_connections.sql
│               ├── 20260405000007_user_concepts.sql
│               ├── 20260405000008_indexes.sql
│               ├── 20260405000009_rls_policies.sql
│               ├── 20260405000010_triggers.sql
│               └── 20260405000011_functions.sql
├── packages/
│   ├── types/            ← @toy-monorepo/types (공유 타입, devjournal 타입 추가)
│   └── common/           ← @toy-monorepo/common (공유 유틸)
└── nx.json
```

**절대 규칙:** `apps/backend`, `apps/frontend`, `apps/portfolio` 는 읽기만 허용. 수정 전 반드시 사용자 확인.

**NX 스캐폴딩 명령:**

```bash
npx nx g @nx/next:app devjournal-frontend --directory=apps/devjournal/frontend --appDir=true
npx nx g @nx/nest:app devjournal-backend --directory=apps/devjournal/backend
```

---

## Next.js App Router 라우트 구조

```
apps/devjournal/frontend/src/app/
├── (app)/                  ← 로그인 필요, 앱 레이아웃
│   ├── layout.tsx          ← AppLayout (AppSidebar + AppHeader)
│   ├── journal/
│   │   ├── page.tsx        ← /journal (Tiptap 에디터 + SSE 실시간 분석)
│   │   └── [id]/page.tsx   ← /journal/[id] (일기 상세)
│   ├── mindmap/
│   │   └── page.tsx        ← /mindmap (D3.js 전체 지식 그래프)
│   └── dashboard/
│       └── page.tsx        ← /dashboard (성장 히스토리, recharts)
├── (blog)/                 ← 퍼블릭, SSG, 블로그 레이아웃
│   ├── layout.tsx
│   └── blog/
│       ├── page.tsx        ← /blog
│       └── [slug]/page.tsx ← /blog/use-callback-vs-usememo
└── (auth)/
    └── login/page.tsx      ← /login (Supabase OAuth)
```

---

## NestJS 백엔드 모듈 구조

```
apps/devjournal/backend/src/
├── app/
│   └── app.module.ts
├── agent/
│   ├── agent.module.ts
│   ├── agent.service.ts      ← Claude tool_use 오케스트레이션 (4-스텝 체인)
│   └── tools/
│       ├── extract-concepts.tool.ts    ← TOOL_DEFINITION + parseOutput()
│       ├── search-connections.tool.ts  ← pgvector 직접 쿼리 (Claude 호출 없음)
│       ├── build-mindmap.tool.ts       ← 델타 생성 + 머지 로직
│       └── recommend-next.tool.ts      ← TOOL_DEFINITION + parseOutput()
├── journal/
│   ├── journal.module.ts
│   ├── journal.controller.ts ← POST /api/entries, GET /api/entries/:id/analysis (SSE)
│   └── journal.service.ts    ← Subject 관리 (30분 TTL)
├── mindmap/
│   ├── mindmap.module.ts
│   └── mindmap.service.ts    ← pgvector 그래프 쿼리, 델타 머지
├── concepts/
│   ├── concepts.module.ts
│   └── concepts.service.ts   ← 개념 upsert, Ollama nomic-embed-text 임베딩 생성
├── blog/
│   ├── blog.module.ts
│   └── blog.service.ts       ← 퍼블리시 + SEO 메타 자동생성
├── supabase/
│   ├── supabase.module.ts    ← Global 모듈
│   └── supabase.service.ts   ← anonClient + serviceClient (RLS 우회)
└── auth/
    └── supabase-auth.guard.ts ← Supabase JWT 검증 (Passport 없이)
```

**모듈별 API 요약:**

| 모듈     | 엔드포인트                                                                                                                        |
| -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| journal  | `POST /api/entries`, `GET /api/entries`, `GET /api/entries/:id`, `GET /api/entries/:id/analysis` (SSE), `DELETE /api/entries/:id` |
| concepts | `GET /api/concepts`, `GET /api/concepts/:id`, `GET /api/concepts/search`, `GET /api/concepts/user`                                |
| mindmap  | `GET /api/mindmap`, `GET /api/mindmap/user`, `GET /api/mindmap/concept/:id`                                                       |
| blog     | `POST /api/blog/publish`, `GET /api/blog/posts`, `GET /api/blog/posts/:slug`, `DELETE /api/blog/posts/:slug`                      |

---

## Claude Agent Tool 설계

사용자가 일기를 입력하면 AgentService가 아래 4개 Tool을 순서대로 호출.

> **핵심 원칙:** 각 스텝은 독립적인 `messages.create` 호출. `tool_choice`로 항상 강제 지정.

### 전체 오케스트레이션 흐름

```
POST /api/entries
    │ entryId 즉시 반환
    ▼
클라이언트 → GET /api/entries/:id/analysis (SSE 연결)
    │
    ├─ [Step 1] Claude API — extract_concepts (강제 호출)
    │           └─ ConceptsService.upsertBatch() → Ollama nomic-embed-text 임베딩 생성
    │           └─ SSE: { event: 'concepts_extracted', data: [...] }
    │
    ├─ [Step 2] pgvector 코사인 유사도 직접 쿼리 (Claude 호출 없음)
    │           └─ Claude API — search_connections (후보 컨텍스트 포함)
    │           └─ ConnectionsService.upsertBatch()
    │           └─ SSE: { event: 'connections_found', data: {...} }
    │
    ├─ [Step 3] Claude API — build_mindmap (델타만 생성)
    │           └─ MindmapService.mergeAndSave() ← 기존 그래프 + 델타 머지
    │           └─ SSE: { event: 'mindmap_updated', data: {nodes, links} }
    │
    └─ [Step 4] Claude API — recommend_next
                └─ RecommendationsService.save()
                └─ SSE: { event: 'recommendations_ready', data: [...] }
                └─ SSE: { event: 'analysis_complete' }
```

### Tool 1: extract_concepts

```typescript
// tool_choice: { type: 'tool', name: 'extract_concepts' } 강제 지정
{
  name: 'extract_concepts',
  input_schema: {
    concepts: [{
      name: string,           // 개념명 (영문 권장)
      category: 'language' | 'framework' | 'pattern' | 'principle' | 'tool' | 'concept',
      confidence: number,     // 0.6 이상만 저장
      description: string,    // 한 줄 설명 (한국어)
      aliases: string[]       // 동의어/약어 목록
    }],
    entry_summary: string,    // 일기 전체 요약 (한 문장)
    primary_topic: string     // 주요 주제 개념명
  }
}
```

### Tool 2: search_connections

> **구현 주의:** LLM 호출이 아니라 **pgvector 직접 쿼리**로 후보를 찾은 뒤, 그 결과를 컨텍스트로 Claude에게 관계 분류를 요청하는 방식.

```typescript
{
  name: 'search_connections',
  input_schema: {
    connections: [{
      from_concept: string,
      to_concept: string,
      strength: number,       // 0.1~1.0, D3 link distance에 반비례
      relation_type: 'is_prerequisite_of' | 'is_related_to' | 'is_implementation_of'
                   | 'is_part_of' | 'is_alternative_to' | 'is_opposite_of' | 'is_used_with',
      explanation: string     // 연결 이유 (한국어)
    }],
    cluster_suggestion: string  // 이번 학습 클러스터명
  }
}
```

### Tool 3: build_mindmap

> **구현 주의:** 전체 그래프를 매번 재생성하지 않음. **이번에 추가된 델타(신규 노드+엣지)만** Claude가 생성하고, `MindmapService.mergeAndSave()`로 기존 그래프와 머지.

```typescript
{
  name: 'build_mindmap',
  input_schema: {
    nodes: [{
      id: string,             // concept UUID
      label: string,
      category: string,
      weight: number,         // 노드 크기 (review_count 기반, 1~10)
      is_new: boolean,        // 이번 일기에서 추가된 노드 여부
      group: string           // D3 색상 그룹핑
    }],
    links: [{
      source: string,         // from node id
      target: string,         // to node id
      strength: number,
      relation_type: string,
      label: string           // hover 시 표시
    }],
    center_node_id: string,   // 이번 일기 핵심 개념 (D3 중심 고정)
    layout_hint: {
      charge_strength: number, // D3 forceCharge 권장값
      link_distance: number
    }
  }
}
```

### Tool 4: recommend_next

```typescript
{
  name: 'recommend_next',
  input_schema: {
    recommendations: [{
      concept_name: string,
      reason: string,               // 구체적 추천 이유 (한국어)
      priority: number,             // 1~5
      estimated_difficulty: 'beginner' | 'intermediate' | 'advanced',
      prerequisite_satisfied: boolean,
      related_to_today: string[],   // 오늘 학습 개념 중 연관된 것
      resource_hint: string         // 학습 자료 힌트
    }],
    learning_pattern_analysis: string, // 학습 패턴 분석 (대시보드용)
    streak_encouragement: string       // 짧은 격려 메시지
  }
}
```

---

## Supabase DB 스키마

### 확장 활성화

```sql
create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm with schema extensions;  -- 퍼지 검색
create extension if not exists unaccent with schema extensions; -- 발음 기호 무시
```

### 핵심 테이블

```sql
-- 사용자 프로필 (auth.users 직접 수정 불가)
create table user_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone     text default 'Asia/Seoul',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 일기 항목 (원안에서 대폭 개선)
create table entries (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  content          text not null check (char_length(content) >= 10),
  title            text,
  summary          text,                    -- Claude가 생성하는 1~2문장 요약
  embedding        vector(768),             -- entry 전체 임베딩 (Ollama nomic-embed-text)

  -- 분석 상태 (원안에 없었던 컬럼)
  analysis_status  text not null default 'pending'
                   check (analysis_status in ('pending','processing','completed','failed')),
  analysis_error   text,
  analyzed_at      timestamptz,

  -- 블로그 퍼블리시 (원안에 없었던 컬럼)
  is_published     boolean not null default false,
  published_at     timestamptz,
  slug             text unique,
  seo_title        text,
  seo_description  text,
  seo_tags         text[],

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz            -- soft delete
);

-- 일기 ↔ 개념 조인 테이블 (원안의 extracted_concepts text[] 대체)
create table entry_concepts (
  entry_id    uuid references entries(id) on delete cascade,
  concept_id  uuid references concepts(id) on delete cascade,
  confidence  float not null check (confidence between 0 and 1),
  primary key (entry_id, concept_id)
);

-- 개념 마스터 (원안에서 개선)
create table concepts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  name_lower  text generated always as (lower(name)) stored,  -- 대소문자 무시 중복 방지
  category    text not null
              check (category in (
                'language','framework','pattern','principle',
                'tool','concept','algorithm','database','devops','other'
              )),
  description text,
  aliases     text[],
  embedding   vector(768) not null,         -- Ollama nomic-embed-text voyage-3-lite (512차원)
  source      text default 'ai_extracted'
              check (source in ('ai_extracted','user_defined','seed')),
  usage_count int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index concepts_name_lower_unique on concepts(name_lower);
create index concepts_name_trgm on concepts using gin(name gin_trgm_ops);

-- 개념 간 연결 (원안에서 relation_type 세분화)
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

-- 사용자별 학습 기록 (원안에서 SM-2 알고리즘 컬럼 추가)
create table user_concepts (
  user_id          uuid not null references auth.users(id) on delete cascade,
  concept_id       uuid not null references concepts(id) on delete cascade,
  learned_at       timestamptz not null default now(),
  review_count     int not null default 0,
  last_reviewed_at timestamptz,
  ease_factor      float not null default 2.5,  -- SM-2 복습 간격 조정
  next_review_at   timestamptz,
  mastery_level    text not null default 'learning'
                   check (mastery_level in ('learning','familiar','mastered')),
  primary key (user_id, concept_id)
);
```

### pgvector 인덱스

```sql
-- HNSW 인덱스 (수만 개 규모, recall 95~99%)
-- ivfflat 대비 동적 삽입 지원, 쿼리 정확도 우수
create index concepts_embedding_hnsw
  on concepts using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

create index entries_embedding_hnsw
  on entries using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);
```

### 핵심 DB 함수

```sql
-- 유사 개념 검색 (search_connections에서 사용)
create or replace function match_concepts(
  query_embedding vector(768),
  match_threshold float default 0.6,
  match_count     int   default 10
)
returns table (id uuid, name text, category text, similarity float)
language plpgsql security definer
as $$
begin
  return query
  select c.id, c.name, c.category,
         1 - (c.embedding <=> query_embedding) as similarity
  from concepts c
  where 1 - (c.embedding <=> query_embedding) > match_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 사용자 마인드맵 전체 그래프 조회 (D3.js용)
create or replace function get_user_mindmap(p_user_id uuid)
returns json language plpgsql security definer as $$
declare result json;
begin
  select json_build_object(
    'nodes', (
      select json_agg(json_build_object(
        'id', c.id, 'name', c.name, 'category', c.category,
        'mastery', uc.mastery_level, 'review_count', uc.review_count
      ))
      from user_concepts uc join concepts c on c.id = uc.concept_id
      where uc.user_id = p_user_id
    ),
    'edges', (
      select json_agg(json_build_object(
        'from', conn.from_id, 'to', conn.to_id,
        'strength', conn.strength, 'type', conn.relation_type
      ))
      from connections conn
      where conn.from_id in (select concept_id from user_concepts where user_id = p_user_id)
        and conn.to_id   in (select concept_id from user_concepts where user_id = p_user_id)
    )
  ) into result;
  return result;
end;
$$;
```

---

## 임베딩 전략

| 항목        | 결정                          | 이유                             |
| ----------- | ----------------------------- | -------------------------------- |
| AI 모델     | **Google Gemini Flash**       | 무료 tier, function calling 지원 |
| 임베딩 모델 | **Ollama `nomic-embed-text`** | 로컬 실행, 완전 무료             |
| 차원        | **768**                       | nomic-embed-text 기본 차원       |
| 인덱스      | **HNSW**                      | 수만 개 규모에서 recall 95~99%   |
| 임베딩 대상 | `name + " " + description`    | 짧고 명확                        |
| 캐싱        | DB의 `embedding` 컬럼 재사용  | 동일 개념 재임베딩 스킵          |

**비용:**

- AI 분석: **$0** (Gemini Flash 무료 tier — 15 RPM, 1M tokens/일)
- 임베딩: **$0** (Ollama 로컬)
- Supabase: **$0** (Free tier — 500MB DB, 1GB storage)
- 총합: **$0** (프로토타입 기준)

---

## 프론트엔드 구조

```
apps/devjournal/frontend/src/
├── features/
│   ├── journal/
│   │   ├── components/     ← TiptapEditor, AnalysisProgressPanel, RecommendationCards
│   │   ├── hooks/          ← useJournalEditor, useJournalAnalysis (SSE EventSource)
│   │   ├── api/
│   │   └── types/          ← SSEEvent, AnalysisStep
│   ├── mindmap/
│   │   ├── components/     ← MindmapCanvas, MindmapNode, MindmapEdge, ConceptDetailDrawer
│   │   ├── hooks/          ← useMindmapSimulation (D3), useMindmapZoom
│   │   └── stores/         ← mindmapStore (필터, 선택 상태)
│   ├── concepts/
│   │   ├── components/     ← ConceptTimeline, ConceptGrowthChart (recharts)
│   │   └── hooks/
│   ├── blog/
│   │   ├── components/     ← BlogPostCard, JsonLdScript, BlogPublishButton
│   │   └── hooks/
│   └── auth/
│       └── hooks/          ← useSupabaseAuth
└── shared/
    ├── components/layout/  ← AppLayout, AppSidebar, AppHeader
    ├── config/navigation.ts
    ├── lib/
    │   ├── api.ts          ← axios (NestJS 백엔드)
    │   └── supabase.ts     ← Supabase 클라이언트
    ├── providers/
    │   ├── QueryProvider.tsx
    │   └── SupabaseProvider.tsx
    └── stores/
        ├── authStore.ts    ← Supabase 세션 기반
        └── journalStore.ts ← 에디터 + 분석 상태
```

**D3 + React 통합 패턴:**

- D3는 **좌표 계산만** (`useMindmapSimulation` 훅 내부)
- React는 **SVG 렌더링** (JSX `<circle>`, `<line>`) → Virtual DOM 충돌 방지
- 줌/패닝: `d3.zoom` → `useState<string>` transform → React `<g transform={...}>`

**SSE 클라이언트 패턴:**

```typescript
// POST /api/entries → entryId 즉시 반환
// GET /api/entries/:id/analysis → EventSource 연결
const es = new EventSource(`${API_URL}/entries/${entryId}/analysis`, {
  withCredentials: true,
});
es.addEventListener('concepts_extracted', (e) =>
  setConcepts(JSON.parse(e.data)),
);
es.addEventListener('analysis_complete', () => es.close());
```

---

## 환경 변수

```dotenv
# 서버
NODE_ENV=development
PORT=3001                          # 환경변수로 자유롭게 설정
FRONTEND_URL=http://localhost:3000

# Supabase
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # RLS 우회, 절대 노출 금지
# Supabase Settings > Database > Connection string (Transaction mode) 에서 복사

# AI
GEMINI_API_KEY=AIza...              # Google AI Studio에서 무료 발급
OLLAMA_BASE_URL=http://localhost:11434  # 로컬 Ollama
EMBEDDING_MODEL=nomic-embed-text
EMBEDDING_DIMENSION=768
```

---

## 신규 패키지 의존성

```bash
# 백엔드
pnpm add @google/generative-ai @supabase/supabase-js ollama

# 프론트엔드
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-code-block-lowlight tiptap-markdown lowlight
pnpm add d3 && pnpm add -D @types/d3
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add recharts
pnpm add marked dompurify schema-dts
pnpm add -D @types/marked @types/dompurify
```

---

## SSE 스트리밍 이벤트 스펙

| 이벤트                  | 발생 시점           | data 형식                                             |
| ----------------------- | ------------------- | ----------------------------------------------------- |
| `progress`              | 각 스텝 시작 전     | `{ step: 1~4, message: string }`                      |
| `concepts_extracted`    | Step 1 완료         | `{ concepts: ConceptItem[], entry_summary: string }`  |
| `connections_found`     | Step 2 완료         | `{ connections: ConnectionItem[] }`                   |
| `mindmap_updated`       | Step 3 완료         | `{ delta: {nodes, links}, total_node_count: number }` |
| `recommendations_ready` | Step 4 완료         | `{ recommendations: RecommendationItem[] }`           |
| `analysis_complete`     | 전체 완료           | `{ success: true }`                                   |
| `step_failed`           | 스텝 실패 (partial) | `{ step: number, will_retry: boolean }`               |
| `error`                 | 치명적 오류         | `{ message: string }`                                 |

> **스텝별 독립 Fallback:** Step 2 실패해도 Step 3, 4는 계속 진행. 실패한 스텝은 `analysis_retry_queue` 테이블에 추가되어 5분 후 재시도.

---

## RLS 정책 요약

| 테이블           | 읽기                         | 쓰기                     |
| ---------------- | ---------------------------- | ------------------------ |
| `entries`        | 자신의 글 + 퍼블리시된 글    | 자신만                   |
| `concepts`       | 모든 인증 사용자 (전역 공유) | service_role (AI가 대신) |
| `connections`    | 모든 인증 사용자             | service_role             |
| `user_concepts`  | 자신만                       | 자신만                   |
| `entry_concepts` | entry 소유자 + published     | service_role             |
| `user_profiles`  | 모든 인증 사용자             | 자신만                   |

---

## SEO / AI 노출 전략

블로그 글을 퍼블리시하면 자동으로:

- `sitemap.xml` — Next.js App Router 자동 생성
- `JSON-LD` — 구글 구조화 데이터 (작성자, 날짜, 태그)
- `OpenGraph` — SNS 공유 미리보기
- `llms.txt` — AI 크롤러(ChatGPT, Perplexity) 노출용

Supabase Database Webhook → `on_entry_published` Edge Function → Next.js ISR 재검증 트리거

---

## Claude Code Agent 구조

```
CLAUDE.md (루트) — 모노레포 전체 보호 규칙
  └── CLAUDE.md (apps/devjournal/) — DevJournal 전용 컨텍스트
        └── Orchestrator — 전체 흐름 조율
              ├── DB Agent     — Supabase DDL + pgvector 셋업
              ├── Backend Agent — NestJS 모듈 생성
              └── Frontend Agent — Next.js 페이지 생성
                    └── Verify Agent — .env 검증, 타입 체크, 연결 테스트
```

```bash
# devjournal 폴더에서 집중 작업
cd apps/devjournal && claude "db 셋업해줘"

# 루트에서 전체 컨텍스트로 작업
cd toy-monorepo && claude "devjournal 백엔드 agent 모듈 만들어줘"
```

---

## 2주 스프린트 계획

> **방침 변경 (2026-04-07)**: 백엔드/프론트엔드 주차 분리 → **기능 단위(BE+FE 함께)** 방식으로 재편.
> 각 Day마다 백엔드 API + 프론트엔드 UI를 함께 완성해 동작하는 기능을 매일 확인 가능.
>
> **방침 변경 (2026-04-08)**: Journal CRUD 테스트 후 인증 없이는 E2E 테스트 불가 확인.
> Day 5를 **OAuth 인증 구현** (GitHub + Google)으로 교체. 기존 Day 5 이후 한 칸씩 밀림.
>
> **방침 변경 (2026-04-09)**: AI Agent 전에 실제 배포 환경 구축 필요.
> Day 7을 **CI/CD 구성** (GitHub Actions + AWS EC2 BE / Vercel FE)으로 교체. 기존 Day 7 이후 한 칸씩 밀림.

| 일차      | 기능              | 내용                                                                         | 우선순위 |
| --------- | ----------------- | ---------------------------------------------------------------------------- | -------- |
| Day 1–2   | ✅ DB 셋업        | Supabase migrations 001~011, pgvector HNSW 인덱스                            | P0       |
| Day 3     | ✅ 스캐폴딩       | NX BE+FE 스캐폴딩, SupabaseModule, Auth/Layout 기본 구현                     | P0       |
| Day 4     | ✅ Journal CRUD   | BE: entries CRUD API / FE: 목록·생성·삭제 UI (textarea)                      | P0       |
| Day 5     | ✅ OAuth 인증     | Supabase GitHub OAuth / BE: SupabaseAuthGuard 실전 적용 / FE: 세션 가드 완성 | P0       |
| Day 6     | ✅ Concepts       | BE: concepts 조회 API / FE: 개념 목록·검색 UI                                | P0       |
| Day 7     | ✅ CI/CD          | BE: GitHub Actions → AWS EC2 자동 배포 / FE: Vercel 자동 배포                | P0       |
| Day 8     | **AI Agent 1**    | AgentService + Tool 1 (extract_concepts) + Ollama 임베딩                     | P0       |
| Day 9     | **AI Agent 2–3**  | Tool 2 (search_connections + pgvector) + Tool 3 (build_mindmap 델타)         | P1       |
| Day 10    | **SSE + Agent 4** | Tool 4 (recommend_next) + SSE 스트리밍 + FE AnalysisProgressPanel            | P1       |
| Day 11    | **Tiptap 에디터** | textarea → Tiptap v2 교체 + SSE 실시간 분석 연동                             | P1       |
| Day 12–13 | **Mindmap**       | BE mindmap API / FE D3.js MindmapCanvas + ConceptDetailDrawer                | P1       |
| Day 14    | **Dashboard**     | recharts ConceptGrowthChart, WeeklyHeatmap                                   | P2       |
| Day 15    | **Blog + PWA**    | SSG + SEO (JSON-LD, OG) + PWA manifest + sitemap                             | P2       |

---

## 앱 확장 경로

```
1단계: PWA (manifest.json + Service Worker) — 홈 화면 설치
2단계: Capacitor 래핑 — iOS/Android 앱스토어 배포
3단계: 푸시 알림 — 매일 복습 리마인더 (SM-2 기반 next_review_at 활용)
```

---

## 직무별 확장 전략

현재는 개발자 버전이지만, `concept_category`만 변경하면 동일한 엔진으로 확장 가능:

- **디자이너:** UI 패턴, Figma 컴포넌트, 색상 이론
- **PM:** 프레임워크, 지표, 케이스스터디
- **마케터:** 채널 전략, 카피라이팅, 퍼널 지식

---

## Supabase Auth 설정 메모

> **작성일:** 2026-04-09 — 도메인 연결 시 반드시 재확인 필요

### OAuth Provider 설정 위치

```
Supabase Dashboard → Authentication → Providers
```

| Provider | 등록된 Callback URL                                         |
| -------- | ----------------------------------------------------------- |
| GitHub   | `https://vrhktnkdluqnsukbknwb.supabase.co/auth/v1/callback` |
| Google   | (미설정 — 추후 추가 예정)                                   |

### ⚠️ 도메인 연결 시 체크리스트

Vercel/기타 호스팅에 도메인을 연결하면 **아래 3곳을 모두 업데이트**해야 합니다.

**1. Supabase Redirect URL 허용 목록 추가**

```
Authentication → URL Configuration → Redirect URLs
→ 추가: https://<your-domain>/auth/callback
```

현재 등록된 URL: `http://localhost:3000/auth/callback`

**2. GitHub OAuth App 콜백 URL 유지**

GitHub OAuth App의 `Authorization callback URL`은 Supabase URL(`https://vrhktnkdluqnsukbknwb.supabase.co/auth/v1/callback`)이라 도메인이 바뀌어도 **수정 불필요**.

단, `Homepage URL`은 실제 도메인으로 업데이트하는 것이 좋음:

```
github.com → Settings → Developer settings → OAuth Apps → DevJournal (local)
→ Homepage URL: https://<your-domain>
```

**3. (Google 추가 시) Google OAuth 리디렉션 URI는 Supabase URL이라 수정 불필요**

---

## 아이데이션 백로그

> **작성일:** 2026-04-10 — 코드 미반영, 스프린트 계획 시 반영 여부 결정

### 핵심 방향

단순 일기장이 아닌 **"생각을 정리하고 공유까지 이어지는 학습 도구"** 로 포지셔닝.

### 아이디어

| #   | 아이디어                                                                                                                                                                                           | 연관 스프린트 | 우선순위 |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | -------- |
| 1   | **일기 작성이 핵심** — 다른 기능은 일기를 잘 쓰게 돕는 수단으로 설계                                                                                                                               | 전체          | -        |
| 2   | **더 디테일한 일기 유도** — 짧은 메모가 아닌 충분한 내용을 작성하도록 UX 설계 (글자수 가이드, 작성 프롬프트 등)                                                                                    | Day 11 Tiptap | 검토     |
| 3   | **주제(토픽) 필수 입력** — 현재 `title`이 optional인데 required로 변경 검토                                                                                                                        | Day 4 수정    | 검토     |
| 4   | **AI 기반 개념 제안 + 생각 도출** — 주제 입력 시 AI가 관련 개념을 먼저 제안하고, "이 개념에 대해 어떻게 생각하나요?" 형식의 질문으로 본인 생각을 끌어내어 일기가 자기 생각이 담긴 글이 되도록 유도 | Day 8 Agent   | 검토     |
| 5   | **콘텐츠 내보내기** — 일기/개념 정리 후 외부 플랫폼 퍼블리시 지원: LinkedIn 포스팅 형식 변환, Velog/개인 블로그 마크다운 변환                                                                      | Day 15 Blog   | 검토     |

---

## 시작 순서 (권장)

1. **Supabase 프로젝트 생성** (supabase.com → Northeast Asia Seoul)
2. **`apps/devjournal/` CLAUDE.md 작성** (devjournal 전용 컨텍스트)
3. **migrations 001~011 작성 및 `supabase db push`** → pgvector + RLS + DB 함수
4. **NX 스캐폴딩** → `devjournal-backend`, `devjournal-frontend` 프로젝트 생성
5. **SupabaseModule + AgentService** → Tool 1~4 순서대로 구현
6. **SSE 스트리밍 연결** → 프론트엔드 AnalysisProgressPanel
7. **D3.js 마인드맵** → 데이터가 쌓인 후 시각화
8. **블로그 SSG + SEO** → 마지막에 추가
