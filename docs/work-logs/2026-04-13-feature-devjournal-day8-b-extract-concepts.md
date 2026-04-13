# 2026-04-13 feature/devjournal-day8-b-extract-concepts 작업 일지

## 📋 작업 개요

- **브랜치**: `feature/devjournal-day8-b-extract-concepts`
- **작업 일자**: 2026-04-13
- **목적**: AI Agent 4단계 파이프라인의 Step 1 구현 — Gemini function calling으로 일기 텍스트에서 기술 개념 추출

## ✅ 완료된 작업

- `AgentModule` / `AgentService` 신규 생성
- `extractConcepts()` 메서드 구현 (Gemini Flash function calling)
- 무료 티어 4개 모델 자동 폴백 로직 구현
- `POST /api/test/extract` 테스트 엔드포인트 추가
- `AppModule`, `TestModule`에 `AgentModule` 등록

## 🔧 주요 변경사항

| 파일                          | 변경 내용                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `src/agent/agent.service.ts`  | AgentService 신규 생성 — extract_concepts 툴 정의, 모델 폴백 루프, 결과 파싱 |
| `src/agent/agent.module.ts`   | AgentModule 신규 생성                                                        |
| `src/test/test.controller.ts` | POST /api/test/extract 엔드포인트 추가                                       |
| `src/test/test.module.ts`     | AgentModule import 추가                                                      |
| `src/app/app.module.ts`       | AgentModule import 추가                                                      |

## 🐛 발생한 문제 & 해결

- **빌드 오류 — SchemaType 타입 불일치**: `@google/generative-ai`의 Tool 스키마 정의 시 문자열 리터럴(`'string' as const`) 사용 불가. `SchemaType` enum과 `format: 'enum'` 필드 필수 적용으로 해결
- **429 Too Many Requests**: `gemini-2.0-flash` 무료 티어 일일 한도 소진. 4개 모델 자동 폴백 패턴으로 해결
- **404 Model Not Found**: `gemini-1.5-flash`는 현재 API v1beta에서 미지원. 사용 가능한 모델 목록 API로 확인 후 `gemini-2.5-flash` 계열로 교체

## 💡 기술적 결정사항 (왜 이 방법을 선택했는가)

- **FunctionCallingMode.ANY**: 모델이 텍스트로 자유 응답하는 것을 방지하고 항상 파싱 가능한 JSON 구조를 보장하기 위해 강제 tool_use 모드 사용
- **모델 폴백 패턴**: 무료 티어 모델별 quota가 독립적임을 활용. `gemini-2.5-flash → gemini-2.5-flash-lite → gemini-2.0-flash → gemini-2.0-flash-lite` 순서로 429 발생 시 자동 전환
- **confidence >= 0.6 필터**: 낮은 신뢰도 개념이 DB에 쌓이는 것을 방지

## 🔗 관련 이슈/참고

- devjournal-plan.md Day 8-B
- 전 단계: Day 8-A EmbeddingService (PR #61)
- 다음 단계: Day 8-C ConceptsService.upsertBatch() + DB 저장
