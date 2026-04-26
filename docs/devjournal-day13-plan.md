# Day 13 — Mindmap 델타 머지 + 인터랙션 (이웃 강조 / 줌-fit / 엣지 호버 라벨)

> **목표:** 일기 분석이 끝나는 즉시 마인드맵에 새 노드/엣지가 부드럽게 추가되도록 SSE 기반 델타 머지 파이프라인을 완성하고, 마인드맵 시각 인터랙션 일부(이웃 강조 · 줌-fit · 엣지 호버 라벨)를 추가한다.
> **작성일:** 2026-04-26
> **선행:** Day 12 마인드맵 D3 시각화 + ConceptDetailDrawer (PR #70) 완료
> **후속:** 별도 day로 분리 — B-2 변화 스토리 / 검색 박스 / 카테고리·mastery 필터 / 클러스터 그룹핑 / 다크모드

---

## 🎯 핵심 결정 사항

| 항목                | 결정                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| Tool 3 처리         | **폐기**. 원안 `build_mindmap`은 Tool 1+2 결과 + DB 쿼리로 100% 만들 수 있어 LLM 호출이 잉여    |
| Step 3 재정의       | `MindmapService.computeDelta()` — Claude 호출 X, DB SELECT만으로 신규 nodes/edges 추출          |
| SSE 채널            | **기존 `/api/journal/:id/analysis` 재사용**. `mindmap_updated` 이벤트 추가 (타입은 이미 정의됨) |
| FE 구독 추적        | **sessionStorage 기반**. BE `/active-analysis` 엔드포인트 신설 X                                |
| 신규 노드 정의      | "이 사용자에게 처음 등장한 concept" — `user_concepts.first_seen_entry_id` 컬럼 신설 + 백필      |
| 엣지 시각화         | **단일 스타일 + strength 두께 + 호버 라벨**. relation_type별 색상 분화는 enum 안정화 후 별 day  |
| 이웃 강조 범위      | **1-hop만** (2-hop은 노드 100개 시 시각 노이즈)                                                 |
| **별도 day로 분리** | B-2 변화 스토리 / 검색 박스 / 카테고리·mastery 필터 / 클러스터 그룹핑 / 다크모드 / jest 셋업    |

---

## 🧐 왜 Tool 3을 폐기하나

원안의 `build_mindmap` Tool은 Tool 1+2가 만든 데이터를 LLM에 다시 던지고 그대로 받는 구조라 **새로 결정되는 정보가 없음**:

| 출력 필드          | 누가 결정?                      | LLM 필요? |
| ------------------ | ------------------------------- | --------- |
| `nodes[].id/label` | DB 그대로                       | ❌        |
| `nodes[].category` | Tool 1이 이미 결정              | ❌        |
| `nodes[].weight`   | `review_count` 기반 공식        | ❌        |
| `nodes[].is_new`   | DB 비교                         | ❌        |
| `nodes[].group`    | category or Tool 2 cluster      | ❌        |
| `links[]` 전부     | Tool 2가 이미 결정              | ❌        |
| `center_node_id`   | Tool 1의 `primary_topic` 그대로 | ❌        |
| `layout_hint`      | LLM이 던지면 그래프 안정성 흔듦 | ⚠️        |

→ Claude API 호출 1회 추가 = 비용·지연·실패 위험만 증가, 새 정보 0건. **Step 3은 DB only.**

---

## 📦 현재 상태 (Day 12 완료 기준)

| 항목                                           | 상태                                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------------- |
| BE `mindmap` 모듈                              | ✅ Day 12에서 controller/service/DTO 완성 — `computeDelta` 메서드만 추가하면 됨 |
| BE `journal.service.ts` SSE 인프라             | ✅ Day 10 — `analysisSubjects: Map<entryId, Subject<MessageEvent>>` + TTL 30분  |
| BE `runAnalysisPipeline`                       | ✅ Step 1·2·4 발화 완료. Step 3 한 줄 호출 추가 필요                            |
| BE `concepts.service.ts upsertBatch`           | ⚠️ `first_seen_entry_id` 세팅 로직 추가 필요                                    |
| FE `domains/mindmap/{4 layers}`                | ✅ Day 12에서 Canvas/Node/Edge/Drawer 등 완성                                   |
| FE `useMindmapSSE` 훅                          | ❌ **신규 작성**                                                                |
| FE `mindmapStore`                              | ⚠️ `mergeDelta`/`hoveredNodeId`/`selectedNodeId`/`totalNodeCount` 추가 필요     |
| FE `MindmapToolbar` (ZoomFit)                  | ❌ **신규 작성**                                                                |
| FE 일기 작성/분석 페이지 — sessionStorage 세팅 | ❌ 분석 시작 시 `setItem`, `analysis_complete` 시 `removeItem` 추가             |
| 공유 타입 `SSEMindmapUpdatedData`              | ✅ Day 10에 미리 정의됨 (`types/index.ts`)                                      |
| `user_concepts.first_seen_entry_id`            | ❌ **마이그레이션 신규 작성** + 기존 데이터 백필                                |

---

## 🗄️ 데이터베이스 마이그레이션

### `2026XXXXXXXXXX_user_concepts_first_seen.sql`

```sql
-- 1. 컬럼 추가
alter table user_concepts
  add column first_seen_entry_id uuid
  references entries(id) on delete set null;

-- 2. 기존 데이터 백필 — 가장 오래된 entry_concepts 기준
update user_concepts uc
set first_seen_entry_id = sub.entry_id
from (
  select ec.user_id, ec.concept_id, ec.entry_id,
         row_number() over (
           partition by ec.user_id, ec.concept_id
           order by ec.created_at asc
         ) as rn
  from entry_concepts ec
) sub
where uc.user_id = sub.user_id
  and uc.concept_id = sub.concept_id
  and sub.rn = 1;

-- 3. 인덱스 (델타 추출 쿼리 최적화)
create index user_concepts_first_seen_idx
  on user_concepts(user_id, first_seen_entry_id);
```

> **주의:** 마이그레이션 적용 후 `database.types.ts` 재생성 필요 (`mcp__supabase__generate_typescript_types`).

---

## 🔧 Backend 설계

### `mindmap.service.ts` — `computeDelta` / `countUserNodes` 추가

```typescript
async computeDelta(
  entryId: string,
  userId: string,
  analysisStartedAt: Date,
): Promise<{ nodes: MyMindmapNode[]; links: MyMindmapEdge[] }> {
  // 신규 노드: 이번 entry로 user_concepts에 처음 등록된 concept
  const { data: nodes } = await this.supabase.rpc('rpc_or_select', { ... });
  // SELECT c.id, c.name, c.category, uc.review_count, uc.mastery_level
  // FROM user_concepts uc JOIN concepts c ON c.id = uc.concept_id
  // WHERE uc.user_id = $userId AND uc.first_seen_entry_id = $entryId

  // 신규 엣지: 이번 분석으로 만들어진 connection
  const { data: links } = await this.supabase.from('concept_connections')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', analysisStartedAt.toISOString());

  return { nodes: this.normalizeNodes(nodes), links: this.normalizeEdges(links) };
}

async countUserNodes(userId: string): Promise<number> {
  const { count } = await this.supabase.from('user_concepts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  return count ?? 0;
}
```

### `journal.service.ts` — Step 3 발화 추가

`runAnalysisPipeline()` (또는 동등한 함수) 안 Step 2 끝난 직후, Step 4 `analysis_complete` 직전에:

```typescript
// Step 2 끝 (기존)
this.emitSse(entryId, 'connections_found', { connections });

// Step 3 신규 ⭐
const delta = await this.mindmapService.computeDelta(
  entryId,
  userId,
  analysisStartedAt,
);
const totalNodeCount = await this.mindmapService.countUserNodes(userId);
this.emitSse(entryId, 'mindmap_updated', {
  delta,
  total_node_count: totalNodeCount,
});

// Step 4 (기존)
this.emitSse(entryId, 'analysis_complete', {});
```

> `analysisStartedAt`은 `triggerAnalysis()` 진입 시점에 기록해 파이프라인 전반 공유.

### `concepts.service.ts upsertBatch` — `first_seen_entry_id` 세팅

신규 `user_concepts` row insert 시 현재 entry_id를 `first_seen_entry_id`로 세팅. 이미 존재하는 row는 건드리지 않음 (ON CONFLICT DO NOTHING for first_seen_entry_id).

### `mindmap.module.ts`

`forwardRef`(또는 import) — `JournalService`와 cross-reference 가능성. `JournalModule`에서 `MindmapService`를 import 하는 방향이 자연스러움 (반대 방향은 X).

---

## 🎨 Frontend 설계

### `useMindmapSSE` 훅 (신규)

```typescript
export function useMindmapSSE() {
  const mergeDelta = useMindmapStore((s) => s.mergeDelta);
  const setTotalCount = useMindmapStore((s) => s.setTotalCount);
  const refetchFull = useMindmapStore((s) => s.refetchFull);

  useEffect(() => {
    const entryId = sessionStorage.getItem('activeAnalysisEntryId');
    if (!entryId) return;

    const es = new EventSource(`/api/journal/${entryId}/analysis`);

    es.addEventListener('mindmap_updated', (e) => {
      const { delta, total_node_count } = JSON.parse((e as MessageEvent).data);
      mergeDelta(delta);
      // 정합성 체크
      const currentCount = useMindmapStore.getState().graph?.nodes.length ?? 0;
      if (currentCount !== total_node_count) {
        console.warn('[Mindmap] Delta mismatch, refetching full graph');
        refetchFull();
      }
    });

    es.addEventListener('analysis_complete', () => {
      sessionStorage.removeItem('activeAnalysisEntryId');
      es.close();
    });

    return () => es.close();
  }, [mergeDelta, setTotalCount, refetchFull]);
}
```

### `mindmapStore` 확장

```typescript
interface MindmapStore {
  graph: MyMindmapGraph | null;
  hoveredNodeId: string | null;
  selectedNodeId: string | null;

  setGraph(graph: MyMindmapGraph): void;
  setHovered(id: string | null): void;
  setSelected(id: string | null): void;
  mergeDelta(delta: { nodes: MyMindmapNode[]; links: MyMindmapEdge[] }): void;
  refetchFull(): void; // GET /api/mindmap 재호출 헬퍼
}

// mergeDelta 구현
mergeDelta: (delta) => set((state) => {
  if (!state.graph) return state;
  const nodeMap = new Map(state.graph.nodes.map(n => [n.id, n]));
  delta.nodes.forEach(n => nodeMap.set(n.id, { ...n, isNew: true }));

  const linkKey = (l: MyMindmapEdge) => `${l.source}-${l.target}`;
  const linkMap = new Map(state.graph.links.map(l => [linkKey(l), l]));
  delta.links.forEach(l => linkMap.set(linkKey(l), l));

  return {
    graph: {
      nodes: Array.from(nodeMap.values()),
      links: Array.from(linkMap.values()),
    },
  };
}),
```

### `useMindmapSimulation` 수정

- 새 노드(isNew) 초기 좌표: 이미 시뮬레이션에 존재하는 1-hop 이웃 좌표의 평균 (없으면 화면 중앙 부근)
- `simulation.alpha(0.3).restart()` — 기존 노드 거의 안 움직이고 새 노드만 자리 잡음
- 사용자 드래그로 옮긴 노드(`fx`/`fy` 세팅된 노드)는 머지 후에도 위치 보존
- 5초 후 `isNew` 자동 해제 (setTimeout) — pulse 종료

### `MindmapCanvas` 인터랙션

```typescript
const hoveredId = useMindmapStore((s) => s.hoveredNodeId);
const neighbors = useMemo(() => {
  if (!hoveredId) return null;
  const set = new Set<string>([hoveredId]);
  graph.links.forEach((l) => {
    if (l.source === hoveredId) set.add(l.target);
    if (l.target === hoveredId) set.add(l.source);
  });
  return set;
}, [hoveredId, graph.links]);

// 노드 className: neighbors === null || neighbors.has(node.id) → 'opacity-100' : 'opacity-15'
// 엣지 className: neighbors === null || (neighbors.has(l.source) && neighbors.has(l.target)) → 'opacity-100' : 'opacity-5'
```

### `MindmapEdgeView` — strength 두께 + 호버 라벨

```typescript
<line
  strokeWidth={1 + edge.strength * 2}
  stroke="rgb(156 163 175)"  // gray-400
  className="transition-opacity"
  onMouseEnter={() => setHoveredEdge(edge)}
  onMouseLeave={() => setHoveredEdge(null)}
/>
{hoveredEdge && (
  <foreignObject ...>
    <div className="bg-black/80 text-white text-xs px-2 py-1 rounded">
      {hoveredEdge.relation_type} (강도 {hoveredEdge.strength.toFixed(2)})
      <br />{hoveredEdge.explanation}
    </div>
  </foreignObject>
)}
```

### `MindmapToolbar` (신규)

캔버스 우상단 absolute 위치. 내부에 `ZoomFitButton`:

```typescript
function ZoomFitButton() {
  const { svgRef, simulation, zoom } = useMindmapContext();
  return (
    <button onClick={() => {
      // 노드 bounding box 계산 → d3.zoomIdentity.translate(...).scale(...)
      const bounds = computeBoundingBox(simulation.nodes());
      const transform = computeFitTransform(bounds, svgRef.current);
      d3.select(svgRef.current).transition().duration(500).call(zoom.transform, transform);
    }}>전체 보기</button>
  );
}
```

### 일기 작성/분석 페이지 — sessionStorage

분석 시작(`POST /api/journal/entries` 응답 받은 직후):

```typescript
sessionStorage.setItem('activeAnalysisEntryId', entry.id);
```

기존 분석 SSE 구독 코드에서 `analysis_complete` 수신 시:

```typescript
sessionStorage.removeItem('activeAnalysisEntryId');
```

---

## 🚨 에러 처리

| 시나리오                                       | 처리                                                                               |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| SSE 자동 끊김                                  | EventSource 자동 재연결 (브라우저 표준)                                            |
| 분석 실패 (`step_failed`)                      | 마인드맵 영향 없음. 기존 그래프 유지. 분석 페이지 토스트는 기존 로직               |
| 델타 정합성 불일치 (`total_node_count` 불일치) | `console.warn` + `GET /api/mindmap` 재호출하여 전체 교체                           |
| 빈 델타 (`nodes: [], links: []`)               | SSE 발화하되 FE merge는 noop                                                       |
| `computeDelta` 쿼리 실패                       | Step 3 실패 → analysis_complete은 그대로 발화 (다음 페이지 진입 시 GET으로 동기화) |
| 마이그레이션 중 외래키/RLS 충돌                | 트랜잭션 안에 백필. 실패 시 롤백                                                   |
| sessionStorage 만료/없음                       | SSE 구독 skip — 페이지 진입 시 GET 결과로 충분                                     |

---

## 📋 작업 순서 (체크리스트)

### Phase 1 — DB 마이그레이션 + BE Step 3

- [ ] `2026XXXXXXXXXX_user_concepts_first_seen.sql` 작성 (컬럼 + 백필 + 인덱스)
- [ ] 로컬 Supabase에 적용 + 백필 결과 sanity check
- [ ] `database.types.ts` 재생성
- [ ] `concepts.service.ts upsertBatch`에 `first_seen_entry_id` 세팅
- [ ] `mindmap.service.ts`에 `computeDelta()` + `countUserNodes()` 추가
- [ ] `journal.service.ts runAnalysisPipeline()` Step 3 발화 추가
- [ ] `npm run build:devjournal-backend` 통과 확인

### Phase 2 — FE 델타 머지 + SSE

- [ ] `mindmapStore`에 `mergeDelta`/`hoveredNodeId`/`selectedNodeId`/`refetchFull` 추가
- [ ] `useMindmapSSE` 훅 신규 작성
- [ ] `MindmapPageView`에서 `useMindmapSSE` 호출
- [ ] `useMindmapSimulation` — 새 노드 초기 좌표 + alpha=0.3 reheat + fixed 보존
- [ ] `MindmapNodeView` — `isNew` 5초 pulse 애니메이션 (Tailwind animate)
- [ ] 일기 작성/분석 페이지에서 sessionStorage `activeAnalysisEntryId` 세팅/해제
- [ ] dev 서버에서 일기 작성 → 마인드맵 페이지에서 새 노드 페이드인 확인

### Phase 3 — 인터랙션 (이웃 강조 / 줌-fit / 엣지 호버)

- [ ] `MindmapCanvas` 1-hop 이웃 Set 계산 + opacity 토글
- [ ] `MindmapEdgeView` strength 두께 + 호버 라벨
- [ ] `MindmapToolbar` + `ZoomFitButton` 신규 작성
- [ ] 캔버스 우상단에 Toolbar 배치
- [ ] dev 서버에서 hover/zoom-fit/edge-hover 동작 확인

### Phase 4 — 검증 및 PR

- [ ] `npm run build:devjournal-backend` + `npm run build:devjournal-frontend` 통과
- [ ] `npx nx lint devjournal-frontend --fix` 통과
- [ ] 수동 검증 시나리오 (아래 검증 방법)
- [ ] `docs/work-logs/2026-04-XX-feature-devjournal-day13-...md` 작업 일지 작성
- [ ] PR 생성 (base: develop)

---

## ✅ 검증 방법

> Day 12 패턴 따라 jest 셋업 도입은 별도 작업. 본 작업에서는 빌드 + 수동 검증.

### 자동 검증

- ✅ `npm run build:devjournal-backend` 빌드 통과 (TypeScript 타입 검증)
- ✅ `npm run build:devjournal-frontend` 빌드 통과
- ✅ `npx nx lint devjournal-frontend` 통과

### 수동 검증 시나리오

| 시나리오                                      | 기대 동작                                                |
| --------------------------------------------- | -------------------------------------------------------- |
| 일기 작성 → 분석 진행 중 마인드맵 페이지 진입 | 분석 끝나면 새 노드 부드럽게 페이드인 + 5초 pulse        |
| 일기 작성 → 분석 끝난 후 마인드맵 페이지 진입 | GET 결과만으로 새 노드 보임 (SSE 굳이 안 필요)           |
| 마인드맵 페이지에서 아무 노드에 마우스 호버   | 자기 + 1-hop 이웃 강조, 나머지 페이드 (opacity 0.15)     |
| 노드 클릭                                     | 호버와 동일하게 강조 (selectedNodeId 세팅, Drawer 열림)  |
| 줌-fit 버튼 클릭                              | 모든 노드가 화면 안에 들어오도록 0.5s 트랜지션           |
| 엣지에 마우스 호버                            | relation_type + strength + explanation 라벨 표시         |
| 사용자가 노드 드래그로 옮긴 후 새 분석        | 옮긴 노드 위치 그대로 유지, 새 노드만 추가               |
| 백필 결과 확인 (DB)                           | 기존 user_concepts row 모두 `first_seen_entry_id` 세팅됨 |

---

## 🚫 의도적 미포함 (별도 day로 분리)

- B-2 마인드맵 변화 스토리 (Claude로 자연어 1~2문장 피드백)
- 검색 박스 (개념명 검색)
- 카테고리 필터 / mastery 필터
- relation_type별 색상/대시 분화 (enum 안정화 후)
- 클러스터 자동 그룹핑 (B-1)
- 다크모드 + 디자인 토큰 정리
- jest 셋업 도입 (devjournal-backend `test` target 신설)

---

## 🔗 관련 문서

- 본 spec의 브레인스토밍 합의 출처: 2026-04-26 대화
- `docs/devjournal-plan.md` Day 12-13 (656~662 라인)
- `docs/devjournal-day12-plan.md` (선행 — 마인드맵 골격)
- 마이그레이션 베이스: `apps/devjournal/supabase/migrations/20260405000007_user_concepts.sql`
- SSE 인프라: Day 10 `journal.service.ts analysisSubjects Map`
- 공유 타입: `apps/devjournal/types/index.ts` `SSEMindmapUpdatedData`
