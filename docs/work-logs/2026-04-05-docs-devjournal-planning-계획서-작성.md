# 2026-04-05 docs/devjournal-planning 작업 일지

## 📋 작업 개요

- **브랜치**: `docs/devjournal-planning`
- **작업 일자**: 2026-04-05
- **목적**: DevJournal 토이프로젝트 구현 계획서 작성 및 문서화

## ✅ 완료된 작업

- DevJournal 프로젝트 계획서 초안 작성 (`docs/devjournal-plan.md`)
- 4개 에이전트(DB / Backend / Frontend / AI Agent) 병렬 분석으로 계획서 심화
- 기술 스택 확정 (Gemini Flash, Ollama, Supabase, D3.js, Tiptap)
- CLAUDE.md 모노레포 구조 상세화

## 🔧 주요 변경사항

| 파일                      | 변경 내용                                     |
| ------------------------- | --------------------------------------------- |
| `docs/devjournal-plan.md` | DevJournal 풀스택 구현 계획서 신규 작성       |
| `.claude/CLAUDE.md`       | 모노레포 구조 상세화, eslint 설정 파일명 수정 |

## 🐛 발생한 문제 & 해결

- pre-commit hook(gitleaks)이 `DATABASE_URL` 플레이스홀더를 실제 시크릿으로 오탐지
  → `postgresql://` 형식 제거하고 주석으로 대체하여 해결

## 💡 기술적 결정사항 (왜 이 방법을 선택했는가)

- **AI: Claude → Gemini Flash** — 사이드 프로젝트 비용 최소화, 무료 tier로 충분
- **임베딩: Voyage AI → Ollama nomic-embed-text** — 로컬 실행으로 완전 무료, 나중에 클라우드 전환 용이
- **임베딩 차원: 1536 → 768** — nomic-embed-text 기본 차원, Supabase free tier에 적합
- **벡터 인덱스: ivfflat → HNSW** — 수만 개 규모에서 recall 95~99%, 동적 삽입 지원
- **Tool 2 search_connections** — Claude 호출 없이 pgvector 직접 쿼리로 구현 (비용 절감)
- **build_mindmap** — 전체 그래프 재생성 대신 델타만 생성 후 머지 (성능 최적화)
- **entries.extracted_concepts text[]** → **entry_concepts 조인 테이블** 분리 (FK 무결성)
- **포트 고정 제거** — 기존 backend(3001)와 충돌 우려였으나, 동시 실행 불필요해 환경변수로 유연하게 관리

## 🔗 관련 이슈/참고

- 계획서 원본: `docs/devjournal-plan.md`
- 에이전트 분석: DB / Backend / Frontend / AI Agent 4개 Plan 에이전트 병렬 실행 결과 반영
