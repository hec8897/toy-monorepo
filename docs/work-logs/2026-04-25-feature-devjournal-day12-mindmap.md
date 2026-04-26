# 2026-04-25 feature/devjournal-day12-mindmap 작업 일지

## 📋 작업 개요

- **브랜치**: `feature/devjournal-day12-mindmap`
- **작업 일자**: 2026-04-25
- **목적**: 사용자가 학습한 개념과 그 연결을 D3 force-directed 그래프로 조망할 수 있는 마인드맵 페이지의 기본 골격을 완성한다 (Day 12 옵션 C 스코프).

## ✅ 완료된 작업

- 📝 Day 12 구현 계획서 작성 — `docs/devjournal-day12-plan.md`
- 🔧 BE: `mindmap` 모듈 신설 (controller / service / DTO)
  - `GET /api/mindmap` — `get_user_mindmap()` Postgres 함수 RPC 호출 + DTO 정규화
  - `GET /api/mindmap/concepts/:conceptId` — 개념 메타 + 본인 일기 중 관련 일기 최신 10개
  - `SupabaseAuthGuard` 적용 (자기 데이터만 조회)
  - `AppModule`에 `MindmapModule` 등록
- 🎨 FE: DDD 4 레이어로 `domains/mindmap/` 채움
  - `domain/`: `categoryColors.ts` (카테고리→Tailwind 색상, mastery→투명도, review_count→반지름 공식)
  - `infrastructure/`: `mindmapApi.ts`
  - `application/`: `useMindmapQuery`, `useConceptDetailQuery`, `useMindmapSimulation` (D3 force-directed), `mindmapStore` (Zustand)
  - `presentation/`: `MindmapPageView`, `MindmapCanvas` (SVG + d3.zoom), `MindmapNodeView`, `MindmapEdgeView`, `ConceptDetailDrawer`, `MindmapEmptyState`
- 🗺️ 페이지: `app/(app)/mindmap/page.tsx` 얇은 진입점으로 교체 (기존 placeholder 대체)
- 🧩 공유 타입: `@devjournal/types` 에 `MyMindmapGraph`, `MyMindmapNode`, `MyMindmapEdge`, `ConceptDetail`, `EntryRef` 추가
- 📦 의존성: `d3@7` (dependencies) + `@types/d3@7` (devDependencies) 추가
- ✅ 빌드/린트 통과 (devjournal-backend 빌드, devjournal-frontend 빌드 + lint --fix)
- 🧪 dev 서버에서 `/mindmap` 라우트 정상 등록 확인 (NestJS RouterExplorer 로그)

## 🔧 주요 변경사항

| 파일                                                            | 변경 내용                                                                                       |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `docs/devjournal-day12-plan.md`                                 | 신규 — Day 12 구현 계획서                                                                       |
| `apps/devjournal/backend/src/mindmap/mindmap.module.ts`         | 신규                                                                                            |
| `apps/devjournal/backend/src/mindmap/mindmap.controller.ts`     | 신규 — 2개 GET 엔드포인트 + SupabaseAuthGuard                                                   |
| `apps/devjournal/backend/src/mindmap/mindmap.service.ts`        | 신규 — `getUserMindmap` (RPC) + `getConceptDetail` (3 쿼리 조합)                                |
| `apps/devjournal/backend/src/mindmap/dto/mindmap-graph.dto.ts`  | 신규 — `MindmapNodeDto`, `MindmapEdgeDto`, `MindmapGraphDto`                                    |
| `apps/devjournal/backend/src/mindmap/dto/concept-detail.dto.ts` | 신규 — `ConceptDetailDto`, `EntryRefDto`                                                        |
| `apps/devjournal/backend/src/app/app.module.ts`                 | `MindmapModule` import + 등록                                                                   |
| `apps/devjournal/types/index.ts`                                | `MyMindmapGraph` / `MyMindmapNode` / `MyMindmapEdge` / `ConceptDetail` / `EntryRef` 타입 추가   |
| `apps/devjournal/frontend/src/domains/mindmap/domain/`          | `categoryColors.ts` + `index.ts` (도메인 타입 re-export)                                        |
| `apps/devjournal/frontend/src/domains/mindmap/infrastructure/`  | `mindmapApi.ts` (axios 호출 2개)                                                                |
| `apps/devjournal/frontend/src/domains/mindmap/application/`     | `queryKeys`, `useMindmapQuery`, `useConceptDetailQuery`, `mindmapStore`, `useMindmapSimulation` |
| `apps/devjournal/frontend/src/domains/mindmap/presentation/`    | 6개 컴포넌트 (PageView, Canvas, Node, Edge, Drawer, EmptyState)                                 |
| `apps/devjournal/frontend/src/app/(app)/mindmap/page.tsx`       | placeholder → `<MindmapPageView />` 얇은 진입점                                                 |
| `package.json` / `pnpm-lock.yaml`                               | `d3@7.9.0` + `@types/d3@7.4.3`                                                                  |

## 🐛 발생한 문제 & 해결

### 1. npm install d3 실패

**증상:** `npm install d3 @types/d3` 실행 시 `Cannot read properties of null (reading 'matches')` 에러 (npm 11 + arborist 버그). `--legacy-peer-deps` 도 동일 실패.

**원인:** 모노레포가 `pnpm-lock.yaml`을 사용 중. devjournal 계획서에도 `pnpm add` 로 명시되어 있었음.

**해결:** `pnpm add d3@7 && pnpm add -D @types/d3@7` 로 설치 성공.

### 2. d3 서브모듈 Module Not Found

**증상:** `import { forceSimulation } from 'd3-force'` / `import { zoom } from 'd3-zoom'` → Next.js 빌드 시 모듈을 찾을 수 없음.

**원인:** d3 메인 패키지만 설치하면 서브모듈은 직접 노출되지 않음 (peer 형태로 들어옴).

**해결:** 모든 import를 `'d3'` 메인 모듈에서 가져오도록 통합. `import { forceSimulation, drag, zoom, select, ... } from 'd3';` 로 변경.

### 3. devjournal-backend jest 인프라 부재

**증상:** spec 문서에 `mindmap.service.spec.ts` 작성 계획이 있었으나 `project.json`에 `test` target 없음.

**해결:** Day 12 스코프 보호를 위해 jest 셋업 도입은 별도 작업으로 분리. 본 작업에서는 `npm run build:devjournal-backend` 빌드 통과(타입 검증) + 수동 검증으로 대체. spec 문서도 이를 반영해 업데이트.

### 4. lint import/order 에러 8건

**해결:** `npx nx lint devjournal-frontend --fix` 로 자동 수정 (5개 파일 import 순서 자동 정리).

### 5. d3.zoom 패닝과 노드 드래그 이벤트 충돌

**해결:** `d3.zoom().filter()`에서 `mousedown` 이벤트의 target이 `<circle>`이면 zoom 패닝을 무시하도록 필터링. → 노드 드래그 시 zoom이 가로채지 않음.

## 💡 기술적 결정사항 (왜 이 방법을 선택했는가)

### 옵션 C 스코프 한정 (Day 13 분리)

- **결정:** Day 12에는 BE API + 최소 D3 시각화(줌/패닝/드래그/호버) + Drawer 골격까지만. 검색/카테고리 필터/이웃 강조/Tool 3 build_mindmap 은 Day 13으로 분리.
- **이유:** 한 PR에 BE+FE+D3+SSE+Tool 까지 다 묶으면 리뷰가 무거워짐. "보고/움직이고/클릭" 까지가 1일 분량으로 적정. 검색/필터는 mindmapStore 본격 활용이 필요해 별도 묶음이 깔끔.

### "내 마인드맵만" — 타인/공개 마인드맵 분리

- **결정:** `GET /api/mindmap`은 본인 user_id 기준만. 공개 마인드맵(타인의 학습 지도)은 Day 15 Blog 단계로 분리.
- **이유:** DevJournal 1차 가치는 개인 학습 도구. 자기 데이터가 타인에 묻히면 거울 기능이 흐려짐. `get_user_mindmap` 함수 자체가 이미 본인 user_concepts 기준 필터링이므로 자연스럽게 정합.

### 노드 시각 매핑

- **카테고리 → 색상** (10개 Tailwind 500 톤 팔레트), **review_count → 반지름** (`8 + log(n+1)*4`, 8~20px), **mastery → 투명도** (0.5/0.75/1.0).
- **이유:** 학습 지도 조망(1차 사용자 가치)에 직관적. 자주 본 개념이 크고 진해 보임. 카테고리 분포가 색상 클러스터로 자연스럽게 드러남.

### Drawer 콘텐츠 = 메타 + 관련 일기 (연결된 개념 X)

- **이유:** "이 개념을 어디서 배웠지?" → 일기로 회귀하는 동선이 마인드맵의 핵심 가치 흐름. 연결된 개념은 마인드맵 SVG 자체가 이미 시각적으로 보여주므로 Drawer에서는 중복.

### D3 + React 통합 패턴

- D3는 좌표 계산만 (`useMindmapSimulation` 훅 내부), React가 SVG 렌더 (JSX `<circle>`, `<line>`)
- **이유:** D3가 직접 DOM 조작하면 React Virtual DOM과 충돌 → 무한 리렌더링/유실 위험. 좌표 계산만 D3, 렌더는 React 가 표준 패턴.

### Lint --fix 자동 적용

- **이유:** import/order 8건은 모두 mechanical fix 가능. 수동 수정보다 안전.

## 🚫 의도적 미포함 (Day 13 이후)

- 검색 박스 / 카테고리 필터 / mastery 필터
- 이웃 노드 강조 인터랙션
- 줌 to fit 버튼
- relation_type 별 엣지 시각화 (색상/대시 등)
- Tool 3 `build_mindmap` Claude 함수 + SSE `mindmap_updated` 이벤트
- 일기 작성 시 마인드맵 실시간 갱신 (델타 머지)
- 다크모드
- 시드/테스트 데이터 정리 스크립트 (사용성 검증 단계에서 함께 처리하기로 사용자와 합의)

## 🔗 관련 이슈 / 참고

- `docs/devjournal-plan.md` Day 12-13 (656~662 라인)
- `docs/devjournal-day12-plan.md` (본 작업 spec)
- 마이그레이션: `apps/devjournal/supabase/migrations/20260405000011_functions.sql` (`get_user_mindmap`)
- 선행 PR: #69 (Day 11 — Tiptap 에디터 + AI 분석 재시도)
- 후속: Day 13 — 검색/카테고리 필터 + 이웃 강조 + Tool 3 델타 머지
