# 2026-04-14 feature/devjournal-day8-c-db-save 작업 일지

## 📋 작업 개요

- **브랜치**: `feature/devjournal-day8-c-db-save`
- **작업 일자**: 2026-04-14
- **목적**: Day 8-B에서 추출한 개념 목록을 실제 DB에 저장하는 파이프라인 완성

## ✅ 완료된 작업

- `ConceptsService.upsertBatch()` 구현 (신규/기존 개념 분기 처리)
- `ConceptsModule`에 `EmbeddingModule` import 및 `ConceptsService` export 추가
- `POST /api/test/pipeline` E2E 검증 엔드포인트 추가
- `TestModule`에 `ConceptsModule` import 추가
- `devjournal-plan.md` Day 9 계획 수정 (AI Agent 2~3 → FE 연결 먼저)

## 🔧 주요 변경사항

| 파일                           | 변경 내용                                            |
| ------------------------------ | ---------------------------------------------------- |
| `concepts/concepts.service.ts` | `upsertBatch()` 메서드 추가, `EmbeddingService` 주입 |
| `concepts/concepts.module.ts`  | `EmbeddingModule` import, `ConceptsService` export   |
| `test/test.controller.ts`      | `POST /api/test/pipeline` 엔드포인트 추가            |
| `test/test.module.ts`          | `ConceptsModule` import 추가                         |
| `docs/devjournal-plan.md`      | Day 9 FE 연결로 변경, 8-B/8-C ✅ 완료 표시           |

## 🐛 발생한 문제 & 해결

- **빌드 에러**: `embedding` 컬럼 타입이 DB 스키마상 `string`으로 정의되어 있어 `number[]` 직접 전달 불가
  - 해결: `[${vector.join(',')}]` 형식의 pgvector 문자열로 변환 후 저장

## 💡 기술적 결정사항 (왜 이 방법을 선택했는가)

- **2-step upsert (신규/기존 분리)**: `ON CONFLICT DO UPDATE`로 한 번에 처리하면 기존 embedding이 덮어써짐 → 비용 낭비 방지를 위해 분리
- **개념 단위 실패 허용**: 일부 개념 embedding 생성 실패 시 전체 롤백하지 않고 continue → 부분 저장으로 UX 보호
- **entry_concepts `ignoreDuplicates: true`**: 서버 재시작 등으로 재호출 시 중복 row 방지 (멱등성)
- **user_concepts `ignoreDuplicates: true`**: 이미 학습 중인 개념의 mastery_level/통계를 덮어쓰지 않음
- **Day 9 계획 변경 (B안 채택)**: AI Agent Tool 2~3 심화보다 FE에서 결과를 먼저 볼 수 있도록 순서 조정 → 매일 동작하는 기능 확인으로 개발 동기부여

## 🔗 관련 이슈/참고

- Day 8-A PR: EmbeddingService (Gemini gemini-embedding-001)
- Day 8-B PR: AgentService.extractConcepts() (Gemini Function Calling)
- 다음 작업: Day 8-D — `JournalService.create()` fire-and-forget 트리거
