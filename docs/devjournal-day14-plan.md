# Day 14 — Dashboard (KPI 카드 + ConceptGrowthChart + WeeklyHeatmap)

> **목표:** 학습 활동을 한눈에 보여주는 대시보드를 도입한다. 상단 KPI 카드 4개와 누적 학습 곡선(라인), 작성 캘린더(GitHub-style heatmap)로 "성장"과 "꾸준함"을 시각화한다.
> **작성일:** 2026-04-27
> **선행:** Day 13 마인드맵 검색/필터/모바일 대응 (PR #72) 완료
> **후속:** Day 15 Blog + PWA (SSG/SEO/manifest), Day 16+ 별도 스프린트로 일기 작성 UX 개선·콘텐츠 내보내기 등 아이데이션 백로그 진행

---

## 🎯 핵심 결정 사항

| 항목               | 결정                                                                            |
| ------------------ | ------------------------------------------------------------------------------- |
| 범위               | KPI 카드 4개 + 차트 2개. 풀 대시보드 위젯(카테고리 도넛 등)은 보류 (프로토타입) |
| KPI 4개            | 총 일기 수 / 학습 개념 수 / 마스터 개념 수 / 연속 작성 일수(streak)             |
| ConceptGrowthChart | **누적 라인 차트**, 최근 90일 고정 (기간 토글 없음 — 프로토타입 범위)           |
| WeeklyHeatmap      | **GitHub contributions 스타일** 7행 × 13열 그리드, 최근 91일                    |
| 인터랙션           | 정적 + 호버 툴팁만. 클릭 액션·라우팅 없음                                       |
| API 구조           | **하이브리드** — KPI 묶음 1개 + 차트 2개 분리 (위젯별 캐시 독립)                |
| 차트 라이브러리    | **recharts** (라인) + **Tailwind 그리드** (heatmap, 라이브러리 X)               |
| 집계 SQL           | Supabase **RPC 함수**로 캡슐화 (기존 mindmap·concepts 패턴과 일관)              |
| 인증               | 모든 엔드포인트 `SupabaseAuthGuard` 적용                                        |
| 테스트             | 백엔드 service 단위 테스트만. E2E·프론트 컴포넌트 테스트 skip                   |

---

## 🧐 왜 단일 엔드포인트가 아니라 하이브리드인가

처음 단일 `GET /api/dashboard/stats`로 묶는 안을 검토했으나 다음 리스크 때문에 폐기:

1. 차트 위젯이 무거워지면 **가벼운 KPI 카드까지 같이 지연**된다.
2. 향후 ConceptGrowthChart에 기간 토글(30/90/전체)을 추가하면 KPI까지 매번 다시 받는 낭비가 생긴다.
3. React Query에서 위젯별 `staleTime`/캐시 키 독립 제어가 불가능해진다.

반대로 위젯 N개 모두 분리하는 안은 보일러플레이트가 크다. 절충점으로 **KPI(가벼운 COUNT 묶음) + 차트별 시계열 분리**로 결정.

---

## 🧐 왜 RPC 함수인가

이 프로젝트는 이미 RPC 패턴을 표준으로 쓰고 있다:

- `apps/devjournal/supabase/migrations/20260405000011_functions.sql`
- `apps/devjournal/supabase/migrations/20260426000015_get_user_mindmap_is_recent.sql`
- `mindmap.service.ts:50` → `rpc('get_user_mindmap', ...)`
- `concepts.service.ts:317` → `rpc('search_connections', ...)`

dashboard도 동일 패턴을 따른다. streak 계산은 윈도우 함수 + 일별 GROUP BY가 필요해 클라이언트(JS)에서 풀면 데이터를 다 받아야 해 비효율적이다. SQL 안에서 한 번에 끝내는 것이 일관성·성능 모두 유리.

단순 COUNT 3개(`totalEntries`, `totalConcepts`, `masteredConcepts`)는 RPC로 빼지 않고 NestJS 서비스에서 `supabase.from(...).select('*', { count: 'exact', head: true })`로 짧게 처리한다.

---

## 📦 변경 파일 / 신규 파일

### 신규

```
packages/types/src/lib/dashboard.ts
apps/devjournal/supabase/migrations/20260427000016_dashboard_rpcs.sql
apps/devjournal/backend/src/dashboard/
├── dashboard.module.ts
├── dashboard.controller.ts
├── dashboard.service.ts
├── dashboard.service.spec.ts
└── dto/
    ├── kpis-response.dto.ts
    ├── concept-growth-response.dto.ts
    └── heatmap-response.dto.ts
apps/devjournal/frontend/src/domains/dashboard/
├── domain/
│   └── dashboard.types.ts
├── infrastructure/
│   └── dashboardApi.ts
├── application/
│   ├── queryKeys.ts
│   ├── useDashboardKpisQuery.ts
│   ├── useConceptGrowthQuery.ts
│   └── useHeatmapQuery.ts
└── presentation/
    ├── DashboardPageView.tsx
    ├── KpiCardGrid.tsx
    ├── KpiCard.tsx
    ├── ConceptGrowthChart.tsx
    └── WeeklyHeatmap.tsx
```

### 수정

```
packages/types/src/index.ts                            ← dashboard 타입 export
apps/devjournal/backend/src/app/app.module.ts          ← DashboardModule 등록
apps/devjournal/frontend/src/app/(app)/dashboard/page.tsx  ← <DashboardPageView /> 한 줄
apps/devjournal/frontend/package.json (또는 root)        ← recharts 추가
apps/devjournal/frontend/src/domains/dashboard/{application,domain,infrastructure,presentation}/index.ts
```

---

## 🗄️ DB / RPC 설계

신규 마이그레이션: `apps/devjournal/supabase/migrations/20260427000016_dashboard_rpcs.sql`

### 1. `get_user_streak()`

오늘부터 거꾸로 일기 작성한 연속 일수. 작성 안 한 날을 만나면 break.

```sql
create or replace function get_user_streak(p_user_id uuid)
returns int
language plpgsql
security invoker
as $$
declare
  v_streak int := 0;
  v_cursor date := current_date;
begin
  loop
    if exists (
      select 1 from entries
      where user_id = p_user_id
        and deleted_at is null
        and created_at::date = v_cursor
    ) then
      v_streak := v_streak + 1;
      v_cursor := v_cursor - 1;
    else
      -- 오늘 안 썼어도 어제까지 연속이면 streak 유지 가능 → 첫 루프에서만 허용
      if v_cursor = current_date then
        v_cursor := v_cursor - 1;
        continue;
      end if;
      exit;
    end if;
  end loop;
  return v_streak;
end;
$$;
```

> **비고:** 오늘 아직 안 썼지만 어제까지 연속이면 streak 유지 (UX 측면에서 자정 직후 streak 0 표시 회피).

### 2. `get_concept_growth(p_user_id uuid, p_days int)`

최근 `p_days` 일의 일별 누적 학습 개념 수. 데이터가 없는 날도 빈 셀 없이 캘린더 시리즈로 채운다.

```sql
create or replace function get_concept_growth(p_user_id uuid, p_days int default 90)
returns table(date date, cumulative int)
language sql
security invoker
as $$
  with day_series as (
    select generate_series(
      current_date - (p_days - 1),
      current_date,
      interval '1 day'
    )::date as day
  ),
  daily as (
    select learned_at::date as day, count(*) as new_count
    from user_concepts
    where user_id = p_user_id
      and learned_at::date >= current_date - (p_days - 1)
    group by 1
  ),
  baseline as (
    -- p_days 시작 이전까지의 누적 (시작점 보정)
    select count(*)::int as base
    from user_concepts
    where user_id = p_user_id
      and learned_at::date < current_date - (p_days - 1)
  )
  select
    s.day as date,
    (select base from baseline)
      + sum(coalesce(d.new_count, 0))::int over (order by s.day) as cumulative
  from day_series s
  left join daily d on d.day = s.day
  order by s.day;
$$;
```

### 3. `get_entry_heatmap(p_user_id uuid, p_days int)`

최근 `p_days` 일의 일별 일기 작성 수. 0인 날은 응답에 포함되지 않음 (프론트에서 채움).

```sql
create or replace function get_entry_heatmap(p_user_id uuid, p_days int default 91)
returns table(date date, count int)
language sql
security invoker
as $$
  select created_at::date as date, count(*)::int as count
  from entries
  where user_id = p_user_id
    and deleted_at is null
    and created_at::date >= current_date - (p_days - 1)
  group by 1
  order by 1;
$$;
```

> **RLS:** 함수가 `security invoker`라 호출자 권한으로 실행됨. 기존 `entries`/`user_concepts` RLS 정책이 그대로 적용되어 다른 사용자 데이터 노출 없음.

---

## 🌐 백엔드 API

전부 `SupabaseAuthGuard` 적용. 컨트롤러 prefix `dashboard`.

### `GET /api/dashboard/kpis`

```typescript
// kpis-response.dto.ts
export class KpisResponseDto {
  totalEntries: number;
  totalConcepts: number;
  masteredConcepts: number;
  currentStreak: number;
}
```

서비스 구현 요지:

```typescript
async getKpis(userId: string): Promise<KpisResponseDto> {
  const [entries, concepts, mastered, streak] = await Promise.all([
    this.supabase.admin
      .from('entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null),
    this.supabase.admin
      .from('user_concepts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    this.supabase.admin
      .from('user_concepts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('mastery_level', 'mastered'),
    this.supabase.admin.rpc('get_user_streak', { p_user_id: userId }),
  ]);
  // 에러 처리 + count 0 fallback
  return {
    totalEntries: entries.count ?? 0,
    totalConcepts: concepts.count ?? 0,
    masteredConcepts: mastered.count ?? 0,
    currentStreak: streak.data ?? 0,
  };
}
```

### `GET /api/dashboard/concept-growth?days=90`

```typescript
export class ConceptGrowthPointDto {
  date: string; // 'YYYY-MM-DD'
  cumulative: number;
}
// Response: ConceptGrowthPointDto[]
```

`days` 쿼리 파라미터는 1–365 범위 검증(class-validator). 기본 90.

### `GET /api/dashboard/heatmap?days=91`

```typescript
export class HeatmapCellDto {
  date: string;
  count: number;
}
// Response: HeatmapCellDto[]
```

`days` 1–365, 기본 91 (13주 × 7일).

> **모듈 등록:** `app.module.ts`의 `imports`에 `DashboardModule` 추가.

---

## 🖥️ 프론트엔드 설계

### 도메인 구조 (mindmap 도메인 패턴 그대로)

```
domains/dashboard/
├── application/   ← React Query 훅, queryKeys
├── domain/        ← 타입 (공유 타입을 re-export하거나 필요 시 ViewModel)
├── infrastructure/← API fetcher
└── presentation/  ← UI 컴포넌트
```

### `application/queryKeys.ts`

```typescript
export const dashboardKeys = {
  all: ['dashboard'] as const,
  kpis: () => [...dashboardKeys.all, 'kpis'] as const,
  conceptGrowth: (days: number) =>
    [...dashboardKeys.all, 'concept-growth', days] as const,
  heatmap: (days: number) => [...dashboardKeys.all, 'heatmap', days] as const,
};
```

### `infrastructure/dashboardApi.ts`

```typescript
export const dashboardApi = {
  getKpis: () => http.get<DashboardKpis>('/dashboard/kpis'),
  getConceptGrowth: (days = 90) =>
    http.get<ConceptGrowthPoint[]>(`/dashboard/concept-growth?days=${days}`),
  getHeatmap: (days = 91) =>
    http.get<HeatmapCell[]>(`/dashboard/heatmap?days=${days}`),
};
```

### Presentation

#### `DashboardPageView.tsx` (얇은 컴포지션)

```tsx
<section className="space-y-6 p-6">
  <h1 className="text-2xl font-semibold">대시보드</h1>
  <KpiCardGrid />
  <ConceptGrowthChart />
  <WeeklyHeatmap />
</section>
```

#### `KpiCard.tsx` / `KpiCardGrid.tsx`

- 4열 그리드(`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`)
- 카드: 라벨, 큰 숫자, 작은 보조 아이콘
- 로딩: skeleton (`animate-pulse` 박스)
- 빈 상태: `0` 그대로 표시 (특수 분기 X)

#### `ConceptGrowthChart.tsx`

- recharts `<ResponsiveContainer>` + `<LineChart>` + `<Line type="monotone" dataKey="cumulative" />`
- 호버 툴팁: 날짜 + 누적 개념 수
- 데이터가 0인 경우: "아직 학습한 개념이 없어요. 일기를 작성해보세요" + `/journal` 링크
- 카드 컨테이너로 감싸 KPI와 톤 통일

#### `WeeklyHeatmap.tsx`

- 91일을 7행(요일) × 13열(주)로 매핑
- 셀 색상 5단계: count 기준
  - 0 → `bg-gray-100`
  - 1 → `bg-emerald-200`
  - 2 → `bg-emerald-400`
  - 3 → `bg-emerald-600`
  - 4+ → `bg-emerald-800`
- 셀 호버 툴팁: `{date} · {count}편`
- 위쪽에 월 라벨, 왼쪽에 요일 라벨(월/수/금만 표기로 노이즈 ↓)
- 빈 상태: 그리드는 그대로 표시(전부 회색) + 안내 텍스트 + `/journal` 링크

### 페이지 진입점 (얇게)

```tsx
// app/(app)/dashboard/page.tsx
import { DashboardPageView } from '@/domains/dashboard/presentation';

export default function DashboardPage() {
  return <DashboardPageView />;
}
```

### 상태 처리 정책

| 상태      | 처리                                                       |
| --------- | ---------------------------------------------------------- |
| 로딩      | 위젯별 skeleton                                            |
| 에러      | 위젯별 카드 안에 "데이터를 불러올 수 없어요" + 재시도 버튼 |
| 빈 데이터 | KPI는 0 그대로, 차트/히트맵은 안내 + `/journal` CTA        |

**빈 상태 판정 기준:**

- ConceptGrowthChart: `get_concept_growth`는 `day_series`로 항상 N일치 row를 반환하므로 빈 배열이 아님. **마지막 포인트의 `cumulative`가 0인 경우** 빈 상태로 판단 (= 누적 학습 개념 0).
- WeeklyHeatmap: RPC가 작성 있는 날만 반환 → 프론트에서 91일 캘린더 grid를 만들고 `count`를 매핑. **모든 셀의 `count`가 0인 경우** 빈 상태.
- KPI: 0 자체를 의미 있는 값으로 표시 (특수 분기 없음).

---

## 🔗 공통 타입 (`packages/types`)

```typescript
// packages/types/src/lib/dashboard.ts
export interface DashboardKpis {
  totalEntries: number;
  totalConcepts: number;
  masteredConcepts: number;
  currentStreak: number;
}

export interface ConceptGrowthPoint {
  date: string; // 'YYYY-MM-DD'
  cumulative: number;
}

export interface HeatmapCell {
  date: string; // 'YYYY-MM-DD'
  count: number;
}
```

`packages/types/src/index.ts`에 `export * from './lib/dashboard';` 추가.

> **단일 진실의 원천(Single Source of Truth):** 백엔드 DTO가 위 인터페이스를 implement, 프론트는 위 인터페이스를 직접 import. 백엔드/프론트 디커플 + 병렬 작업의 인터페이스 핀.

---

## 🤝 병렬 실행 트랙 (에이전트 분할)

다음 흐름으로 실행한다. **공통 타입 정의가 두 트랙의 핀**.

```
[메인 세션]  Step 0: packages/types/dashboard.ts + index.ts export 추가 + 빌드
                ↓
   ┌──────────────────────────┬──────────────────────────┐
   │  Track A (백엔드 에이전트)  │  Track B (프론트 에이전트)  │
   │                          │                          │
   │  A1. 마이그레이션 작성       │  B1. recharts 설치         │
   │  A2. dashboard 모듈/DTO   │  B2. domain/types 정의      │
   │  A3. service + RPC 호출   │  B3. presentation 4개 컴포  │
   │  A4. controller          │     - mock data 사용       │
   │  A5. service 단위 테스트   │  B4. application 훅(서버 미준비라도 fetcher만 작성) │
   │  A6. AppModule 등록       │  B5. infrastructure api    │
   └──────────────────────────┴──────────────────────────┘
                ↓
[메인 세션] Step F: hooks ↔ API 실제 연결, 페이지 진입점, 수동 검증, work-log
```

### 트랙 간 공유 인터페이스

- 응답 타입: `packages/types/dashboard.ts`의 `DashboardKpis` / `ConceptGrowthPoint[]` / `HeatmapCell[]`
- 엔드포인트: `GET /api/dashboard/{kpis|concept-growth|heatmap}` (Track B는 fetcher만 작성하고 mock으로 UI 검증)

### 분할 규칙

- 두 트랙 모두 **신규 파일만 만들고 공통 모듈/설정 충돌 없도록** 작업한다.
- `app.module.ts`(백엔드)와 `dashboard/page.tsx`(프론트) 같은 **공통 파일은 메인 세션에서만 수정**한다 (Step 0 또는 Step F).
- `packages/types/src/index.ts` re-export는 Step 0에서만 수정.

### 직렬 실행도 가능

병렬이 부담스러우면 단일 세션 직렬 실행도 OK. 그 경우 Step 순서:

1. 공통 타입 → 2. 마이그레이션 → 3. 백엔드 모듈 → 4. 백엔드 테스트 → 5. recharts 설치 → 6. 프론트 도메인 → 7. 페이지 연결 → 8. 수동 검증.

---

## ✅ 작업 순서 (직렬 기준)

| #   | 단계                                                                                        | 비고                            |
| --- | ------------------------------------------------------------------------------------------- | ------------------------------- |
| 1   | `packages/types/dashboard.ts` 추가 + index.ts export                                        | 빌드 확인                       |
| 2   | `20260427000016_dashboard_rpcs.sql` 작성                                                    | 로컬 Supabase에 적용            |
| 3   | DashboardModule (module/service/controller/dto)                                             | `SupabaseAuthGuard` 적용        |
| 4   | `dashboard.service.spec.ts` 단위 테스트                                                     | RPC/from 모킹                   |
| 5   | `app.module.ts`에 DashboardModule 등록                                                      |                                 |
| 6   | recharts 의존성 추가 (`npm i recharts -w devjournal-frontend`)                              |                                 |
| 7   | 프론트 domain/infrastructure/application                                                    | API 클라이언트 + React Query 훅 |
| 8   | 프론트 presentation (KpiCard/Grid → ConceptGrowthChart → WeeklyHeatmap → DashboardPageView) |                                 |
| 9   | `app/(app)/dashboard/page.tsx`를 `<DashboardPageView />`로 교체                             |                                 |
| 10  | 수동 검증 (아래 체크리스트)                                                                 |                                 |
| 11  | 작업 일지 작성 + 커밋 + PR                                                                  |                                 |

---

## 🧪 테스트 범위

- ✅ 백엔드 단위 테스트: `dashboard.service.spec.ts`
  - `getKpis`: SupabaseClient의 `from`/`rpc`가 올바른 인자로 호출되는지, count fallback 동작
  - `getConceptGrowth`/`getHeatmap`: RPC 호출 시 `p_user_id`, `p_days` 정확히 전달되는지
  - 에러 발생 시 적절한 예외 throw
- ⏭️ E2E 스킵 (P2 우선순위 + 시각 위주 페이지)
- ⏭️ 프론트 컴포넌트 테스트 스킵 (검증 가치 < 비용, 수동 검증으로 대체)

---

## 🧷 의존성

추가:

- `recharts` (devjournal-frontend)

이미 사용 중:

- `@tanstack/react-query` (다른 도메인 동일 패턴)
- `tailwindcss` (heatmap 그리드)
- `class-validator` (DTO 검증)

---

## 📝 수동 검증 체크리스트

로컬에서 `npm run dev` 후 `/dashboard` 진입:

- [ ] KPI 카드 4개가 모두 표시됨 (총 일기 / 학습 개념 / 마스터 개념 / 연속 작성)
- [ ] 숫자가 실제 DB와 일치 (백엔드에서 직접 카운트와 대조)
- [ ] ConceptGrowthChart에 90일치 라인이 표시됨, 우상향 또는 평탄
- [ ] 라인 호버 시 툴팁이 표시됨 (날짜 + 누적 수)
- [ ] WeeklyHeatmap이 7행 × 13열 그리드로 표시됨
- [ ] 작성한 날 셀이 emerald 톤으로 진해지고, 호버 시 툴팁 표시
- [ ] 모바일(< 640px)에서 KPI 카드가 2열 그리드로 줄어듦
- [ ] 새 계정으로 진입 시 빈 상태 안내 + `/journal` 링크 표시
- [ ] streak: 오늘 작성하지 않았어도 어제까지 연속이면 유지, 어제도 안 썼으면 0
- [ ] 네트워크 탭에서 3개 엔드포인트가 호출됨

---

## 📚 작업 일지 / PR 정책

- 작업 일지 위치: `docs/work-logs/2026-04-27-feature-devjournal-day14-dashboard.md`
- 커밋 메시지: `feat(devjournal): Day 14 — Dashboard KPI + ConceptGrowthChart + WeeklyHeatmap`
- PR 베이스: `develop`
- 병렬 실행 시: 두 트랙이 같은 feature 브랜치에서 작업하거나, 하위 브랜치를 만들어 메인 세션이 머지하는 방식 중 후자가 충돌 안전 (선택)

---

## 🚧 명시적으로 범위 외

다음은 Day 14 범위에서 빠진다:

- 카테고리별 개념 분포 도넛 차트
- 최근 학습 개념 리스트 위젯
- 마스터리 분포 막대
- 차트 기간 토글(30/90/전체) UI
- 셀/포인트 클릭 → 일기 라우팅
- 다크모드 별도 색 팔레트
- 차트 export(PNG/CSV)
- LinkedIn/Velog 내보내기 (Day 16+ 별도 스프린트)

위 항목들은 사용자 피드백 후 다음 스프린트에서 재논의.
