# 마인드맵 검색 + 카테고리/mastery 필터

> **목표:** Day 13 마인드맵 위에 검색 박스 + 카테고리/mastery 칩 필터를 더해 "사용성 마무리" 단계를 완성한다. Day 14 Dashboard 진입 전 브릿지 작업.
> **작성일:** 2026-04-26
> **선행:** Day 13 마인드맵 새로고침 + 최근 개념 강조 + 인터랙션 (PR #71)
> **후속:** Day 14 Dashboard

---

## 🎯 핵심 결정 사항

| 항목                   | 결정                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| 스코프                 | **검색 + 카테고리 필터 + mastery 필터** (Day 13 분리 항목 중 사용성 직접 영향 분만)      |
| 비매칭 노드 시각       | **페이드** (opacity 0.1) — 호버 강조와 일관 / 그래프 구조 유지                           |
| 검색 매칭 범위         | **노드 이름만** (`name.toLowerCase().includes(query.toLowerCase())`)                     |
| 결합 로직              | **검색 AND 카테고리(체크된 것 OR) AND mastery(체크된 것 OR)**, 0개 칩 = 해당 그룹 비활성 |
| UI 위치                | **좌상단 헤더 아래 패널** (`MindmapFilterPanel` absolute) — 위치 변경 시 한 파일만 수정  |
| 페이드 합성            | 단순 OR — 필터 비매칭 OR 호버 비이웃 둘 중 하나만 만족해도 페이드 (단계 분리 X)          |
| 페이드된 노드 인터랙션 | **그대로** — pointer-events 변경 X, 클릭/호버 가능                                       |
| `is_recent` ring       | **페이드와 직교** — opacity는 흐려져도 stroke 색상은 유지                                |
| 빈 결과                | 패널 하단 카운트 텍스트가 빨간색으로 변함. 캔버스 중앙 토스트 X                          |
| **별도 day로 분리**    | aliases 검색 / 클러스터 그룹핑 / 같은 entry 자동 약한 연결 / relation_type 색상 분화     |

---

## 🏗️ 아키텍처

### 책임 분담 (DDD 4 레이어 일관)

| 레이어       | 파일                               | 책임                                            |
| ------------ | ---------------------------------- | ----------------------------------------------- |
| application  | `mindmapStore.ts`                  | 필터 **상태** (`searchQuery` / 칩 Set / 액션)   |
| application  | `useMindmapFilterMatch.ts` ⭐ 신규 | 필터 **로직** (매칭 Set 계산 — `null` = 비활성) |
| presentation | `MindmapFilterPanel.tsx` ⭐ 신규   | 필터 **UI** (검색 input + 칩 + 카운트 + 초기화) |
| presentation | `MindmapCanvas.tsx`                | 매칭 결과를 **시각** 적용 (페이드 합성)         |
| presentation | `MindmapPageView.tsx`              | `<MindmapFilterPanel />` 마운트                 |

→ 각 단위가 한 가지 책임. 변경 영향 한 파일에 갇힘.

### 컴포넌트 트리

```
MindmapPageView
 ├─ <header> ........................ 기존 (좌상단 absolute)
 ├─ <MindmapFilterPanel /> .......... 신규 (좌상단 absolute, 헤더 아래)
 ├─ <MindmapCanvas>
 │    └─ useMindmapFilterMatch(nodes) → matchedIds: Set<string> | null
 │    └─ MindmapNodeView (isFaded 합성)
 │    └─ MindmapEdgeView (isFaded 합성)
 │    └─ <MindmapToolbar /> ......... 기존 (우상단)
 └─ <ConceptDetailDrawer /> ......... 기존
```

---

## 🗂️ 상태 설계 (`mindmapStore.ts`)

```typescript
import type { MasteryLevel } from '@devjournal/types';

interface MindmapStore {
  // 기존 — Drawer / 호버 상태
  selectedConceptId: string | null;
  selectConcept(id: string | null): void;
  hoveredNodeId: string | null;
  setHovered(id: string | null): void;
  hoveredEdgeKey: string | null;
  setHoveredEdge(key: string | null): void;

  // 신규 — 검색·필터 상태
  searchQuery: string;
  setSearch(query: string): void;

  categoryFilters: Set<string>;
  toggleCategory(category: string): void;

  masteryFilters: Set<MasteryLevel>;
  toggleMastery(level: MasteryLevel): void;

  clearFilters(): void;
}
```

`Set<string>` 사용 이유: 빠른 has() 체크 + toggle 시 add/delete 단순.

`clearFilters()` — 검색어/칩 둘 다 초기화.

---

## 🎯 매칭 로직 (`useMindmapFilterMatch.ts` 신규)

```typescript
import { useMemo } from 'react';
import type { MyMindmapNode } from '@devjournal/types';
import { useMindmapStore } from './mindmapStore';

export interface MindmapFilterMatchResult {
  matchedIds: Set<string> | null; // null = 필터 비활성 = 모두 매칭
  total: number;
  matched: number; // null일 땐 total과 동일
}

export function useMindmapFilterMatch(
  nodes: MyMindmapNode[],
): MindmapFilterMatchResult {
  const searchQuery = useMindmapStore((s) => s.searchQuery);
  const categoryFilters = useMindmapStore((s) => s.categoryFilters);
  const masteryFilters = useMindmapStore((s) => s.masteryFilters);

  return useMemo(() => {
    const allInactive =
      !searchQuery && categoryFilters.size === 0 && masteryFilters.size === 0;

    if (allInactive) {
      return { matchedIds: null, total: nodes.length, matched: nodes.length };
    }

    const q = searchQuery.toLowerCase();
    const matchedIds = new Set(
      nodes
        .filter((n) => matches(n, q, categoryFilters, masteryFilters))
        .map((n) => n.id),
    );
    return { matchedIds, total: nodes.length, matched: matchedIds.size };
  }, [nodes, searchQuery, categoryFilters, masteryFilters]);
}

function matches(
  node: MyMindmapNode,
  query: string,
  categories: Set<string>,
  mastery: Set<string>,
): boolean {
  if (query && !node.name.toLowerCase().includes(query)) return false;
  if (categories.size > 0 && !categories.has(node.category)) return false;
  if (mastery.size > 0 && !mastery.has(node.mastery)) return false;
  return true;
}
```

---

## 🎨 시각 합성 (`MindmapCanvas.tsx`)

### 페이드 합성

```typescript
const { matchedIds } = useMindmapFilterMatch(nodes);

// 노드
const isFiltered = matchedIds !== null && !matchedIds.has(node.id);
const isOutOfHover = neighbors !== null && !neighbors.has(node.id);
const isFaded = isFiltered || isOutOfHover;

// 엣지 (양 끝점 모두 살아있어야 정상)
const bothEndpointsMatched =
  matchedIds === null || (matchedIds.has(sourceId) && matchedIds.has(targetId));
const bothEndpointsInHover =
  neighbors === null || (neighbors.has(sourceId) && neighbors.has(targetId));
const isEdgeFaded = !bothEndpointsMatched || !bothEndpointsInHover;
```

기존 `MindmapNodeView` / `MindmapEdgeView`의 `isFaded` prop 그대로 사용 → 시각 처리 변경 0.

---

## 🎨 UI 디자인 (`MindmapFilterPanel.tsx` 신규)

### 레이아웃

```
┌─────────────────────────────────────────┐
│ 🔍 [개념명 검색...                  ]   │
│                                         │
│ 카테고리                                │
│ [language] [framework] [pattern]        │
│ [principle] [tool] [concept]            │
│                                         │
│ 숙련도                                  │
│ [learning] [familiar] [mastered]        │
│                                         │
│ 12 / 45 노드 매칭 · 초기화              │
└─────────────────────────────────────────┘
```

### 스타일

- 위치: `absolute top-16 left-6 z-10`
- 컨테이너: `bg-white/90 backdrop-blur-sm rounded-md shadow-sm border border-gray-200 p-3 max-w-[320px]`
- 검색 input: `border border-gray-200 rounded px-3 py-1.5 text-sm w-full`
- 칩 (활성): `bg-{categoryColor} text-white px-2 py-1 text-xs rounded-full` (카테고리는 색상, mastery는 단순)
- 칩 (비활성): `border border-gray-200 text-gray-600 px-2 py-1 text-xs rounded-full hover:bg-gray-50`
- 카운트 텍스트: 매칭 > 0 → `text-gray-500 text-xs` / 매칭 == 0 → `text-red-600 text-xs`
- 초기화 텍스트 버튼: 활성 필터 있을 때만 표시, `text-blue-600 text-xs underline cursor-pointer`

### 카테고리 칩 색상 매핑

`domain/categoryColors.ts`의 `getCategoryColor(category)` 재활용. 활성 칩 fill을 같은 색상으로 → 노드 색상과 시각 일관.

### Mastery 칩

| 레벨     | 활성 색상                  |
| -------- | -------------------------- |
| learning | 회색 fill (`bg-gray-500`)  |
| familiar | 파랑 fill (`bg-blue-500`)  |
| mastered | 초록 fill (`bg-green-500`) |

---

## 🚨 에러 처리 / 엣지 케이스

| 시나리오                     | 처리                                                           |
| ---------------------------- | -------------------------------------------------------------- |
| 노드 0개                     | 패널 자체를 표시하지 않음 (`MindmapEmptyState`가 떠 있는 상태) |
| 검색어만 입력 + 매칭 0개     | 모든 노드 페이드, 카운트 빨간색 "0 / N 노드 매칭"              |
| 카테고리/mastery 칩 0개 체크 | 해당 그룹 비활성 (필터에 영향 없음)                            |
| 모든 필터 비활성             | `matchedIds = null` → 모든 노드 정상                           |
| 입력 도중 (typing) 페이드    | useMemo 의존성으로 자동 갱신 — debounce 안 함 (입력 부담 미미) |

---

## 📋 작업 순서 (체크리스트)

### Phase 1 — 상태 + 로직

- [ ] `mindmapStore.ts` 확장 — `searchQuery` / `categoryFilters` / `masteryFilters` / 액션
- [ ] `useMindmapFilterMatch.ts` 신규 작성
- [ ] `application/index.ts` 에 export 추가

### Phase 2 — UI 패널

- [ ] `MindmapFilterPanel.tsx` 신규 작성
- [ ] 카테고리/mastery 칩 컴포넌트 (인라인 또는 작은 헬퍼)
- [ ] 카운트 + 초기화 버튼
- [ ] `presentation/index.ts` 에 export 추가

### Phase 3 — 시각 적용

- [ ] `MindmapCanvas.tsx` — `useMindmapFilterMatch` 호출 + 노드/엣지 isFaded 합성
- [ ] `MindmapPageView.tsx` — `<MindmapFilterPanel />` 마운트

### Phase 4 — 검증 및 PR

- [ ] `npm run build:devjournal-frontend` 통과 (BE 변경 없음)
- [ ] `npx nx lint devjournal-frontend --fix` 통과
- [ ] 수동 검증 시나리오 (아래)
- [ ] 작업 일지 작성
- [ ] PR 생성 (base: develop)

---

## ✅ 검증 방법

### 자동 검증

- ✅ `npm run build:devjournal-frontend`
- ✅ `npx nx lint devjournal-frontend --fix`

### 수동 검증 시나리오

| 시나리오                        | 기대 동작                                                               |
| ------------------------------- | ----------------------------------------------------------------------- |
| 검색어 "ob" 입력                | "Observable" / "Observer 패턴" 등 매칭, 비매칭 노드 페이드, 카운트 갱신 |
| 카테고리 "framework" 칩 클릭    | framework 노드만 정상, 나머지 페이드                                    |
| "framework" + "tool" 동시 클릭  | 둘 중 하나라도 해당하는 노드 정상 (그룹 내 OR)                          |
| 검색 + 카테고리 동시            | 검색 매칭 ∩ 카테고리 매칭 노드만 정상 (그룹 간 AND)                     |
| mastery "learning" 칩 클릭      | learning 노드만 정상                                                    |
| 매칭 0개 시 카운트 색상         | 빨간색으로 "0 / N 노드 매칭"                                            |
| 활성 필터 있을 때 "초기화" 클릭 | 모든 칩/검색어 비움, 그래프 정상 복원                                   |
| 호버 + 필터 동시                | 두 페이드 모두 적용 (둘 중 하나만 페이드여도 흐려짐)                    |
| 페이드된 노드 클릭              | Drawer 정상 열림 (pointer-events 유지)                                  |

---

## 🚫 의도적 미포함 (별도 day로 분리)

- aliases 검색 (concepts.aliases 노출 + 매칭 확장) — RPC + 타입 변경 동반
- 클러스터 자동 그룹핑 (B-1)
- 같은 entry 새 개념끼리 자동 약한 연결 (Tool 2 한계 보완)
- relation_type별 색상/대시 분화
- 다크모드
- 검색 history / 자주 쓴 필터 저장
- 키보드 단축키 (Cmd+K 검색 포커스 등)

---

## 🔗 관련 문서

- 본 spec의 브레인스토밍 합의 출처: 2026-04-26 대화
- `docs/devjournal-day13-plan.md` — 선행 작업 (Day 13)
- `docs/work-logs/2026-04-26-feature-devjournal-day13-...md` — Day 13 작업 일지
- 카테고리 색상: `apps/devjournal/frontend/src/domains/mindmap/domain/categoryColors.ts`
