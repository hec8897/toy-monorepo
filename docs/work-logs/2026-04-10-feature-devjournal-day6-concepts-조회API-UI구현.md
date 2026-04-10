# 2026-04-10 feature/devjournal-day6-concepts 작업 일지

## 📋 작업 개요

- **브랜치**: `feature/devjournal-day6-concepts`
- **작업 일자**: 2026-04-10
- **목적**: Day 6 — AI가 추출한 개념(concepts)을 조회·검색하는 BE API와 FE UI 구현

## ✅ 완료된 작업

- BE: NestJS ConceptsModule 구현 (GET /concepts 4개 엔드포인트)
- FE: DDD 구조로 Concepts 도메인 전체 구현
- FE: `/concepts` 라우트 및 네비게이션 추가
- FE: `application/index.ts` barrel export 추가
- `.gitignore`에 `*.tsbuildinfo` 추가

## 🔧 주요 변경사항

| 파일                                                    | 변경 내용                                                 |
| ------------------------------------------------------- | --------------------------------------------------------- |
| `backend/src/concepts/concepts.controller.ts`           | 4개 엔드포인트 정의                                       |
| `backend/src/concepts/concepts.service.ts`              | findAll, findUserConcepts, search, findOne                |
| `backend/src/concepts/dto/concept-response.dto.ts`      | embedding 제외 타입                                       |
| `backend/src/concepts/dto/user-concept-response.dto.ts` | user_concepts + concepts join 타입                        |
| `backend/src/app/app.module.ts`                         | ConceptsModule 등록                                       |
| `frontend/src/domains/concepts/`                        | domain / infrastructure / application / presentation 전체 |
| `frontend/src/app/(app)/concepts/page.tsx`              | 얇은 진입점                                               |
| `frontend/src/domains/auth/.../AppLayout.tsx`           | 개념 네비게이션 항목 추가                                 |
| `.gitignore`                                            | `*.tsbuildinfo` 추가                                      |
| `docs/devjournal-plan.md`                               | 아이데이션 백로그 섹션 추가                               |

## 🐛 발생한 문제 & 해결

- **FE 린트 오류**: `conceptApi.ts` import 순서 위반 → Verify Agent가 import 순서 재정렬로 해결
- `tsconfig.tsbuildinfo`가 git에 트래킹되어 있던 문제 → `.gitignore` 추가 + `git rm --cached`로 해결

## 💡 기술적 결정사항 (왜 이 방법을 선택했는가)

- **Supabase admin 클라이언트 사용**: concepts는 전역 공유 테이블이라 RLS 우회가 필요. anon 클라이언트 대신 admin 사용
- **라우트 순서**: `/concepts/user`, `/concepts/search`를 `/:id` 보다 먼저 선언하여 NestJS 라우팅 충돌 방지
- **embedding 필드 차단**: select 쿼리에서 처음부터 제외하여 벡터값이 클라이언트에 노출되지 않도록 처리
- **에이전트 팀 병렬 실행**: Backend Agent + Frontend Agent를 worktree 격리로 동시 실행, Verify Agent가 통합 검증
- **ORM 미사용 결정**: Supabase 클라이언트가 RLS·pgvector·join을 모두 지원하므로 별도 ORM 불필요

## 🔗 관련 이슈/참고

- Day 8 AI Agent 구현 전까지 concepts 테이블에 실 데이터 없음 (빈 배열 반환이 정상)
- 아이데이션 백로그: 주제 필수 입력, AI 생각 도출, LinkedIn/Velog 내보내기 → `docs/devjournal-plan.md` 참고
