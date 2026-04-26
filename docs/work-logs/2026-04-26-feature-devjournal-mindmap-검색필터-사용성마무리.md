# 2026-04-26 feature/devjournal-mindmap-search-filter 작업 일지

## 📋 작업 개요

- **브랜치**: `feature/devjournal-mindmap-search-filter`
- **작업 일자**: 2026-04-26
- **목적**: Day 13 마인드맵 위에 검색 박스 + 카테고리/mastery 칩 필터를 더해 "사용성 마무리" 단계 완성. Day 14 Dashboard 진입 전 브릿지.

## ✅ 완료된 작업

### 디자인 합의 (브레인스토밍)

- 📝 계획서 작성 — `docs/devjournal-mindmap-search-filter-plan.md`
- 🎯 스코프: 검색 + 카테고리/mastery 필터 (별 day로 분리: aliases 검색 / 클러스터 그룹핑 / 같은 entry 자동 약한 연결 / relation_type 분화)
- 🎨 비매칭 노드 = 페이드 (opacity 0.1, 호버 강조와 일관)
- 🔍 검색 매칭 = 노드 이름만 (FE 메모리 String.includes, BE 호출 0회)
- 🧮 결합 로직 = 검색 AND 카테고리(OR) AND mastery(OR), 0개 칩 = 그룹 비활성

### 구현

#### Application 레이어

- 🔧 `mindmapStore.ts` 확장 — `searchQuery` / `categoryFilters: Set<string>` / `masteryFilters: Set<MasteryLevel>` / `setSearch` / `toggleCategory` / `toggleMastery` / `clearFilters`. `toggleInSet` 헬퍼로 토글 로직 추출.
- ✨ `useMindmapFilterMatch.ts` 신규 — 매칭 Set 계산 (null = 비활성). `matches` 헬퍼로 단일 노드 필터링 분리. `MindmapFilterMatchResult` 타입 export.

#### Presentation 레이어

- ✨ `MindmapFilterPanel.tsx` 신규 — 검색 input + 카테고리/mastery 칩 + 카운트 + 초기화. `FilterChipGroup` 헬퍼로 카테고리/mastery 칩 중복 제거. 모바일 토글(접이식) + 데스크탑 항상 펼침 (CSS `sm:block`).
- 🔧 `MindmapCanvas.tsx` — 노드/엣지에 `useMindmapFilterMatch` 호출 + `outOfHover || outOfFilter` 합성으로 isFaded 결정.
- 🔧 `MindmapPageView.tsx` — `<MindmapFilterPanel nodes={data.nodes} />` 마운트.

#### 모바일 대응

- 📱 `MindmapFilterPanel` 반응형 — 모바일은 `left-4 right-4` 좌우 마진 + 폭 자동, 데스크탑은 `sm:w-[300px]` 고정.
- 📱 `MindmapFilterPanel` 접이식 — 모바일 첫 진입 시 접힘 (캔버스 가림 최소), 토글 헤더 클릭으로 펼침. 데스크탑은 CSS로 항상 펼침.
- 🌀 `useMindmapSimulation` 모바일 force 파라미터 — `width < 640`이면 `MOBILE` 프리셋(`charge -80`, `linkDistance 50~120`, `centerStrength 0.08`로 `forceX`/`forceY` 활성), 데스크탑은 `DESKTOP` 프리셋. `getForceParams(width)` 헬퍼로 분기.

### 코드 리뷰 반영

- 🧹 `useMindmapSimulation.ts` — force 적용 코드가 마운트/update 두 군데에서 중복되던 것을 `applyForces(simulation, params, width, height, links)` 헬퍼 함수로 추출. 향후 force 추가/파라미터 변경 시 한 곳만 수정.

### 검증

- ✅ `npm run build:devjournal-frontend` 통과
- ✅ `npx nx lint devjournal-frontend --fix` 통과
- ✅ 수동 검증:
  - 검색어 "ob" 입력 → "Observable" / "Observer 패턴" 매칭, 나머지 페이드, 카운트 갱신
  - 카테고리 칩 클릭 (단일/복수) → 그룹 내 OR 동작
  - 검색 + 카테고리 동시 → 그룹 간 AND 동작
  - 매칭 0개 → 카운트 빨간색 "매칭된 노드 없음"
  - 초기화 클릭 → 모든 칩/검색어 비움, 그래프 정상 복원
  - 호버 + 필터 동시 → 두 페이드 합성 (둘 중 하나라도 페이드면 흐려짐)
  - 페이드된 노드 클릭 → Drawer 정상 열림 (pointer-events 유지)
  - 모바일 사이즈 → 패널 접힘, 노드들이 가운데 모임, force 파라미터 자동 전환

## 🔧 주요 변경사항

| 파일                                                                                | 변경 내용                                                         |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `docs/devjournal-mindmap-search-filter-plan.md`                                     | 신규 — 계획서                                                     |
| `apps/devjournal/frontend/src/domains/mindmap/application/mindmapStore.ts`          | 검색·필터 상태 + 액션 + `toggleInSet` 헬퍼                        |
| `apps/devjournal/frontend/src/domains/mindmap/application/useMindmapFilterMatch.ts` | 신규 — 매칭 Set 계산 훅                                           |
| `apps/devjournal/frontend/src/domains/mindmap/application/useMindmapSimulation.ts`  | 모바일 force 프리셋 + `forceX`/`forceY` 추가 + `applyForces` 헬퍼 |
| `apps/devjournal/frontend/src/domains/mindmap/application/index.ts`                 | `useMindmapFilterMatch` / `MindmapFilterMatchResult` export       |
| `apps/devjournal/frontend/src/domains/mindmap/presentation/MindmapFilterPanel.tsx`  | 신규 — 검색 input + 칩 + 카운트 + 초기화 + 모바일 접이식          |
| `apps/devjournal/frontend/src/domains/mindmap/presentation/MindmapCanvas.tsx`       | `useMindmapFilterMatch` 호출 + 페이드 합성                        |
| `apps/devjournal/frontend/src/domains/mindmap/presentation/MindmapPageView.tsx`     | `<MindmapFilterPanel />` 마운트                                   |
| `apps/devjournal/frontend/src/domains/mindmap/presentation/index.ts`                | `MindmapFilterPanel` export                                       |

## 🐛 발생한 문제 & 해결

### 1. 모바일 디자인 미반영 → 패널이 화면 가림

**증상:** 데스크탑 기준 `w-[300px] left-6 top-16` 하드코딩으로 모바일에서 우측이 잘리거나 캔버스를 가림.

**해결:**

- 컨테이너 폭을 `left-4 right-4 sm:left-6 sm:right-auto sm:w-[300px]` 반응형으로 변경.
- 모바일은 접이식 토글 헤더(`sm:hidden`) + 본문 조건부 렌더 (`isOpen ? 'block' : 'hidden'`) + 데스크탑 `sm:block` 강제 표시.
- SSR/hydration 안전성 위해 `isOpen` 초기값을 `false` 고정 (데스크탑은 어차피 CSS로 항상 표시되므로 무관).

### 2. 모바일에서 노드 거리 너무 멀어 화면 밖으로 흘러감

**증상:** Day 13 force 파라미터(`charge -150`, `linkDistance 100~240`)가 데스크탑 기준이라 모바일 좁은 화면에선 노드들이 외곽으로 빠져나감.

**해결:**

- `useMindmapSimulation`에 `getForceParams(width)` 추가, `MOBILE_BREAKPOINT_PX = 640` 기준으로 `DESKTOP` / `MOBILE` 프리셋 분기.
- 모바일은 `charge -80`, `linkDistance 50~120`, `collidePadding 4`로 더 컴팩트.
- `forceX(width/2).strength(0.08)` + `forceY(height/2).strength(0.08)` 추가로 약한 가운데 인력 → 외곽 이탈 방지. 데스크탑은 `centerStrength: 0`으로 비활성.
- width 변경(가로↔세로 전환 / 리사이즈) 시 update 케이스에서도 force 파라미터 재적용.

### 3. force 적용 코드 중복 (코드 리뷰 반영)

**증상:** 첫 마운트와 update 두 군데에서 같은 6개 force(`link`/`charge`/`center`/`collide`/`x`/`y`)를 거의 동일하게 호출. 파라미터 변경 시 한쪽 빠뜨릴 위험.

**해결:** `applyForces(simulation, params, width, height, links)` 헬퍼 함수로 추출하여 두 케이스 모두 한 호출로 단순화.

## 💡 기술적 결정사항 (왜 이 방법을 선택했는가)

### 검색은 BE 호출 0회 (클라이언트 사이드 필터링)

- **결정:** 마인드맵 페이지 진입 시 받은 노드 배열에서 `String.includes` 매칭. BE 검색 API 신설 X.
- **이유:** 노드 수천 개여도 microseconds 수준, 입력 즉시 반응(debounce 불필요), BE 부하 0. 마인드맵은 본인 그래프(보통 수백 개) 한정이라 메모리 부담도 미미.

### 매칭 Set 반환 패턴 (`Set<string> | null`)

- **결정:** 필터 비활성 = `null` 반환, 활성 = 매칭된 ID들의 `Set` 반환.
- **이유:** 호출자가 `null` 체크로 비활성 조기 분기 가능. `Set.has()`는 O(1)이라 노드 렌더 시점 페이드 합성 빠름. 빈 Set과 null의 의미 분리(빈 Set = 매칭 0건 / null = 필터 자체가 없음).

### 페이드 합성을 단순 OR로 (단계 분리 X)

- **결정:** `outOfHover || outOfFilter` 둘 중 하나라도 만족하면 페이드 (opacity 0.1).
- **이유:** 0.15(호버) / 0.1(필터) 단계 분리는 인지 부담만 늘리고 시각 차이는 거의 없음. 단일 페이드 값이 더 깔끔.

### 카테고리 칩 = 데이터 기반 동적 (fixed 6종 X)

- **결정:** `nodes.map(n => n.category)`로 실제 등장한 카테고리만 칩 표시.
- **이유:** Tool 1 enum이 6종이지만 미래 확장 가능성. 데이터에 없는 카테고리 칩은 무용. 동적 생성이 미래 안전 + 단순.

### 모바일 접이식 (B안 채택)

- **결정:** 모바일은 첫 진입 시 접힘 + 토글, 데스크탑은 항상 펼침.
- **이유:** 모바일에서 펼친 패널이 캔버스를 크게 가림. "필터 보고 싶을 때만" 펼치는 UX가 자연스러움. 데스크탑은 화면 여유 있어 펼친 상태 기본이 나음. CSS sm: 분기로 React state 단순화.

### `forceX`/`forceY` 모바일에만 활성

- **결정:** 데스크탑은 `centerStrength: 0` (forceCenter만), 모바일은 `0.08` (가운데 약한 인력 추가).
- **이유:** 데스크탑은 화면 넓어 forceCenter만으로 충분. 모바일은 좁은 화면이라 외곽 이탈 방지가 필요 → forceX/Y로 약한 끌어당김 추가. 두 환경에 같은 파라미터 쓰면 데스크탑에선 그래프가 너무 응축됨.

### `applyForces` 헬퍼 추출 (코드 리뷰 반영)

- **결정:** force 적용을 한 함수로 모음.
- **이유:** 마운트/update 두 분기에 같은 force 6개 호출이 나뉘어 있어 향후 추가/변경 시 한쪽 누락 위험. 헬퍼 추출로 응집도 ↑, 유지 비용 ↓.

## 🚫 의도적 미포함 (별도 day로 분리)

- aliases 검색 (RPC + 타입 변경 동반)
- 카테고리 fixed 칩 (현재 동적이라 데이터 비어있을 때 빈 그룹 가능 — 큰 문제 아님)
- 클러스터 자동 그룹핑
- 같은 entry 새 개념끼리 자동 약한 연결 (Tool 2 한계 보완)
- relation_type별 색상/대시 분화
- 다크모드
- 검색 history / 자주 쓴 필터 저장
- 키보드 단축키 (Cmd+K 검색 포커스 등)
- mastery 색상도 domain 레이어로 옮기기 (코드 리뷰 Info — 사용처 1곳뿐이라 보류)
- `FilterChipGroup` 제네릭화로 `as MasteryLevel` 캐스팅 제거 (코드 리뷰 Info — 동작 영향 없음)

## 🔗 관련 이슈/참고

- 본 작업 spec: `docs/devjournal-mindmap-search-filter-plan.md`
- 선행 PR: #71 (Day 13 마인드맵 새로고침 + 최근 개념 강조 + 인터랙션)
- 후속: Day 14 Dashboard
