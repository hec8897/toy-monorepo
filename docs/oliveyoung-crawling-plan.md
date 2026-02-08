# 올리브영 베스트 랭킹 크롤링 기능 구현 계획

## 개요

| 항목         | 내용                                                   |
| ------------ | ------------------------------------------------------ |
| **기능명**   | 올리브영 베스트 랭킹 크롤링                            |
| **목적**     | 올리브영 인기 상품 데이터 수집 및 DB 누적 저장         |
| **버전**     | MVP (Minimum Viable Product)                           |
| **대상 URL** | https://www.oliveyoung.co.kr/store/main/getBestList.do |

---

## 요구사항 정의

### 기능 요구사항

| ID  | 요구사항                     | 우선순위 |
| --- | ---------------------------- | -------- |
| F1  | 전체 베스트 랭킹 크롤링      | 필수     |
| F2  | API 엔드포인트로 수동 트리거 | 필수     |
| F3  | 크롤링 결과 DB 저장          | 필수     |
| F4  | 최신 랭킹 조회 API           | 필수     |
| F5  | 관리자 페이지 (버튼 UI)      | 필수     |
| F6  | 카테고리별 크롤링            | 추후     |
| F6  | 스케줄러 자동 실행           | 추후     |

### 비기능 요구사항

| ID  | 요구사항       | 상세                         |
| --- | -------------- | ---------------------------- |
| NF1 | 인증 없이 접근 | MVP 테스트 편의성            |
| NF2 | 크롤링 딜레이  | 요청 간 1초 대기             |
| NF3 | 에러 핸들링    | 네트워크 오류 시 적절한 응답 |

---

## 기술 스택

| 영역            | 기술                  | 비고         |
| --------------- | --------------------- | ------------ |
| 프레임워크      | NestJS                | 기존 백엔드  |
| DB              | PostgreSQL (Supabase) | TypeORM 연동 |
| HTTP 클라이언트 | axios                 | 기존 설치됨  |
| HTML 파서       | cheerio               | 신규 설치    |
| 타입            | TypeScript            | 타입 안전성  |

---

## 파일 구조

### 신규 생성 파일

```
apps/backend/src/
├── entities/
│   ├── product.entity.ts              # 상품 마스터 데이터
│   └── ranking-snapshot.entity.ts     # 랭킹 스냅샷 (시계열)
│
└── crawling/
    ├── crawling.module.ts             # 모듈 정의
    ├── crawling.controller.ts         # REST API 엔드포인트
    ├── crawling.service.ts            # 비즈니스 로직
    ├── oliveyoung.crawler.ts          # 올리브영 전용 크롤러
    └── dto/
        └── crawl-result.dto.ts        # 응답 DTO
```

### 수정 파일

| 파일                                         | 수정 내용                            |
| -------------------------------------------- | ------------------------------------ |
| `package.json`                               | cheerio, @types/cheerio 추가         |
| `apps/backend/src/config/database.config.ts` | Product, RankingSnapshot 엔티티 등록 |
| `apps/backend/src/app/app.module.ts`         | CrawlingModule import                |

---

## 데이터베이스 스키마

### ERD 관계

```
┌─────────────┐       ┌────────────────────┐
│  products   │       │ ranking_snapshots  │
├─────────────┤       ├────────────────────┤
│ id (PK)     │◄──────│ product_id (FK)    │
│ product_code│       │ id (PK)            │
│ name        │       │ rank               │
│ brand_name  │       │ price              │
│ image_url   │       │ rating             │
│ product_url │       │ review_count       │
│ created_at  │       │ snapshot_at        │
│ updated_at  │       │ created_at         │
└─────────────┘       └────────────────────┘
     1                        N
```

### products 테이블 (상품 마스터)

| 컬럼명       | 타입        | 제약조건         | 설명                 |
| ------------ | ----------- | ---------------- | -------------------- |
| id           | UUID        | PK               | 고유 식별자          |
| product_code | TEXT        | UNIQUE, NOT NULL | 올리브영 상품 코드   |
| name         | TEXT        | NOT NULL         | 상품명               |
| brand_name   | TEXT        | NULLABLE         | 브랜드명             |
| image_url    | TEXT        | NULLABLE         | 상품 이미지 URL      |
| product_url  | TEXT        | NULLABLE         | 상품 상세 페이지 URL |
| created_at   | TIMESTAMPTZ | DEFAULT NOW()    | 최초 수집일          |
| updated_at   | TIMESTAMPTZ | AUTO UPDATE      | 정보 갱신일          |

### ranking_snapshots 테이블 (랭킹 이력)

| 컬럼명         | 타입          | 제약조건         | 설명           |
| -------------- | ------------- | ---------------- | -------------- |
| id             | UUID          | PK               | 고유 식별자    |
| product_id     | UUID          | FK → products.id | 상품 참조      |
| rank           | INT           | NOT NULL         | 순위 (1~N)     |
| category       | TEXT          | DEFAULT 'ALL'    | 랭킹 카테고리  |
| price          | DECIMAL(12,0) | NOT NULL         | 판매가         |
| original_price | DECIMAL(12,0) | NULLABLE         | 정가           |
| discount_rate  | INT           | NULLABLE         | 할인율 (%)     |
| rating         | DECIMAL(3,1)  | NULLABLE         | 평점 (0.0~5.0) |
| review_count   | INT           | NULLABLE         | 리뷰 수        |
| snapshot_at    | TIMESTAMPTZ   | NOT NULL         | 스냅샷 시점    |
| created_at     | TIMESTAMPTZ   | DEFAULT NOW()    | 레코드 생성일  |

### 테이블 생성 SQL

```sql
-- products 테이블
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  brand_name TEXT,
  image_url TEXT,
  product_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ranking_snapshots 테이블
CREATE TABLE ranking_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  rank INT NOT NULL,
  category TEXT DEFAULT 'ALL',
  price DECIMAL(12, 0) NOT NULL,
  original_price DECIMAL(12, 0),
  discount_rate INT,
  rating DECIMAL(3, 1),
  review_count INT,
  snapshot_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 (조회 성능 최적화)
CREATE INDEX idx_ranking_snapshots_snapshot_at ON ranking_snapshots(snapshot_at DESC);
CREATE INDEX idx_ranking_snapshots_product_id ON ranking_snapshots(product_id);
CREATE INDEX idx_products_product_code ON products(product_code);
```

> 참고: 개발 환경에서는 TypeORM의 `synchronize: true` 설정으로 자동 생성됩니다.

---

## API 명세

### GET /api/crawling (관리자 페이지)

크롤링 관리 페이지 (HTML)

**Request**

```http
GET /api/crawling HTTP/1.1
Host: localhost:3001
```

**Response (200 OK)**

브라우저에서 접속 시 버튼이 있는 HTML 페이지 렌더링:

- "올리브영 베스트 크롤링 실행" 버튼
- 클릭 시 POST /api/crawling/oliveyoung/best 호출
- 결과를 페이지에 표시

---

### POST /api/crawling/oliveyoung/best

크롤링 실행 (수동 트리거)

**Request**

```http
POST /api/crawling/oliveyoung/best HTTP/1.1
Host: localhost:3001
Content-Type: application/json
```

**Response (200 OK)**

```json
{
  "success": true,
  "message": "크롤링 완료",
  "data": {
    "totalProducts": 50,
    "newProducts": 5,
    "updatedProducts": 45,
    "snapshotAt": "2026-01-31T10:30:00.000Z"
  }
}
```

**Response (500 Error)**

```json
{
  "success": false,
  "message": "크롤링 실패",
  "error": "네트워크 오류 또는 페이지 구조 변경"
}
```

### GET /api/crawling/oliveyoung/best

최신 랭킹 조회

**Request**

```http
GET /api/crawling/oliveyoung/best HTTP/1.1
Host: localhost:3001
```

**Response (200 OK)**

```json
{
  "snapshotAt": "2026-01-31T10:30:00.000Z",
  "rankings": [
    {
      "rank": 1,
      "productCode": "A000000123456",
      "name": "상품명",
      "brandName": "브랜드",
      "price": 25000,
      "originalPrice": 30000,
      "discountRate": 17,
      "rating": 4.8,
      "reviewCount": 15234,
      "imageUrl": "https://...",
      "productUrl": "https://..."
    }
  ]
}
```

---

## 의존성

### 신규 설치

```bash
npm install cheerio
npm install @types/cheerio --save-dev
```

### 기존 활용

- axios (HTTP 클라이언트)
- typeorm (ORM)
- @nestjs/common, @nestjs/core

---

## 구현 단계

| 단계 | 작업                             | 파일                                |
| ---- | -------------------------------- | ----------------------------------- |
| 1    | cheerio 패키지 설치              | package.json                        |
| 2    | Product 엔티티 생성              | entities/product.entity.ts          |
| 3    | RankingSnapshot 엔티티 생성      | entities/ranking-snapshot.entity.ts |
| 4    | database.config.ts에 엔티티 등록 | config/database.config.ts           |
| 5    | OliveyoungCrawler 구현           | crawling/oliveyoung.crawler.ts      |
| 6    | CrawlResultDto 생성              | crawling/dto/crawl-result.dto.ts    |
| 7    | CrawlingService 구현             | crawling/crawling.service.ts        |
| 8    | CrawlingController 구현          | crawling/crawling.controller.ts     |
| 9    | CrawlingModule 생성              | crawling/crawling.module.ts         |
| 10   | AppModule에 import 추가          | app/app.module.ts                   |

---

## 검증 체크리스트

### 기능 테스트

- [ ] 백엔드 서버 정상 실행
- [ ] GET /api/crawling 접속 시 관리자 페이지 표시
- [ ] 버튼 클릭 시 크롤링 실행 및 결과 표시
- [ ] POST /api/crawling/oliveyoung/best 호출 성공
- [ ] 크롤링 결과 DB 저장 확인
- [ ] GET /api/crawling/oliveyoung/best 조회 성공
- [ ] 반복 크롤링 시 스냅샷 누적 확인

### 테스트 명령어

```bash
# 1. 서버 실행
npm run dev:backend

# 2. 관리자 페이지 접속 (브라우저)
open http://localhost:3001/api/crawling

# 3. 크롤링 실행 (curl)
curl -X POST http://localhost:3001/api/crawling/oliveyoung/best

# 4. 결과 조회
curl http://localhost:3001/api/crawling/oliveyoung/best
```

---

## 주의사항

### 크롤링 윤리

- 요청 간 1초 딜레이 적용
- User-Agent 헤더 설정
- 과도한 요청 자제

### 에러 처리

- 네트워크 오류 시 적절한 에러 메시지 반환
- HTML 구조 변경 감지 시 로깅

### 향후 확장

- 스케줄러 추가 (`@nestjs/schedule`)
- 카테고리별 크롤링
- 프론트엔드 대시보드 연동

---

## 향후 로드맵

| 버전 | 기능                       | 상태      | 설명                                  |
| ---- | -------------------------- | --------- | ------------------------------------- |
| MVP  | 수동 트리거 크롤링         | 진행 예정 | 관리자 페이지에서 버튼 클릭으로 실행  |
| v1.1 | 스케줄러 자동 실행         | 계획      | 일정 주기로 자동 크롤링               |
| v1.2 | 카테고리별 크롤링          | 계획      | 스킨케어, 메이크업 등 카테고리별 수집 |
| v1.3 | 프론트엔드 대시보드        | 계획      | React 기반 랭킹 조회 UI               |
| v2.0 | 주간 가격 변동 비교        | 아이디어  | 상품별 가격 변동 추적 및 알림         |
| v2.1 | 주간 랭킹 순위 변동 그래프 | 아이디어  | 순위 변동 시각화 차트                 |
| v2.2 | 월간 랭킹 리포트           | 아이디어  | 월별 베스트 상품 통계 분석            |
