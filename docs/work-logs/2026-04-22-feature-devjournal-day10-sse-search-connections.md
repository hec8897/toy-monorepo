# 2026-04-22 feature/devjournal-day10-sse-search-connections 작업 일지

## 📋 작업 개요

- **브랜치**: `feature/devjournal-day10-sse-search-connections`
- **작업 일자**: 2026-04-22
- **목적**: 일기 분석 결과를 SSE(Server-Sent Events)로 실시간 스트리밍하고, pgvector 유사도 검색 + Gemini function calling으로 개념 간 연결 관계를 분석하는 파이프라인 구현

## ✅ 완료된 작업

- `ConnectionsService` 신규 구현 (concept 이름 → ID 조회 후 connections 테이블 upsert)
- `AgentService.searchConnections()` 추가 (SEARCH_CONNECTIONS_TOOL + 모델 폴백)
- `ConceptsService.findCandidateConnections()` 추가 (pgvector `match_concepts` RPC 활용)
- `JournalService` 리팩토링 — RxJS Subject 기반 SSE pub/sub 구조
- `JournalController` — `@Sse(':id/analysis')` 엔드포인트 추가
- `SupabaseAuthGuard` — `?token=` 쿼리 파라미터 fallback 추가 (EventSource 인증용)
- `useJournalAnalysis` 훅 신규 구현 (EventSource SSE 구독)
- `AnalysisProgressPanel` 컴포넌트 신규 구현 (Step 1/2 진행 상태 + 실시간 미리보기)
- `EntryDetailPageView` 업데이트 — 분석 중 패널 / 완료 후 개념 목록 조건부 렌더

## 🔧 주요 변경사항

| 파일                                              | 변경 내용                                                  |
| ------------------------------------------------- | ---------------------------------------------------------- |
| `backend/src/connections/connections.service.ts`  | 🆕 신규 — upsertBatch, findByConceptIds                    |
| `backend/src/connections/connections.module.ts`   | 🆕 신규                                                    |
| `backend/src/agent/agent.service.ts`              | SEARCH_CONNECTIONS_TOOL + searchConnections() 추가         |
| `backend/src/concepts/concepts.service.ts`        | findCandidateConnections() 추가 (pgvector N+N RPC)         |
| `backend/src/journal/journal.service.ts`          | Subject 맵 + TTL 타이머 + emitSSE/triggerAnalysis 리팩토링 |
| `backend/src/journal/journal.controller.ts`       | @Sse(':id/analysis') 엔드포인트 추가                       |
| `backend/src/auth/supabase-auth.guard.ts`         | extractToken()에 ?token= 쿼리 파라미터 fallback            |
| `backend/tsconfig.json` + `webpack.config.js`     | @devjournal/types 경로 alias 추가                          |
| `frontend/application/useJournalAnalysis.ts`      | 🆕 신규 — SSE EventSource 훅                               |
| `frontend/presentation/AnalysisProgressPanel.tsx` | 🆕 신규 — 실시간 분석 진행 UI                              |
| `frontend/presentation/EntryDetailPageView.tsx`   | isAnalyzing 분기 + AnalysisProgressPanel 통합              |

## 🐛 발생한 문제 & 해결

- **`@devjournal/types` 빌드 오류**: `tsconfig.json`이 `tsconfig.base.json`의 paths를 오버라이드하는 문제. `tsconfig.json`과 `webpack.config.js` 양쪽에 alias 직접 추가로 해결.
- **EventSource 인증 불가**: 브라우저 native EventSource는 커스텀 헤더를 지원하지 않음. `?token=` 쿼리 파라미터 방식으로 우회, `SupabaseAuthGuard`에 fallback 로직 추가.

## 💡 기술적 결정사항 (왜 이 방법을 선택했는가)

- **RxJS Subject + TTL 맵**: fire-and-forget 분석 파이프라인과 SSE 스트림을 브릿지하기 위해 Subject 사용. 30분 TTL로 분석 완료 후 늦게 연결하는 클라이언트도 수용하면서 메모리 누수 방지.
- **Step 2 non-fatal 처리**: search_connections 실패 시 Step 1(개념 추출) 결과는 유지하고 partial 완료(completed)로 처리. 연결 관계 분석은 부가 기능이므로 실패가 전체 분석 실패로 이어지지 않도록 설계.
- **create() 시점에 Subject 미리 생성**: 클라이언트가 SSE에 늦게 연결해도 이벤트를 수신할 수 있도록 분석 시작 전에 Subject 생성. (단, 이미 complete된 Subject는 구독 즉시 complete를 받아 UI가 전환됨.)

## 🔗 관련 이슈/참고

- Day 9 작업: `2026-04-21-feature-devjournal-day9-*` 작업 일지 참고
- pgvector `match_concepts` RPC: Supabase DB에 정의된 함수 (cosine similarity, threshold 0.65, count 10)
