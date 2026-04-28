# 2026-04-27 feature/devjournal-day14-dashboard 작업 일지

## 📋 작업 개요

- **브랜치**: `feature/devjournal-day14-dashboard`
- **작업 일자**: 2026-04-27
- **목적**: 학습 활동을 한눈에 보여주는 Dashboard 도입 — KPI 카드 4개 + ConceptGrowthChart(누적 라인) + WeeklyHeatmap(GitHub-style 캘린더)

## ✅ 완료된 작업

### 설계

- spec/plan 통합 문서 작성: `docs/devjournal-day14-plan.md`
- 핵심 결정: KPI 4개 + 차트 2개 / 누적 라인 / GitHub heatmap / 정적+호버 / 하이브리드 API / RPC 함수 / recharts + Tailwind 그리드
- 병렬 트랙(백엔드 / 프론트) 분할 명시

### 백엔드

- `apps/devjournal/backend/src/dashboard/` 모듈 신규 (controller / service / module / dto 4개)
- Supabase RPC 함수 3개 (`get_user_streak`, `get_concept_growth`, `get_entry_heatmap`)
- 마이그레이션 적용 완료 (`20260427000016_dashboard_rpcs`, MCP `apply_migration`으로 적용)
- 단위 테스트 10/10 통과
- jest 인프라 신규 셋업 (`jest.config.cts`, `tsconfig.spec.json`)
- `@toy-monorepo/*` path alias 추가 (tsconfig + webpack alias)

### 프론트엔드

- `apps/devjournal/frontend/src/domains/dashboard/` 도메인 4 레이어
  - application: queryKeys + useQuery 훅 3개 (KPI / ConceptGrowth / Heatmap)
  - infrastructure: dashboardApi (3개 fetcher)
  - domain: types (`@toy-monorepo/types` re-export)
  - presentation: KpiCard / KpiCardGrid / ConceptGrowthChart / WeeklyHeatmap / DashboardPageView
- 페이지 진입점 얇게 유지 (`<DashboardPageView />` import만)
- 2단 레이아웃 (`lg:grid-cols-2`) — 데스크탑에서 차트 2개 좌우 배치, 모바일은 1열
- WeeklyHeatmap 셀 그리드 균등 분배 (`gridTemplateColumns: repeat(13, minmax(0,1fr))` + `aspect-square`)
- Tailwind v4 자동 detect 누락 회피 — `global.css`에 `@source` 디렉티브 명시
- 빌드/린트/타입체크 모두 통과 (`recharts` 3.8.1 추가, React 19 호환 OK)

### 공통

- `packages/types/src/lib/dashboard.ts` 신규 (DashboardKpis / ConceptGrowthPoint / HeatmapCell)
- `packages/types/src/index.ts` re-export
- recharts 의존성 workspace root에 추가

## 🔧 주요 변경사항

| 파일                                                                           | 변경 내용                                                          |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `docs/devjournal-day14-plan.md` (신규)                                         | spec/plan 통합 문서                                                |
| `apps/devjournal/supabase/migrations/20260427000016_dashboard_rpcs.sql` (신규) | RPC 3개 (get_user_streak / get_concept_growth / get_entry_heatmap) |
| `apps/devjournal/backend/src/dashboard/` (신규)                                | dashboard 모듈 + DTO 4개 + 단위 테스트                             |
| `apps/devjournal/backend/src/app/app.module.ts`                                | `DashboardModule` 등록                                             |
| `apps/devjournal/backend/src/supabase/database.types.ts`                       | RPC 3개 타입 수동 추가                                             |
| `apps/devjournal/backend/{tsconfig,webpack.config}.{json,js}`                  | `@toy-monorepo/*` path alias 추가                                  |
| `apps/devjournal/backend/jest.config.cts`, `tsconfig.spec.json` (신규)         | jest 인프라                                                        |
| `apps/devjournal/frontend/src/domains/dashboard/` (신규)                       | 도메인 4 레이어                                                    |
| `apps/devjournal/frontend/src/app/(app)/dashboard/page.tsx`                    | placeholder → `<DashboardPageView />`                              |
| `apps/devjournal/frontend/src/app/global.css`                                  | `@source` 디렉티브 추가                                            |
| `apps/devjournal/frontend/tsconfig.json`                                       | `@toy-monorepo/types` path 추가                                    |
| `packages/types/src/lib/dashboard.ts` (신규)                                   | 공통 타입 3종                                                      |
| `package.json`, `pnpm-lock.yaml`                                               | recharts 3.8.1 추가                                                |

## 🐛 발생한 문제 & 해결

### 1. `npm install` 시도 → 사용자가 거부

- **원인**: 이 모노레포는 `pnpm` 사용 (`pnpm-lock.yaml` 존재, `package-lock.json` 없음)
- **해결**: `pnpm add recharts -w`로 재시도 → 성공
- **메모리 등록**: `project_package_manager.md` (npm install 금지)

### 2. SQL 윈도우 함수 캐스트 위치 syntax error

- **원인**: `sum(...)::int over (...)` 형태가 syntax error — `::int` 캐스트가 윈도우 함수 호출 중간에 들어갈 수 없음
- **해결**: `(sum(...) over (...))::int`로 괄호 위치 수정 — 캐스트가 윈도우 함수 결과 전체에 적용되도록
- spec 문서와 마이그레이션 파일 모두 동기화

### 3. 첫 마이그레이션 적용 시 RPC `get_entry_heatmap` 미존재 에러

- **원인**: 첫 시도가 SQL 문법 에러로 트랜잭션 롤백 → DB에 함수 미등록 상태에서 백엔드 호출 시도
- **해결**: 캐스트 위치 수정 후 `mcp__supabase__apply_migration`으로 재적용 → success

### 4. 작성 캘린더 셀이 박스에 가득 안 채워짐

- **원인**: 셀 사이즈가 `h-3 w-3` 고정이라 좌측에 쏠림
- **해결**: `flex-1` 컨테이너 + 각 row를 `grid` + `gridTemplateColumns: repeat(13, minmax(0,1fr))` + 셀 `aspect-square`로 변경

### 5. 셀이 너무 커서 어색함

- **원인**: 풀 폭 박스에 셀이 균등 분배되니 셀 사이즈가 과도하게 큼
- **해결**: ConceptGrowthChart와 WeeklyHeatmap을 2단 레이아웃(`lg:grid-cols-2`)으로 배치 → 박스 절반 폭이 되어 셀 크기도 자연스러워짐

### 6. emerald 색상 빌드 누락 (Tailwind v4)

- **원인**: NX monorepo + Tailwind v4 자동 detect가 dashboard 디렉토리의 `bg-emerald-*` 클래스를 못 잡음 (다른 컴포넌트가 emerald를 한 번도 안 써서 derive 불가)
- **해결**: `global.css`에 `@source "../**/*.{ts,tsx,js,jsx,mdx}"` 디렉티브 추가 → 빌드 CSS에 emerald-200/400/600/800 모두 포함 검증
- **메모리 등록**: `feedback_tailwind_v4_source.md`

## 🚧 미해결 이슈 (다음 세션에서 디버깅)

### WeeklyHeatmap 셀에 emerald 색상이 화면에 표시 안 됨

- **알려진 사실**:
  - 빌드된 CSS (dev 모드 `.next/dev/.../global_*.css` 포함)에 `bg-emerald-200/400/600/800` 클래스 모두 포함 (grep으로 검증)
  - DB · RPC 응답 정상 (`select * from get_entry_heatmap('<user_id>', 91)` → `[{"date":"2026-04-26","count":3}]`)
  - 사용자 화면에서는 색상 범례 5개 사각형까지 모두 회색으로 보임
- **남은 가능성**:
  1. 브라우저 CSS 캐시 (강제 새로고침 미시도)
  2. 셀에 클래스가 적용 안 됨 (DOM 검증 미실시)
  3. CSS specificity/override (전역 CSS가 emerald를 덮음)
  4. 응답 데이터가 실제 화면에서 비어있음 (인증 컨텍스트 차이)
- **다음 디버깅 단계**:
  1. 브라우저 hard refresh (Cmd+Shift+R) 후 색상 범례 재확인
  2. DevTools → Elements에서 캘린더 셀의 `class` attribute 확인
  3. Network 탭에서 `/api/dashboard/heatmap?days=91` 응답 본문 확인
  4. 위 결과에 따라 CSS / 매핑 / 인증 중 한 곳으로 좁혀 수정

## 💡 기술적 결정사항 (왜 이 방법을 선택했는가)

- **하이브리드 API 구조** (KPI 묶음 + 차트별 분리): 단일 엔드포인트는 차트 위젯이 무거워질 때 가벼운 KPI까지 함께 지연됨. 위젯 N개 모두 분리는 보일러플레이트 과다. 절충점.
- **RPC 함수**: 이 프로젝트는 이미 `get_user_mindmap`, `search_connections` 등 RPC 패턴을 표준으로 사용 중. streak/누적 계산은 윈도우 함수가 필요해 클라이언트(JS) 계산 비효율적. SQL 캡슐화가 일관성·성능 모두 유리.
- **recharts + Tailwind 그리드 (heatmap 라이브러리 X)**: heatmap 자체는 단순 div 그리드라 라이브러리 도입 비용 > 이득. Tailwind 톤 통일 + 의존성 최소화.
- **2단 레이아웃**: 셀 크기를 사용자 만족 수준으로 조정하면서도 좌우 시각적 균형이 좋아짐.
- **Tailwind v4 `@source` 명시**: NX monorepo + 새 색상 도입 시 자동 detect가 누락될 수 있어, 명시적 `@source`로 재발 방지.
- **2 트랙 병렬 에이전트 dispatch**: 공통 타입 핀으로 백엔드/프론트 디커플 → 동시 작업 가능 → 시간 절감.

## 🔗 관련 이슈/참고

- 선행 PR: #72 (마인드맵 검색 + 카테고리/mastery 필터 + 모바일 대응)
- 후속 작업: Day 15 (Blog + PWA — SSG/SEO/manifest), Day 16+ 별도 스프린트
- 메모리 신규 등록:
  - `project_package_manager.md` — pnpm 사용
  - `feedback_tailwind_v4_source.md` — Tailwind v4 `@source` 명시
- 사용된 superpowers 스킬:
  - `superpowers:brainstorming` — 설계 단계
  - `superpowers:dispatching-parallel-agents` — 백엔드/프론트 동시 dispatch
