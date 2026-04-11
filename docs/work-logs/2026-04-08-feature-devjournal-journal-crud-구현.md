# 2026-04-08 feature/devjournal-journal-crud 작업 일지

## 📋 작업 개요

- **브랜치**: `feature/devjournal-journal-crud`
- **작업 일자**: 2026-04-08
- **목적**: Journal entries CRUD API + UI 구현, OAuth 인증 흐름 완성, 다음 스프린트 계획 수립

---

## ✅ 완료된 작업

- BE: Journal entries CRUD API 구현 (GET/POST/DELETE)
- BE: Supabase DB 타입 생성 및 SupabaseClient 타입화 (`any`/`unknown` 제거)
- BE: ValidationPipe 전역 적용, SupabaseAuthGuard 실전 적용
- BE: 에러 처리 개선 (`InternalServerErrorException` / `NotFoundException` 구분)
- FE: features/journal 모듈 생성 (api, hooks, components, types)
- FE: JournalForm, JournalList 컴포넌트 구현
- FE: OAuth 콜백 라우트(`/auth/callback`) 구현
- FE: 세션 가드 + `initialized` 플래그로 깜빡임 방지
- Docs: Day 5 OAuth 인증 계획서 작성, 스프린트 계획 재편

---

## 🔧 주요 변경사항

| 파일                                        | 변경 내용                             |
| ------------------------------------------- | ------------------------------------- |
| `backend/src/journal/` (신규 5개)           | CRUD controller, service, dto, module |
| `backend/src/supabase/database.types.ts`    | Supabase 자동 생성 DB 타입            |
| `backend/src/supabase/supabase.service.ts`  | `SupabaseClient<Database>` 타입화     |
| `backend/src/app/app.module.ts`             | JournalModule 등록                    |
| `backend/src/main.ts`                       | ValidationPipe 전역 적용              |
| `frontend/src/features/journal/` (신규 8개) | api, hooks, components, types         |
| `frontend/src/app/(app)/journal/page.tsx`   | placeholder → CRUD UI 오케스트레이션  |
| `frontend/src/app/auth/callback/route.ts`   | OAuth code → session 교환 라우트      |
| `frontend/src/app/(app)/layout.tsx`         | 세션 가드 활성화                      |
| `frontend/src/shared/stores/authStore.ts`   | `initialized` 플래그 추가             |
| `docs/devjournal-day5-plan.md`              | Day 5 OAuth 인증 구현 계획서          |

---

## 🐛 발생한 문제 & 해결

- **Supabase 타입 캐스트 문제**: `as unknown as EntryResponseDto` 필요 → DB 타입 생성 + `select('*')` + destructuring으로 캐스트 없이 해결
- **RLS 차단 문제**: `anon` 클라이언트로 조회 시 인증 없이 빈 배열 반환 → 테스트 시 `admin` 클라이언트로 임시 전환 후 인증 구현 완료 시 `anon`으로 복원
- **SupabaseAuthGuard DI 문제**: `JournalModule` providers에 `SupabaseAuthGuard` 미등록 → providers에 추가
- **세션 로드 전 깜빡임**: `session === null` 초기값으로 인해 로그인 사용자도 `/login`으로 튕김 → `initialized` 플래그 추가

---

## 💡 기술적 결정사항

| 결정                          | 이유                                           |
| ----------------------------- | ---------------------------------------------- |
| DB 타입 생성 + `Omit` 파생    | `any`/`unknown` 없이 완전한 타입 안전성        |
| `select('*')` + destructuring | 동적 컬럼 문자열로는 Supabase 타입 추론 불가   |
| soft delete (`deleted_at`)    | DB 설계 준수, 복구 가능성 유지                 |
| `PGRST116` 분기 처리          | row 없음(404)과 서버 에러(500) 명확히 구분     |
| Day 5를 OAuth 인증으로 교체   | CRUD 테스트 시 인증 없으면 RLS로 막혀 E2E 불가 |

---

## 🔗 관련 이슈/참고

- Day 4 계획서: `docs/devjournal-day4-plan.md`
- Day 5 계획서: `docs/devjournal-day5-plan.md` (다음 작업)
- 다음 작업: Supabase GitHub/Google OAuth Provider 활성화 + FE Google 버튼 추가
