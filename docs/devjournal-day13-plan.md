# Day 13 — Mindmap 새로고침 + 최근 개념 강조 + 인터랙션 (이웃 강조 / 줌-fit / 엣지 호버 라벨)

> **목표:** 일기 분석 결과가 마인드맵에 자연스럽게 반영되도록 새로고침 버튼 + "마지막 일기로 처음 등장한 개념" 강조를 도입하고, 마인드맵 시각 인터랙션 일부(이웃 강조 · 줌-fit · 엣지 호버 라벨)를 추가한다.
> **작성일:** 2026-04-26
> **선행:** Day 12 마인드맵 D3 시각화 + ConceptDetailDrawer (PR #70) 완료
> **후속:** 별도 day로 분리 — 검색 박스 / 카테고리·mastery 필터 / 클러스터 그룹핑 / 다크모드 / 같은 entry 개념 자동 약한 연결

---

## 🎯 핵심 결정 사항

| 항목                  | 결정                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| Tool 3 처리           | **폐기**. 원안 `build_mindmap`은 Tool 1+2 결과 + DB 쿼리로 100% 만들 수 있어 LLM 호출이 잉여   |
| 분석 후 마인드맵 갱신 | **단순 새로고침 + 최근 개념 강조**. SSE 자동 머지/델타 푸시 폐기 (가치 대비 복잡도 과다)       |
| "최근 개념" 정의      | **사용자의 가장 최근 일기로 `first_seen`된 개념**. RPC가 `is_recent: boolean` 으로 전달        |
| 시각 강조             | orange ring + 부드러운 stroke pulse                                                            |
| 신규 노드 추적        | `user_concepts.first_seen_entry_id` 컬럼 신설 + 백필                                           |
| 엣지 시각화           | **단일 스타일 + strength 두께 + 호버 라벨**. relation_type별 색상 분화는 enum 안정화 후 별 day |
| 이웃 강조 범위        | **1-hop만** (2-hop은 노드 100개 시 시각 노이즈)                                                |
| **별도 day로 분리**   | 검색 박스 / 카테고리·mastery 필터 / 클러스터 그룹핑 / 다크모드 / 변화 스토리 / jest 셋업       |

---

## 🧐 왜 SSE 자동 머지를 폐기했나

원안의 SSE 기반 실시간 델타 머지는 다음 조합이라 복잡도가 지나치게 컸다:

1. BE Step 3에서 신규 노드/엣지 SELECT → SSE `mindmap_updated` 발화
2. FE `useMindmapSSE` 훅 + sessionStorage 활성 entry 추적
3. React Query 캐시에 델타 머지 + 정합성 체크 + 안전망 refetch

**실제 검증 결과:**

- 다른 페이지에서 분석 끝난 후 마인드맵 페이지 진입 시 React Query staleTime 5분 캐시 때문에 갱신 안 됨 → invalidate 추가 → 그래도 캐시 갱신 사각지대 발생
- 사용자 가치는 "분석 결과를 마인드맵에서 본다"는 것뿐, 실시간 델타 머지의 시각적 가치는 미미
- "마지막 일기로 처음 등장한 개념" 강조 + 새로고침 버튼만으로 동일한 가치를 단순하게 달성 가능

→ **단순화로 피벗.** 인프라 부담은 사라지고 사용자 가치는 동일.

---

## 🧐 왜 Tool 3을 폐기했나

원안의 `build_mindmap` Tool은 Tool 1+2가 만든 데이터를 LLM에 다시 던지고 그대로 받는 구조라 **새로 결정되는 정보가 없음**:

| 출력 필드          | 누가 결정?                      | LLM 필요? |
| ------------------ | ------------------------------- | --------- |
| `nodes[].id/label` | DB 그대로                       | ❌        |
| `nodes[].category` | Tool 1이 이미 결정              | ❌        |
| `nodes[].weight`   | `review_count` 기반 공식        | ❌        |
| `nodes[].is_new`   | `first_seen_entry_id` 비교      | ❌        |
| `links[]` 전부     | Tool 2가 이미 결정              | ❌        |
| `layout_hint`      | LLM이 던지면 그래프 안정성 흔듦 | ⚠️        |

→ Claude API 호출 1회 추가 = 비용·지연·실패 위험만 증가, 새 정보 0건. **마인드맵 갱신은 GET only.**

---

## 📦 현재 상태 (Day 12 완료 기준)

| 항목                                 | 상태                                                                  |
| ------------------------------------ | --------------------------------------------------------------------- |
| BE `mindmap` 모듈                    | ✅ Day 12 — controller/service/DTO 완성. `is_recent` 매핑만 추가 필요 |
| BE `journal.service.ts` SSE 인프라   | ✅ Day 10 — Step 1·2·4 발화 그대로. Step 3 추가 안 함                 |
| BE `concepts.service.ts upsertBatch` | ⚠️ `first_seen_entry_id` 세팅 로직 추가 필요                          |
| BE `get_user_mindmap` RPC            | ⚠️ `is_recent` 필드 반환하도록 수정 필요                              |
| FE `domains/mindmap/{4 layers}`      | ✅ Day 12 — Canvas/Node/Edge/Drawer 등 완성                           |
| FE `useMindmapSimulation`            | ⚠️ 사용자 좌표 보존 + `is_recent` 동기화 패턴으로 리팩토링            |
| FE `mindmapStore`                    | ⚠️ `hoveredNodeId` / `hoveredEdgeKey` 추가                            |
| FE `MindmapToolbar`                  | ❌ **신규 작성** (줌-fit + 새로고침)                                  |
| 공유 타입 `MyMindmapNode.is_recent`  | ❌ 추가                                                               |
| `user_concepts.first_seen_entry_id`  | ❌ **마이그레이션 신규 작성** + 백필                                  |

---

## 🗄️ 데이터베이스 마이그레이션

### `20260426000014_user_concepts_first_seen.sql`

```sql
-- 1. 컬럼 추가
alter table user_concepts
  add column first_seen_entry_id uuid
  references entries(id) on delete set null;

-- 2. 기존 데이터 백필 — 가장 오래된 entry 기준 (entry_concepts에 created_at 없어 entries.created_at JOIN)
update user_concepts uc
set first_seen_entry_id = sub.first_entry_id
from (
  select e.user_id, ec.concept_id,
         (array_agg(ec.entry_id order by e.created_at asc))[1] as first_entry_id
  from entry_concepts ec
  join entries e on e.id = ec.entry_id
  group by e.user_id, ec.concept_id
) sub
where uc.user_id = sub.user_id
  and uc.concept_id = sub.concept_id;

-- 3. 인덱스
create index user_concepts_first_seen_idx
  on user_concepts(user_id, first_seen_entry_id);
```

### `20260426000015_get_user_mindmap_is_recent.sql`

`get_user_mindmap` RPC가 사용자의 가장 최근 일기로 `first_seen`된 노드를 `is_recent=true`로 표시하도록 수정. 단일 RPC 호출로 처리 (별도 API X).

```sql
create or replace function get_user_mindmap(p_user_id uuid)
returns json language plpgsql security definer as $$
declare
  result json;
  v_latest_entry_id uuid;
begin
  select id into v_latest_entry_id
  from entries
  where user_id = p_user_id and deleted_at is null
  order by created_at desc
  limit 1;

  select json_build_object(
    'nodes', (
      select coalesce(json_agg(json_build_object(
        'id', c.id, 'name', c.name, 'category', c.category,
        'mastery', uc.mastery_level, 'review_count', uc.review_count,
        'is_recent', (
          v_latest_entry_id is not null
          and uc.first_seen_entry_id is not null
          and uc.first_seen_entry_id = v_latest_entry_id
        )
      )), '[]'::json)
      from user_concepts uc join concepts c on c.id = uc.concept_id
      where uc.user_id = p_user_id
    ),
    'edges', (
      select coalesce(json_agg(json_build_object(
        'from', conn.from_id, 'to', conn.to_id,
        'strength', conn.strength, 'type', conn.relation_type
      )), '[]'::json)
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

## 🔧 Backend 설계

### `concepts.service.ts upsertBatch` — `first_seen_entry_id` 세팅

```typescript
const userConceptRows = allConceptIds.map((conceptId) => ({
  user_id: userId,
  concept_id: conceptId,
  mastery_level: 'learning',
  first_seen_entry_id: entryId, // ← 추가
}));
```

`upsert` + `ignoreDuplicates: true` 덕분에 신규 row에만 `first_seen_entry_id`가 세팅되고 기존 row는 보존된다.

### `mindmap.service.ts normalizeGraph` — `is_recent` 매핑

```typescript
const nodes: MindmapNodeDto[] = (raw?.nodes ?? []).map((node) => ({
  id: node.id,
  name: node.name,
  category: node.category,
  mastery: this.coerceMastery(node.mastery),
  review_count: node.review_count ?? 0,
  is_recent: node.is_recent ?? false, // ← 추가
}));
```

### `MindmapNodeDto` 확장

```typescript
export interface MindmapNodeDto {
  id: string;
  name: string;
  category: string;
  mastery: MasteryLevel;
  review_count: number;
  is_recent: boolean; // ← 추가
}
```

---

## 🎨 Frontend 설계

### `MyMindmapNode` 타입 확장 (공유 패키지)

```typescript
export interface MyMindmapNode {
  id: string;
  name: string;
  category: string;
  mastery: MasteryLevel;
  review_count: number;
  is_recent: boolean; // ← 추가
}
```

### `useMindmapSimulation` 리팩토링

기존: nodes prop이 변하면 simulation 재생성 → 모든 좌표 리셋, 사용자 드래그 위치 사라짐.

신규: simulation 인스턴스를 **한 번만 생성**, nodes 변경 시 nodes()/links() 만 업데이트.

- 새 노드: `nodesMapRef.current` Map에 추가, 이웃 노드 좌표 평균에서 시작
- 사라진 노드: Map에서 제거
- 기존 노드: 좌표·fx·fy 유지, **메타(name/category/mastery/review_count/is_recent/radius)만 동기화**
- `simulation.alpha(0.3).restart()` — 부드러운 reheat
- 사용자 드래그(`fx`/`fy`) 위치 새로고침 후에도 보존
- force 파라미터: `CHARGE -150`, `LINK_DISTANCE 100~240`, `COLLIDE_PADDING 8`

### `mindmapStore` — 인터랙션 상태만

```typescript
interface MindmapStore {
  selectedConceptId: string | null;
  selectConcept(id: string | null): void;

  hoveredNodeId: string | null;
  setHovered(id: string | null): void;

  hoveredEdgeKey: string | null;
  setHoveredEdge(key: string | null): void;
}
```

> `newNodeIds` / `markNew` / `clearNew` 같은 SSE 머지 관련 상태는 도입하지 않는다.

### `MindmapNodeView` — `is_recent` 시각 강조

- `node.is_recent === true` → orange stroke (`#f59e0b`) + `mindmap-node-pulse` className (1.2s ease-in-out infinite stroke-opacity 깜빡)
- 1-hop 이웃 강조와 호환: `isFaded` opacity 토글 위에 stroke 색상 별도 적용

### `MindmapEdgeView` — strength 두께 + 호버 라벨

- `strokeWidth: 1 + strength * 2`
- 호버 시 캔버스 absolute layer에 `relation_type + 강도` 라벨

### `MindmapCanvas` — 호버 강조 + 줌-fit

- `hoveredNodeId` 기준 1-hop neighbor Set 계산
- 노드/엣지 className 토글 (opacity 0.15 / 1.0)
- 줌-fit: bounding box 계산 → `d3.zoomIdentity` 0.5s 트랜지션

### `MindmapToolbar` — 줌-fit + 새로고침 버튼

- 캔버스 우상단 absolute, 두 버튼 가로 배치
- 새로고침 버튼: `onRefresh` (= `useMindmapQuery.refetch`) 호출, `isRefreshing` 시 disabled + 스피너 텍스트

### `MindmapPageView`

- `useMindmapQuery` 의 `refetch` / `isFetching` 을 `MindmapCanvas` 에 전달

---

## 🚨 에러 처리

| 시나리오                                   | 처리                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------- |
| 분석 실패 (`step_failed`)                  | 마인드맵 영향 없음. 기존 그래프 유지. 분석 페이지 토스트는 기존 로직 |
| 마이그레이션 중 외래키/RLS 충돌            | 트랜잭션 안에 백필. 실패 시 롤백                                     |
| RPC 실패                                   | `useMindmapQuery` 에러 → 마인드맵 페이지에 "다시 시도" 버튼 노출     |
| 가장 최근 entry 없을 때 (entries 0개)      | `v_latest_entry_id IS NULL` → 모든 노드 `is_recent=false` (정상)     |
| `first_seen_entry_id` NULL인 백필 누락 row | `is_recent` 비교 false (정상)                                        |

---

## ✅ 검증 방법

> Day 12 패턴 따라 jest 셋업 도입은 별도 작업. 본 작업에서는 빌드 + 수동 검증.

### 자동 검증

- ✅ `npm run build:devjournal-backend` 빌드 통과
- ✅ `npm run build:devjournal-frontend` 빌드 통과
- ✅ `npx nx lint devjournal-frontend --fix` 통과

### 수동 검증 시나리오

| 시나리오                                             | 기대 동작                                                 |
| ---------------------------------------------------- | --------------------------------------------------------- |
| 데이터 비운 후 첫 일기 작성 → 마인드맵 페이지 진입   | 모든 노드 orange ring + pulse                             |
| 두 번째 일기 작성 → 새로고침 버튼 클릭               | 새 노드만 ring + pulse, 첫 일기 노드는 일반 stroke로 복원 |
| 분석 끝난 후 마인드맵 페이지 진입 시 변화 안 보일 때 | 우상단 🔄 새로고침 버튼 → 새 GET 호출 → 변화 반영         |
| 노드 호버                                            | 자기 + 1-hop 이웃 강조, 나머지 페이드 (opacity 0.15)      |
| 노드 클릭                                            | Drawer 열림 + 강조 유지                                   |
| 줌-fit 버튼                                          | 모든 노드 화면 안에 들어오도록 0.5s 트랜지션              |
| 엣지 호버                                            | relation_type + strength 라벨 표시                        |
| 사용자가 노드 드래그로 옮긴 후 새로고침              | 옮긴 노드 위치 유지, 새 노드만 추가                       |

---

## 🚫 의도적 미포함 (별도 day로 분리)

- 검색 박스 (개념명 검색)
- 카테고리 필터 / mastery 필터
- relation_type별 색상/대시 분화 (enum 안정화 후)
- 클러스터 자동 그룹핑 (B-1)
- 같은 entry 새 개념끼리 자동 약한 연결 (Tool 2 한계 해소)
- 마인드맵 변화 스토리 (Claude 자연어 피드백)
- 다크모드 + 디자인 토큰 정리
- jest 셋업 도입 (devjournal-backend `test` target 신설)
- SSE 자동 머지 / 실시간 델타 푸시

---

## 🔗 관련 문서

- 본 spec의 브레인스토밍 합의 출처: 2026-04-26 대화
- `docs/devjournal-plan.md` Day 12-13 (656~662 라인)
- `docs/devjournal-day12-plan.md` (선행 — 마인드맵 골격)
- 마이그레이션 베이스: `apps/devjournal/supabase/migrations/20260405000007_user_concepts.sql`, `20260405000011_functions.sql`
- 공유 타입: `apps/devjournal/types/index.ts` `MyMindmapNode.is_recent`
