# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 소개 및 목적 (Don't Delete)

**toy-monorepo**는 개인 토이프로젝트를 개발하는 모노레포로, 프론트엔드와 백엔드 모두 포함합니다.

| 앱              | 설명                                                                   |
| --------------- | ---------------------------------------------------------------------- |
| `apps/frontend` | 병행 수입/수출 셀러 관리 앱 (매출, 상품 등록 자동화, 인기 상품 크롤링) |
| `apps/backend`  | frontend의 API 서버                                                    |

> 📋 기술 스택, 폴더 구조, 모듈 구조: `README.md` 참고

## 빌드/실행/테스트 명령

### 개발 서버

| 명령어                 | 설명                                 |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | 백엔드 + 프론트엔드 동시 실행        |
| `npm run dev:backend`  | 백엔드만 (http://localhost:3001/api) |
| `npm run dev:frontend` | 프론트엔드만 (http://localhost:3000) |

### 빌드 & 테스트

| 명령어                                     | 설명                   |
| ------------------------------------------ | ---------------------- |
| `npm run build`                            | 모든 프로젝트 빌드     |
| `npm run build:backend` / `build:frontend` | 개별 빌드              |
| `npm run affected:build`                   | 변경된 프로젝트만 빌드 |
| `npm test`                                 | 모든 테스트 실행       |
| `npm run test:backend` / `test:frontend`   | 개별 테스트            |
| `npx nx run backend:e2e` / `frontend:e2e`  | E2E 테스트             |
| `npm run lint`                             | 모든 프로젝트 린트     |

### NX 유틸리티

| 명령어                                | 설명                 |
| ------------------------------------- | -------------------- |
| `npm run graph`                       | 의존성 그래프 시각화 |
| `npx nx show project <name>`          | 프로젝트 정보 조회   |
| `npx nx run <target> --skip-nx-cache` | 캐시 무시 실행       |

## 코딩 및 설계 기본 원칙 (Don't Delete)

> 📋 상세 규칙:
>
> - 백엔드: `.claude/rules/backend-code-style.md`
> - 프론트엔드: `.claude/rules/front-end-code-style.md`

### 타입 안전성 (Type Safety)

- 모든 코드는 **TypeScript**로 작성, `any` 타입 사용 금지
- 공유 타입은 `@toy-monorepo/types` 패키지에 정의
- API 요청/응답은 DTO로 타입 정의

### 테스트 가능성 (Testability)

- 의존성 주입(DI) 사용, 모킹 가능하도록 설계
- 중요 비즈니스 로직은 단위 테스트 작성

### 코드 품질 (Code Quality)

- ESLint + Prettier 규칙 준수, pre-commit hook 자동 검사
- 모든 변경사항은 PR 리뷰 필수
- **⚠️ Git 커밋 및 푸시는 반드시 사용자에게 확인 후 실행**

### NX 모노레포 규칙

- 공유 코드는 `packages/` 아래 배치, 앱 간 직접 import 금지
- Path alias: `@toy-monorepo/common`, `@toy-monorepo/types`

## 추가 문서 (Don't Delete)

| 문서                     | 설명                                          |
| ------------------------ | --------------------------------------------- |
| `README.md`              | 프로젝트 개요, 기술 스택, 로드맵              |
| `.claude/rules/*`        | 상황별 규칙 (백엔드, 프론트엔드, Git Flow 등) |
| `apps/backend/README.md` | 백엔드 상세 문서                              |

### 주요 설정 파일

| 파일                                            | 용도                            |
| ----------------------------------------------- | ------------------------------- |
| `nx.json`                                       | NX 워크스페이스 설정            |
| `tsconfig.base.json`                            | TypeScript 기본 설정            |
| `.eslintrc.json`                                | ESLint 설정                     |
| `apps/frontend/src/shared/config/navigation.ts` | 프론트엔드 라우트 경로 중앙관리 |

## Git Flow (요약)

> 📋 상세: `.claude/rules/git-workflow.md`

| 브랜치      | 용도        | Base      |
| ----------- | ----------- | --------- |
| `main`      | 프로덕션    | -         |
| `develop`   | 개발 통합   | -         |
| `feature/*` | 새 기능     | `develop` |
| `release/*` | 릴리스 준비 | `develop` |
| `hotfix/*`  | 긴급 수정   | `main`    |

**커밋 타입**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

**Note**: 프로젝트 전체 개요 및 로드맵은 `README.md`를 참고하세요.
