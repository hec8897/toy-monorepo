# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
