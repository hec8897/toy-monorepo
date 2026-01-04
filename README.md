# toy-monorepo

토이프로젝트 모노레포

백엔드와 프론트엔드 코드를 하나의 저장소에서 관리하는 모노레포 워크스페이스입니다.

## 프로젝트 구조

```
toy-monorepo/
├── apps/
│   ├── backend/          # NestJS 백엔드 애플리케이션
│   ├── backend-e2e/      # 백엔드 E2E 테스트
│   ├── frontend/         # Next.js 프론트엔드 애플리케이션
│   └── frontend-e2e/     # 프론트엔드 E2E 테스트
├── packages/             # 공유 패키지 및 유틸리티
│   ├── common/          # 공통 유틸리티 라이브러리
│   └── types/           # 공유 TypeScript 타입 정의
├── nx.json              # NX 워크스페이스 설정
├── tsconfig.base.json   # TypeScript 기본 설정
└── package.json         # 프로젝트 의존성 및 스크립트
```

## 시작하기

### 필수 요구사항

- Node.js v20 이상 권장
- npm (10.0 이상)

### 설치

```bash
# 의존성 설치
npm install

# 또는 yarn 사용
yarn install

# 또는 pnpm 사용
pnpm install
```

### 개발

```bash
# 백엔드와 프론트엔드 모두 개발 모드로 실행
npm run dev

# 백엔드만 실행 (http://localhost:3001)
npm run dev:backend

# 프론트엔드만 실행 (http://localhost:3000)
npm run dev:frontend
```

개발 서버 주소:
- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:3001/api

### 빌드

```bash
# 모든 프로젝트 빌드
npm run build

# 특정 프로젝트 빌드
npm run build:backend
npm run build:frontend
```

## 기술 스택

### 백엔드
- **NestJS** - Progressive Node.js 프레임워크
- **TypeScript** - 타입 안정성을 위한 정적 타입 언어
- **Express** - HTTP 서버 (NestJS 기본 플랫폼)

### 프론트엔드
- **Next.js 16** - React 기반 풀스택 프레임워크
- **React 19** - UI 라이브러리
- **TypeScript** - 타입 안정성을 위한 정적 타입 언어

### 공유 라이브러리
- **@toy-monorepo/common** - 공통 유틸리티 함수
- **@toy-monorepo/types** - 공유 TypeScript 타입 정의

### 개발 도구
- **NX** - 모노레포 빌드 시스템 및 작업 실행 도구
- **Jest** - 테스트 프레임워크
- **Playwright** - E2E 테스트 도구
- **ESLint** - 코드 린팅
- **Prettier** - 코드 포맷팅

## 워크스페이스 관리

이 모노레포는 **NX**를 사용하여 여러 패키지를 효율적으로 관리합니다.

### NX 주요 기능
- **증분 빌드**: 변경된 프로젝트만 다시 빌드
- **작업 캐싱**: 이전 빌드 결과 재사용
- **병렬 실행**: 여러 작업 동시 실행
- **의존성 그래프**: 프로젝트 간 관계 시각화

### 유용한 NX 명령어

```bash
# 프로젝트 의존성 그래프 보기
npm run graph

# 영향받은 프로젝트만 빌드
npm run affected:build

# 영향받은 프로젝트만 테스트
npm run affected:test

# 특정 프로젝트 정보 보기
nx show project backend
nx show project frontend
```

## 미래 계획

- Flutter WebView 통합 준비 완료 (CORS 설정 구성됨)
- 추후 모바일 앱에서 프론트엔드를 WebView로 사용 가능

## 기여

개인 학습 및 실험용 토이 프로젝트입니다.

## 라이선스

MIT
