# Day 5 — OAuth 인증 구현 계획서

> **목표:** GitHub + Google OAuth 로그인 / BE SupabaseAuthGuard 실전 적용 / FE 세션 가드 완성
> **작성일:** 2026-04-08
> **배경:** Day 4 Journal CRUD 완성 후 E2E 테스트를 위해 실제 인증 필요

---

## 현재 상태 (Day 4 완료 기준)

| 항목                      | 상태                                                          |
| ------------------------- | ------------------------------------------------------------- |
| `SupabaseAuthGuard`       | 구현 완료, journal.module에 등록됨                            |
| `journal.controller.ts`   | `@UseGuards(SupabaseAuthGuard)` 적용, `req.user.id` 사용      |
| `SupabaseProvider`        | `getSession()` + `onAuthStateChange()` + `initialized` 플래그 |
| `(app)/layout.tsx`        | 세션 가드 활성화 (`initialized && session === null` → /login) |
| `/auth/callback/route.ts` | OAuth code → session 교환 라우트 구현                         |
| `login/page.tsx`          | GitHub OAuth 버튼 + `redirectTo: /auth/callback`              |
| Supabase OAuth 설정       | **미완성** — GitHub/Google Provider 미활성화                  |

---

## BE 구현 계획

### 변경 없음

백엔드는 이미 완성 상태.

- `SupabaseAuthGuard`: Bearer token → `supabase.auth.getUser()` → `req.user` 주입
- `journal.controller.ts`: `req.user.id` 사용

**단, `user_profiles` 자동 생성 트리거 확인 필요:**
Supabase `auth.users`에 새 유저가 생성될 때 `user_profiles` 테이블에 row가 자동 insert되어야 함.
→ `migrations/20260405000010_triggers.sql` 확인 후 없으면 추가.

---

## Supabase 설정 계획

### 1. GitHub OAuth Provider 활성화

```
Supabase Dashboard
→ Authentication → Providers → GitHub
→ Enable GitHub Provider: ON
→ Client ID: <GitHub OAuth App에서 발급>
→ Client Secret: <GitHub OAuth App에서 발급>
→ Redirect URL 복사 (Supabase가 제공): https://vrhktnkdluqnsukbknwb.supabase.co/auth/v1/callback
```

**GitHub OAuth App 생성 (github.com → Settings → Developer settings → OAuth Apps):**

```
Application name: DevJournal (local)
Homepage URL: http://localhost:3000
Authorization callback URL: https://vrhktnkdluqnsukbknwb.supabase.co/auth/v1/callback
```

### 2. Google OAuth Provider 활성화

```
Supabase Dashboard
→ Authentication → Providers → Google
→ Enable Google Provider: ON
→ Client ID: <Google Cloud Console에서 발급>
→ Client Secret: <Google Cloud Console에서 발급>
```

**Google Cloud Console 설정 (console.cloud.google.com):**

```
APIs & Services → Credentials → OAuth 2.0 Client IDs
Authorized redirect URIs: https://vrhktnkdluqnsukbknwb.supabase.co/auth/v1/callback
```

### 3. Supabase Redirect URL 허용 목록 추가

```
Authentication → URL Configuration → Redirect URLs
추가: http://localhost:3000/auth/callback
```

---

## FE 구현 계획

### 수정할 파일 (1개)

#### `app/(auth)/login/page.tsx` — Google 버튼 추가

```typescript
// GitHub 버튼 (기존)
await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: { redirectTo: `${window.location.origin}/auth/callback` },
});

// Google 버튼 (추가)
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${window.location.origin}/auth/callback` },
});
```

**UI 구성:**

```
┌─────────────────────────────┐
│         DevJournal          │
│   개발 일기로 성장을 추적하세요  │
│                             │
│  [ GitHub으로 로그인 ]       │
│  [ Google로 로그인  ]        │
│                             │
└─────────────────────────────┘
```

### 추가할 파일 (1개)

#### `app/(auth)/login/error/page.tsx` — 인증 실패 에러 페이지

`/login?error=auth_failed` 리다이렉트 시 사용자에게 안내.

```typescript
// searchParams.error 값에 따라 메시지 표시
// "다시 로그인" 버튼 → /login
```

### 수정할 파일 (1개, 선택)

#### `app/auth/callback/route.ts` — 에러 케이스 보강

```typescript
// 현재: error → /login?error=auth_failed
// 추가: error 타입별 메시지 구분 (access_denied, server_error 등)
return NextResponse.redirect(
  `${origin}/login?error=${error.code ?? 'auth_failed'}`,
);
```

---

## 검증 체크리스트

### Supabase 설정

- [ ] GitHub Provider 활성화 + OAuth App 생성 완료
- [ ] Google Provider 활성화 + Cloud Console 설정 완료
- [ ] Redirect URL `http://localhost:3000/auth/callback` 허용 목록 추가

### GitHub 로그인 플로우

- [ ] `/login` → GitHub 버튼 클릭 → GitHub 인증 → `/journal` 이동
- [ ] `GET /api/entries` 200 반환 (Bearer token 정상 첨부)
- [ ] `POST /api/entries` 200 반환 (user_id가 실제 Supabase user.id)
- [ ] 새로고침 후 세션 유지

### Google 로그인 플로우

- [ ] `/login` → Google 버튼 클릭 → Google 인증 → `/journal` 이동
- [ ] 동일 이메일 GitHub/Google 중복 계정 처리 확인

### 세션 가드

- [ ] 비로그인 상태로 `/journal` 직접 접근 → `/login` 리다이렉트
- [ ] 로그아웃 후 `/journal` 접근 → `/login` 리다이렉트

### user_profiles 트리거

- [ ] 신규 로그인 시 `user_profiles` row 자동 생성 확인

---

## 구현 순서

```
1. Supabase 설정 (외부 작업 — 사용자가 직접)
   ① GitHub OAuth App 생성 + Supabase GitHub Provider 활성화
   ② Google OAuth App 생성 + Supabase Google Provider 활성화
   ③ Redirect URL 허용 목록 추가

2. FE (Claude 작업)
   ① login/page.tsx — Google 버튼 추가
   ② login/error/page.tsx — 에러 페이지 추가 (선택)

3. BE (Claude 작업)
   ① user_profiles 트리거 존재 여부 확인 및 보완

4. E2E 테스트
   ① GitHub 로그인 → /journal CRUD 전체 확인
   ② Google 로그인 → /journal CRUD 전체 확인
```

---

## 주요 설계 결정

| 결정                         | 이유                                                        |
| ---------------------------- | ----------------------------------------------------------- |
| Supabase OAuth (직접 구현 X) | Supabase가 provider 토큰 관리, refresh 자동 처리            |
| GitHub + Google 두 provider  | 개발자는 GitHub 선호, 일반 사용자는 Google 선호             |
| `/auth/callback` 단일 라우트 | provider 무관하게 동일 code exchange 로직 공유              |
| `user_profiles` 트리거 방식  | `auth.users` insert 이벤트로 자동 생성, 앱 레벨 코드 불필요 |
