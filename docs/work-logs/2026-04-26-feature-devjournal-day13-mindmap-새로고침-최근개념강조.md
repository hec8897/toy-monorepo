# 2026-04-26 feature/devjournal-day13-mindmap-delta-merge 작업 일지

## 📋 작업 개요

- **브랜치**: `feature/devjournal-day13-mindmap-delta-merge`
- **작업 일자**: 2026-04-26
- **목적**: Day 13 — 일기 분석 결과가 마인드맵에 반영되도록 새로고침 버튼 + "최근 개념" orange ring 강조 도입, 마인드맵 시각 인터랙션 일부(이웃 강조 / 줌-fit / 엣지 호버 라벨) 추가.

## ✅ 완료된 작업

### 디자인 합의 (브레인스토밍)

- 📝 Day 13 계획서 작성 — `docs/devjournal-day13-plan.md`
- 🧐 Tool 3 (`build_mindmap`) 폐기 결정 — Tool 1+2 결과 + DB 쿼리로 100% 만들 수 있어 LLM 호출이 잉여
- 🔁 SSE 자동 머지 → 단순 새로고침 + `is_recent` 강조로 피벗 (검증 후)
- 🚫 별도 day로 분리: 검색/필터, 클러스터 그룹핑, 변화 스토리, 다크모드, jest 셋업, 같은 entry 자동 약한 연결

### 데이터베이스

- 🗄️ 마이그레이션 1: `20260426000014_user_concepts_first_seen.sql`
  - `user_concepts.first_seen_entry_id` 컬럼 + 백필 + 인덱스
  - 백필 결과: 59/69 row backfilled (10 row는 seed로 들어간 user_concepts라 NULL — 정상)
- 🗄️ 마이그레이션 2: `20260426000015_get_user_mindmap_is_recent.sql`
  - `get_user_mindmap` RPC가 `is_recent: boolean` 필드 반환
  - 사용자의 가장 최근 entry로 `first_seen`된 노드만 `is_recent=true`
- 📦 `database.types.ts` 갱신 — `user_concepts.first_seen_entry_id` + foreign key 반영

### Backend

- 🔧 `concepts.service.ts upsertBatch` — 신규 `user_concepts` row insert 시 `first_seen_entry_id = entryId` 세팅
- 🔧 `mindmap.service.ts normalizeGraph` — `is_recent` 필드 매핑
- 📦 `MindmapNodeDto.is_recent: boolean` 필드 추가

### Frontend

- ✨ `useMindmapSimulation` 리팩토링 — simulation 인스턴스 1회 생성, nodes/edges prop 변경 시 nodes()/links() 업데이트만, 사용자 드래그 좌표(fx/fy) 보존, 메타 동기화 (`is_recent` 포함)
- ✨ `MindmapToolbar` 신규 — 우상단 absolute, 줌-fit + 새로고침 버튼
- ✨ `MindmapNodeView` — `node.is_recent` 기반 orange ring (`#f59e0b`) + `mindmap-node-pulse` stroke 깜빡
- ✨ `MindmapEdgeView` — strength 기반 두께 + 호버 라벨 (`relation_type` + 강도)
- ✨ `MindmapCanvas` — 1-hop 이웃 강조 (opacity 0.15/1.0), `onRefresh` / `isRefreshing` prop, 호버 엣지 라벨 absolute layer
- 🔧 `MindmapPageView` — `useMindmapQuery.refetch` / `isFetching` 을 Canvas에 전달
- 🔧 `mindmapStore` — `hoveredNodeId` / `hoveredEdgeKey` / `setHovered` / `setHoveredEdge` 추가
- 🎨 `global.css` — `mindmap-node-pulse` keyframes (1.2s ease-in-out infinite stroke-opacity)

### 공유 타입

- 📦 `MyMindmapNode.is_recent: boolean` 필드 추가
- 🗑️ `SSEMindmapUpdatedData` / SSE `mindmap_updated` 이벤트 타입 제거 (피벗으로 미사용)

### 검증

- ✅ `npm run build:devjournal-backend` 통과
- ✅ `npm run build:devjournal-frontend` 통과
- ✅ `npx nx lint devjournal-frontend --fix` 통과
- ✅ 수동 검증 (3개 일기 시나리오):
  1. 첫 일기 작성 → 모든 노드 orange ring + pulse, 엣지 0개 (Tool 2 한계 정상)
  2. 두 번째 일기 작성 → 새로고침 → 신규 노드만 ring + pulse, 일기 1↔2 사이 엣지(Promise↔Observable 등) 등장
  3. 세 번째 일기(외딴 영역 포함) → 두 클러스터 분리 시각 + 외딴 섬 노드 확인

## 🔧 주요 변경사항

| 파일                                                                                | 변경 내용                                                    |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `docs/devjournal-day13-plan.md`                                                     | 신규 — Day 13 계획서 (피벗 반영)                             |
| `apps/devjournal/supabase/migrations/20260426000014_user_concepts_first_seen.sql`   | 신규 — 컬럼 + 백필 + 인덱스                                  |
| `apps/devjournal/supabase/migrations/20260426000015_get_user_mindmap_is_recent.sql` | 신규 — RPC `is_recent` 필드 반환                             |
| `apps/devjournal/backend/src/concepts/concepts.service.ts`                          | `upsertBatch`에 `first_seen_entry_id` 세팅                   |
| `apps/devjournal/backend/src/mindmap/mindmap.service.ts`                            | `normalizeGraph`에 `is_recent` 매핑                          |
| `apps/devjournal/backend/src/mindmap/dto/mindmap-graph.dto.ts`                      | `MindmapNodeDto.is_recent` 추가                              |
| `apps/devjournal/backend/src/supabase/database.types.ts`                            | `user_concepts.first_seen_entry_id` 반영                     |
| `apps/devjournal/types/index.ts`                                                    | `MyMindmapNode.is_recent` 추가, `SSEMindmapUpdatedData` 제거 |
| `apps/devjournal/frontend/src/domains/mindmap/application/mindmapStore.ts`          | hover 상태 추가 (`hoveredNodeId` / `hoveredEdgeKey`)         |
| `apps/devjournal/frontend/src/domains/mindmap/application/useMindmapSimulation.ts`  | 좌표 보존 + 메타 동기화 패턴으로 리팩토링                    |
| `apps/devjournal/frontend/src/domains/mindmap/presentation/MindmapNodeView.tsx`     | orange ring + pulse + 1-hop opacity 토글                     |
| `apps/devjournal/frontend/src/domains/mindmap/presentation/MindmapEdgeView.tsx`     | strength 두께 + 호버 라벨                                    |
| `apps/devjournal/frontend/src/domains/mindmap/presentation/MindmapCanvas.tsx`       | 이웃 강조 / 줌-fit / 호버 엣지 라벨 / refresh prop 전달      |
| `apps/devjournal/frontend/src/domains/mindmap/presentation/MindmapToolbar.tsx`      | 신규 — 줌-fit + 새로고침 버튼                                |
| `apps/devjournal/frontend/src/domains/mindmap/presentation/MindmapPageView.tsx`     | refetch/isFetching prop 전달                                 |
| `apps/devjournal/frontend/src/domains/mindmap/presentation/index.ts`                | `MindmapToolbar` export 추가                                 |
| `apps/devjournal/frontend/src/domains/mindmap/application/index.ts`                 | `useMindmapSSE` export 제거                                  |
| `apps/devjournal/frontend/src/app/global.css`                                       | `mindmap-node-pulse` keyframes                               |

## 🐛 발생한 문제 & 해결

### 1. spec doc과 실제 스키마 불일치 — `entry_concepts.created_at` / `connections.user_id` 부재

**증상:** 스펙 작성 시 백필 쿼리가 `entry_concepts.created_at`을 사용했고, 신규 엣지 추출이 `connections.created_at >= analysisStartedAt` 비교에 의존했으나 두 컬럼 모두 실제 스키마에 존재하지 않음.

**원인:** `entry_concepts`는 `entry_id`/`concept_id`/`confidence`만 가짐. `connections`는 글로벌(모든 사용자 공통)이라 `user_id`/`created_at` 모두 없음.

**해결:**

- 백필: `entry_concepts JOIN entries` 로 `entries.created_at` 사용 (`array_agg(... order by e.created_at asc))[1]`)
- 신규 엣지(SSE 머지 시기): `entry_concepts` 매칭으로 정의 — 이번 entry의 concept이 한 끝점이고 양쪽이 user_concepts 범위. (이후 SSE 자체를 폐기해 무관해짐)

### 2. SSE 자동 머지 디자인 피벗

**증상:** SSE 기반 델타 머지를 구현 후 dev 검증에서 "다른 페이지에서 분석 끝난 후 마인드맵 페이지 진입 시 변화 없음" 발견. React Query staleTime 5분 캐시가 원인.

**시도 1:** `useJournalAnalysis analysis_complete` 핸들러에 마인드맵 query invalidate 추가. 그래도 검증에서 변화 없음 (캐시 갱신 사각지대).

**근본 결정:** 사용자와 합의 후 SSE 자동 머지 자체를 폐기. 단순 새로고침 + "최근 개념" orange ring 강조로 피벗. 사용자 가치는 동일하면서 인프라 부담 사라짐.

**삭제된 코드:**

- `useMindmapSSE.ts`
- `mindmapStore` `newNodeIds` / `markNew` / `clearNew`
- `useJournalAnalysis` sessionStorage / `mindmap` invalidate
- `journal.service.ts` Step 3 `mindmap_updated` 발화 + `MindmapService` 의존성
- `mindmap.service.ts` `computeDelta` / `countUserNodes`
- `types/SSEMindmapUpdatedData` / `SSEEventType.mindmap_updated`

### 3. `useMindmapSimulation` 메타 동기화 누락 → ring이 영구 유지됨

**증상:** 일기 2 작성 후 새로고침해도 일기 1 노드들이 여전히 orange ring 표시. RPC 응답에선 일기 1 노드의 `is_recent=false`로 정상 반환됨.

**원인:** `useMindmapSimulation`의 update 케이스가 `name/category/mastery/review_count/radius`만 동기화하고 `is_recent`를 누락. 첫 로드 시 SimNode 캐시에 `is_recent=true`로 들어간 후 새로고침해도 갱신 안 됨.

**해결:** update 케이스에 `existing.is_recent = n.is_recent;` 한 줄 추가.

### 4. Tool 2 설계 한계 — 같은 entry 새 개념끼리 자동 연결 안 됨

**증상:** 첫 일기에서 17개 개념 추출됐는데 connections 0개. 마인드맵에 노드만 있고 엣지 0.

**원인:** Tool 2 (`search_connections`)는 새 개념과 pgvector로 찾은 기존 유사 개념 후보 사이의 관계만 분류. concepts 테이블이 비어있던 상태에서 첫 일기 분석 시 후보 0개 → Tool 2 결과 0건.

**대응:** Day 13 스코프 외로 분리. 두 번째 일기부터는 Tool 2 후보가 잡혀 자연스러운 연결 발생을 검증으로 확인. 같은 entry 자동 약한 연결은 별도 day 후속.

### 5. force-layout 노드 간 거리 촘촘

**해결:** `useMindmapSimulation` force 파라미터 튜닝 (사용자 미세 조정 반영) — `LINK_DISTANCE_BASE 100`, `LINK_DISTANCE_RANGE 140`, `COLLIDE_PADDING 8`.

## 💡 기술적 결정사항 (왜 이 방법을 선택했는가)

### Tool 3 폐기

- **결정:** 원안의 `build_mindmap` Tool은 출력 필드(category/weight/is_new/center_node_id 등)가 모두 Tool 1+2 결과 + DB 쿼리로 만들 수 있어 LLM 호출이 잉여.
- **이유:** Claude API 호출 1회 추가 = 비용·지연·실패 위험만 +1, 새 정보 0건. 정직한 폐기가 더 깔끔.

### SSE 자동 머지 → 단순 새로고침 피벗

- **결정:** 분석 끝나면 마인드맵 페이지에서 새로고침 버튼으로 갱신. 실시간 델타 푸시 X.
- **이유:** SSE 인프라(Subject Map / sessionStorage / 정합성 체크 / refetch 안전망)가 가치 대비 너무 무거움. 사용자 가치는 "분석 결과를 마인드맵에서 본다"이므로 새로고침으로 동등 달성. React Query staleTime 캐시와의 미묘한 사각지대도 해소.

### "최근 개념" 정의 = 가장 최근 일기로 first_seen된 개념

- **결정:** "마지막 1개 entry 기준" — 시간 윈도우(N일)나 N개 entry 누적 X.
- **이유:** "방금 추가한 개념" 의미가 가장 명확. RPC 한 단계로 처리 가능 (`v_latest_entry_id` 변수 + `=` 비교). 추가 API 불필요.

### `is_recent` 시각 강조 = orange ring + stroke pulse

- **결정:** stroke 색상(orange #f59e0b) + `mindmap-node-pulse` CSS keyframes (1.2s ease-in-out stroke-opacity 0.3↔1).
- **이유:** 마인드맵의 fill 색상(카테고리)·반지름(review_count)을 건드리지 않으면서 인지 가능. NEW 텍스트 배지보다 톤이 부드러움.

### `useMindmapSimulation` 좌표 보존 패턴

- **결정:** simulation 인스턴스 1회 생성, `nodesMapRef`로 SimNode 인스턴스를 보존, prop 변경 시 nodes()/links() 업데이트만.
- **이유:** Day 12 패턴(prop 변경 = 시뮬레이션 재생성)은 새로고침 시 모든 좌표가 리셋되어 사용자 드래그 위치/안정화된 레이아웃이 사라짐. 보존 패턴은 사용자 좌표를 유지하면서 새 노드만 자연스럽게 자리 잡음.

### Tool 2 한계 노출 = Day 13 스코프 외로 인정

- **결정:** 같은 entry 새 개념끼리 자동 연결을 추가하지 않음. 두 번째 일기부터 Tool 2가 후보 잡으면서 자연스럽게 연결되도록 둠.
- **이유:** "같은 entry 자동 약한 연결" 추가는 Day 13 스코프 확장. 실제 사용성에서 일기 2~3개 작성 시점부턴 풍부한 연결이 발생함을 수동 검증으로 확인. 별도 day로 분리.

### `connections` 글로벌 테이블 유지

- **결정:** `connections` 테이블에 `user_id`/`created_at` 컬럼 추가하지 않음. 글로벌 그래프 유지.
- **이유:** 마인드맵의 사용자별 격리는 `get_user_mindmap` RPC가 `from_id IN user_concepts AND to_id IN user_concepts` 필터로 처리. 글로벌 connections는 다른 사용자가 이미 만든 개념 관계를 재활용할 수 있는 잠재 가치도 있음. 큰 스키마 변경은 별 day로 미룸.

### 새로고침 버튼 위치 = 캔버스 우상단 Toolbar

- **결정:** 줌-fit과 같은 Toolbar 컴포넌트에 가로 배치.
- **이유:** 마인드맵 캔버스 영역 안 인터랙션이라 한 곳에 모이는 게 자연스러움. 페이지 헤더/사이드바 영역 침범 없음.

### `is_recent` 자동 해제 트리거 = 새 일기 작성 (RPC가 알아서)

- **결정:** FE 타이머/setTimeout으로 5초 자동 해제 X. RPC가 `v_latest_entry_id` 비교로 다음 일기 작성 시 자연스럽게 false로 반환.
- **이유:** 시간 기반 자동 해제는 "사용자가 마인드맵 페이지에 있는 동안 5초 내 새로고침 안 하면 영원히 ring" 같은 코너 케이스 발생. 데이터 기반(RPC)이 더 정직하고 일관적.

## 🚫 의도적 미포함 (Day 14 이후)

- 검색 박스 / 카테고리·mastery 필터
- 클러스터 자동 그룹핑 (B-1)
- 같은 entry 새 개념끼리 자동 약한 연결 (Tool 2 한계 해소)
- 마인드맵 변화 스토리 (Claude 자연어 피드백)
- 다크모드 + 디자인 토큰 정리
- relation_type별 색상/대시 분화 (enum 안정화 후)
- jest 셋업 도입 (devjournal-backend `test` target 신설)
- SSE 자동 머지 / 실시간 델타 푸시 (이번 작업에서 폐기)

## 🔗 관련 이슈/참고

- 본 작업 spec: `docs/devjournal-day13-plan.md`
- `docs/devjournal-plan.md` Day 12-13 (656~662 라인)
- 선행 PR: #70 (Day 12 — 마인드맵 D3 시각화 + ConceptDetailDrawer)
- 마이그레이션 베이스: `20260405000007_user_concepts.sql`, `20260405000011_functions.sql`
- 인터랙션 트리거: 사용자 일기 3개 시나리오 (Promise 비동기 → RxJS Observable → Subject 변종 + HTML 시맨틱) 로 검증
