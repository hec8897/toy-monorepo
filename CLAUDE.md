# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 소개 및 목적

**toy-monorepo**는 개인 토이프로젝트를 개발하는 모노레포로, 프론트엔드와 백엔드 모두 포함합니다.

- **Frontend**: Next.js + React
- **Backend**: NestJS + PostgreSQL
- **Build System**: NX Monorepo
- **Type Safety**: 엔드-투-엔드 TypeScript

## 기술 스택

### 백엔드
- **Framework**: NestJS 11 + Express
- **Language**: TypeScript 5.9
- **Database**: PostgreSQL (Supabase)
- **ORM**: TypeORM
- **Authentication**: Passport + JWT
- **Validation**: class-validator, class-transformer
- **Security**: bcrypt (password hashing)

### 프론트엔드
- **Framework**: Next.js 16
- **UI Library**: React 19
- **Language**: TypeScript 5.9
- **Routing**: App Router

### 공유 패키지
- **@toy-monorepo/common**: 공통 유틸리티 함수
- **@toy-monorepo/types**: 공유 TypeScript 타입 정의

### 개발 도구
- **Build System**: NX 22.3.3
- **Testing**: Jest 30 (unit/integration), Playwright 1.36 (E2E)
- **Linting**: ESLint 9
- **Formatting**: Prettier 3.6
- **Bundler**: Webpack 5 (backend), Turbopack (frontend)

## 폴더 구조

```
toy-monorepo/
├── apps/
│   ├── backend/              # NestJS 백엔드 (port 3001)
│   │   ├── src/
│   │   │   ├── app/          # 앱 모듈
│   │   │   ├── auth/         # 인증 모듈 (JWT)
│   │   │   ├── members/      # 회원 관리 모듈
│   │   │   ├── entities/     # TypeORM 엔티티
│   │   │   ├── config/       # 설정 파일
│   │   │   └── main.ts       # 진입점
│   │   ├── e2e/              # 백엔드 E2E 테스트
│   │   └── scripts/          # 유틸리티 스크립트
│   │
│   └── frontend/             # Next.js 프론트엔드 (port 3000)
│       ├── app/              # App Router 페이지
│       ├── components/       # React 컴포넌트
│       └── e2e/              # 프론트엔드 E2E 테스트
│
├── packages/
│   ├── common/               # 공통 유틸리티
│   └── types/                # 공유 타입 정의
│
├── nx.json                   # NX 워크스페이스 설정
├── tsconfig.base.json        # TypeScript 기본 설정
├── package.json              # 프로젝트 의존성
├── CLAUDE.md                 # Claude Code 가이드 (본 파일)
└── README.md                 # 프로젝트 문서
```

### 모듈 구조 규칙

각 백엔드 기능 모듈은 다음 구조를 따릅니다:

```
feature/
├── feature.module.ts       # 모듈 정의 및 의존성
├── feature.controller.ts   # HTTP 엔드포인트 (Presentation)
├── feature.service.ts      # 비즈니스 로직 (Business Logic)
├── dto/                    # 데이터 전송 객체
│   ├── create-feature.dto.ts
│   ├── update-feature.dto.ts
│   └── feature-response.dto.ts
└── entities/
    └── feature.entity.ts   # TypeORM 엔티티 (Data Access)
```

## 빌드/실행/테스트 명령

### 개발 서버

```bash
# 백엔드 + 프론트엔드 동시 실행
npm run dev

# 백엔드만 실행 (http://localhost:3001/api)
npm run dev:backend

# 프론트엔드만 실행 (http://localhost:3000)
npm run dev:frontend
```

### 빌드

```bash
# 모든 프로젝트 병렬 빌드
npm run build

# 개별 프로젝트 빌드
npm run build:backend
npm run build:frontend

# 영향받은 프로젝트만 빌드 (git diff 기반)
npm run affected:build
```

### 테스트

```bash
# 모든 테스트 실행
npm test

# 개별 프로젝트 테스트
npm run test:backend
npm run test:frontend

# E2E 테스트
npx nx run backend:e2e
npx nx run frontend:e2e

# 영향받은 프로젝트만 테스트
npm run affected:test
```

### 린팅

```bash
# 모든 프로젝트 린트
npm run lint

# 개별 프로젝트 린트
npm run lint:backend
npm run lint:frontend
```

### NX 명령어

```bash
# 프로젝트 의존성 그래프 시각화
npm run graph

# 특정 프로젝트 정보 조회
npx nx show project backend
npx nx show project frontend

# 캐시 무시하고 실행
npx nx run backend:serve --skip-nx-cache
```

## 코딩 및 설계 기본 원칙

### 1. 타입 안전성 (Type Safety)
- **모든 코드는 TypeScript로 작성**
- `any` 타입 사용 금지 (tsconfig strict mode)
- 공유 타입은 `@toy-monorepo/types` 패키지에 정의
- API 요청/응답은 DTO로 타입 정의

### 2. 관심사의 분리 (Separation of Concerns)
- **Controller**: HTTP 요청/응답 처리만
- **Service**: 비즈니스 로직 및 오케스트레이션
- **Repository/Entity**: 데이터 접근 계층
- **DTO**: 계층 간 데이터 전송 및 검증

### 3. 보안 (Security)
- 비밀번호는 bcrypt로 해싱 (솔트 라운드 10)
- JWT 토큰 기반 인증 (Bearer token)
- 모든 DTO에 class-validator 적용
- 환경 변수로 민감한 정보 관리 (`.env` 파일, git ignore)

### 4. 테스트 가능성 (Testability)
- 의존성 주입(DI) 사용
- 서비스/리포지토리는 모킹 가능하도록 설계
- 중요 비즈니스 로직은 단위 테스트 작성

### 5. 코드 품질 (Code Quality)
- ESLint + Prettier 규칙 준수
- Git pre-commit hook으로 자동 검사
- 모든 변경사항은 PR 리뷰 필수

### 6. NX 모노레포 규칙
- 공유 코드는 `packages/` 아래 배치
- 앱 간 직접 import 금지 (공유 패키지 경유)
- Path alias 사용: `@toy-monorepo/common`, `@toy-monorepo/types`
- 빌드 캐시 활용 (affected 명령어)

### 7. 백엔드 아키텍처
- **Layered Architecture**: Presentation → Business Logic → Data Access → Database
- 각 모듈은 독립적으로 동작 가능하도록 설계
- 환경별 설정은 `ConfigModule` 사용

### 8. 프론트엔드 아키텍처
- Next.js **App Router** 사용 (Pages Router 아님)
- Server Components 우선, Client Components는 필요시만
- 컴포넌트는 재사용 가능하도록 작성

### 9. 데이터베이스
- TypeORM 엔티티는 `apps/backend/src/entities/`에 작성
- 엔티티 변경 시 `database.config.ts`에 등록
- 개발 환경에서만 `synchronize: true` (프로덕션은 마이그레이션 사용)

### 10. API 설계
- RESTful 원칙 준수
- 전역 prefix: `/api`
- 응답은 일관된 DTO 구조 사용
- 에러는 NestJS Exception Filter로 처리

## 추가 문서 및 리소스

### 프로젝트 문서
- **README.md**: 프로젝트 개요, 기술 선택 이유, 로드맵
- **CLAUDE.md**: 본 파일 - Claude Code 작업 가이드
- **apps/backend/README.md**: 백엔드 상세 문서
- **apps/frontend/README.md**: 프론트엔드 상세 문서 (예정)

### 데이터베이스 관련
- **Supabase 설정**: `apps/backend/src/config/database.config.ts`
- **환경 변수 예제**: `apps/backend/.env.example`
- **엔티티 정의**: `apps/backend/src/entities/`

### 주요 설정 파일
- **NX 설정**: `nx.json`
- **TypeScript 설정**: `tsconfig.base.json` (전역), 각 앱별 `tsconfig.json`
- **ESLint 설정**: `.eslintrc.json`

### 외부 참고 자료
- [NX Documentation](https://nx.dev)
- [NestJS Documentation](https://docs.nestjs.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeORM Documentation](https://typeorm.io)
- [Supabase Documentation](https://supabase.com/docs)

### 주요 API 엔드포인트
- **Backend API Base**: `http://localhost:3001/api`
- **Health Check**: `GET /api`
- **Authentication**: `POST /api/auth/login`
- **Members**: `GET /api/members`, `GET /api/members/:id`

## Git Flow 운용 전략

이 저장소는 **Git Flow 기반** 브랜치 전략을 사용합니다.

### 메인 브랜치

- **`main`**: 프로덕션 준비 코드
  - 릴리스 브랜치와 핫픽스만 머지
  - 태그로 버전 관리

- **`develop`**: 개발 통합 브랜치
  - 모든 feature 브랜치의 base
  - 다음 릴리스 준비 상태 유지

### 지원 브랜치

#### Feature 브랜치
- **용도**: 새 기능 개발
- **Base**: `develop`
- **명명 규칙**: `feature/<scope>-<description>`
- **예시**: `feature/api-user-registration`, `feature/web-login-page`
- **완료 후**: PR을 통해 `develop`으로 머지 (Squash & Merge)

```bash
# Feature 브랜치 시작
git checkout develop
git pull origin develop
git checkout -b feature/api-user-profile

# 작업 후 푸시
git add .
git commit -m "feat: Add user profile API"
git push -u origin feature/api-user-profile

# PR 생성
gh pr create --base develop --title "Add user profile API"
```

#### Release 브랜치
- **용도**: 릴리스 준비 (버전 업데이트, 버그 수정, 문서화)
- **Base**: `develop`
- **명명 규칙**: `release/<version>`
- **예시**: `release/0.1.0`
- **완료 후**: `main`과 `develop` 모두에 머지

```bash
# Release 브랜치 생성
git checkout develop
git checkout -b release/0.1.0

# 버전 업데이트 및 최종 수정
# ...

# main으로 머지 및 태그
git checkout main
git merge --no-ff release/0.1.0
git tag -a v0.1.0 -m "Release version 0.1.0"
git push origin main --tags

# develop으로도 머지
git checkout develop
git merge --no-ff release/0.1.0
git push origin develop
```

#### Hotfix 브랜치
- **용도**: 프로덕션 긴급 버그 수정
- **Base**: `main`
- **명명 규칙**: `hotfix/<issue-description>`
- **예시**: `hotfix/fix-login-crash`
- **완료 후**: `main`과 `develop` 모두에 머지

```bash
# Hotfix 브랜치 생성
git checkout main
git checkout -b hotfix/fix-critical-bug

# 수정 후
git commit -m "fix: Fix critical bug in authentication"

# main으로 머지
git checkout main
git merge --no-ff hotfix/fix-critical-bug
git tag -a v0.1.1 -m "Hotfix 0.1.1"
git push origin main --tags

# develop으로도 머지
git checkout develop
git merge --no-ff hotfix/fix-critical-bug
git push origin develop
```

### 커밋 메시지 규칙

Conventional Commits 스타일 사용:

```
<type>: <subject>

<body>

<footer>
```

**Types**:
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅 (기능 변경 없음)
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드, 설정 등

**예시**:
```bash
git commit -m "feat: Add user registration API endpoint"
git commit -m "fix: Resolve JWT token expiration issue"
git commit -m "docs: Update API documentation for authentication"
```

### PR 규칙

- **Base 브랜치**: 대부분 `develop` (hotfix는 `main`)
- **리뷰 필수**: 모든 PR은 코드 리뷰 후 머지
- **머지 전략**: Squash & Merge (커밋 히스토리 정리)
- **자동 테스트**: GitHub Actions CI 통과 필수

### 브랜치 보호 규칙

- `main`, `develop` 브랜치는 직접 push 금지
- PR을 통한 머지만 허용
- 최소 1명의 리뷰 승인 필요
- CI 테스트 통과 필수

---

**Note**: 이 문서는 Claude Code가 코드 작업 시 참고하는 가이드입니다. 프로젝트 전체 개요 및 로드맵은 `README.md`를 참고하세요.
