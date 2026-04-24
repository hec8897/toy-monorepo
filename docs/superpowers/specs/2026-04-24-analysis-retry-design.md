# 분석 재시도 기능 설계

## 개요

- **목적**: Gemini API 일시 장애(503 등)로 분석이 실패했을 때 자동 1회 재시도 + 사용자 수동 재시도 버튼 제공
- **범위**: 백엔드 `journal.service.ts` / `journal.controller.ts`, 프론트엔드 `journalApi.ts` / 새 훅 / `AnalysisProgressPanel.tsx` / `EntryDetailPageView.tsx`
- **제외**: DB 스키마 변경(retry_count 등), 다단계 exponential backoff

---

## 백엔드

### 자동 재시도 (1회)

`journal.service.ts`의 `triggerAnalysis` 내부에 재시도 래퍼를 추가한다.

```
extractConcepts 또는 searchConnections 실패
  → 2초 대기
  → 동일 로직 1회 재시도
  → 재시도도 실패 시 analysis_status = 'failed' 처리
```

- 재시도 중에도 SSE `progress` 이벤트를 유지해 프론트가 "분석 중" 상태를 보인다.
- 재시도 로직은 `triggerAnalysis` 안의 private 헬퍼(`withRetry`)로 분리한다.
- Step 1(개념 추출)과 Step 2(연결 분석)는 독립적으로 재시도 적용한다.
  - Step 1 실패 시 재시도 → 그래도 실패 시 전체 `failed`
  - Step 2 실패 시 재시도 → 그래도 실패 시 partial 완료(기존 동작 유지)

### 수동 재시도 엔드포인트

```
POST /entries/:id/retry-analysis
Guard: SupabaseAuthGuard (기존과 동일)
```

**동작**:

1. entry 소유권 및 `analysis_status === 'failed'` 확인 → 아니면 409 Conflict
2. DB: `analysis_status = 'pending'`, `analysis_error = null` 초기화
3. `createSubject(entryId)` 호출로 SSE Subject 재생성
4. `triggerAnalysis` fire-and-forget 재실행
5. 202 Accepted 반환 (body 없음)

**에러 케이스**:

- entry 없음 → 404
- status가 `failed`가 아님 → 409 Conflict

---

## 프론트엔드

### journalApi.ts

```ts
retryAnalysis: (id: string) =>
  api.post(`/entries/${id}/retry-analysis`).then((r) => r.data),
```

### useRetryAnalysis.ts (신규)

```
useMutation wrapper:
  - retryAnalysis(entryId) 호출
  - 성공 시 journalQueryKeys.detail(entryId) invalidate
  - entry의 analysis_status가 'pending'으로 갱신되면
    useJournalAnalysis의 useEffect가 자동으로 SSE 재연결
```

### AnalysisProgressPanel.tsx

에러 상태 UI에 재시도 버튼 추가:

```
⚠️ 분석 실패
<에러 메시지>
[재시도]  ← 버튼 (onClick: onRetry prop 호출)
```

- `onRetry?: () => void` prop 추가
- 버튼 클릭 시 `isPending` 동안 disabled + 로딩 스피너

### EntryDetailPageView.tsx

```
기존: isAnalyzing일 때만 AnalysisProgressPanel 렌더링
변경: isAnalyzing || entry.analysis_status === 'failed' 일 때 렌더링
```

- `useRetryAnalysis` 훅 사용, `mutate` 함수를 `AnalysisProgressPanel`의 `onRetry`로 전달

---

## 데이터 흐름 (수동 재시도)

```
[재시도 버튼 클릭]
  → POST /entries/:id/retry-analysis
  → entry.analysis_status = 'pending' (DB)
  → 202 반환
  → 프론트: entry 쿼리 invalidate
  → entry.analysis_status 가 'pending'으로 갱신됨
  → useJournalAnalysis useEffect 재실행 (initialStatus 변경)
  → SSE 재연결
  → 분석 진행 이벤트 수신
```

---

## 변경 파일 목록

| 파일                                                                             | 변경 유형                                                |
| -------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `backend/src/journal/journal.service.ts`                                         | 수정 — `withRetry` 헬퍼 + retry 엔드포인트 서비스 메서드 |
| `backend/src/journal/journal.controller.ts`                                      | 수정 — `POST :id/retry-analysis` 엔드포인트 추가         |
| `frontend/src/domains/journal/infrastructure/journalApi.ts`                      | 수정 — `retryAnalysis` 추가                              |
| `frontend/src/domains/journal/application/useRetryAnalysis.ts`                   | 신규                                                     |
| `frontend/src/domains/journal/application/index.ts`                              | 수정 — export 추가                                       |
| `frontend/src/domains/journal/presentation/components/AnalysisProgressPanel.tsx` | 수정 — `onRetry` prop + 버튼 UI                          |
| `frontend/src/domains/journal/presentation/EntryDetailPageView.tsx`              | 수정 — failed 상태 패널 표시 + onRetry 연결              |
