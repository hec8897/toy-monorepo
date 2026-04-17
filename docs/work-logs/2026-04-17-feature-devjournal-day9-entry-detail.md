# 2026-04-17 feature/devjournal-day9-entry-detail 작업 일지

## 📋 작업 개요

- **브랜치**: `feature/devjournal-day9-entry-detail`
- **작업 일자**: 2026-04-17
- **목적**: 일기 상세 페이지 구현 — Day 8-D에서 완성된 AI 분석 파이프라인 결과를 프론트엔드에서 표시

## ✅ 완료된 작업

- 백엔드: `GET /entries/:id/concepts` 엔드포인트 추가
- 프론트 인프라: 단일 entry 조회 훅, concepts 조회 훅 (polling) 추가
- 프론트 컴포넌트: 상세 페이지, 개념 배지, 학습 개념 섹션 구현
- 라우트: `/journal/[id]` 동적 라우트 추가
- 목록 페이지: 각 항목에 상세 페이지 링크 연결
- 코드 리뷰 후 2개 이슈 수정 (불필요한 초기 fetch, 중첩 조건 분기)

## 🔧 주요 변경사항

| 파일                                         | 변경 내용                                                              |
| -------------------------------------------- | ---------------------------------------------------------------------- |
| `types/index.ts`                             | `EntryConceptResponse` 공유 타입 추가 (embedding 제외 + confidence)    |
| `concepts/dto/entry-concept-response.dto.ts` | 🆕 백엔드 응답 DTO 추가                                                |
| `concepts/concepts.service.ts`               | `findByEntry()` — entry 소유자 확인 후 concepts 조회 (confidence DESC) |
| `journal/journal.controller.ts`              | `GET :id/concepts` 라우트 추가, ConceptsService 주입                   |
| `journalApi.ts`                              | `getEntryConcepts(id)` 메서드 추가                                     |
| `queryKeys.ts`                               | `detail(id)`, `concepts(id)` 키 추가                                   |
| `useGetEntry.ts`                             | 🆕 단일 entry 조회 훅                                                  |
| `useGetEntryConcepts.ts`                     | 🆕 concepts 조회 훅 (3초 polling, completed/failed 시 자동 중단)       |
| `EntryDetailPageView.tsx`                    | 🆕 상세 페이지 컨테이너                                                |
| `EntryContent.tsx`                           | 🆕 제목/날짜/AI요약/본문 표시 컴포넌트                                 |
| `ConceptBadge.tsx`                           | 🆕 카테고리별 색상 배지 (10가지)                                       |
| `LearnedConceptsSection.tsx`                 | 🆕 분석 상태별 분기 렌더링, ConceptsContent 분리                       |
| `JournalList.tsx`                            | 항목에 `/journal/:id` Link 추가                                        |
| `app/(app)/journal/[id]/page.tsx`            | 🆕 thin entrypoint (async params 패턴)                                 |

## 🐛 발생한 문제 & 해결

- **불필요한 초기 concepts fetch**: entry 로딩 완료 전(`analysisStatus === undefined`)에도 concepts API가 3초마다 호출되던 문제
  → `useGetEntryConcepts`의 `enabled` 조건에 `analysisStatus !== undefined` 추가

- **LearnedConceptsSection 중첩 조건**: `status === 'completed'` 블록 안에서 isLoading/concepts.length 조건 3개가 중첩되어 가독성 저하
  → `ConceptsContent` 컴포넌트로 분리, `if/return` 패턴으로 위에서 아래로 읽히는 흐름으로 개선

## 💡 기술적 결정사항 (왜 이 방법을 선택했는가)

- **SSE 대신 polling**: Day 10에 SSE 도입 예정. 단순 polling(3초)으로 먼저 기능 연결 후 점진적 개선
- **RLS 우회 없이 anonClient 사용**: `GET /entries/:id/concepts`는 UI에서 직접 호출 → 사용자 JWT 포함 → RLS 통과. serviceClient 불필요
- **ConceptsModule 재사용**: JournalModule에 이미 ConceptsModule이 import되어 있어 JournalController에서 ConceptsService 직접 주입 가능

## 🔗 관련 이슈/참고

- Day 8-D 작업 일지: `docs/work-logs/2026-04-07-feature-devjournal-day8-ai-agent-step-D.md`
- 다음 단계 (Day 10): SSE로 실시간 분석 진행 상황 표시
