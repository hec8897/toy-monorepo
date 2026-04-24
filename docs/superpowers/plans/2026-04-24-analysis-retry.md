# 분석 재시도 기능 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gemini API 장애 시 자동 1회 재시도 + 사용자 수동 재시도 버튼 추가

**Architecture:** `triggerAnalysis` 내부에 `withRetry` 헬퍼로 Step 1/2를 각각 1회 재시도. 별도 `POST /entries/:id/retry-analysis` 엔드포인트로 `failed` 상태 entry를 `pending`으로 초기화 후 재분석 트리거. 프론트엔드는 `failed` 상태에서 패널을 계속 표시하고 재시도 버튼 노출, 클릭 시 엔드포인트 호출 → entry 쿼리 invalidate → SSE 자동 재연결.

**Tech Stack:** NestJS + Supabase (백엔드), Next.js + TanStack Query + EventSource API (프론트엔드)

---

## 변경 파일 목록

| 파일                                                                                             | 역할                                                                         |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `apps/devjournal/backend/src/journal/journal.service.ts`                                         | `withRetry` 헬퍼 추가, `triggerAnalysis`에 적용, `retryAnalysis` 메서드 신설 |
| `apps/devjournal/backend/src/journal/journal.controller.ts`                                      | `POST :id/retry-analysis` 엔드포인트 추가                                    |
| `apps/devjournal/frontend/src/domains/journal/infrastructure/journalApi.ts`                      | `retryAnalysis` API 함수 추가                                                |
| `apps/devjournal/frontend/src/domains/journal/application/useRetryAnalysis.ts`                   | 신규 — useMutation 훅                                                        |
| `apps/devjournal/frontend/src/domains/journal/application/index.ts`                              | `useRetryAnalysis` export 추가                                               |
| `apps/devjournal/frontend/src/domains/journal/presentation/components/AnalysisProgressPanel.tsx` | `onRetry` / `isRetrying` prop + 버튼 UI                                      |
| `apps/devjournal/frontend/src/domains/journal/presentation/EntryDetailPageView.tsx`              | `failed` 상태 패널 표시 + retry 연결                                         |

---

## Task 1: 백엔드 — `withRetry` 헬퍼 + `triggerAnalysis` 적용

**Files:**

- Modify: `apps/devjournal/backend/src/journal/journal.service.ts`

- [ ] **Step 1: `withRetry` private 메서드 추가**

`JournalService` 클래스 내 `cleanupSubject` 메서드 아래에 추가:

```typescript
private async withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  delayMs = 2000,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    this.logger.warn(`[${label}] 실패, ${delayMs}ms 후 재시도...`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return fn();
  }
}
```

- [ ] **Step 2: `triggerAnalysis` Step 1에 `withRetry` 적용**

`triggerAnalysis` 내 Step 1 블록을 다음으로 교체:

```typescript
// ── Step 1: 개념 추출 ──────────────────────────────────────────────────
this.emitSSE(entryId, 'progress', {
  step: 1,
  message: '개념 추출 중...',
});

const { concepts, entry_summary } = await this.withRetry(
  () => this.agentService.extractConcepts(content),
  `Step1:${entryId}`,
);
```

- [ ] **Step 3: `triggerAnalysis` Step 2에 `withRetry` 적용**

Step 2 내부 `try` 블록에서 `agentService.searchConnections` 호출을 다음으로 교체:

```typescript
const { connections } = await this.withRetry(
  () => this.agentService.searchConnections(conceptNames, candidates),
  `Step2:${entryId}`,
);
```

- [ ] **Step 4: 동작 확인**

백엔드 실행 후 로그 확인:

```bash
cd apps/devjournal/backend && npx nx run devjournal-backend:serve
```

503/429 에러 발생 시 `[Step1:xxx] 실패, 2000ms 후 재시도...` 로그가 찍히면 정상.

- [ ] **Step 5: 커밋**

```bash
git add apps/devjournal/backend/src/journal/journal.service.ts
git commit -m "feat(devjournal): triggerAnalysis에 withRetry 헬퍼 적용 (자동 1회 재시도)"
```

---

## Task 2: 백엔드 — `retryAnalysis` 서비스 메서드 + 컨트롤러 엔드포인트

**Files:**

- Modify: `apps/devjournal/backend/src/journal/journal.service.ts`
- Modify: `apps/devjournal/backend/src/journal/journal.controller.ts`

- [ ] **Step 1: `ConflictException` import 추가**

`journal.service.ts` 상단 import를 수정:

```typescript
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
```

- [ ] **Step 2: `retryAnalysis` 서비스 메서드 추가**

`JournalService`의 `remove` 메서드 아래, `// ─── 내부 메서드` 주석 위에 추가:

```typescript
async retryAnalysis(userId: string, entryId: string): Promise<void> {
  const { data: entry, error } = await this.supabase.admin
    .from('entries')
    .select('id, analysis_status, content')
    .eq('id', entryId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  if (error || !entry) {
    throw new NotFoundException(`Entry #${entryId} not found`);
  }

  if (entry.analysis_status !== 'failed') {
    throw new ConflictException(
      '분석 실패 상태인 경우에만 재시도할 수 있습니다.',
    );
  }

  await this.supabase.admin
    .from('entries')
    .update({ analysis_status: 'pending', analysis_error: null })
    .eq('id', entryId);

  this.createSubject(entryId);
  void this.triggerAnalysis(entryId, userId, entry.content);
}
```

- [ ] **Step 3: `POST :id/retry-analysis` 엔드포인트 추가**

`journal.controller.ts`에서 `@Delete(':id')` 블록 위에 추가:

```typescript
@Post(':id/retry-analysis')
@HttpCode(HttpStatus.ACCEPTED)
retryAnalysis(
  @Req() req: AuthenticatedRequest,
  @Param('id') id: string,
): Promise<void> {
  return this.journalService.retryAnalysis(req.user.id, id);
}
```

- [ ] **Step 4: 엔드포인트 동작 수동 확인**

백엔드 실행 상태에서:

```bash
# failed 상태 entry가 있어야 함. 토큰은 Supabase 세션에서 복사.
curl -X POST http://localhost:3005/api/entries/<ENTRY_ID>/retry-analysis \
  -H "Authorization: Bearer <TOKEN>"
# 기대값: HTTP 202, 빈 응답
```

- [ ] **Step 5: 커밋**

```bash
git add apps/devjournal/backend/src/journal/journal.service.ts \
        apps/devjournal/backend/src/journal/journal.controller.ts
git commit -m "feat(devjournal): POST /entries/:id/retry-analysis 엔드포인트 추가"
```

---

## Task 3: 프론트엔드 — API 함수 + `useRetryAnalysis` 훅

**Files:**

- Modify: `apps/devjournal/frontend/src/domains/journal/infrastructure/journalApi.ts`
- Create: `apps/devjournal/frontend/src/domains/journal/application/useRetryAnalysis.ts`
- Modify: `apps/devjournal/frontend/src/domains/journal/application/index.ts`

- [ ] **Step 1: `journalApi.ts`에 `retryAnalysis` 추가**

기존 `deleteEntry` 아래에 추가:

```typescript
retryAnalysis: (id: string) =>
  api.post(`/entries/${id}/retry-analysis`),
```

- [ ] **Step 2: `useRetryAnalysis.ts` 신규 생성**

```typescript
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { journalApi } from '@/domains/journal/infrastructure/journalApi';

import { journalQueryKeys } from './queryKeys';

export function useRetryAnalysis(entryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => journalApi.retryAnalysis(entryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: journalQueryKeys.detail(entryId),
      });
    },
  });
}
```

- [ ] **Step 3: `index.ts`에 export 추가**

```typescript
export { useRetryAnalysis } from '@/domains/journal/application/useRetryAnalysis';
```

- [ ] **Step 4: 커밋**

```bash
git add apps/devjournal/frontend/src/domains/journal/infrastructure/journalApi.ts \
        apps/devjournal/frontend/src/domains/journal/application/useRetryAnalysis.ts \
        apps/devjournal/frontend/src/domains/journal/application/index.ts
git commit -m "feat(devjournal): useRetryAnalysis 훅 추가"
```

---

## Task 4: 프론트엔드 — `AnalysisProgressPanel` 재시도 버튼 UI

**Files:**

- Modify: `apps/devjournal/frontend/src/domains/journal/presentation/components/AnalysisProgressPanel.tsx`

- [ ] **Step 1: Props 타입에 `onRetry` / `isRetrying` 추가 후 에러 UI 수정**

파일 전체를 다음으로 교체:

```typescript
import type { AnalysisState } from '@/domains/journal/application/useJournalAnalysis';

interface StepItemProps {
  step: 1 | 2;
  label: string;
  currentStep: 0 | 1 | 2;
  isComplete: boolean;
}

function StepItem({ step, label, currentStep, isComplete }: StepItemProps) {
  const isActive = currentStep === step;
  const isDone = isComplete || currentStep > step;

  return (
    <div className="flex items-center gap-2">
      <div
        className={[
          'flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium shrink-0',
          isDone
            ? 'bg-green-100 text-green-600'
            : isActive
              ? 'bg-blue-100 text-blue-600'
              : 'bg-gray-100 text-gray-400',
        ].join(' ')}
      >
        {isDone ? '✓' : step}
      </div>
      <span
        className={[
          'text-sm',
          isDone
            ? 'text-green-600'
            : isActive
              ? 'text-blue-600 font-medium'
              : 'text-gray-400',
        ].join(' ')}
      >
        {label}
      </span>
      {isActive && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
      )}
    </div>
  );
}

interface AnalysisProgressPanelProps {
  analysisState: AnalysisState;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function AnalysisProgressPanel({
  analysisState,
  onRetry,
  isRetrying,
}: AnalysisProgressPanelProps) {
  const { currentStep, concepts, connections, isComplete, error } =
    analysisState;

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-base">⚠️</span>
          <h2 className="text-sm font-semibold text-red-700">분석 실패</h2>
        </div>
        <p className="text-sm text-red-500">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors"
          >
            {isRetrying && (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
            )}
            재시도
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-base">🤖</span>
        <h2 className="text-sm font-semibold text-blue-700">
          {isComplete ? 'AI 분석 완료' : 'AI 분석 중...'}
        </h2>
      </div>

      <div className="space-y-2">
        <StepItem
          step={1}
          label="개념 추출"
          currentStep={currentStep}
          isComplete={isComplete}
        />
        <StepItem
          step={2}
          label="연결 관계 분석"
          currentStep={currentStep}
          isComplete={isComplete}
        />
      </div>

      {concepts.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-blue-600">
            추출된 개념 ({concepts.length}개)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {concepts.map((c) => (
              <span
                key={c.name}
                className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-200"
              >
                {c.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {connections.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-blue-600">
            발견된 연결 ({connections.length}개)
          </p>
          <div className="space-y-1">
            {connections.slice(0, 3).map((conn, i) => (
              <p key={i} className="text-xs text-blue-500">
                {conn.from_concept} → {conn.to_concept}
              </p>
            ))}
            {connections.length > 3 && (
              <p className="text-xs text-blue-400">
                +{connections.length - 3}개 더
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/devjournal/frontend/src/domains/journal/presentation/components/AnalysisProgressPanel.tsx
git commit -m "feat(devjournal): AnalysisProgressPanel 재시도 버튼 UI 추가"
```

---

## Task 5: 프론트엔드 — `EntryDetailPageView` failed 상태 연결

**Files:**

- Modify: `apps/devjournal/frontend/src/domains/journal/presentation/EntryDetailPageView.tsx`

- [ ] **Step 1: 파일 전체 교체**

```typescript
'use client';

import Link from 'next/link';

import {
  useGetEntry,
  useGetEntryConcepts,
  useJournalAnalysis,
  useRetryAnalysis,
} from '@/domains/journal/application';
import type { AnalysisState } from '@/domains/journal/application';

import { AnalysisProgressPanel } from './components/AnalysisProgressPanel';
import { EntryContent } from './components/EntryContent';
import { LearnedConceptsSection } from './components/LearnedConceptsSection';

interface EntryDetailPageViewProps {
  entryId: string;
}

export function EntryDetailPageView({ entryId }: EntryDetailPageViewProps) {
  const { data: entry, isLoading, isError } = useGetEntry(entryId);
  const { data: concepts, isLoading: isConceptsLoading } = useGetEntryConcepts(
    entryId,
    entry?.analysis_status,
  );
  const analysisState = useJournalAnalysis(entryId, entry?.analysis_status);
  const { mutate: retryAnalysis, isPending: isRetrying } =
    useRetryAnalysis(entryId);

  const isAnalyzing =
    entry?.analysis_status === 'pending' ||
    entry?.analysis_status === 'processing';
  const isFailed = entry?.analysis_status === 'failed';

  // 페이지 진입 시 SSE 없이 DB 에러를 fallback으로 표시
  const effectiveAnalysisState: AnalysisState = {
    ...analysisState,
    error:
      analysisState.error ??
      (isFailed ? (entry?.analysis_error ?? '분석에 실패했습니다.') : null),
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
        <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
        <div className="h-8 w-2/3 animate-pulse rounded bg-gray-100" />
        <div className="h-48 animate-pulse rounded bg-gray-100" />
      </div>
    );
  }

  if (isError || !entry) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-red-500">
          일기를 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      <Link
        href="/journal"
        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        ← 목록으로
      </Link>

      <EntryContent entry={entry} />

      {(isAnalyzing || isFailed) && (
        <AnalysisProgressPanel
          analysisState={effectiveAnalysisState}
          onRetry={isFailed ? retryAnalysis : undefined}
          isRetrying={isRetrying}
        />
      )}

      {!isAnalyzing && !isFailed && (
        <LearnedConceptsSection
          status={entry.analysis_status}
          concepts={concepts}
          isLoading={isConceptsLoading}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: 타입 빌드 확인**

```bash
cd /Users/dawoon/Desktop/dev/toy-monorepo
npx nx run devjournal-frontend:type-check
# 기대값: 에러 없음
```

- [ ] **Step 3: 커밋**

```bash
git add apps/devjournal/frontend/src/domains/journal/presentation/EntryDetailPageView.tsx
git commit -m "feat(devjournal): failed 상태에서 재시도 버튼 연결"
```

---

## 전체 흐름 수동 검증

- [ ] **백엔드 + 프론트엔드 동시 실행**

```bash
cd /Users/dawoon/Desktop/dev/toy-monorepo
npm run dev
```

- [ ] **시나리오 검증**

1. 일기 작성 → 분석 진행 패널 표시 확인
2. (분석 실패 entry가 있는 경우) 해당 entry 상세 페이지 이동 → 에러 메시지 + 재시도 버튼 표시 확인
3. 재시도 버튼 클릭 → 버튼 disabled + 스피너 표시 → 패널이 분석 중 상태로 전환 확인
4. 분석 완료 후 → 개념 목록 표시 확인
