# 2026-04-13 feature/devjournal-day8-ai-agent (Step A) 작업 일지

## 📋 작업 개요

- **브랜치**: `feature/devjournal-day8-ai-agent`
- **작업 일자**: 2026-04-13
- **목적**: Day 8 AI 연동 Step A — Gemini 임베딩 서비스 구현 및 동작 검증

## ✅ 완료된 작업

- `EmbeddingService` 구현 (Gemini `gemini-embedding-001`, 768차원)
- `POST /api/test/embed` 임시 검증 엔드포인트 추가
- `devjournal-plan.md` Ollama → Gemini 임베딩으로 전면 수정

## 🔧 주요 변경사항

| 파일                                                         | 변경 내용                                             |
| ------------------------------------------------------------ | ----------------------------------------------------- |
| `apps/devjournal/backend/src/embedding/embedding.service.ts` | Gemini API로 768차원 임베딩 생성 (embed / embedBatch) |
| `apps/devjournal/backend/src/embedding/embedding.module.ts`  | EmbeddingModule (exports: [EmbeddingService])         |
| `apps/devjournal/backend/src/test/test.controller.ts`        | POST /api/test/embed 임시 엔드포인트                  |
| `apps/devjournal/backend/src/test/test.module.ts`            | TestModule (임시, Step D 완료 후 삭제 예정)           |
| `apps/devjournal/backend/src/app/app.module.ts`              | EmbeddingModule, TestModule 등록                      |
| `docs/devjournal-plan.md`                                    | Ollama → Gemini 임베딩 전면 수정 + Day 8 스텝별 분리  |

## 🐛 발생한 문제 & 해결

- **문제**: Ollama `nomic-embed-text` 모델 로드 실패
- **원인**: Apple M5 (`MTLGPUFamilyApple10`) + Ollama 내장 Metal 셰이더 비호환
  - `static_assert failed: "Input types must match cooperative tensor types"` — Metal 컴파일 오류
  - CPU 모드(`OLLAMA_NO_METAL=1`)에서도 동일 오류 발생
- **해결**: Gemini `gemini-embedding-001`로 교체
  - `text-embedding-004`는 현재 API에서 404 반환 → `gemini-embedding-001` 사용
  - `outputDimensionality: 768` 지정으로 기존 DB 스키마(vector(768)) 호환 유지

## 💡 기술적 결정사항 (왜 이 방법을 선택했는가)

- **Gemini 임베딩 통일**: 개념 추출(Gemini)과 임베딩(Gemini) 모두 같은 API 사용 → 인프라 단순화
- **EC2에 Ollama 불필요**: t2.micro(1GB RAM) 메모리 제약 우려도 함께 해소
- **768차원 유지**: `outputDimensionality: 768` 지정으로 기존 `vector(768)` DB 스키마 변경 없음
- **TestModule 임시 운영**: Step A~B 검증용. Step D 완료 후 삭제 예정

## 🔗 관련 이슈/참고

- 계획서: `docs/devjournal-plan.md` (Day 8-A)
- 다음 단계: Step B — `AgentService.extractConcepts()` + `POST /api/test/extract`
