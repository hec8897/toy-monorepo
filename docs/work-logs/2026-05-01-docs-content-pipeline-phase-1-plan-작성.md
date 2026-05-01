# 2026-05-01 docs/content-pipeline-brainstorming-spec 작업 일지 (Phase 1 plan 작성)

## 📋 작업 개요

- **브랜치**: `docs/content-pipeline-brainstorming-spec`
- **작업 일자**: 2026-05-01
- **목적**: 2차 프로토타입(content-pipeline) Phase 1 — "기반" plan 문서 작성. brainstorming spec에서 미뤄둔 인증 구현 방식, DB 격리 전략, 배포 자동화 방식을 plan 단계에서 확정하고, Phase 2 진입 전에 굳혀야 할 토대(앱 스캐폴드 / Supabase Auth 로그인 / ECS Fargate / n8n Cloudflare Access)를 9 task × ~80 step 으로 분해

## ✅ 완료된 작업

- Phase 1 plan 문서 신규 작성 (`docs/superpowers/plans/2026-05-01-content-pipeline-phase-1.md`)
- Spec 문서에 `## 8. Plans` 섹션 추가 (plan 인덱스, Phase별 상태 추적)
- Spec 문서 `## 9. 결정 이력` 에 2026-05-01 항목 추가 (Phase 1 plan에서 굳힌 4가지 핵심 결정 요약)
- 인증 방식 추가 검토 (Firebase Auth) → 불필요 결론, 현재 결정(Supabase Auth) 유지
- 자체 리뷰: spec 커버리지 / placeholder 잔여 / 타입 일관성 모두 OK

## 🔧 주요 변경사항

| 파일                                                                | 변경 내용                                                                                                        |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `docs/superpowers/plans/2026-05-01-content-pipeline-phase-1.md`     | 신규 작성 — Phase 1 9 task plan (~1630 lines)                                                                    |
| `docs/superpowers/specs/2026-04-28-content-pipeline-saas-design.md` | `## 8. Plans` 섹션 신설 + `## 9. 결정 이력` 에 2026-05-01 항목 추가 (이전 8장 → 9장, 9장 → 10장으로 번호 시프트) |

### Phase 1 plan 9 task 구성

| Task | 내용                                                                                                                |
| ---- | ------------------------------------------------------------------------------------------------------------------- |
| 1    | 작업 브랜치 + 모노레포 디렉토리 골격 (worktree, tsconfig alias)                                                     |
| 2    | NestJS 백엔드 스캐폴드 — `SupabaseModule` / `SupabaseAuthGuard` 1차 devjournal 1:1 재활용 + Health controller (TDD) |
| 3    | Next.js 프론트엔드 스캐폴드 — App Router `(auth)` / `(app)` 그룹 + `@supabase/ssr` 로그인 플로우                    |
| 4    | Supabase 마이그레이션 폴더 — `cp_*` 접두어 컨벤션, `extensions.sql` 1개                                             |
| 5    | 로컬 dev 검증 — `pnpm dev:content-pipeline` 으로 양쪽 부팅 + 로그인 손으로                                          |
| 6    | 백엔드 Dockerfile — multi-stage + nx prune, 로컬 docker run smoke                                                   |
| 7    | AWS 인프라 + ECS Service (backend) — ECR / Cluster / SG / IAM / Secrets / ALB / TG / Listener / Service             |
| 8    | n8n on ECS + Cloudflare Access — Postgres 영속 (Supabase의 `n8n` schema), `/webhook/*` Bypass                       |
| 9    | GitHub Actions CI/CD + smoke — OIDC → ECR push → ECS update-service, 작업 일지 + PR                                 |

## 🐛 발생한 문제 & 해결

특별히 막힌 부분 없음. 다만 plan 작성 중 spec 커버리지 셀프 체크 시 다음 항목이 추가로 plan에 반영됨:

- spec 6.6 "n8n 노출 방식 = B (Cloudflare Access + public webhook)" → Task 8에서 `/webhook/*` Bypass 정책 + HMAC 시그니처 검증 step으로 구체화
- spec 6.6 "fallback 가이드: Cloudflare Access 셋업 막히면 옵션 A로 우선 진행" → Task 8 README에 fallback 절차 명시

## 💡 기술적 결정사항 (왜 이 방법을 선택했는가)

### 1. 인증 = Supabase Auth + `SupabaseAuthGuard` (1:1 재활용)

- spec 7장에 "구체 구현(Supabase Auth vs NestJS JWT)은 plan 단계에서 결정" 으로 미뤄둔 결정
- **선택**: Supabase Auth + devjournal `SupabaseAuthGuard` 1:1 재활용
- **이유**:
  - devjournal에서 이미 검증된 패턴 (anon key + `auth.getUser(token)` 으로 JWT 검증)
  - 별도 JWT secret 관리 / refresh token 관리 / 비밀번호 해싱 코드 제거 → 백엔드 단순화
  - 추후 OAuth provider(Google/Kakao 등) 추가 시 백엔드 가드 수정 불필요 (Supabase가 일괄 발급하는 JWT 형식이 동일)
- **NestJS JWT 옵션 폐기 사유**: devjournal 1차 자산 재활용 가치를 살리는 것이 학습 진척에 가장 효율적

### 2. DB 격리 = 별도 schema X, `cp_*` 접두어 + `public` schema

- spec 7장 "1차와 같은 인스턴스 + 새 스키마/테이블" 결정의 구체화
- **선택**: 별도 DB schema 분리 X, `public.cp_*` 접두어로 1차 devjournal 테이블과 네이밍 격리
- **이유**:
  - Supabase는 PostgREST가 자동 노출하는 schema가 `public` 으로 기본 설정 → 새 schema 만들면 PostgREST 설정에서 추가 노출 작업 필요 (스코프 ↑)
  - 1차 devjournal 테이블은 `dj_*` 같은 접두어 미사용이라 충돌 가능성 ↑ → `cp_*` 접두어 + 1차 테이블도 후속에서 점진 마이그레이션
  - `cp_users` 같은 자체 사용자 테이블은 만들지 않고 `auth.users` 그대로 사용 (FK는 `cp_*.user_id → auth.users.id`)

### 3. n8n 영속 = 같은 Supabase Postgres의 별도 `n8n` schema + `n8n_runner` role

- spec 6.6 "n8n self-host" 의 데이터 영속 구체화
- **선택**: 별도 RDS / SQLite 파일 X, **같은 Supabase Postgres의 `n8n` schema** + 전용 role(`n8n_runner`) 로 격리
- **이유**:
  - SQLite 파일은 Fargate ephemeral 디스크라 task restart 시 워크플로우/실행 로그 휘발 → 운영 부적합
  - 별도 RDS는 월 비용 추가 (~$15+) → spec "껐다 켰다 비용 모델" 위반
  - Supabase 한 인스턴스로 묶되 schema 격리 + role 권한 제한으로 보안/관리 분리
- **`cp_*` public schema 와의 차별 사유**: n8n은 schema 의존이 외부 앱(우리 backend)과 무관 → schema 분리해도 PostgREST 노출 이슈 없음. 반면 `cp_*` 는 Supabase 클라이언트가 직접 호출 가능해야 해서 `public` 유지

### 4. 배포 자동화 = GitHub Actions OIDC → ECR/ECS

- **선택**: GitHub Actions OIDC role assume 방식 (long-lived AWS access key 미사용)
- **이유**:
  - long-lived key는 GitHub Secrets에 저장 시 leak 위험 + 회전 운영 부담
  - OIDC는 워크플로우 실행마다 단기 자격증명 발급 → 보안 표준
  - 학습 가치 ↑ (1차 devjournal은 EC2 + PM2 + SSH key 방식이라 OIDC 미경험)

### 5. spec/plan 분리 운영 패턴 굳힘

- **결정**: spec은 "왜/무엇을" 결정 이력 + 컨셉 SoT, plan은 "어떻게" task/step 분해
- **spec ↔ plan 연결**: spec `## 8. Plans` 인덱스에서 plan 파일 링크 + plan 첫 줄 metadata에 spec section 역참조
- **결정 이력 중복 방지**: plan에서 굳힌 결정은 plan에 상세 + spec 결정 이력에는 한 줄 요약만 (DRY)

## 🔗 관련 이슈/참고

- Spec: `docs/superpowers/specs/2026-04-28-content-pipeline-saas-design.md`
- 1차 자산 참조: `apps/devjournal/backend/src/auth/supabase-auth.guard.ts`, `apps/devjournal/backend/src/auth/supabase.module.ts`, `apps/devjournal/frontend/src/app/(auth)/login/page.tsx`
- spec 7.5 "plan 단계로 미룬 결정" 4건 중 3건이 본 plan에서 확정 (인증 / 카드뉴스 렌더 / 인스타 발행 디테일 중 인증만 — 카드뉴스/인스타는 Phase 3, Phase 7 plan에서)
- 다음 plan: Phase 2 — AI 인터뷰 (Phase 1 완료 후 작성)
