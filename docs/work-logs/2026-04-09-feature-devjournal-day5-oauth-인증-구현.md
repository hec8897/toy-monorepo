# 2026-04-09 feature/devjournal-day5-oauth 작업 일지

## 📋 작업 개요

- **브랜치**: `feature/devjournal-day5-oauth`
- **작업 일자**: 2026-04-09
- **목적**: GitHub OAuth 인증 E2E 플로우 완성 및 관련 버그 수정

## ✅ 완료된 작업

- GitHub OAuth 로그인 플로우 완성 (로그인 → /journal 이동)
- `auth.users` INSERT 시 `user_profiles` 자동 생성 트리거 추가
- OAuth 에러 타입별 피드백 페이지 구현
- `GET /api/entries` RLS 차단 버그 수정

## 🔧 주요 변경사항

| 파일                                                          | 변경 내용                                              |
| ------------------------------------------------------------- | ------------------------------------------------------ |
| `migrations/20260409000013_user_profiles_auth_trigger.sql`    | auth.users INSERT 시 user_profiles 자동 생성 트리거    |
| `app/auth/callback/route.ts`                                  | 에러 시 `/login/error?reason=<code>` 리다이렉트로 개선 |
| `domains/auth/presentation/components/LoginPageView.tsx`      | `scopes: 'user:email'` 명시 추가                       |
| `domains/auth/presentation/components/LoginErrorPageView.tsx` | 신규 — 에러 타입별 한국어 메시지 + 다시 로그인 버튼    |
| `app/(auth)/login/error/page.tsx`                             | 신규 — 에러 페이지 thin entry point                    |
| `backend/src/journal/journal.service.ts`                      | findAll/findOne anon → admin 클라이언트 변경           |

## 🐛 발생한 문제 & 해결

### 1. GitHub OAuth App vs GitHub App 혼동

- **문제**: GitHub App으로 생성 시 `/user/emails` 403 "Resource not accessible by integration" 에러
- **원인**: Supabase GitHub 프로바이더는 OAuth App 필요. GitHub App은 installation token을 사용해 이메일 접근 권한 구조가 다름
- **해결**: GitHub Developer Settings → OAuth Apps에서 신규 생성 후 교체

### 2. GitHub 이메일 scope 미요청

- **문제**: OAuth App 교체 후에도 동일 에러 발생
- **원인**: `signInWithOAuth` 호출 시 `user:email` scope가 명시적으로 요청되지 않음
- **해결**: `scopes: 'user:email'` 옵션 추가

### 3. GET /api/entries 빈 배열 반환

- **문제**: 로그인 후 일기 목록이 비어 있음
- **원인**: `journal.service.ts`의 `findAll`/`findOne`이 `anon` 클라이언트 사용. 백엔드 anon 클라이언트에는 유저 JWT가 없어 `auth.uid() = null` → RLS가 모든 row 차단
- **해결**: `admin` 클라이언트로 변경 (user_id 필터는 쿼리에서 직접 수행)

## 💡 기술적 결정사항

### admin 클라이언트 사용 범위

- `create`, `remove`: 처음부터 admin 사용 (RLS 우회 필요)
- `findAll`, `findOne`: anon → admin 변경
- **이유**: NestJS 백엔드는 Supabase JWT를 직접 전파하지 않음. 인증은 `SupabaseAuthGuard`에서 처리하고, 서비스 레이어는 검증된 `userId`를 파라미터로 받아 직접 필터링하는 구조

### user_profiles 트리거 설계

- `security definer` + `set search_path = public`: RLS 우회 + search path injection 방지
- `on conflict (id) do nothing`: 멱등성 보장 (재실행 안전)
- `display_name` fallback: `name` → `user_name` → null 순서 (GitHub 메타데이터 구조 반영)

## 🔗 관련 이슈/참고

- Day 5 계획서: `docs/devjournal-day5-plan.md`
- Supabase Auth 설정 메모 (도메인 연결 시 참고): `docs/devjournal-plan.md` → "Supabase Auth 설정 메모" 섹션
