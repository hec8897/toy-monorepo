# 2026-04-06 feature/devjournal-backend-setup 작업 일지

## 📋 작업 개요

- **브랜치**: `feature/devjournal-backend-setup`
- **작업 일자**: 2026-04-06
- **목적**: DevJournal 프로젝트 2일차 — NX devjournal-backend 스캐폴딩 및 핵심 모듈 구현

## ✅ 완료된 작업

- NX로 `devjournal-backend` (NestJS) 앱 스캐폴딩
- SupabaseModule (Global) + SupabaseService 구현
- SupabaseAuthGuard (JWT 검증) 구현
- AppModule + main.ts 설정 (포트 3002, /api prefix, CORS)
- GET /api/health 엔드포인트로 Supabase 연결 확인
- `apps/devjournal/types/` 신규 생성 + `@devjournal/types` path alias 설정
- `pnpm dev:devjournal-backend` 실행 스크립트 추가

## 🔧 주요 변경사항

| 파일                                                       | 변경 내용                          |
| ---------------------------------------------------------- | ---------------------------------- |
| `apps/devjournal/backend/src/supabase/supabase.module.ts`  | Global SupabaseModule 생성         |
| `apps/devjournal/backend/src/supabase/supabase.service.ts` | anon/admin 클라이언트 분리         |
| `apps/devjournal/backend/src/auth/supabase-auth.guard.ts`  | Bearer JWT 검증 Guard              |
| `apps/devjournal/backend/src/app/app.module.ts`            | ConfigModule + SupabaseModule 연결 |
| `apps/devjournal/backend/src/main.ts`                      | 포트 3002, CORS, /api prefix       |
| `apps/devjournal/backend/src/app/app.controller.ts`        | GET /api/health 엔드포인트         |
| `apps/devjournal/backend/webpack.config.js`                | webpack-node-externals 적용        |
| `apps/devjournal/types/index.ts`                           | devjournal 전용 타입 정의          |
| `tsconfig.base.json`                                       | @devjournal/types path alias 추가  |
| `package.json`                                             | dev/build 스크립트 추가            |

## 🐛 발생한 문제 & 해결

- **`@nx/js:node` serve executor 미작동**: `@nx/js:node`가 webpack 빌드 결과물 경로를 인식 못함 → `nx:run-commands`로 교체, `cd apps/devjournal/backend && webpack-cli build --watch` + `node dist/.../main.js` 병렬 실행으로 해결
- **`Injectable is not a function` 런타임 오류**: webpack이 `@nestjs/common`을 중복 번들링하는 문제 → `webpack-node-externals` 추가로 해결
- **포트 충돌 (EADDRINUSE 3002)**: 이전 서버 프로세스가 남아있는 경우 발생 → `pnpm dev:devjournal-backend` 스크립트에 `lsof -ti:3002 | xargs kill -9` 선행 실행으로 해결

## 💡 기술적 결정사항 (왜 이 방법을 선택했는가)

- **TypeORM 미사용**: devjournal-backend는 Supabase SDK로 직접 DB 접근. TypeORM 레이어 불필요
- **anon/admin 클라이언트 분리**: anon은 RLS 적용(사용자 요청), admin은 service_role(AI 분석 결과 쓰기)로 역할 분리
- **Passport 미사용**: `supabase.auth.getUser(token)`으로 충분, 의존성 최소화
- **@devjournal/types 분리**: devjournal 전용 타입을 `packages/types`에 넣지 않고 `apps/devjournal/types`로 분리하여 응집도 향상. `@devjournal/types` alias로 backend/frontend 모두 사용 가능
- **webpack 유지 (EC2 배포 고려)**: 단일 번들로 배포 단순화. 개발 시에는 `tsx` 전환 고려 중

## 🔗 관련 이슈/참고

- 계획서: `docs/devjournal-plan.md`
- 1일차 작업 일지: `docs/work-logs/2026-04-06-feature-devjournal-db-setup-supabase-migration.md`
- Supabase 프로젝트 ID: `vrhktnkdluqnsukbknwb` (ap-northeast-2)
