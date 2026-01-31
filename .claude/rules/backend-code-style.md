# 백엔드 코드 스타일 가이드 🔧

NestJS + TypeORM 기반 백엔드 개발 규칙입니다.

---

## 🏗️ 아키텍처

### Layered Architecture

```
Presentation (Controllers, DTOs)
       ↓
Business Logic (Services)
       ↓
Data Access (Repositories, Entities)
       ↓
Database (PostgreSQL/Supabase)
```

### 모듈 구조

```
feature/
├── feature.module.ts       # 모듈 정의
├── feature.controller.ts   # HTTP 엔드포인트
├── feature.service.ts      # 비즈니스 로직
├── dto/                    # 데이터 전송 객체
└── entities/               # TypeORM 엔티티
```

---

## 📋 관심사의 분리

| 계층                  | 책임                            |
| --------------------- | ------------------------------- |
| **Controller**        | HTTP 요청/응답 처리만           |
| **Service**           | 비즈니스 로직 및 오케스트레이션 |
| **Repository/Entity** | 데이터 접근 계층                |
| **DTO**               | 계층 간 데이터 전송 및 검증     |

```typescript
// ❌ Controller에서 비즈니스 로직 처리
@Get(':id')
async getUser(@Param('id') id: string) {
  const user = await this.userRepo.findOne(id);
  if (user.status === 'inactive') throw new ForbiddenException();
  return user;
}

// ✅ Service로 분리
@Get(':id')
async getUser(@Param('id') id: string) {
  return this.userService.getActiveUser(id);
}
```

---

## 🔒 보안

| 항목        | 규칙                            |
| ----------- | ------------------------------- |
| 비밀번호    | bcrypt 해싱 (솔트 라운드 10)    |
| 인증        | JWT 토큰 (Bearer token)         |
| 마스터 토큰 | `.env`의 `MASTER_TOKEN`         |
| 쿠키        | `cookie-parser` 사용            |
| 입력 검증   | 모든 DTO에 class-validator 적용 |
| 환경 변수   | `.env` 파일 (git ignore)        |

```typescript
// ✅ DTO 검증 예시
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

---

## 💾 데이터베이스

### 설정 파일 위치

- **Supabase 설정**: `apps/backend/src/config/database.config.ts`
- **환경 변수 예제**: `apps/backend/.env.example`
- **엔티티 정의**: `apps/backend/src/entities/`

### TypeORM 규칙

| 항목        | 규칙                         |
| ----------- | ---------------------------- |
| 엔티티 위치 | `apps/backend/src/entities/` |
| 엔티티 등록 | `database.config.ts`에 추가  |
| synchronize | 개발 환경만 `true`           |
| 프로덕션    | 마이그레이션 사용            |

```typescript
// ✅ 엔티티 예시
@Entity('members')
export class Member {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

### ⚠️ 주의사항

- **DB 쿼리 실행이 필요한 경우, 반드시 사용자에게 확인 후 실행**

---

## 🌐 API 설계

| 항목        | 규칙                    |
| ----------- | ----------------------- |
| 스타일      | RESTful                 |
| 전역 prefix | `/api`                  |
| 응답 형식   | 일관된 DTO 구조         |
| 에러 처리   | NestJS Exception Filter |

```typescript
// ✅ 일관된 응답 구조
@Get()
async findAll(): Promise<MemberResponseDto[]> {
  return this.membersService.findAll();
}

// ✅ 에러 처리
if (!member) {
  throw new NotFoundException(`Member #${id} not found`);
}
```

---

## 🔧 설정 관리

- 환경별 설정은 `ConfigModule` 사용
- 각 모듈은 독립적으로 동작 가능하도록 설계

```typescript
// ✅ ConfigModule 사용
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
})
export class AppModule {}
```
