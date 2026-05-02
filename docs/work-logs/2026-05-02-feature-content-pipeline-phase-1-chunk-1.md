# 2026-05-02 feature/content-pipeline-phase-1 작업 일지 (Chunk 1)

## 📋 작업 개요

- **브랜치**: `feature/content-pipeline-phase-1`
- **작업 일자**: 2026-05-01 ~ 2026-05-02
- **목적**: Phase 1 — "기반" Chunk 1 진행. content-pipeline 앱 NestJS 백엔드 스캐폴드(Supabase 연동 + 인증 가드 + Health 엔드포인트) + 모노레포 디렉토리 골격 셋업. plan 단계의 핵심 결정 2건(DB 분리 / SupabaseService 패턴) 본 chunk 진행 중 변경 + 코드/문서 일괄 패치까지

## ✅ 완료된 작업

- Task 1 — 작업 브랜치 생성, `apps/content-pipeline/` 디렉토리 골격, `apps/content-pipeline/types/index.ts` placeholder, `tsconfig.base.json`에 `@content-pipeline/types` path alias 추가
- Task 2 — NestJS 11 백엔드 앱 스캐폴드 (서브에이전트 디스패치, TDD 흐름):
  - `project.json` (Nx 빌드 타깃), `package.json`, tsconfig 3종, `webpack.config.js`, `jest.config.cts`, `.env.example`
  - `src/main.ts` — 포트 3003, `/api` 프리픽스, ValidationPipe, CORS (FRONTEND_URL=3004 + Vercel regex)
  - `src/supabase/supabase.module.ts` + `src/supabase/supabase.service.ts`
  - `src/auth/supabase-auth.guard.ts` + `.spec.ts` (4 테스트 — no token / supabase error / Bearer / query token)
  - `src/health/{health.module.ts, health.controller.ts, health.controller.spec.ts}` (TDD: 실패 → 구현 → 통과)
  - `src/app/app.module.ts` — ConfigModule(global) + Supabase + Health
- Workspace 합치기 — 처음에 별도 worktree(`../toy-monorepo-cp-phase1`)로 시작 → 헷갈려서 단일 디렉토리로 통합 (`git worktree remove` + 메인에서 `git checkout feature/...`)
- Chunk 1 fixup — DB 분리 결정 + SupabaseService devjournal 패턴 채택에 따른 코드/spec/plan 일괄 패치
- root `package.json` scripts 추가 (Task 5 일정에서 미리 당김)
- 로컬 `.env` 파일 생성 (사용자가 cp 전용 Supabase 키 채움 → MCP로 연결 검증)
- plan stray `cp_*` 참조 3곳 정리 (line 22 / 1338 / 1725)

## 🔧 주요 변경사항

### 신규 파일

| 파일                                                                       | 변경 내용                                                             |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `apps/content-pipeline/types/index.ts`                                     | 앱 로컬 공유 타입 placeholder                                         |
| `apps/content-pipeline/backend/project.json`                               | Nx 빌드 타깃 (build/test/serve/prune-lockfile/copy-workspace-modules) |
| `apps/content-pipeline/backend/package.json`                               | NestJS 11 의존성                                                      |
| `apps/content-pipeline/backend/{tsconfig,tsconfig.app,tsconfig.spec}.json` | TypeScript 설정                                                       |
| `apps/content-pipeline/backend/webpack.config.js`                          | NestJS webpack                                                        |
| `apps/content-pipeline/backend/jest.config.cts`                            | Jest 설정                                                             |
| `apps/content-pipeline/backend/.env.example`                               | env 템플릿 (cp 전용 Supabase + PORT 3003 + FRONTEND_URL 3004)         |
| `apps/content-pipeline/backend/src/main.ts`                                | bootstrap                                                             |
| `apps/content-pipeline/backend/src/app/app.module.ts`                      | 루트 모듈                                                             |
| `apps/content-pipeline/backend/src/supabase/supabase.module.ts`            | @Global Supabase 모듈                                                 |
| `apps/content-pipeline/backend/src/supabase/supabase.service.ts`           | ConfigService + `SupabaseClient<Database>` (anon/admin)               |
| `apps/content-pipeline/backend/src/supabase/database.types.ts`             | Phase 2 대비 placeholder                                              |
| `apps/content-pipeline/backend/src/auth/supabase-auth.guard.ts`            | Bearer/query 토큰 검증 가드                                           |
| `apps/content-pipeline/backend/src/auth/supabase-auth.guard.spec.ts`       | 4 단위 테스트                                                         |
| `apps/content-pipeline/backend/src/health/health.module.ts`                | Health 모듈                                                           |
| `apps/content-pipeline/backend/src/health/health.controller.ts`            | GET /api/health                                                       |
| `apps/content-pipeline/backend/src/health/health.controller.spec.ts`       | 1 단위 테스트 (TDD)                                                   |

### 수정 파일

| 파일                                                                | 변경 내용                                                                                                                    |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `tsconfig.base.json`                                                | `@content-pipeline/types` path alias 추가                                                                                    |
| `package.json` (root)                                               | content-pipeline dev/build scripts 5개 추가                                                                                  |
| `docs/superpowers/specs/2026-04-28-content-pipeline-saas-design.md` | 7장 DB 행 갱신, 9장 결정 이력에 DB 분리 + SupabaseService 패턴 결정 2건 추가                                                 |
| `docs/superpowers/plans/2026-05-01-content-pipeline-phase-1.md`     | 라인 12 / Task 2 Step 3,5 / Task 4 Step 1,2 / Task 5 Step 2 / Task 8 Step 1 / 결정 이력 footer 일괄 패치 + stray `cp_*` 정리 |

## 🐛 발생한 문제 & 해결

### 1. 처음 worktree 분리 셋업이 헷갈림

- 증상: plan 권장대로 별도 worktree(`../toy-monorepo-cp-phase1`)에서 작업 시작했는데 사용자가 "왜 저장소가 분리됐냐"고 물음
- 원인: docs/content-pipeline-brainstorming-spec PR이 develop에 이미 머지되어 메인 worktree 컨텍스트 보존 가치가 사라진 상태였는데도 worktree 분리 유지
- 해결: `git worktree remove ../toy-monorepo-cp-phase1` + 메인 worktree에서 `git checkout feature/content-pipeline-phase-1` 으로 통합. 이후 단일 디렉토리에서 작업

### 2. Code reviewer가 `SupabaseService` 구현 불일치 지적

- 증상: Task 2 결과물의 `SupabaseService`가 plan 코드 블록을 따랐지만, 그 코드 블록 자체가 devjournal 실구현과 다름 (process.env vs ConfigService, OnModuleInit vs constructor, `serviceRole` vs `admin`, untyped vs `<Database>`)
- 원인: plan 작성 시 devjournal 코드를 잘못 인용한 코드 블록을 Step 5에 넣음
- 해결: plan 패치 + service 코드 재작성 + `database.types.ts` placeholder 추가 (Chunk 1 fixup commit `7c06848`)

### 3. `source .env` 파싱 실패

- 증상: bash `source` 로 .env 읽어 Supabase ping 시도했는데 multi-line JWT 토큰 값에서 line 11에 `command not found` 에러
- 원인: `source`가 multi-line/특수문자 포함 값을 안전하게 파싱 못 함
- 해결: Supabase MCP를 발견 → OAuth 인증 후 MCP 도구로 직접 검증 (URL / 테이블 / 확장 모두 확인)

## 💡 기술적 결정사항 (왜 이 방법을 선택했는가)

### 1. DB 분리 = content-pipeline 전용 신규 Supabase 프로젝트 (1차 pause)

- **이전 결정**: 1차 devjournal Supabase 인스턴스 공유 + `cp_*` 접두어로 public schema 격리
- **변경 결정**: cp 전용 신규 Supabase 프로젝트 생성, 1차 devjournal Supabase는 (당분간 active 유지하다 추후) pause
- **사유**:
  1. 일반 SaaS 출시 대상이라 1차 dogfooding 사용자와 분리 필요
  2. RLS/마이그레이션 격리로 사고 위험 ↓
  3. 무료 슬롯 재배치 (1차 pause 시 슬롯 1개 회수)
- **영향**:
  - 도메인 테이블 접두어(`cp_*`) 강제 풀림 → Phase 2에서 `topics`, `drafts` 같은 자유 이름 사용
  - `auth.users` 분리 = 양쪽 앱이 별도 가입
  - n8n schema는 cp Supabase Postgres 위에 위치 (이전 결정 그대로, host project만 변경)

### 2. SupabaseService 구현 = devjournal 1차 실구현 1:1 재활용

- **plan 초안**: `process.env` + `OnModuleInit` + `serviceRole` 네이밍 + untyped `SupabaseClient`
- **선택**: devjournal 실구현 1:1 (`ConfigService.getOrThrow` + constructor 주입 + `SupabaseClient<Database>` 타입드 + `anon`/`admin` 네이밍)
- **사유**:
  1. backend-code-style.md "🔧 설정 관리"의 ConfigModule 사용 원칙 준수
  2. Phase 2 도메인 테이블 도입 시 `<Database>` 제네릭으로 IDE 자동완성 / 타입체크 지원
  3. 1차 자산 일부 활용 방향성 — Supabase 패턴은 검증된 1차 코드 그대로 가는 것이 학습 진척에 효율적
- **이행 비용**: service 파일 1개 재작성 + `database.types.ts` placeholder 신규 (~30줄)

### 3. Worktree 통합

- **이유**: docs PR 머지 후 메인 worktree에 1차 컨텍스트 보존 가치 사라짐. 두 디렉토리 매번 의식해야 하는 부담만 ↑
- **선택**: 단일 worktree로 통합. Chunk 단위 격리는 git 브랜치 자체로 충분

### 4. 서브에이전트 적극 활용

- **이유**: Task 2가 ~349줄짜리 중량 task. 메인에서 직접 수행 시 컨텍스트 폭주
- **선택**: Task 2 → general-purpose 서브에이전트 (TDD 강제 + 자체 self-review). Code review → superpowers:code-reviewer 서브에이전트
- **결과**: 서브에이전트 1회로 13 step 완료, 5 테스트 통과, 2회 review 모두 APPROVED_WITH_NOTES

### 5. Chunk 단위 사용자 리뷰 체크포인트

- **이유**: Phase 1 9 task가 한 호흡에 무리. 사용자가 "끊어서" 작업 원함
- **선택**: 7 chunk 분할 + chunk 끝마다 사용자 검수 (자동 code-reviewer 1회 + 사용자 OK 받기 전까지 다음 chunk 진입 X)
- **현재**: Chunk 1 종료 시점, draft PR 생성 후 Chunk 2 진입 대기

## 🔗 관련 이슈/참고

- Spec: `docs/superpowers/specs/2026-04-28-content-pipeline-saas-design.md`
- Plan: `docs/superpowers/plans/2026-05-01-content-pipeline-phase-1.md`
- 1차 자산 참조: `apps/devjournal/backend/src/{supabase,auth}/`
- Supabase MCP 검증: cp 프로젝트 ID `fphlsaulrqfjtjmwbkdw`, 리전 ap-northeast-2, public 스키마 비어있음, vector extension 미설치 (Task 4 마이그레이션에서 활성화 예정)
- 다음 Chunk: Chunk 2 — Task 3: Next.js 프론트엔드 스캐폴드 + 로그인 페이지
