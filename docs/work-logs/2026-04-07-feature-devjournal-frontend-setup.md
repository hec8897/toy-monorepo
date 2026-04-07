# 2026-04-07 feature/devjournal-frontend-setup 작업 일지

## 📋 작업 개요

- **브랜치**: `feature/devjournal-frontend-setup`
- **작업 일자**: 2026-04-07
- **목적**: DevJournal 프로젝트 — NX devjournal-frontend Next.js 앱 스캐폴딩 및 기본 구조 구현

## ✅ 완료된 작업

- NX로 `devjournal-frontend` (Next.js) 앱 스캐폴딩
- Tailwind CSS v4 + PostCSS 설정
- RootLayout: `QueryProvider` + `SupabaseProvider` 래핑
- Supabase 클라이언트 생성 유틸 (`@supabase/ssr` 기반)
- Axios API 인스턴스 (`@/shared/lib/api.ts`): Supabase JWT 자동 첨부 인터셉터
- Zustand `authStore`: Supabase 세션 상태 전역 관리
- 인증/비인증/블로그 라우트 그룹 분리: `(app)`, `(auth)`, `(blog)`
- 페이지 스캐폴딩: `/journal`, `/dashboard`, `/mindmap`, `/login`, `/blog`, `/blog/[slug]`
- dev/build 스크립트 추가 (`dev:devjournal-frontend`, `dev:devjournal`)

## 🔧 주요 변경사항

| 파일                                                                 | 변경 내용                                                           |
| -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `apps/devjournal/frontend/project.json`                              | NX 프로젝트 등록                                                    |
| `apps/devjournal/frontend/tsconfig.json`                             | TypeScript 설정 (`@/*` 절대 경로, `@devjournal/types` alias)        |
| `apps/devjournal/frontend/next.config.js`                            | NX Next.js 플러그인 설정                                            |
| `apps/devjournal/frontend/tailwind.config.ts`                        | Tailwind CSS v4 설정                                                |
| `apps/devjournal/frontend/postcss.config.js`                         | PostCSS 설정 (`@tailwindcss/postcss`)                               |
| `apps/devjournal/frontend/src/app/layout.tsx`                        | RootLayout (QueryProvider + SupabaseProvider)                       |
| `apps/devjournal/frontend/src/app/page.tsx`                          | 루트 페이지 → `/journal` 리다이렉트                                 |
| `apps/devjournal/frontend/src/shared/providers/QueryProvider.tsx`    | React Query Provider                                                |
| `apps/devjournal/frontend/src/shared/providers/SupabaseProvider.tsx` | Supabase 클라이언트 Context + 세션 동기화                           |
| `apps/devjournal/frontend/src/shared/lib/supabase.ts`                | `@supabase/ssr` 기반 클라이언트 팩토리                              |
| `apps/devjournal/frontend/src/shared/lib/api.ts`                     | Axios 인스턴스 (baseURL: `NEXT_PUBLIC_API_URL`, JWT 인터셉터)       |
| `apps/devjournal/frontend/src/shared/stores/authStore.ts`            | Zustand 세션 스토어                                                 |
| `apps/devjournal/frontend/src/app/(app)/layout.tsx`                  | 인증 필요 라우트 그룹 레이아웃                                      |
| `apps/devjournal/frontend/src/app/(auth)/login/page.tsx`             | 로그인 페이지 스캐폴딩                                              |
| `apps/devjournal/frontend/src/app/(blog)/layout.tsx`                 | 블로그 레이아웃                                                     |
| `package.json`                                                       | dev/build 스크립트 추가, `@nx/next` 버전 고정, `@supabase/ssr` 추가 |

## 🐛 발생한 문제 & 해결

- 특이사항 없음 (백엔드 스캐폴딩에서 해결한 eslint pathGroups, tailwind v4 설정이 그대로 적용됨)

## 💡 기술적 결정사항 (왜 이 방법을 선택했는가)

- **`@supabase/ssr` 사용**: Next.js App Router 환경에서 SSR/CSR 모두 지원하는 Supabase 클라이언트 팩토리. `createBrowserClient`를 클라이언트 컴포넌트에서 사용
- **라우트 그룹 분리 `(app)` / `(auth)` / `(blog)`**: 인증 필요 페이지와 공개 페이지를 레이아웃 수준에서 분리, 인증 가드 적용 위치 명확화
- **SupabaseProvider에서 세션 동기화**: `onAuthStateChange`를 최상위에서 구독하여 Zustand authStore에 세션 상태 전파, 컴포넌트마다 개별 구독 불필요
- **Axios 인터셉터로 JWT 자동 첨부**: API 호출 시 매번 토큰을 수동으로 첨부하지 않아도 되도록 인터셉터에서 Supabase 세션에서 토큰 추출 후 자동 주입

## 🔗 관련 이슈/참고

- 계획서: `docs/devjournal-plan.md`
- 백엔드 작업 일지: `docs/work-logs/2026-04-06-feature-devjournal-backend-setup.md`
- Supabase 프로젝트 ID: `vrhktnkdluqnsukbknwb` (ap-northeast-2)
- `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:3002/api`
