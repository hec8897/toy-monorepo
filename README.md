# toy-monorepo

토이프로젝트 모노레포

백엔드와 프론트엔드 코드를 하나의 저장소에서 관리하는 모노레포 워크스페이스입니다.

## 프로젝트 구조

```
toy-monorepo/
├── apps/
│   ├── backend/          # 백엔드 애플리케이션
│   └── frontend/         # 프론트엔드 애플리케이션
├── packages/             # 공유 패키지 및 유틸리티
│   ├── common/          # 공통 유틸리티
│   └── types/           # 공유 TypeScript 타입
└── README.md
```

## 시작하기

### 필수 요구사항

- Node.js (v18 이상 권장)
- npm 또는 yarn 또는 pnpm

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

# 백엔드만 실행
npm run dev:backend

# 프론트엔드만 실행
npm run dev:frontend
```

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
- TBD

### 프론트엔드
- TBD

### 공유
- TBD

## 워크스페이스 관리

이 모노레포는 [워크스페이스 관리 도구 TBD]를 사용하여 여러 패키지를 효율적으로 관리합니다.

## 기여

개인 학습 및 실험용 토이 프로젝트입니다.

## 라이선스

MIT
