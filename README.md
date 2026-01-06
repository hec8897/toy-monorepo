# toy-monorepo

토이프로젝트 모노레포

백엔드와 프론트엔드 코드를 하나의 저장소에서 관리하는 모노레포 워크스페이스입니다.

## 프로젝트 구조

```
toy-monorepo/
├── apps/
│   ├── backend/          # NestJS 백엔드 애플리케이션
│   │   └── e2e/          # 백엔드 E2E 테스트 (Jest)
│   └── frontend/         # Next.js 프론트엔드 애플리케이션
│       └── e2e/          # 프론트엔드 E2E 테스트 (Playwright)
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

## 기술 선택 이유

### NX Monorepo
- **코드 공유**: 백엔드-프론트엔드 간 타입과 유틸리티 공유로 중복 제거
- **스마트 캐싱**: 빌드 캐시로 CI/CD 속도 대폭 향상
- **확장성**: 새로운 앱 추가가 쉬운 구조

### NestJS (백엔드)
- **TypeScript 우선**: 데이터베이스부터 API까지 완전한 타입 안전성
- **모듈식 아키텍처**: 깔끔한 관심사 분리
- **풍부한 생태계**: TypeORM, Passport, JWT 등 원활한 통합

### 주요 라이브러리
- **TypeORM** + **Supabase**: 타입 안전 DB 작업, 우수한 무료 티어
- **Passport + JWT**: 업계 표준 인증
- **bcrypt**: 안전한 비밀번호 해싱

## 아키텍처

### 계층 구조
```
프레젠테이션 계층 (Controllers, DTOs)
       ↓
비즈니스 로직 계층 (Services)
       ↓
데이터 접근 계층 (Repositories, Entities)
       ↓
데이터베이스 계층 (PostgreSQL/Supabase)
```

### 설계 원칙
1. **타입 안전성 우선**: 엔드-투-엔드 TypeScript
2. **관심사 분리**: 컨트롤러/서비스/리포지토리 명확한 역할 구분
3. **기본 보안**: JWT 인증, 비밀번호 해싱, 입력 검증
4. **테스트 가능성**: 의존성 주입 및 모킹 용이
5. **코드 품질**: ESLint, Prettier, 코드 리뷰 필수

### 모듈 구조
```
feature/
├── feature.module.ts       # 모듈 정의
├── feature.controller.ts   # HTTP 엔드포인트
├── feature.service.ts      # 비즈니스 로직
├── dto/                    # 데이터 전송 객체
└── entities/               # DB 모델
```

## AI 활용 계획

### 현재 활용
- **Claude Code**: 개발 지원 (코드 생성, 리팩토링, 버그 수정, 문서화)

### 향후 계획
- **LLM API 통합**: Claude API 또는 GPT-4
  - 지능형 검색 및 추천
  - 콘텐츠 생성 및 요약
  - 자연어 → SQL 변환
- **AI 챗봇**: RAG 기반 고객 지원
- **콘텐츠 처리**: 요약, 감성 분석, 번역

## 개발 로드맵

### Phase 1: 기반 구축 ✅
- [x] NX Monorepo 설정
- [x] NestJS 백엔드 + TypeORM
- [x] JWT 인증 시스템
- [x] Members CRUD API
- [x] Supabase 연동

### Phase 2: 핵심 기능 🚧
- [ ] 사용자 등록 및 프로필 관리
- [ ] RBAC (역할 기반 접근 제어)
- [ ] 프론트엔드 인증 페이지
- [ ] API 속도 제한

### Phase 3: 고급 기능 📋
- [ ] AI 챗봇 통합
- [ ] 실시간 알림 (WebSocket/SSE)
- [ ] 파일 업로드 (Supabase Storage)
- [ ] 이메일 서비스

### Phase 4+: 확장 🔮
- [ ] Flutter 모바일 앱 (WebView)
- [ ] Redis 캐싱
- [ ] 프로덕션 배포
- [ ] 모니터링 (Sentry, Datadog)

### 우선순위

| 순위 | 기능 | 영향도 | 작업량 |
|------|------|--------|--------|
| P0 | 사용자 등록 | 높음 | 중간 |
| P0 | RBAC | 높음 | 높음 |
| P1 | 프론트 인증 UI | 높음 | 중간 |
| P2 | AI 챗봇 | 중간 | 높음 |

## 미래 계획

- Flutter WebView 통합 준비 완료 (CORS 설정 구성됨)
- 추후 모바일 앱에서 프론트엔드를 WebView로 사용 가능

## 기여

개인 학습 및 실험용 토이 프로젝트입니다.

## 라이선스

MIT
