# Day 12 — Mindmap (옵션 C: BE API + 최소 D3 시각화 + Drawer 골격)

> **목표:** 사용자가 학습한 개념과 그 연결을 D3 force-directed 그래프로 조망하고, 노드 클릭 시 개념 상세(Drawer)를 볼 수 있는 기본 골격을 완성한다.
> **작성일:** 2026-04-25
> **선행:** Day 11 Tiptap 에디터 + AI 분석 재시도 (PR #69) 완료
> **후속:** Day 13 — 검색/카테고리 필터/이웃 강조/Tool 3 델타 머지

---

## 🎯 핵심 결정 사항

| 항목                | 결정                                                                        |
| ------------------- | --------------------------------------------------------------------------- |
| 핵심 사용자 가치    | **학습 지도 조망** — 자기 학습을 거울처럼 보여주는 것이 1차 목표            |
| 데이터 범위         | **내 마인드맵만** (타인/공개 마인드맵은 Day 15 Blog 단계로 분리)            |
| Drawer 콘텐츠       | 개념 메타 + **관련 일기 리스트** (마인드맵 → 일기 회귀 동선)                |
| 인터랙션            | 줌/패닝 + 노드 클릭(Drawer) + 노드 드래그 + 호버 강조                       |
| **Day 13으로 분리** | 검색 / 카테고리 필터 / 이웃 강조(neighbor highlight) / Tool 3 build_mindmap |

---

## 📦 현재 상태 (Day 11 완료 기준)

| 항목                                     | 상태                                                                                |
| ---------------------------------------- | ----------------------------------------------------------------------------------- |
| DB `get_user_mindmap()`                  | ✅ migration `20260405000011_functions.sql` 에 정의됨                               |
| DB `concepts` / `connections`            | ✅ 테이블 + RLS 정책 + HNSW 인덱스 완비                                             |
| DB `user_concepts` / `entry_concepts`    | ✅ 테이블 + 트리거 완비                                                             |
| BE `concepts.service.ts`                 | ✅ 구현 완료 (Day 6, 8-C)                                                           |
| BE `connections.service.ts`              | ✅ 구현 완료 (Day 10 search_connections)                                            |
| BE `mindmap` 모듈                        | ❌ **신규 작성**                                                                    |
| FE `domains/mindmap/{4 layers}/index.ts` | ⚪ DDD 4 레이어 빈 index.ts만 있음 — **본 작업에서 채움**                           |
| FE `app/mindmap/page.tsx`                | ❌ **신규 작성**                                                                    |
| FE 사이드바 메뉴                         | ❌ "마인드맵" 메뉴 항목 추가 필요 (`shared/config/navigation.ts`)                   |
| `database.types.ts`                      | ✅ `get_user_mindmap` 타입 이미 포함 (`Args: { p_user_id: string }; Returns: Json`) |

---

## 🔧 Backend 설계

### 모듈 구조

```
apps/devjournal/backend/src/mindmap/
├── mindmap.module.ts
├── mindmap.controller.ts
├── mindmap.service.ts
└── dto/
    ├── mindmap-graph.dto.ts        # GET /api/mindmap 응답
    └── concept-detail.dto.ts       # GET /api/mindmap/concepts/:id 응답
```

`AppModule`에 `MindmapModule` 등록.

### API 엔드포인트

| 메서드 | 경로                               | 응답                                                                 | 비고                          |
| ------ | ---------------------------------- | -------------------------------------------------------------------- | ----------------------------- |
| GET    | `/api/mindmap`                     | `{ nodes: MindmapNodeDto[], edges: MindmapEdgeDto[] }`               | `get_user_mindmap()` RPC 호출 |
| GET    | `/api/mindmap/concepts/:conceptId` | `{ concept, mastery, review_count, related_entries: EntryRefDto[] }` | Drawer용                      |

모두 `SupabaseAuthGuard` 적용 → `req.user.id` 기반.

### DTO 형태

```typescript
// mindmap-graph.dto.ts
export class MindmapNodeDto {
  id: string; // concept UUID
  name: string;
  category: string; // language|framework|...|other
  mastery: 'learning' | 'familiar' | 'mastered';
  review_count: number;
}

export class MindmapEdgeDto {
  from: string; // concept UUID
  to: string; // concept UUID
  strength: number; // 0..1
  type: string; // relation_type
}

export class MindmapGraphDto {
  nodes: MindmapNodeDto[];
  edges: MindmapEdgeDto[];
}

// concept-detail.dto.ts
export class EntryRefDto {
  id: string;
  title: string | null;
  created_at: string;
}

export class ConceptDetailDto {
  id: string;
  name: string;
  category: string;
  description: string | null;
  mastery: 'learning' | 'familiar' | 'mastered';
  review_count: number;
  related_entries: EntryRefDto[]; // 최대 10개, created_at desc
}
```

### MindmapService 책임

- `getUserMindmap(userId)` — `supabase.rpc('get_user_mindmap', { p_user_id })` 호출 후 JSON → DTO 변환. nodes/edges null이면 빈 배열로 정규화.
- `getConceptDetail(userId, conceptId)` — 다음을 병렬로 조회:
  1. `concepts` row (id, name, category, description)
  2. `user_concepts` row (mastery_level, review_count) — 본인 데이터만
  3. `entry_concepts` JOIN `entries` — 본인 일기만, `created_at desc` 최대 10개
- 본인이 학습하지 않은 개념(`user_concepts`에 없음) 요청 시 `404 NotFoundException`.

### 유닛 테스트

`devjournal-backend`에는 현재 jest test target이 셋업되어 있지 않다. Day 12 스코프 보호를 위해 jest 인프라 도입은 별도 작업으로 분리하고, 본 작업에서는 다음으로 검증한다:

- `npm run build:devjournal-backend` 빌드 통과 (TypeScript 타입 검증)
- `npm run lint` 통과
- 수동 검증 체크리스트 (아래 섹션)
- 추후 jest 셋업 시 `mindmap.service.spec.ts` 추가 예정

---

## 🎨 Frontend 설계

### DDD 4 레이어 구조

```
apps/devjournal/frontend/src/domains/mindmap/
├── domain/
│   ├── index.ts
│   ├── MindmapNode.ts          # 도메인 타입 (서버 응답과 1:1)
│   ├── MindmapEdge.ts
│   ├── ConceptDetail.ts
│   └── categoryColors.ts       # 카테고리 → Tailwind 색상 매핑 상수
├── infrastructure/
│   ├── index.ts
│   └── mindmapApi.ts           # axios 호출 (GET /api/mindmap, /concepts/:id)
├── application/
│   ├── index.ts
│   ├── useMindmapQuery.ts      # TanStack Query, staleTime 5분
│   ├── useConceptDetailQuery.ts
│   ├── useMindmapSimulation.ts # D3 force-directed, 좌표만 반환
│   └── mindmapStore.ts         # Zustand: { selectedConceptId }
└── presentation/
    ├── index.ts
    ├── MindmapPageView.tsx     # 페이지 본체
    ├── MindmapCanvas.tsx       # SVG + zoom + nodes/edges 렌더
    ├── MindmapNodeView.tsx     # <circle> + 라벨
    ├── MindmapEdgeView.tsx     # <line>
    ├── ConceptDetailDrawer.tsx # 우측 슬라이드 드로어
    └── MindmapEmptyState.tsx
```

### 페이지 진입점 (얇게)

```typescript
// apps/devjournal/frontend/src/app/mindmap/page.tsx
import { MindmapPageView } from '@/domains/mindmap/presentation';

export default function MindmapPage() {
  return <MindmapPageView />;
}
```

> 메모리 규칙: `app/` 페이지는 로직 없이 View 컴포넌트 import만.

### 핵심 훅 명세

**`useMindmapQuery()`**

- TanStack Query
- `queryKey: ['mindmap']`
- `staleTime: 5 * 60 * 1000` (5분)
- 응답: `MindmapGraphDto`

**`useConceptDetailQuery(conceptId: string | null)`**

- `enabled: !!conceptId`
- `queryKey: ['mindmap', 'concept', conceptId]`
- `staleTime: 60_000` (1분)

**`useMindmapSimulation(nodes, edges, { width, height })`**

- D3 `forceSimulation` 인스턴스 내부 관리
- forces: `forceManyBody({ strength: -150 })`, `forceLink({ distance: e => 50 + (1 - e.strength) * 100 })`, `forceCenter`, `forceCollide`
- 반환: `{ positionedNodes, positionedEdges, simulationRef, dragHandlers }`
- D3는 좌표 계산만, **JSX는 React가 렌더** (V-DOM 충돌 방지)
- `useEffect`로 nodes/edges 변경 시 simulation 재시작
- 컴포넌트 unmount 시 `simulation.stop()`

### 상태 관리

`mindmapStore` (Zustand):

```typescript
interface MindmapStore {
  selectedConceptId: string | null;
  selectConcept: (id: string | null) => void;
}
```

> Day 13에서 `searchQuery`, `categoryFilter[]`, `masteryFilter[]` 추가 예정.

---

## 🎨 시각 디자인 명세

### 노드 (`MindmapNodeView`)

| 속성       | 매핑                                                                        |
| ---------- | --------------------------------------------------------------------------- |
| 색상(fill) | `categoryColors[category]` (Tailwind 500 톤)                                |
| 반지름     | `8 + Math.log(review_count + 1) * 4` → 8px ~ 약 20px                        |
| 투명도     | `learning: 0.5`, `familiar: 0.75`, `mastered: 1.0`                          |
| 테두리     | 기본 `stroke-width: 2`, 호버 시 `4`                                         |
| 라벨       | `<text>` 노드 우측, `font-size: 12px`, `pointer-events: none` (클릭 방해 X) |

### 카테고리 색상 (`categoryColors.ts`)

```typescript
export const categoryColors: Record<string, string> = {
  language: '#0ea5e9', // sky-500
  framework: '#6366f1', // indigo-500
  pattern: '#8b5cf6', // violet-500
  principle: '#ec4899', // pink-500
  tool: '#f59e0b', // amber-500
  concept: '#10b981', // emerald-500
  algorithm: '#f43f5e', // rose-500
  database: '#06b6d4', // cyan-500
  devops: '#f97316', // orange-500
  other: '#94a3b8', // slate-400
};
```

### 엣지 (`MindmapEdgeView`)

| 속성   | 매핑                                     |
| ------ | ---------------------------------------- |
| 색상   | `#94a3b8` (slate-400)                    |
| 굵기   | `1 + strength * 2` (1px ~ 3px)           |
| 투명도 | `0.6`, 호버 시 `0.9`                     |
| 화살표 | ❌ (Day 13 relation_type 시각화 시 검토) |

### 캔버스

- `<svg>` 영역: `width: 100%`, `height: calc(100vh - <header>)`
- 배경: 흰색 (다크모드는 차후)
- `d3.zoom()` → React state로 transform 관리, `<g transform={...}>` 적용
- 줌 범위: `0.3x ~ 4x`
- 드래그(d3.drag) 시 노드 위치 고정(`fx/fy`) → 마우스 업 시 해제

### Drawer (`ConceptDetailDrawer`)

- 우측 슬라이드 인 (`width: 380px`, `transition: transform 200ms`)
- 닫기: 헤더 X 버튼 + Esc 키
- 콘텐츠:
  ```
  ┌────────────────────────────┐
  │ React Hooks            [X] │
  │ framework · familiar       │
  │ ────────────────────────── │
  │ 📖 19회 학습              │
  │                            │
  │ 학습 설명 (description)    │
  │ ────────────────────────── │
  │ 📝 관련 일기 (최신 10개)   │
  │ • 2026-04-23 useMemo 최적화 │
  │ • 2026-04-20 Hooks 깊이 이해 │
  │ ...                        │
  └────────────────────────────┘
  ```
- 일기 항목 클릭 → `router.push('/journal/' + entryId)`

---

## 🌱 빈 상태 UX (`MindmapEmptyState`)

`get_user_mindmap` 결과 nodes 0개일 때:

```
            🗺️
   아직 학습한 개념이 없어요

  일기를 작성하면 AI가 자동으로 개념을 추출해
  당신만의 학습 지도를 만들어줍니다.

         [ 일기 쓰러 가기 ]
```

`Link` → `/journal` (또는 `/journal/new` 가 있으면 그쪽)

---

## 🧭 진입 경로

`apps/devjournal/frontend/src/shared/config/navigation.ts`에 항목 추가:

```typescript
{
  href: '/mindmap',
  label: '마인드맵',
  icon: 'Map' /* 또는 LucideIcon: Network */,
}
```

순서: `홈` → `일기` → `개념` → **`마인드맵`** → (Day 14에서 `대시보드`)

---

## 🔄 데이터 흐름

```
[사용자] /mindmap 진입
   ↓
useMindmapQuery → GET /api/mindmap
   ↓
MindmapService.getUserMindmap(userId)
   ↓
supabase.rpc('get_user_mindmap', { p_user_id: userId })
   ↓
{ nodes, edges } 응답
   ↓
useMindmapSimulation(nodes, edges) → 좌표 계산
   ↓
<MindmapCanvas> SVG 렌더 (React)
   ↓
[노드 클릭] mindmapStore.selectConcept(id)
   ↓
useConceptDetailQuery(id, enabled) → GET /api/mindmap/concepts/:id
   ↓
<ConceptDetailDrawer> 슬라이드 인
   ↓
[관련 일기 클릭] router.push('/journal/' + entryId)
```

---

## ⚠️ 에러 처리

| 케이스                         | 처리                                                                        |
| ------------------------------ | --------------------------------------------------------------------------- |
| `get_user_mindmap` 빈 결과     | nodes/edges = `[]` → `<MindmapEmptyState>` 표시                             |
| `getConceptDetail` 본인 학습 X | BE: `404 NotFoundException` / FE: Drawer에 "개념을 찾을 수 없습니다" 토스트 |
| API 네트워크 실패              | TanStack Query `error` 상태 → 화면 중앙 에러 메시지 + 재시도 버튼           |
| D3 simulation 실행 중 unmount  | `useEffect` cleanup에서 `simulation.stop()`                                 |
| 노드 수 매우 많음 (예: 200+)   | Day 12 범위 외 (Day 13 검색/필터로 대응) — 일단 그대로 렌더                 |

---

## 🧪 테스트 & 검증

### 자동 테스트

- BE: 단위 테스트 인프라(jest) 미구축 → Day 12에서는 빌드 통과(타입 검증) + 수동 검증으로 대체
- FE: 본 작업에서는 단위 테스트 생략 (D3 비결정성 + 라우팅 모킹 비용 高). Day 13 검색/필터 로직부터 추가.

### 수동 검증 체크리스트

- [ ] 사이드바에서 "마인드맵" 메뉴 클릭 시 `/mindmap` 진입
- [ ] 학습 개념 0개인 신규 계정 로그인 시 `<MindmapEmptyState>` 표시
- [ ] 학습 개념이 있는 계정 진입 시 노드/엣지 렌더링
- [ ] 마우스 휠 줌 / 드래그 패닝 동작
- [ ] 노드 드래그 시 위치 변경, 손 떼면 시뮬레이션 재시작
- [ ] 노드 호버 시 stroke 두꺼워짐
- [ ] 노드 클릭 → 우측 Drawer 슬라이드 인 + 개념 상세 + 관련 일기 리스트
- [ ] 관련 일기 클릭 → `/journal/:id` 이동
- [ ] Esc / X 버튼으로 Drawer 닫기
- [ ] 빌드 통과 (`npm run build:devjournal-backend`, `npm run build:devjournal-frontend`)
- [ ] 린트 통과 (`npm run lint`)

---

## 📋 구현 태스크 (체크리스트)

### Backend (NX project: `devjournal-backend`)

- [ ] `mindmap/dto/mindmap-graph.dto.ts` 작성
- [ ] `mindmap/dto/concept-detail.dto.ts` 작성
- [ ] `mindmap/mindmap.service.ts` — `getUserMindmap`, `getConceptDetail`
- [ ] `mindmap/mindmap.controller.ts` — 2개 엔드포인트 + `SupabaseAuthGuard`
- [ ] `mindmap/mindmap.module.ts`
- [ ] `app.module.ts`에 `MindmapModule` 등록
- [ ] `npm run build:devjournal-backend` 통과 확인 (jest 인프라 미구축, 타입 검증으로 대체)

### Frontend (NX project: `devjournal-frontend`)

- [ ] `domains/mindmap/domain/{MindmapNode,MindmapEdge,ConceptDetail,categoryColors}.ts`
- [ ] `domains/mindmap/infrastructure/mindmapApi.ts`
- [ ] `domains/mindmap/application/{useMindmapQuery,useConceptDetailQuery,useMindmapSimulation,mindmapStore}.ts`
- [ ] `domains/mindmap/presentation/MindmapPageView.tsx`
- [ ] `domains/mindmap/presentation/MindmapCanvas.tsx`
- [ ] `domains/mindmap/presentation/MindmapNodeView.tsx`
- [ ] `domains/mindmap/presentation/MindmapEdgeView.tsx`
- [ ] `domains/mindmap/presentation/ConceptDetailDrawer.tsx`
- [ ] `domains/mindmap/presentation/MindmapEmptyState.tsx`
- [ ] 4개 레이어 `index.ts` barrel export 채우기
- [ ] `app/mindmap/page.tsx` (얇은 진입점)
- [ ] `shared/config/navigation.ts` 메뉴 항목 추가
- [ ] 루트 `package.json`에 `d3` (dependencies) + `@types/d3` (devDependencies) 추가 (모노레포 단일 package.json)
- [ ] dev 서버에서 수동 검증 체크리스트 통과

### 마무리

- [ ] `docs/work-logs/2026-04-25-feature-devjournal-day12-mindmap.md` 작성
- [ ] PR 생성 (base: `develop`, title: `feat(devjournal): Day 12 — 마인드맵 D3 시각화 + ConceptDetailDrawer`)

---

## 🚫 Day 13 분리 사항 (의도적 미포함)

본 작업에서는 다음을 **하지 않는다.** Day 13 또는 그 이후로 미룬다.

- 검색 박스 / 카테고리 필터 / mastery 필터
- 이웃 노드 강조(neighbor highlight) 인터랙션
- 줌 to fit 버튼
- relation_type 별 엣지 시각화 (색상/대시 등)
- Tool 3 `build_mindmap` Claude 함수 + SSE `mindmap_updated` 이벤트
- 일기 작성 시 마인드맵 실시간 갱신 (델타 머지)
- 타인/공개 마인드맵 (Day 15 Blog 단계)
- 다크모드

---

## 🔗 관련 문서 / 마이그레이션

- `docs/devjournal-plan.md` Day 12-13 라인 (656~662)
- `apps/devjournal/supabase/migrations/20260405000011_functions.sql` — `get_user_mindmap`
- `apps/devjournal/backend/src/supabase/database.types.ts` — `get_user_mindmap` 타입
- `apps/devjournal/backend/src/concepts/concepts.service.ts` — Drawer 데이터 소스 참고
- `apps/devjournal/frontend/src/domains/journal/` — DDD 4 레이어 구조 참고
