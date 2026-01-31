# toy-monorepo

병행 수입/수출 셀러들을 위한 관리 앱 - 백엔드와 프론트엔드를 하나의 저장소에서 관리하는 모노레포

## 프로젝트 구조

```
toy-monorepo/
├── apps/
│   ├── backend/        # NestJS API 서버 (:3001)
│   └── frontend/       # Next.js 웹 앱 (:3000)
├── packages/
│   ├── common/         # 공통 유틸리티
│   └── types/          # 공유 TypeScript 타입
└── nx.json             # NX 워크스페이스 설정
```

## 시작하기

### 요구사항

- Node.js v20+
- npm 10.0+

### 설치 및 실행

```bash
npm install        # 의존성 설치
npm run dev        # 백엔드 + 프론트엔드 동시 실행
```

| 명령어                 | 설명                          |
| ---------------------- | ----------------------------- |
| `npm run dev`          | 전체 실행                     |
| `npm run dev:backend`  | 백엔드만 (localhost:3001/api) |
| `npm run dev:frontend` | 프론트엔드만 (localhost:3000) |
| `npm run build`        | 전체 빌드                     |
| `npm test`             | 전체 테스트                   |

### 주요 API

| 엔드포인트             | 설명         |
| ---------------------- | ------------ |
| `GET /api`             | Health Check |
| `POST /api/auth/login` | 로그인       |
| `GET /api/members`     | 회원 목록    |

## 기술 스택

| 영역           | 기술                                      |
| -------------- | ----------------------------------------- |
| **백엔드**     | NestJS 11, TypeORM, PostgreSQL (Supabase) |
| **프론트엔드** | Next.js 16, React 19, TypeScript          |
| **인증**       | Passport, JWT, bcrypt                     |
| **빌드**       | NX (모노레포), Turbopack                  |
| **테스트**     | Jest, Playwright                          |
| **품질**       | ESLint, Prettier                          |

## 아키텍처

```
Controller (HTTP) → Service (로직) → Repository (DB) → PostgreSQL
```

### 모듈 구조

```
feature/
├── feature.module.ts      # 모듈 정의
├── feature.controller.ts  # HTTP 엔드포인트
├── feature.service.ts     # 비즈니스 로직
├── dto/                   # 요청/응답 객체
└── entities/              # DB 모델
```

## NX 유틸리티

```bash
npm run graph              # 의존성 그래프
npm run affected:build     # 변경된 프로젝트만 빌드
npm run affected:test      # 변경된 프로젝트만 테스트
```

## 라이선스

MIT - 개인 학습 및 실험용 토이 프로젝트
