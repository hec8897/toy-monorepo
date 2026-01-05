# Backend 애플리케이션

PostgreSQL (Supabase) 통합된 NestJS 백엔드 애플리케이션입니다.

## 데이터베이스 설정

이 애플리케이션은 TypeORM을 통해 Supabase의 PostgreSQL을 사용합니다.

### Supabase 연결 정보 가져오기

1. Supabase 프로젝트 대시보드로 이동
2. **Settings** > **Database** 메뉴로 이동
3. **Connection Info** 섹션에서 다음 정보를 확인:
   - Host: `db.<your-project-ref>.supabase.co`
   - Port: `5432`
   - Database name: `postgres`
   - Username: `postgres`
   - Password: (프로젝트 생성 시 설정한 비밀번호)

### 환경 설정

1. `.env.example` 파일을 `.env`로 복사:
   ```bash
   cp .env.example .env
   ```

2. `.env` 파일에 Supabase 연결 정보 입력:
   ```env
   DB_HOST=db.your-project-ref.supabase.co
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your-password
   DB_DATABASE=postgres
   DB_SSL=true
   ```

### 애플리케이션 실행

```bash
# 개발 모드
npm run dev:backend

# API는 http://localhost:3001/api 에서 사용 가능
```

### 데이터베이스 엔티티

애플리케이션에는 `src/entities/user.entity.ts` 위치에 예제 `User` 엔티티가 포함되어 있습니다.

TypeORM은 개발 모드에서 데이터베이스 스키마를 자동으로 동기화합니다 (`synchronize: true`).

**경고**: 프로덕션 환경에서는 `synchronize`를 비활성화하고 마이그레이션을 사용하세요.

## 프로젝트 구조

```
apps/backend/
├── src/
│   ├── app/              # 메인 애플리케이션 모듈
│   ├── config/           # 설정 파일
│   ├── entities/         # TypeORM 엔티티
│   └── main.ts          # 애플리케이션 진입점
├── .env                  # 환경 변수 (git에 포함되지 않음)
├── .env.example         # 환경 변수 예제
└── README.md            # 이 파일
```
