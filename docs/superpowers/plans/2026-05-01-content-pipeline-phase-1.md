# Content Pipeline — Phase 1 (기반) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `apps/content-pipeline/` 신설 앱(Backend + Frontend)을 1차 devjournal 패턴 그대로 스캐폴드하고, Supabase Auth 로그인 플로우 + ECS Fargate 배포 + n8n self-host(Cloudflare Access)까지 굳혀, Phase 2(AI 인터뷰) 위에 얹을 수 있는 토대를 만든다.

**Architecture:**

- 백엔드 = NestJS (devjournal 패턴 1:1 재활용 — `SupabaseModule`, `SupabaseAuthGuard`, raw SQL 마이그레이션). 컨테이너 = Docker → ECR → ECS Fargate.
- 프론트엔드 = Next.js App Router (devjournal `domains/` + `shared/` 폴더 패턴). 배포는 Vercel(devjournal과 동일).
- 인프라 = 단일 VPC + public subnet only, ALB 호스트 라우팅 (`api.<domain>` → backend ECS Service, `n8n.<domain>` → n8n ECS Service). Cloudflare Access로 n8n UI 보호, `/webhook/*` 만 public + HMAC.
- DB = 1차 Supabase 인스턴스 재활용. content-pipeline 테이블은 `cp_` 접두어로 `public` 스키마 안에 격리. n8n 메타데이터는 같은 Supabase Postgres에 별도 DB(`n8n_meta`)로 분리.

**Tech Stack:** NestJS 11 / Next.js 16 (App Router) / pnpm 10 / Nx 22 / @supabase/supabase-js / Docker / AWS (ECR + ECS Fargate + ALB + CloudWatch) / Cloudflare (DNS + Zero Trust Access) / GitHub Actions

**Out-of-scope (다음 Phase로 미룸):**

- AI 인터뷰 / 양산 / 미리보기 코드 (Phase 2~4)
- 발행 큐 DB 스키마, n8n 워크플로우, 스케줄러 (Phase 5)
- 채널 어댑터 (네이버 메일 트릭 / 인스타 Graph API) (Phase 6~7)
- HMAC 서명 검증 모듈 (Phase 5에서 first-use 시 도입)
- `cp_*` 도메인 테이블 (`cp_topics`, `cp_drafts` 등 — Phase 2 시작 시 첫 마이그레이션)

---

## File Structure

생성/수정할 파일 (Phase 1):

**신규 디렉토리**

- `apps/content-pipeline/` (루트)
- `apps/content-pipeline/backend/` (NestJS)
- `apps/content-pipeline/frontend/` (Next.js)
- `apps/content-pipeline/supabase/migrations/` (raw SQL)
- `apps/content-pipeline/types/` (앱 로컬 공유 타입)

**백엔드 — `apps/content-pipeline/backend/`**

- Create: `project.json`, `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json`, `webpack.config.js`, `jest.config.cts`, `Dockerfile`, `.dockerignore`, `.env.example`
- Create: `src/main.ts`
- Create: `src/app/app.module.ts`, `src/app/app.controller.ts`, `src/app/app.controller.spec.ts`
- Create: `src/supabase/supabase.module.ts`, `src/supabase/supabase.service.ts`
- Create: `src/auth/supabase-auth.guard.ts`, `src/auth/supabase-auth.guard.spec.ts`
- Create: `src/health/health.module.ts`, `src/health/health.controller.ts`, `src/health/health.controller.spec.ts`

**프론트엔드 — `apps/content-pipeline/frontend/`**

- Create: `project.json`, `package.json`, `tsconfig.json`, `tsconfig.app.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `.env.local.example`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(app)/layout.tsx`, `src/app/(app)/page.tsx` (dashboard placeholder)
- Create: `src/app/auth/callback/route.ts`
- Create: `src/shared/lib/supabase/client.ts`, `src/shared/lib/supabase/server.ts`
- Create: `src/shared/components/AuthGuard.tsx`
- Create: `src/domains/auth/LoginForm.tsx`

**Supabase — `apps/content-pipeline/supabase/`**

- Create: `migrations/20260501000001_extensions.sql`
- Create: `README.md` (마이그레이션 적용/롤백 가이드)

**타입 — `apps/content-pipeline/types/`**

- Create: `index.ts` (placeholder export)

**인프라 — 신규**

- Create: `infra/content-pipeline/n8n/Dockerfile` (n8n ECS Task용)
- Create: `infra/content-pipeline/n8n/.env.example`
- Create: `infra/content-pipeline/README.md` (AWS 1회성 셋업 + Cloudflare 가이드)
- Create: `.github/workflows/deploy-content-pipeline-backend.yml`
- Create: `.github/workflows/deploy-content-pipeline-n8n.yml`

**모노레포 루트 수정**

- Modify: `package.json` (scripts: `dev:content-pipeline-backend`, `dev:content-pipeline-frontend`, `build:content-pipeline-backend`)
- Modify: `tsconfig.base.json` (path alias 추가: `@content-pipeline/types`)

**문서**

- Modify: `docs/superpowers/specs/2026-04-28-content-pipeline-saas-design.md` (`## 10. Plans` 섹션 추가하여 본 plan 링크)
- Modify: `.claude/CLAUDE.md` (`apps/content-pipeline` 항목 추가)

---

## Task 1: 작업 브랜치 + 모노레포 디렉토리 골격

**Files:**

- Create: `apps/content-pipeline/` (디렉토리만)
- Create: `apps/content-pipeline/types/index.ts`
- Modify: `tsconfig.base.json`

- [ ] **Step 1: 새 feature 브랜치 생성**

`develop`에서 분기. 작업은 isolated worktree에서.

```bash
cd /Users/dawoon/Desktop/dev/toy-monorepo
git fetch origin
git checkout develop && git pull origin develop
git worktree add ../toy-monorepo-cp-phase1 -b feature/content-pipeline-phase-1 develop
cd ../toy-monorepo-cp-phase1
pnpm install
```

- [ ] **Step 2: 디렉토리 골격 + types placeholder 생성**

`apps/content-pipeline/types/index.ts`:

```ts
// content-pipeline 앱 로컬 공유 타입.
// 패키지로 승격하기 전 단계 — 백엔드/프론트가 같은 타입을 import할 때 사용.
export {};
```

- [ ] **Step 3: tsconfig path alias 추가**

`tsconfig.base.json`의 `compilerOptions.paths`에 다음 항목 추가 (devjournal `@/*` 패턴과 동일하게 앱 내부 path는 각 앱 tsconfig에서 처리, 공유 타입만 루트에서 노출):

```json
{
  "@content-pipeline/types": ["apps/content-pipeline/types/index.ts"]
}
```

- [ ] **Step 4: 변경 확인**

```bash
cat tsconfig.base.json | grep "@content-pipeline" -A 0
ls apps/content-pipeline/types/
```

기대 출력: alias 라인 출력, `index.ts` 파일 존재.

- [ ] **Step 5: 커밋**

```bash
git add apps/content-pipeline/types tsconfig.base.json
git commit -m "chore(content-pipeline): bootstrap directory + tsconfig alias"
```

---

## Task 2: NestJS 백엔드 앱 스캐폴드 + Supabase/Auth/Health 모듈

> 핵심 결정: devjournal `apps/devjournal/backend/` 의 **파일 구성을 1:1로 복제**한다. 차이점만 따로 표기. devjournal 코드를 직접 import하지는 않음 (B-3 read-only 보존).

**Files:**

- Create: `apps/content-pipeline/backend/project.json`, `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json`, `webpack.config.js`, `jest.config.cts`, `.env.example`
- Create: `apps/content-pipeline/backend/src/main.ts`, `src/app/app.module.ts`
- Create: `src/supabase/supabase.module.ts`, `src/supabase/supabase.service.ts`
- Create: `src/auth/supabase-auth.guard.ts`, `src/auth/supabase-auth.guard.spec.ts`
- Create: `src/health/health.module.ts`, `src/health/health.controller.ts`, `src/health/health.controller.spec.ts`

- [ ] **Step 1: project.json + Nx 빌드 설정 생성**

`apps/content-pipeline/backend/project.json` — devjournal `apps/devjournal/backend/project.json` 그대로 복제 후 이름/cwd만 교체:

```json
{
  "name": "content-pipeline-backend",
  "$schema": "../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/content-pipeline/backend/src",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "webpack-cli build",
        "args": ["--node-env=production"],
        "cwd": "apps/content-pipeline/backend"
      },
      "configurations": {
        "development": { "args": ["--node-env=development"] }
      }
    },
    "prune-lockfile": {
      "dependsOn": ["build"],
      "cache": true,
      "executor": "@nx/js:prune-lockfile",
      "outputs": [
        "{workspaceRoot}/dist/apps/content-pipeline/backend/package.json",
        "{workspaceRoot}/dist/apps/content-pipeline/backend/pnpm-lock.yaml"
      ],
      "options": { "buildTarget": "build" }
    },
    "copy-workspace-modules": {
      "dependsOn": ["build"],
      "cache": true,
      "outputs": [
        "{workspaceRoot}/dist/apps/content-pipeline/backend/workspace_modules"
      ],
      "executor": "@nx/js:copy-workspace-modules",
      "options": { "buildTarget": "build" }
    },
    "prune": {
      "dependsOn": ["prune-lockfile", "copy-workspace-modules"],
      "executor": "nx:noop"
    },
    "serve": {
      "continuous": true,
      "executor": "nx:run-commands",
      "dependsOn": ["build"],
      "options": {
        "commands": [
          "cd apps/content-pipeline/backend && webpack-cli build --node-env=development --watch",
          "node dist/apps/content-pipeline/backend/main.js"
        ],
        "parallel": true
      }
    },
    "test": {
      "executor": "@nx/jest:jest",
      "options": {
        "jestConfig": "apps/content-pipeline/backend/jest.config.cts"
      }
    }
  },
  "tags": []
}
```

- [ ] **Step 2: package.json / tsconfig / webpack / jest 설정 복제**

devjournal에서 그대로 복제:

```bash
cp apps/devjournal/backend/package.json     apps/content-pipeline/backend/package.json
cp apps/devjournal/backend/tsconfig.json    apps/content-pipeline/backend/tsconfig.json
cp apps/devjournal/backend/tsconfig.app.json apps/content-pipeline/backend/tsconfig.app.json
cp apps/devjournal/backend/tsconfig.spec.json apps/content-pipeline/backend/tsconfig.spec.json
cp apps/devjournal/backend/webpack.config.js apps/content-pipeline/backend/webpack.config.js
cp apps/devjournal/backend/jest.config.cts  apps/content-pipeline/backend/jest.config.cts
```

복제 후 `package.json`의 `name`을 `@toy-monorepo/content-pipeline-backend` 로 변경 (또는 devjournal과 동일한 네이밍 컨벤션 따라).

- [ ] **Step 3: `.env.example` 작성**

`apps/content-pipeline/backend/.env.example`:

```env
# 1차 devjournal과 같은 Supabase 프로젝트 사용
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# 서버 포트 (devjournal-backend 3002와 충돌 회피)
PORT=3003

# CORS
FRONTEND_URL=http://localhost:3004
```

- [ ] **Step 4: `main.ts` 작성**

`apps/content-pipeline/backend/src/main.ts` — devjournal `main.ts` 골격 그대로, 포트/도메인만 교체:

```ts
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const allowedOrigins = [
    process.env.FRONTEND_URL ?? 'http://localhost:3004',
    /https:\/\/content-pipeline.*\.vercel\.app$/,
  ];

  app.enableCors({ origin: allowedOrigins, credentials: true });

  const port = process.env.PORT ?? 3003;
  await app.listen(port);
  Logger.log(`🚀 content-pipeline backend on http://localhost:${port}/api`);
}

bootstrap();
```

- [ ] **Step 5: `SupabaseModule` + `SupabaseService` 작성 (devjournal 복제)**

`apps/content-pipeline/backend/src/supabase/supabase.module.ts`:

```ts
import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
```

`apps/content-pipeline/backend/src/supabase/supabase.service.ts`:

```ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  anon!: SupabaseClient;
  serviceRole!: SupabaseClient;

  onModuleInit() {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey || !serviceKey) {
      throw new Error('Supabase env vars are missing');
    }

    this.anon = createClient(url, anonKey);
    this.serviceRole = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
}
```

- [ ] **Step 6: `SupabaseAuthGuard` 작성 (devjournal 복제)**

`apps/content-pipeline/backend/src/auth/supabase-auth.guard.ts` — devjournal `supabase-auth.guard.ts` 그대로 복사:

```ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { SupabaseService } from '@/supabase/supabase.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Authorization token is required');
    }

    const { data, error } = await this.supabase.anon.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    (request as Request & { user: typeof data.user }).user = data.user;
    return true;
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
    const queryToken = (request.query as Record<string, string | undefined>)
      .token;
    if (queryToken) return queryToken;
    return null;
  }
}
```

- [ ] **Step 7: 실패 테스트 작성 — Health controller (TDD)**

`apps/content-pipeline/backend/src/health/health.controller.spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    controller = moduleRef.get(HealthController);
  });

  it('returns ok with service name and timestamp', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('content-pipeline-backend');
    expect(typeof result.timestamp).toBe('string');
    expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
  });
});
```

- [ ] **Step 8: 테스트 실행해서 실패 확인**

```bash
pnpm nx test content-pipeline-backend --testFile=src/health/health.controller.spec.ts
```

기대: `Cannot find module './health.controller'` 또는 `HealthController is not defined` 류 실패.

- [ ] **Step 9: Health controller/module 구현**

`apps/content-pipeline/backend/src/health/health.controller.ts`:

```ts
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok' as const,
      service: 'content-pipeline-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
```

`apps/content-pipeline/backend/src/health/health.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({ controllers: [HealthController] })
export class HealthModule {}
```

- [ ] **Step 10: AppModule 작성**

`apps/content-pipeline/backend/src/app/app.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HealthModule } from '@/health/health.module';
import { SupabaseModule } from '@/supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    HealthModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 11: 테스트 통과 확인**

```bash
pnpm nx test content-pipeline-backend
```

기대: 모든 테스트 PASS (Health 1개 통과 + 빈 다른 spec).

- [ ] **Step 12: 빌드 확인**

```bash
pnpm nx build content-pipeline-backend
ls dist/apps/content-pipeline/backend/main.js
```

기대: `main.js` 생성됨.

- [ ] **Step 13: 커밋**

```bash
git add apps/content-pipeline/backend
git commit -m "feat(content-pipeline): scaffold NestJS backend (Supabase, auth guard, health)"
```

---

## Task 3: Next.js 프론트엔드 앱 스캐폴드 + 로그인 페이지

> 핵심 결정: devjournal `apps/devjournal/frontend/`의 `domains/` + `shared/` 폴더 패턴, App Router `(auth)` `(app)` 라우트 그룹 패턴을 그대로 따른다.

**Files:**

- Create: `apps/content-pipeline/frontend/project.json`, `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `.env.local.example`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(app)/layout.tsx`, `src/app/(app)/page.tsx`
- Create: `src/app/auth/callback/route.ts`
- Create: `src/shared/lib/supabase/client.ts`, `src/shared/lib/supabase/server.ts`
- Create: `src/shared/components/AuthGuard.tsx`
- Create: `src/domains/auth/LoginForm.tsx`

- [ ] **Step 1: project.json + Next 설정 복제**

devjournal frontend 설정에서 복제:

```bash
cp apps/devjournal/frontend/project.json    apps/content-pipeline/frontend/project.json
cp apps/devjournal/frontend/package.json    apps/content-pipeline/frontend/package.json
cp apps/devjournal/frontend/tsconfig.json   apps/content-pipeline/frontend/tsconfig.json
cp apps/devjournal/frontend/next.config.ts  apps/content-pipeline/frontend/next.config.ts
cp apps/devjournal/frontend/tailwind.config.ts apps/content-pipeline/frontend/tailwind.config.ts 2>/dev/null || true
cp apps/devjournal/frontend/postcss.config.js  apps/content-pipeline/frontend/postcss.config.js 2>/dev/null || true
```

`apps/content-pipeline/frontend/project.json` 의 `name`을 `content-pipeline-frontend`, `sourceRoot`를 `apps/content-pipeline/frontend` 로 교체.
`package.json`의 `name`을 `content-pipeline-frontend` 로 교체.

`@supabase/ssr` 미설치 시 추가 (devjournal에 이미 있으면 lockfile에 잡힘):

```bash
pnpm add -w @supabase/ssr @supabase/supabase-js
```

- [ ] **Step 2: `.env.local.example` 작성**

`apps/content-pipeline/frontend/.env.local.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_BASE_URL=http://localhost:3003/api
```

- [ ] **Step 3: Supabase 클라이언트 헬퍼 작성**

`apps/content-pipeline/frontend/src/shared/lib/supabase/client.ts`:

```ts
'use client';

import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

`apps/content-pipeline/frontend/src/shared/lib/supabase/server.ts`:

```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );
}
```

- [ ] **Step 4: 루트 layout + globals.css 작성**

`apps/content-pipeline/frontend/src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Content Pipeline',
  description: 'AI 인터뷰 기반 콘텐츠 자동화 SaaS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

`apps/content-pipeline/frontend/src/app/globals.css`:

```css
@import 'tailwindcss';

@source '../**/*.{ts,tsx}';

:root {
  color-scheme: light;
}

body {
  background: #fff;
  color: #111;
}
```

(Tailwind v4 `@source` 명시 — MEMORY: `feedback_tailwind_v4_source.md` 참고)

`apps/content-pipeline/frontend/src/app/page.tsx` (랜딩 → 로그인 리다이렉트):

```tsx
import { redirect } from 'next/navigation';

export default function LandingPage() {
  redirect('/login');
}
```

- [ ] **Step 5: 로그인 페이지 + 폼 작성**

`apps/content-pipeline/frontend/src/domains/auth/LoginForm.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/shared/lib/supabase/client';

export function LoginForm() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 max-w-sm w-full">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일"
        className="border rounded p-2"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호"
        className="border rounded p-2"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white rounded p-2 disabled:opacity-50"
      >
        {loading ? '로그인 중…' : '로그인'}
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </form>
  );
}
```

`apps/content-pipeline/frontend/src/app/(auth)/login/page.tsx` (얇은 진입점 — MEMORY `feedback_app_router_thin_pages.md`):

```tsx
import { LoginForm } from '@/domains/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <LoginForm />
    </main>
  );
}
```

- [ ] **Step 6: 인증 가드 + dashboard placeholder 작성**

`apps/content-pipeline/frontend/src/shared/components/AuthGuard.tsx` (server-side):

```tsx
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/shared/lib/supabase/server';

export async function AuthGuard({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/login');
  return <>{children}</>;
}
```

`apps/content-pipeline/frontend/src/app/(app)/layout.tsx`:

```tsx
import { AuthGuard } from '@/shared/components/AuthGuard';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
```

`apps/content-pipeline/frontend/src/app/(app)/page.tsx` (Phase 2 시작 지점):

```tsx
import { createSupabaseServerClient } from '@/shared/lib/supabase/server';

export default async function DashboardPlaceholder() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-2">콘텐츠 파이프라인</h1>
      <p className="text-gray-600">로그인됨: {data.user?.email}</p>
      <p className="text-sm text-gray-500 mt-4">
        Phase 2(주제 입력 + AI 인터뷰)에서 이 화면을 채웁니다.
      </p>
    </main>
  );
}
```

- [ ] **Step 7: OAuth/매직링크 콜백 라우트 (확장 대비)**

`apps/content-pipeline/frontend/src/app/auth/callback/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/shared/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL('/', url));
}
```

- [ ] **Step 8: 빌드 확인**

```bash
pnpm nx build content-pipeline-frontend
```

기대: PASS (warning 정도는 허용, error 없음).

- [ ] **Step 9: 커밋**

```bash
git add apps/content-pipeline/frontend
git commit -m "feat(content-pipeline): scaffold Next.js frontend (login, AuthGuard, supabase client)"
```

---

## Task 4: Supabase 마이그레이션 폴더 + 1차 인스턴스 사용 가이드

> Phase 1에선 도메인 테이블을 만들지 않는다. `auth.users`만 있으면 로그인 플로우가 동작. 마이그레이션 폴더 구조와 적용 가이드만 굳혀 Phase 2에서 첫 도메인 테이블을 추가하기 좋게.

**Files:**

- Create: `apps/content-pipeline/supabase/migrations/20260501000001_extensions.sql`
- Create: `apps/content-pipeline/supabase/README.md`

- [ ] **Step 1: extensions 마이그레이션 작성**

`apps/content-pipeline/supabase/migrations/20260501000001_extensions.sql`:

```sql
-- content-pipeline 앱이 사용할 PostgreSQL 확장.
-- 1차 devjournal과 같은 Supabase 인스턴스에 적용 — 이미 활성화되어 있으면 no-op.
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";
create extension if not exists "vector";
```

(`vector`는 Phase 2~3의 임베딩 활용을 미리 준비. 1차에 이미 enabled일 확률 높음.)

- [ ] **Step 2: 마이그레이션 가이드 README 작성**

`apps/content-pipeline/supabase/README.md`:

````md
# content-pipeline / Supabase 마이그레이션

1차 devjournal과 같은 Supabase 프로젝트를 공유한다. 신규 테이블은 `cp_` 접두어로 `public` 스키마에 둔다 (devjournal 테이블과 충돌 방지).

## 적용 방법

로컬 개발용 — Supabase Studio에서 SQL 에디터로 직접 실행하거나, supabase CLI를 사용한다.

```bash
# CLI 미설치 시
brew install supabase/tap/supabase

# 프로젝트 링크 (1회)
supabase link --project-ref <YOUR_PROJECT_REF>

# 마이그레이션 push
supabase db push --include-all
```
````

> ⚠️ 1차 devjournal 마이그레이션이 같은 인스턴스에 이미 적용되어 있다. 본 폴더는 **content-pipeline 전용** 마이그레이션만 담는다. devjournal 마이그레이션을 다시 실행하지 말 것.

## 명명 규칙

- 도메인 테이블: `cp_` 접두어 (예: `cp_topics`, `cp_drafts`)
- RLS 정책: `cp_<table>: <intent>` 패턴
- 마이그레이션 파일명: `YYYYMMDDHHMMSS_<description>.sql`

````

- [ ] **Step 3: 커밋**

```bash
git add apps/content-pipeline/supabase
git commit -m "chore(content-pipeline): bootstrap supabase migrations folder"
````

---

## Task 5: 로컬 dev 검증 (양쪽 부팅 + 로그인 손으로 시도)

**Files:**

- Modify: `package.json` (루트 — dev 스크립트 추가)
- Create: `apps/content-pipeline/backend/.env` (gitignore'd)
- Create: `apps/content-pipeline/frontend/.env.local` (gitignore'd)

- [ ] **Step 1: 루트 package.json scripts 보강**

`package.json`의 `scripts`에 추가:

```json
{
  "dev:content-pipeline": "concurrently \"npm:dev:content-pipeline-backend\" \"npm:dev:content-pipeline-frontend\"",
  "dev:content-pipeline-backend": "lsof -ti:3003 | xargs kill -9 2>/dev/null; nx serve content-pipeline-backend",
  "dev:content-pipeline-frontend": "nx run content-pipeline-frontend:dev",
  "build:content-pipeline-backend": "nx build content-pipeline-backend",
  "build:content-pipeline-frontend": "nx build content-pipeline-frontend"
}
```

- [ ] **Step 2: 로컬 .env 채우기 (devjournal과 같은 Supabase 키 재사용)**

`apps/content-pipeline/backend/.env`:

```env
SUPABASE_URL=<devjournal과 동일>
SUPABASE_ANON_KEY=<devjournal과 동일>
SUPABASE_SERVICE_ROLE_KEY=<devjournal과 동일>
PORT=3003
FRONTEND_URL=http://localhost:3004
```

`apps/content-pipeline/frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=<devjournal과 동일>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<devjournal과 동일>
NEXT_PUBLIC_API_BASE_URL=http://localhost:3003/api
```

frontend dev 포트는 `3004`로 띄우려면 `apps/content-pipeline/frontend/project.json`의 `dev` target options에 `port: 3004` 추가:

```json
"dev": {
  "executor": "@nx/next:server",
  "options": { "port": 3004, "buildTarget": "content-pipeline-frontend:build" }
}
```

(devjournal `project.json`에 dev target이 비어 있으면 dev 실행 시 자동으로 nx-next plugin이 채운다 — 그 경우 `nx dev content-pipeline-frontend --port 3004` CLI 옵션으로 우회 가능)

- [ ] **Step 3: 양쪽 동시 실행**

```bash
pnpm dev:content-pipeline
```

기대 출력:

- backend: `🚀 content-pipeline backend on http://localhost:3003/api`
- frontend: `Local: http://localhost:3004`

- [ ] **Step 4: 헬스체크 호출**

별도 터미널에서:

```bash
curl http://localhost:3003/api/health
```

기대: `{"status":"ok","service":"content-pipeline-backend","timestamp":"..."}`

- [ ] **Step 5: 로그인 손으로 시도**

브라우저에서 `http://localhost:3004` 접속 → `/login` 리다이렉트 확인 → 1차 devjournal에서 사용 중인 본인 계정으로 로그인 → `/(app)` 라우트의 placeholder 페이지에서 본인 이메일 노출되는지 확인.

> ⚠️ 같은 Supabase 인스턴스 사용 → devjournal 계정 그대로 로그인됨. 의도된 동작 (1차 ↔ 2차 계정 풀 공유).

- [ ] **Step 6: 변경 커밋**

```bash
git add package.json apps/content-pipeline
git commit -m "chore(content-pipeline): wire local dev scripts; verify login flow against shared Supabase"
```

(`.env`/`.env.local`은 gitignore에 이미 잡혀 있을 것 — 아니면 `.gitignore` 보강)

---

## Task 6: 백엔드 Dockerfile + 로컬 docker run 검증

> ECS Fargate에 띄우려면 컨테이너 이미지가 필요. devjournal은 Docker를 안 썼으니 처음부터 깔끔하게.

**Files:**

- Create: `apps/content-pipeline/backend/Dockerfile`
- Create: `apps/content-pipeline/backend/.dockerignore`

- [ ] **Step 1: Dockerfile 작성 (multi-stage, pnpm + nx prune 결과물 활용)**

`apps/content-pipeline/backend/Dockerfile`:

```dockerfile
# syntax=docker/dockerfile:1.7

# ---------- Stage 1: build ----------
FROM node:22-alpine AS build
WORKDIR /workspace

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# 모노레포 전체 복사 (nx 빌드는 워크스페이스 루트에서 수행)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml nx.json tsconfig.base.json ./
COPY apps apps
COPY packages packages

RUN pnpm install --frozen-lockfile
RUN pnpm nx run content-pipeline-backend:prune

# ---------- Stage 2: runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# nx prune 산출물만 복사 (slim image)
COPY --from=build /workspace/dist/apps/content-pipeline/backend ./

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate \
 && pnpm install --prod --frozen-lockfile

EXPOSE 3003
CMD ["node", "main.js"]
```

- [ ] **Step 2: .dockerignore 작성**

`apps/content-pipeline/backend/.dockerignore`:

```
node_modules
dist
.env
.env.local
.git
.idea
.vscode
.DS_Store
**/__tests__
**/*.spec.ts
```

(루트 build context를 쓰므로 실제 docker build 시엔 루트 `.dockerignore`도 검토 — 루트에 없으면 별도 추가는 보류)

- [ ] **Step 3: 로컬 빌드**

```bash
docker build -f apps/content-pipeline/backend/Dockerfile -t content-pipeline-backend:local .
```

기대: 성공. 시간은 첫 빌드 ~3-5분.

- [ ] **Step 4: 로컬 컨테이너 실행 + 헬스체크**

```bash
docker run --rm -p 3013:3003 \
  -e SUPABASE_URL=<...> \
  -e SUPABASE_ANON_KEY=<...> \
  -e SUPABASE_SERVICE_ROLE_KEY=<...> \
  content-pipeline-backend:local

# 다른 터미널
curl http://localhost:3013/api/health
```

기대: `{"status":"ok",...}` 응답.

- [ ] **Step 5: 커밋**

```bash
git add apps/content-pipeline/backend/Dockerfile apps/content-pipeline/backend/.dockerignore
git commit -m "feat(content-pipeline): add backend Dockerfile (multi-stage, nx prune)"
```

---

## Task 7: AWS 인프라 1회성 셋업 + 백엔드 ECS Service

> 이 task는 **manual AWS Console 작업**이 대부분. 자동화(Terraform/CDK)는 본 plan 스코프 밖. 단계별 가이드를 `infra/content-pipeline/README.md`에 기록해 재현 가능하게.

**Files:**

- Create: `infra/content-pipeline/README.md`
- Create: `infra/content-pipeline/backend/task-definition.json` (template)

> 사전 준비: AWS 계정 로그인, 도메인 보유 (예: `<your-domain>`), Cloudflare에 DNS 위임 완료 또는 Route53 사용. 본 가이드는 Cloudflare DNS + AWS ALB 조합을 가정.

- [ ] **Step 1: ECR 저장소 생성**

```bash
aws ecr create-repository \
  --repository-name content-pipeline-backend \
  --region ap-northeast-2 \
  --image-scanning-configuration scanOnPush=true
```

URL 기록 (예: `123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/content-pipeline-backend`).

- [ ] **Step 2: VPC + public subnets 확인 / 신규 VPC**

비용 회피를 위해 **default VPC + 기본 public subnets** 재사용 권장. 별도 VPC 생성 시 NAT Gateway 안 만들기.

확인:

```bash
aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" \
  --query 'Vpcs[0].VpcId' --output text --region ap-northeast-2
aws ec2 describe-subnets --filters "Name=vpc-id,Values=<VPC_ID>" \
  --query 'Subnets[?MapPublicIpOnLaunch==`true`].[SubnetId,AvailabilityZone]' \
  --output table --region ap-northeast-2
```

최소 2개의 AZ subnet ID 기록 (ALB는 multi-AZ 필요).

- [ ] **Step 3: Security Groups 생성**

- `cp-alb-sg`: inbound 80/443 from 0.0.0.0/0 (Cloudflare IP 화이트리스트로 더 좁힐 수 있음 — Phase 1에선 0.0.0.0/0 ok)
- `cp-fargate-sg`: inbound 3003/5678 from `cp-alb-sg` only, outbound all

```bash
# (값은 실제 환경에 맞게)
aws ec2 create-security-group --group-name cp-alb-sg \
  --description "ALB for content-pipeline" --vpc-id <VPC_ID> --region ap-northeast-2

aws ec2 authorize-security-group-ingress --group-id <ALB_SG_ID> \
  --protocol tcp --port 443 --cidr 0.0.0.0/0 --region ap-northeast-2
aws ec2 authorize-security-group-ingress --group-id <ALB_SG_ID> \
  --protocol tcp --port 80 --cidr 0.0.0.0/0 --region ap-northeast-2

aws ec2 create-security-group --group-name cp-fargate-sg \
  --description "Fargate tasks for content-pipeline" --vpc-id <VPC_ID> --region ap-northeast-2

aws ec2 authorize-security-group-ingress --group-id <FARGATE_SG_ID> \
  --protocol tcp --port 3003 --source-group <ALB_SG_ID> --region ap-northeast-2
aws ec2 authorize-security-group-ingress --group-id <FARGATE_SG_ID> \
  --protocol tcp --port 5678 --source-group <ALB_SG_ID> --region ap-northeast-2
```

- [ ] **Step 4: ECS 클러스터 생성**

```bash
aws ecs create-cluster --cluster-name cp-cluster \
  --capacity-providers FARGATE FARGATE_SPOT --region ap-northeast-2
```

- [ ] **Step 5: IAM 역할 생성**

- `ecsTaskExecutionRole` (이미 있으면 재사용): ECR pull + CloudWatch Logs 쓰기
- `cp-task-role`: 본 task용 권한 (Phase 1에선 추가 권한 거의 불필요, Secrets Manager read만)

`ecsTaskExecutionRole`은 AWS Console > IAM > "Use case: Elastic Container Service"로 마법사 생성 (`AmazonECSTaskExecutionRolePolicy` 자동 attach). ARN 기록.

- [ ] **Step 6: Secrets Manager에 환경변수 저장**

```bash
aws secretsmanager create-secret --name cp/backend/supabase \
  --secret-string '{"SUPABASE_URL":"...","SUPABASE_ANON_KEY":"...","SUPABASE_SERVICE_ROLE_KEY":"..."}' \
  --region ap-northeast-2
```

ARN 기록.

- [ ] **Step 7: ALB 생성 + ACM 인증서 발급**

ACM에서 `*.<your-domain>` 와일드카드 인증서 발급 (Cloudflare DNS validation).

ALB 생성 (internet-facing, public subnets, sg=`cp-alb-sg`):

```bash
aws elbv2 create-load-balancer --name cp-alb \
  --subnets <SUBNET_A> <SUBNET_B> \
  --security-groups <ALB_SG_ID> --scheme internet-facing --type application \
  --region ap-northeast-2
```

ALB DNS 이름 기록 (예: `cp-alb-xxxx.ap-northeast-2.elb.amazonaws.com`).

- [ ] **Step 8: Target Group 생성 (backend)**

```bash
aws elbv2 create-target-group --name cp-backend-tg \
  --protocol HTTP --port 3003 --vpc-id <VPC_ID> --target-type ip \
  --health-check-path /api/health --health-check-interval-seconds 30 \
  --region ap-northeast-2
```

ARN 기록.

- [ ] **Step 9: HTTPS 리스너 + 호스트 라우팅 규칙**

```bash
# HTTPS:443 리스너 — 기본 default action은 fixed-response 503
aws elbv2 create-listener --load-balancer-arn <ALB_ARN> \
  --protocol HTTPS --port 443 \
  --certificates CertificateArn=<ACM_CERT_ARN> \
  --default-actions Type=fixed-response,FixedResponseConfig='{StatusCode=503,ContentType=text/plain,MessageBody="cp"}' \
  --region ap-northeast-2

# api.<domain> → backend TG
aws elbv2 create-rule --listener-arn <LISTENER_ARN> --priority 10 \
  --conditions Field=host-header,Values=api.<your-domain> \
  --actions Type=forward,TargetGroupArn=<BACKEND_TG_ARN> \
  --region ap-northeast-2
```

- [ ] **Step 10: ECR 이미지 1차 push (수동)**

GitHub Actions이 아직 없으니 로컬에서 한 번 push해서 ECS Service가 띄울 이미지를 만든다.

```bash
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS \
  --password-stdin <ACCOUNT>.dkr.ecr.ap-northeast-2.amazonaws.com
docker build -f apps/content-pipeline/backend/Dockerfile -t cp-backend:bootstrap .
docker tag cp-backend:bootstrap <ACCOUNT>.dkr.ecr.ap-northeast-2.amazonaws.com/content-pipeline-backend:bootstrap
docker push <ACCOUNT>.dkr.ecr.ap-northeast-2.amazonaws.com/content-pipeline-backend:bootstrap
```

- [ ] **Step 11: Task Definition 등록**

`infra/content-pipeline/backend/task-definition.json`:

```json
{
  "family": "cp-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "<ECS_TASK_EXECUTION_ROLE_ARN>",
  "taskRoleArn": "<CP_TASK_ROLE_ARN>",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<ACCOUNT>.dkr.ecr.ap-northeast-2.amazonaws.com/content-pipeline-backend:bootstrap",
      "essential": true,
      "portMappings": [{ "containerPort": 3003, "protocol": "tcp" }],
      "environment": [
        { "name": "PORT", "value": "3003" },
        {
          "name": "FRONTEND_URL",
          "value": "https://content-pipeline.vercel.app"
        }
      ],
      "secrets": [
        { "name": "SUPABASE_URL", "valueFrom": "<SECRET_ARN>:SUPABASE_URL::" },
        {
          "name": "SUPABASE_ANON_KEY",
          "valueFrom": "<SECRET_ARN>:SUPABASE_ANON_KEY::"
        },
        {
          "name": "SUPABASE_SERVICE_ROLE_KEY",
          "valueFrom": "<SECRET_ARN>:SUPABASE_SERVICE_ROLE_KEY::"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/cp-backend",
          "awslogs-region": "ap-northeast-2",
          "awslogs-stream-prefix": "backend",
          "awslogs-create-group": "true"
        }
      }
    }
  ]
}
```

등록:

```bash
aws ecs register-task-definition \
  --cli-input-json file://infra/content-pipeline/backend/task-definition.json \
  --region ap-northeast-2
```

- [ ] **Step 12: ECS Service 생성**

```bash
aws ecs create-service --cluster cp-cluster --service-name cp-backend \
  --task-definition cp-backend --desired-count 1 --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<SUBNET_A>,<SUBNET_B>],securityGroups=[<FARGATE_SG_ID>],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=<BACKEND_TG_ARN>,containerName=backend,containerPort=3003" \
  --health-check-grace-period-seconds 60 \
  --region ap-northeast-2
```

- [ ] **Step 13: Cloudflare DNS — `api.<your-domain>` CNAME → ALB DNS**

Cloudflare 대시보드에서:

- Type: CNAME, Name: `api`, Target: `cp-alb-xxx.ap-northeast-2.elb.amazonaws.com`, Proxy: **ON** (orange cloud)

검증:

```bash
curl https://api.<your-domain>/api/health
```

기대: `{"status":"ok",...}`. 첫 5~10분은 ECS 헬스체크 통과 시간 + Cloudflare 프로파게이션 대기.

- [ ] **Step 14: 가이드 README 작성 (재현용)**

`infra/content-pipeline/README.md`에 위 단계의 핵심 명령어와 ARN 기록 양식을 정리. 자세한 값(계정 ID, ARN)은 commit하지 말고 1Password 등에 별도 보관.

- [ ] **Step 15: 커밋 (인프라 가이드만)**

```bash
git add infra/content-pipeline
git commit -m "chore(content-pipeline): document AWS ECS Fargate bootstrap + add task-definition template"
```

---

## Task 8: n8n on ECS + Cloudflare Access

> n8n 운영 디테일은 spec 6장 참고. 핵심: Postgres 영속 / `/webhook/*` public / 나머지 Cloudflare Access 보호.

**Files:**

- Create: `infra/content-pipeline/n8n/Dockerfile`
- Create: `infra/content-pipeline/n8n/task-definition.json`
- Create: `infra/content-pipeline/n8n/README.md`

- [ ] **Step 1: n8n Postgres 영속용 — Supabase Postgres에 별도 schema/role**

같은 Supabase 인스턴스의 Postgres에 n8n용 role + schema 생성. Supabase Studio SQL 에디터에서:

```sql
-- n8n 전용 schema (이름 충돌 방지)
create schema if not exists n8n;

-- n8n 전용 role
create role n8n_runner with login password '<STRONG_PW>';
grant usage, create on schema n8n to n8n_runner;
grant all privileges on all tables in schema n8n to n8n_runner;
alter default privileges in schema n8n grant all on tables to n8n_runner;
```

> ⚠️ Supabase는 connection pooler를 통하는 게 안정적. n8n env에 pooler 호스트(`...pooler.supabase.com`) 사용 권장.

n8n 접속 정보 Secrets Manager에 저장:

```bash
aws secretsmanager create-secret --name cp/n8n/postgres \
  --secret-string '{"DB_POSTGRESDB_HOST":"<POOLER_HOST>","DB_POSTGRESDB_PORT":"6543","DB_POSTGRESDB_DATABASE":"postgres","DB_POSTGRESDB_USER":"n8n_runner","DB_POSTGRESDB_PASSWORD":"...","DB_POSTGRESDB_SCHEMA":"n8n","N8N_ENCRYPTION_KEY":"<RANDOM_32_BYTES>","N8N_WEBHOOK_HMAC_SECRET":"<RANDOM_32_BYTES>"}' \
  --region ap-northeast-2
```

- [ ] **Step 2: n8n 이미지는 공식 사용 (커스텀 Dockerfile 필요시 thin layer)**

`infra/content-pipeline/n8n/Dockerfile`:

```dockerfile
# 공식 이미지 그대로. 추후 커스텀 노드 추가 시 npm install 라인 삽입.
FROM n8nio/n8n:latest
```

ECR push (선택 — 공식 이미지 그대로 쓸 거면 ECR 미러링 없이 task definition에서 `n8nio/n8n:latest` 직접 참조 가능. 단, ECR 미러는 지연/안정성 측면에서 유리):

```bash
docker pull n8nio/n8n:latest
docker tag n8nio/n8n:latest <ACCOUNT>.dkr.ecr.ap-northeast-2.amazonaws.com/n8n:bootstrap
docker push <ACCOUNT>.dkr.ecr.ap-northeast-2.amazonaws.com/n8n:bootstrap
```

- [ ] **Step 3: n8n Target Group + ALB 라우팅 규칙**

```bash
aws elbv2 create-target-group --name cp-n8n-tg \
  --protocol HTTP --port 5678 --vpc-id <VPC_ID> --target-type ip \
  --health-check-path /healthz --health-check-interval-seconds 30 \
  --region ap-northeast-2

aws elbv2 create-rule --listener-arn <LISTENER_ARN> --priority 20 \
  --conditions Field=host-header,Values=n8n.<your-domain> \
  --actions Type=forward,TargetGroupArn=<N8N_TG_ARN> \
  --region ap-northeast-2
```

- [ ] **Step 4: n8n Task Definition**

`infra/content-pipeline/n8n/task-definition.json`:

```json
{
  "family": "cp-n8n",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "<ECS_TASK_EXECUTION_ROLE_ARN>",
  "containerDefinitions": [
    {
      "name": "n8n",
      "image": "n8nio/n8n:latest",
      "essential": true,
      "portMappings": [{ "containerPort": 5678, "protocol": "tcp" }],
      "environment": [
        { "name": "N8N_PORT", "value": "5678" },
        { "name": "N8N_HOST", "value": "n8n.<your-domain>" },
        { "name": "N8N_PROTOCOL", "value": "https" },
        { "name": "WEBHOOK_URL", "value": "https://n8n.<your-domain>/" },
        { "name": "DB_TYPE", "value": "postgresdb" },
        { "name": "N8N_RUNNERS_ENABLED", "value": "true" },
        { "name": "N8N_BLOCK_ENV_ACCESS_IN_NODE", "value": "true" }
      ],
      "secrets": [
        {
          "name": "DB_POSTGRESDB_HOST",
          "valueFrom": "<N8N_SECRET_ARN>:DB_POSTGRESDB_HOST::"
        },
        {
          "name": "DB_POSTGRESDB_PORT",
          "valueFrom": "<N8N_SECRET_ARN>:DB_POSTGRESDB_PORT::"
        },
        {
          "name": "DB_POSTGRESDB_DATABASE",
          "valueFrom": "<N8N_SECRET_ARN>:DB_POSTGRESDB_DATABASE::"
        },
        {
          "name": "DB_POSTGRESDB_USER",
          "valueFrom": "<N8N_SECRET_ARN>:DB_POSTGRESDB_USER::"
        },
        {
          "name": "DB_POSTGRESDB_PASSWORD",
          "valueFrom": "<N8N_SECRET_ARN>:DB_POSTGRESDB_PASSWORD::"
        },
        {
          "name": "DB_POSTGRESDB_SCHEMA",
          "valueFrom": "<N8N_SECRET_ARN>:DB_POSTGRESDB_SCHEMA::"
        },
        {
          "name": "N8N_ENCRYPTION_KEY",
          "valueFrom": "<N8N_SECRET_ARN>:N8N_ENCRYPTION_KEY::"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/cp-n8n",
          "awslogs-region": "ap-northeast-2",
          "awslogs-stream-prefix": "n8n",
          "awslogs-create-group": "true"
        }
      }
    }
  ]
}
```

등록 + Service 생성:

```bash
aws ecs register-task-definition \
  --cli-input-json file://infra/content-pipeline/n8n/task-definition.json \
  --region ap-northeast-2

aws ecs create-service --cluster cp-cluster --service-name cp-n8n \
  --task-definition cp-n8n --desired-count 1 --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<SUBNET_A>,<SUBNET_B>],securityGroups=[<FARGATE_SG_ID>],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=<N8N_TG_ARN>,containerName=n8n,containerPort=5678" \
  --health-check-grace-period-seconds 120 \
  --region ap-northeast-2
```

- [ ] **Step 5: Cloudflare DNS — `n8n.<your-domain>` CNAME → ALB DNS, Proxy ON**

Cloudflare 대시보드:

- Type: CNAME, Name: `n8n`, Target: ALB DNS, Proxy: **ON**

- [ ] **Step 6: Cloudflare Zero Trust > Access — n8n UI 보호**

Cloudflare Zero Trust 대시보드 (`one.dash.cloudflare.com`):

1. **Access > Applications > Add application** (Self-hosted)
   - Application domain: `n8n.<your-domain>`
   - **Path bypass 추가** — `/webhook/*` (경로 정책 = "Bypass" 정책 1개)
   - 메인 정책 = "Allow", Selector: `Emails Ending In <your-email-domain>` 또는 본인 이메일 명시

2. 정책 우선순위 — Bypass(`/webhook/*`)가 최상단, 그 다음 Allow.

검증:

- 브라우저 `https://n8n.<your-domain>/` → Cloudflare Access 로그인 화면 → 본인 이메일 OTP → n8n UI 노출
- `curl https://n8n.<your-domain>/webhook/healthz` → Access 통과 (404 또는 n8n 응답)

- [ ] **Step 7: 가이드 README**

`infra/content-pipeline/n8n/README.md` 에 위 단계의 secrets 키 목록, env 변수 의미, fallback 옵션(Spec 6.6의 옵션 A — Basic Auth) 메모.

- [ ] **Step 8: 커밋**

```bash
git add infra/content-pipeline/n8n
git commit -m "chore(content-pipeline): bootstrap n8n on ECS Fargate + Cloudflare Access"
```

---

## Task 9: GitHub Actions CI/CD + End-to-end smoke verification

> backend 자동 배포 파이프라인 + dogfooding 사이클 시작점.

**Files:**

- Create: `.github/workflows/deploy-content-pipeline-backend.yml`
- Modify: `docs/superpowers/specs/2026-04-28-content-pipeline-saas-design.md` (Plans 섹션 + 결정 이력)
- Modify: `.claude/CLAUDE.md` (앱 항목 추가)

- [ ] **Step 1: AWS GitHub Actions OIDC 역할 (재사용 또는 신규)**

기존 GitHub Actions에서 AWS 사용 중이면 그 OIDC role 재사용. 없으면 IAM > Identity providers > GitHub OIDC 등록 + role(`gha-cp-deployer`) 생성하여 다음 권한 attach:

- `ecr:GetAuthorizationToken`, `ecr:BatchCheckLayerAvailability`, `ecr:PutImage`, `ecr:InitiateLayerUpload`, `ecr:UploadLayerPart`, `ecr:CompleteLayerUpload`
- `ecs:DescribeServices`, `ecs:UpdateService`, `ecs:RegisterTaskDefinition`, `ecs:DescribeTaskDefinition`
- `iam:PassRole` (executionRole + taskRole 한정)

GitHub repo `Settings > Secrets and variables > Actions`:

- `AWS_DEPLOY_ROLE_ARN` = role ARN

- [ ] **Step 2: 워크플로우 파일 작성**

`.github/workflows/deploy-content-pipeline-backend.yml`:

```yaml
name: Deploy — content-pipeline backend (dev)

on:
  push:
    branches: [develop]
    paths:
      - 'apps/content-pipeline/backend/**'
      - 'apps/content-pipeline/types/**'
      - 'packages/**'
      - 'pnpm-lock.yaml'
      - '.github/workflows/deploy-content-pipeline-backend.yml'
  workflow_dispatch:

permissions:
  id-token: write
  contents: read

env:
  AWS_REGION: ap-northeast-2
  ECR_REPO: content-pipeline-backend
  ECS_CLUSTER: cp-cluster
  ECS_SERVICE: cp-backend
  ECS_TASK_FAMILY: cp-backend

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with: { run_install: false }

      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'pnpm' }

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint + test
        run: |
          pnpm nx lint content-pipeline-backend
          pnpm nx test content-pipeline-backend

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        id: ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build & push image
        env:
          REG: ${{ steps.ecr.outputs.registry }}
          TAG: ${{ github.sha }}
        run: |
          docker build -f apps/content-pipeline/backend/Dockerfile \
            -t $REG/$ECR_REPO:$TAG -t $REG/$ECR_REPO:develop .
          docker push $REG/$ECR_REPO:$TAG
          docker push $REG/$ECR_REPO:develop

      - name: Render new task definition
        id: render
        run: |
          aws ecs describe-task-definition --task-definition $ECS_TASK_FAMILY \
            --query 'taskDefinition' > td.json
          jq --arg IMG "${{ steps.ecr.outputs.registry }}/${ECR_REPO}:${{ github.sha }}" \
            '.containerDefinitions[0].image=$IMG
             | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)' \
            td.json > td-new.json
          aws ecs register-task-definition --cli-input-json file://td-new.json \
            --query 'taskDefinition.taskDefinitionArn' --output text > new-td.txt
          echo "td=$(cat new-td.txt)" >> $GITHUB_OUTPUT

      - name: Update ECS service
        run: |
          aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE \
            --task-definition ${{ steps.render.outputs.td }} \
            --force-new-deployment

      - name: Wait for stable
        run: aws ecs wait services-stable --cluster $ECS_CLUSTER --services $ECS_SERVICE
```

- [ ] **Step 3: Spec 문서에 Plans 섹션 + 결정 이력 추가**

`docs/superpowers/specs/2026-04-28-content-pipeline-saas-design.md` 끝부분의 결정 이력 섹션 위에 새 섹션 삽입:

```md
## 10. Plans

| Phase | Plan                                                              | 상태                 |
| ----- | ----------------------------------------------------------------- | -------------------- |
| 1     | [Phase 1 — 기반](../plans/2026-05-01-content-pipeline-phase-1.md) | 작성 완료, 실행 대기 |
```

결정 이력에 추가:

```md
- **2026-05-01**: Phase 1 plan 작성 — 인증 = Supabase Auth + SupabaseAuthGuard (1차 devjournal 패턴 1:1 재활용 결정), 도메인 테이블은 `cp_*` 접두어로 `public` 스키마 격리, n8n 영속 = 같은 Supabase Postgres의 `n8n` schema, GitHub Actions OIDC로 ECS deploy
```

- [ ] **Step 4: CLAUDE.md 업데이트**

`.claude/CLAUDE.md`의 앱 표에 추가:

```md
| `apps/content-pipeline` | 콘텐츠 자동화 파이프라인 SaaS (2차 프로토타입, AI 인터뷰 → 양산 → 발행) |
```

및 모노레포 구조 트리에 `apps/content-pipeline/` 노드 추가.

- [ ] **Step 5: PR 생성 전 작업 일지 작성**

`.claude/rules/pr-workflow.md` 규칙 따라 `docs/work-logs/2026-05-01-feature-content-pipeline-phase-1-기반.md` 작성. 작업 개요/완료 작업/주요 변경/문제·해결/기술 결정 기록.

- [ ] **Step 6: develop으로 PR 생성**

```bash
git push -u origin feature/content-pipeline-phase-1
gh pr create --base develop --title "feat(content-pipeline): Phase 1 기반 — 앱 스캐폴드 + ECS Fargate + n8n + Cloudflare Access"
```

PR merge 후 `develop` push가 자동으로 `deploy-content-pipeline-backend.yml` 트리거 → ECS 새 이미지 배포.

- [ ] **Step 7: End-to-end smoke verification**

merge + 자동 배포 완료 후 다음을 모두 확인:

```bash
# 1) backend health (production tag 배포 후)
curl https://api.<your-domain>/api/health
# → {"status":"ok","service":"content-pipeline-backend","timestamp":"..."}

# 2) n8n public webhook path (Access bypass 확인)
curl -i https://n8n.<your-domain>/webhook/test
# → 404 (n8n이 응답한 것 — Access가 막았으면 Cloudflare 로그인 페이지 HTML이 옴)

# 3) ECS Service 상태
aws ecs describe-services --cluster cp-cluster --services cp-backend cp-n8n \
  --query 'services[].{name:serviceName,desired:desiredCount,running:runningCount}' \
  --output table --region ap-northeast-2
# → desired=running=1 둘 다
```

브라우저 검증:

- `https://n8n.<your-domain>/` → Cloudflare Access 로그인 → n8n UI 진입 OK
- frontend(로컬 또는 Vercel) → 로그인 → `/(app)` placeholder 노출

- [ ] **Step 8: 검증 결과 작업 일지에 기록 + 마무리 커밋**

작업 일지에 smoke 결과 추가하고:

```bash
git add docs/work-logs
git commit -m "docs(content-pipeline): Phase 1 작업 일지 + smoke 검증 결과"
git push
```

---

## Phase 1 완료 정의 (DoD)

다음이 모두 OK여야 Phase 1 종료:

- [ ] `pnpm dev:content-pipeline` 으로 backend(:3003) + frontend(:3004) 동시 부팅, 로그인 플로우 손으로 통과
- [ ] `pnpm nx test content-pipeline-backend` 통과
- [ ] `pnpm nx build content-pipeline-backend` + `pnpm nx build content-pipeline-frontend` 모두 PASS
- [ ] `https://api.<your-domain>/api/health` 응답 200 + JSON
- [ ] `https://n8n.<your-domain>/` 진입 시 Cloudflare Access 인증 → n8n UI
- [ ] `https://n8n.<your-domain>/webhook/*` 는 Access 우회 (public)
- [ ] develop branch push 시 GitHub Actions가 ECR 빌드/푸시 + ECS update 자동 수행
- [ ] `apps/content-pipeline/supabase/migrations/` 폴더 + 첫 마이그레이션(`20260501000001_extensions.sql`) 적용 가능 상태
- [ ] devjournal 인스턴스/도메인/CI 영향 없음 (read-only 보존 검증)

---

## Phase 2 시작 시점 첫 결정 (이 plan 스코프 밖, 메모만)

- 첫 도메인 테이블 = `cp_topics` (id, user_id, title, raw_input, created_at) — Phase 2 인터뷰 진입 시 채움
- 인터뷰 prompt 시스템 + few-shot 위치 = `apps/content-pipeline/backend/src/interview/prompts/`
- LLM 호출 폴백 체인 = devjournal `apps/devjournal/backend/src/agent/` 패턴 재활용 후보
