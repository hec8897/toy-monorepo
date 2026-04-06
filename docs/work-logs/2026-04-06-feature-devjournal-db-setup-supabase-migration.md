# 2026-04-06 feature/devjournal-db-setup 작업 일지

## 📋 작업 개요

- **브랜치**: `feature/devjournal-db-setup`
- **작업 일자**: 2026-04-06
- **목적**: DevJournal 프로젝트 1일차 — Supabase DB 셋업 및 migration 작성

## ✅ 완료된 작업

- Supabase 프로젝트 생성 (ap-northeast-2 서울, 무료 tier)
- migration 파일 12개 작성 및 Supabase에 적용
- 테이블 6개 생성 + RLS 전 테이블 활성화
- pgvector HNSW 인덱스 설정
- DB 함수 2개 생성 (match_concepts, get_user_mindmap)
- 시드 데이터 삽입 (React 메모이제이션 주제)

## 🔧 주요 변경사항

| 파일                                | 변경 내용                                             |
| ----------------------------------- | ----------------------------------------------------- |
| `20260405000001_extensions.sql`     | vector, pg_trgm, unaccent extension 활성화            |
| `20260405000002_user_profiles.sql`  | user_profiles 테이블 (auth.users 1:1 확장)            |
| `20260405000003_concepts.sql`       | concepts 테이블 + trgm 인덱스                         |
| `20260405000004_entries.sql`        | entries 테이블 (분석 상태, 블로그 퍼블리시 컬럼 포함) |
| `20260405000005_entry_concepts.sql` | entries ↔ concepts N:M 조인 테이블                   |
| `20260405000006_connections.sql`    | 개념 간 관계 엣지 (마인드맵 선)                       |
| `20260405000007_user_concepts.sql`  | 사용자별 학습 기록 + SM-2 알고리즘 컬럼               |
| `20260405000008_indexes.sql`        | HNSW 벡터 인덱스 + 조회 성능 인덱스                   |
| `20260405000009_rls_policies.sql`   | 6개 테이블 RLS 정책                                   |
| `20260405000010_triggers.sql`       | updated_at 자동 갱신 트리거                           |
| `20260405000011_functions.sql`      | match_concepts(), get_user_mindmap()                  |
| `20260405000012_seed.sql`           | 테스트용 시드 데이터                                  |

## 🐛 발생한 문제 & 해결

- 특이사항 없음. 11개 migration + seed 모두 오류 없이 적용 완료.

## 💡 기술적 결정사항 (왜 이 방법을 선택했는가)

- **HNSW 인덱스**: ivfflat 대비 동적 삽입 지원, recall 95~99% — 수만 개 개념 규모에서 유리
- **concepts 전역 공유**: 사용자별 분리 없이 전체 공유 → 동일 개념 재임베딩 스킵, 크로스유저 연결 가능
- **embedding 0벡터 (시드)**: 실제 Ollama nomic-embed-text는 백엔드 구현 후 생성 예정, 시드는 구조 확인용
- **user_profiles 분리**: Supabase auth.users 직접 수정 불가 → 앱 전용 데이터를 별도 테이블로 관리

## 🔗 관련 이슈/참고

- 계획서: `docs/devjournal-plan.md`
- Supabase 프로젝트 ID: `vrhktnkdluqnsukbknwb` (ap-northeast-2)
