# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication Style

**언어**: 가능한 모든 응답을 한글로 작성해주세요 🇰🇷

**아이콘 사용**: 응답을 더욱 명확하고 친근하게 만들기 위해 적절한 아이콘을 사용해주세요:
- ✅ 성공, 완료
- ❌ 실패, 에러
- 🚀 시작, 배포
- 📝 문서, 설명
- 🔧 설정, 도구
- 💡 팁, 제안
- ⚠️ 경고, 주의사항
- 🎯 목표, 핵심
- 📦 패키지, 의존성
- 🔍 검색, 조사
- 🎨 UI/UX, 디자인
- 🐛 버그
- ✨ 새로운 기능

**예시**:
```
✅ 서버가 성공적으로 시작되었습니다!
📦 패키지 설치 중...
⚠️ 주의: 이 작업은 되돌릴 수 없습니다
```

## Project Overview

This is an NX monorepo managing both backend (NestJS) and frontend (Next.js) applications with shared TypeScript packages. The project is designed with future Flutter WebView integration in mind.

## Development Commands

```bash
# Development servers
npm run dev              # Run both backend and frontend concurrently
npm run dev:backend      # Backend only (http://localhost:3001/api)
npm run dev:frontend     # Frontend only (http://localhost:3000)

# Building
npm run build            # Build all projects in parallel
npm run build:backend    # Build backend only
npm run build:frontend   # Build frontend only

# Testing
npm test                 # Run all tests
npm run test:backend     # Test backend only
npm run test:frontend    # Test frontend only
npx nx test <project>    # Run tests for specific project
npx nx run backend:e2e   # Run backend E2E tests
npx nx run frontend:e2e  # Run frontend E2E tests

# Linting
npm run lint             # Lint all projects
npm run lint:backend     # Lint backend only
npm run lint:frontend    # Lint frontend only

# NX-specific commands
npm run graph            # Visualize project dependency graph
npm run affected:build   # Build only affected projects
npm run affected:test    # Test only affected projects
npx nx show project <name>  # Show project configuration details
```

## Architecture

### Monorepo Structure

- **apps/backend/** - NestJS application (port 3001)
  - **e2e/** - Backend E2E tests (Jest)
- **apps/frontend/** - Next.js 16 application (port 3000)
  - **e2e/** - Frontend E2E tests (Playwright)
- **packages/common/** - Shared utilities (@toy-monorepo/common)
- **packages/types/** - Shared TypeScript types (@toy-monorepo/types)

### NX Configuration

The monorepo uses NX plugins to manage different project types:

- **@nx/webpack/plugin** - Backend build (target: `serve`)
- **@nx/next/plugin** - Frontend build (target: `dev`)
- **@nx/jest/plugin** - Unit testing
- **@nx/playwright/plugin** - E2E testing
- **@nx/eslint/plugin** - Linting

**Important**: Backend uses `nx serve backend`, but frontend uses `nx dev frontend` due to different plugin targets.

### Port Configuration

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001/api`

The backend has a global API prefix `/api` configured in `apps/backend/src/main.ts`.

### TypeScript Path Aliases

Shared packages are accessible via path aliases defined in `tsconfig.base.json`:

- `@toy-monorepo/common` → `packages/common/src/index.ts`
- `@toy-monorepo/types` → `packages/types/src/index.ts`

Use these imports instead of relative paths when consuming shared code.

### CORS Configuration

CORS is pre-configured in the backend for:

- Frontend (`http://localhost:3000`)
- Alternative dev port (`http://localhost:4200`)
- Future Flutter WebView integration (credentials enabled)

Located in `apps/backend/src/main.ts:16-25`.

## 데이터베이스 & Supabase

### 개요

백엔드는 **TypeORM**을 ORM으로 사용하여 **Supabase**를 통한 **PostgreSQL** 데이터베이스를 사용합니다. 데이터베이스 설정은 연결 URL과 개별 연결 매개변수 모두 지원하여 유연성을 제공합니다.

### 데이터베이스 설정

설정은 `apps/backend/src/config/database.config.ts`를 통해 관리되며, 두 가지 연결 모드를 지원합니다:

1. **DATABASE_URL 모드** (Supabase 권장):
   - 단일 연결 문자열 사용
   - 자동 SSL 설정
   - 간편한 설정

2. **개별 매개변수 모드**:
   - host, port, username, password, database 개별 설정
   - SSL 설정 가능
   - 로컬 개발 또는 커스텀 설정에 유용

### 환경 변수

`apps/backend/.env.example`을 `apps/backend/.env`로 복사하고 설정:

```bash
# 옵션 1: 연결 URL (Supabase 권장)
DATABASE_URL=postgresql://postgres.your-project-ref:your-password@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres

# 옵션 2: 개별 매개변수
DB_HOST=aws-0-ap-northeast-2.pooler.supabase.com
DB_PORT=6543
DB_USERNAME=postgres.your-username
DB_PASSWORD=your-password
DB_DATABASE=postgres
DB_SSL=true

# 애플리케이션
PORT=3001
NODE_ENV=development
```

**참고**: `DATABASE_URL`이 설정되면 개별 매개변수보다 우선합니다.

### 엔티티

현재 TypeORM 엔티티:

- **Member** (`apps/backend/src/entities/member.entity.ts`):
  - 테이블: `members`
  - 필드: `id` (bigint), `username`, `name`, `password`, `phone`, `created_at`
  - `MembersModule`에서 회원 관리에 사용

- **User** (`apps/backend/src/entities/user.entity.ts`):
  - 테이블: `users`
  - 필드: `id` (uuid), `email`, `name`, `createdAt`, `updatedAt`
  - email은 고유값

### TypeORM 설정

- **자동 동기화**: 개발 모드에서 활성화 (`synchronize: true`)
- **SSL**: Supabase 연결에 필수
- **로깅**: 개발 환경에서 디버깅을 위해 활성화
- **엔티티 등록**: 모든 엔티티는 `getDatabaseConfig()`에 등록되어야 함

### API 엔드포인트

- `GET /api/members` - 모든 회원 조회 (`MembersController`에서 처리)

### 새 엔티티 추가하기

1. `apps/backend/src/entities/`에 엔티티 파일 생성
2. `apps/backend/src/config/database.config.ts`에 엔티티 등록
3. 해당 모듈, 서비스, 컨트롤러 생성
4. `AppModule`(`apps/backend/src/app/app.module.ts`)에 모듈 임포트

## NX Build System Features

- **Caching**: Build, lint, and test operations are cached. Use `--skip-nx-cache` to bypass.
- **Affected Commands**: Only rebuild/test projects affected by changes (based on git diff from `main` branch).
- **Parallel Execution**: Multiple projects can build/test simultaneously.
- **Dependency Graph**: Build order respects project dependencies automatically.

## Tech Stack

- **Backend**: NestJS 11, Express, TypeScript 5.9
- **Frontend**: Next.js 16, React 19, TypeScript 5.9
- **Testing**: Jest 30, Playwright 1.36
- **Build System**: NX 22.3.3, Webpack 5, Turbopack (Next.js)
- **Code Quality**: ESLint 9, Prettier 3.6

## Important Notes

- All projects use TypeScript. Ensure new code maintains type safety.
- The frontend uses Next.js App Router (not Pages Router).
- ESLint ignores build outputs (`.next`, `dist`, `out-tsc`).
- The monorepo is configured for future mobile app integration via WebView.

## Git Branch Strategy

This repo uses a Git Flow inspired branching model.

### Main branches

- `main`: Production-ready code. Only release branches and hotfixes are merged here.
- `develop`: Integration branch for ongoing development. New features start from here.

### Supporting branches

- `feature/*`: New features or experiments
  - Base branch: `develop`
  - Naming: `feature/<scope>-<short-description>`
  - Example: `feature/web-auth-page`, `feature/api-user-crud`

- `release/*`: Preparation for a new production release
  - Base branch: `develop`
  - Used for: version bump, final bug fixes, docs updates
  - After completion: merge into `main` and back into `develop`

- `hotfix/*`: Critical fixes for production
  - Base branch: `main`
  - After completion: merge into `main` and back into `develop`

### Typical workflows

- Start a new feature
  - `git checkout develop`
  - `git checkout -b feature/web-sso-login`

- Finish a feature
  - Open a PR from `feature/...` into `develop`
  - Squash & merge with a clear commit message

- Create a release
  - `git checkout develop`
  - `git checkout -b release/0.1.0`

- Hotfix production
  - `git checkout main`
  - `git checkout -b hotfix/fix-api-timeout`
