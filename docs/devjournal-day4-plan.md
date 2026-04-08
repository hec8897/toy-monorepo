# Day 4 — Journal CRUD 구현 계획서

> **목표:** BE entries CRUD API + FE 목록·생성·삭제 UI (textarea)  
> **작성일:** 2026-04-07  
> **기반 분석:** BE/FE 코드베이스 자동 탐색 결과

---

## 현재 상태 (Day 3 완료 기준)

| 항목                                                      | 상태                                                          |
| --------------------------------------------------------- | ------------------------------------------------------------- |
| `apps/devjournal/backend/src/app/app.module.ts`           | ConfigModule + SupabaseModule만 등록                          |
| `apps/devjournal/backend/src/main.ts`                     | ValidationPipe **미적용**                                     |
| `apps/devjournal/backend/src/supabase/`                   | `anon` (RLS 적용) + `admin` (RLS 우회) 클라이언트             |
| `apps/devjournal/backend/src/auth/`                       | `SupabaseAuthGuard` — Bearer → `request.user`                 |
| `apps/devjournal/types/index.ts`                          | `Entry`, `AnalysisStatus` 등 완전 정의됨                      |
| `apps/devjournal/frontend/src/app/(app)/journal/page.tsx` | placeholder만 존재                                            |
| FE tsconfig paths                                         | `@/*` → `src/*`, `@devjournal/types` → `../../types/index.ts` |

---

## BE 구현 계획

### 생성할 파일 (5개)

```
apps/devjournal/backend/src/journal/
├── dto/
│   ├── create-entry.dto.ts
│   └── entry-response.dto.ts
├── journal.controller.ts
├── journal.service.ts
└── journal.module.ts
```

---

#### `journal/dto/create-entry.dto.ts`

```typescript
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateEntryDto {
  @IsString()
  @MinLength(10)
  content: string;

  @IsString()
  @IsOptional()
  title?: string;
}
```

---

#### `journal/dto/entry-response.dto.ts`

`apps/devjournal/types`의 `Entry`에서 `embedding`, `deleted_at` 제외한 응답 DTO.

```typescript
import { AnalysisStatus } from 'apps/devjournal/types';

export class EntryResponseDto {
  id: string;
  user_id: string;
  content: string;
  title: string | null;
  summary: string | null;
  analysis_status: AnalysisStatus;
  analysis_error: string | null;
  analyzed_at: string | null;
  is_published: boolean;
  published_at: string | null;
  slug: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_tags: string[] | null;
  created_at: string;
  updated_at: string;
}
```

---

#### `journal/journal.service.ts`

**설계 포인트:**

- `SupabaseService` 생성자 주입 (SupabaseModule이 Global이므로 import 불필요)
- `ENTRY_SELECT_COLUMNS` 상수로 컬럼 목록 관리 (`embedding`, `deleted_at` 제외)
- 모든 CRUD에 `anon` 클라이언트 사용 (RLS가 user_id 자동 필터링)
- soft delete 필터: `.is('deleted_at', null)` — findAll/findOne 공통 적용

```typescript
// Supabase 쿼리 패턴
const ENTRY_SELECT_COLUMNS =
  'id, user_id, content, title, summary, analysis_status, ' +
  'analysis_error, analyzed_at, is_published, published_at, ' +
  'slug, seo_title, seo_description, seo_tags, created_at, updated_at';

// findAll
await this.supabase.anon
  .from('entries')
  .select(ENTRY_SELECT_COLUMNS)
  .eq('user_id', userId)
  .is('deleted_at', null)
  .order('created_at', { ascending: false });

// findOne
await this.supabase.anon
  .from('entries')
  .select(ENTRY_SELECT_COLUMNS)
  .eq('id', id)
  .eq('user_id', userId)
  .is('deleted_at', null)
  .single(); // data 없으면 NotFoundException

// create — admin 클라이언트 (RLS write 정책 우회)
await this.supabase.admin
  .from('entries')
  .insert({ user_id: userId, content, title, analysis_status: 'pending' })
  .select(ENTRY_SELECT_COLUMNS)
  .single();

// remove (soft delete)
await this.supabase.admin
  .from('entries')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', id)
  .eq('user_id', userId);
```

**메서드 목록:**

| 메서드                | 반환                          | 비고                     |
| --------------------- | ----------------------------- | ------------------------ |
| `findAll(userId)`     | `Promise<EntryResponseDto[]>` | 최신순, soft delete 필터 |
| `findOne(userId, id)` | `Promise<EntryResponseDto>`   | 없으면 NotFoundException |
| `create(userId, dto)` | `Promise<EntryResponseDto>`   | admin 클라이언트         |
| `remove(userId, id)`  | `Promise<void>`               | soft delete              |

---

#### `journal/journal.controller.ts`

```typescript
// AuthenticatedRequest 타입 별칭 (컨트롤러 내부 정의)
type AuthenticatedRequest = ExpressRequest & { user: User };

@Controller('entries')
@UseGuards(SupabaseAuthGuard)
export class JournalController {
  // GET    /api/entries       → findAll
  // GET    /api/entries/:id   → findOne
  // POST   /api/entries       → create (Body: CreateEntryDto)
  // DELETE /api/entries/:id   → remove (HttpCode 204)
}
```

---

#### `journal/journal.module.ts`

```typescript
@Module({
  controllers: [JournalController],
  providers: [JournalService],
  // imports 없음 — SupabaseModule이 @Global()
})
export class JournalModule {}
```

---

### 수정할 파일 (2개)

#### `app/app.module.ts`

```diff
+ import { JournalModule } from '@/journal/journal.module';

  imports: [
    ConfigModule.forRoot({ ... }),
    SupabaseModule,
+   JournalModule,
  ],
```

#### `main.ts`

```diff
+ import { ValidationPipe } from '@nestjs/common';

  app.setGlobalPrefix('api');
+ app.useGlobalPipes(
+   new ValidationPipe({
+     whitelist: true,
+     forbidNonWhitelisted: true,
+     transform: true,
+   }),
+ );
```

---

## FE 구현 계획

### 생성할 파일 (8개)

```
apps/devjournal/frontend/src/features/journal/
├── api/
│   └── index.ts              ← axios 호출 함수
├── hooks/
│   ├── useEntries.ts         ← useQuery (목록)
│   ├── useCreateEntry.ts     ← useMutation (생성)
│   └── useDeleteEntry.ts     ← useMutation (삭제)
├── components/
│   ├── JournalForm.tsx       ← 작성 폼 (textarea + 제목)
│   └── JournalList.tsx       ← 목록 + 항목 + 삭제 버튼
└── types/
    └── index.ts              ← @devjournal/types re-export
```

> **컴포넌트 분리 근거:** `journal/page.tsx`에 모두 넣으면 Day 9 Tiptap 교체 시 수정 범위가 커짐.  
> `JournalForm`만 교체하면 되도록 격리.

---

#### `features/journal/types/index.ts`

```typescript
// @devjournal/types alias는 tsconfig에서 ../../types/index.ts로 매핑됨
export type { Entry, AnalysisStatus } from '@devjournal/types';

export type CreateEntryInput = {
  content: string;
  title?: string;
};
```

---

#### `features/journal/api/index.ts`

```typescript
import { api } from '@/shared/lib/api';
import type { Entry } from '@devjournal/types';
import type { CreateEntryInput } from '../types';

export const journalApi = {
  getEntries: () => api.get<Entry[]>('/entries').then((r) => r.data),

  getEntry: (id: string) =>
    api.get<Entry>(`/entries/${id}`).then((r) => r.data),

  createEntry: (data: CreateEntryInput) =>
    api.post<Entry>('/entries', data).then((r) => r.data),

  deleteEntry: (id: string) => api.delete(`/entries/${id}`),
};
```

---

#### `features/journal/hooks/useEntries.ts`

```typescript
export const ENTRIES_QUERY_KEY = ['entries'] as const;

export function useEntries() {
  return useQuery({
    queryKey: ENTRIES_QUERY_KEY,
    queryFn: journalApi.getEntries,
  });
}
```

---

#### `features/journal/hooks/useCreateEntry.ts`

```typescript
export function useCreateEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: journalApi.createEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTRIES_QUERY_KEY });
    },
  });
}
```

---

#### `features/journal/hooks/useDeleteEntry.ts`

```typescript
export function useDeleteEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: journalApi.deleteEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTRIES_QUERY_KEY });
    },
  });
}
```

---

#### `features/journal/components/JournalForm.tsx`

```typescript
// Props: onSubmit, isPending
// 내부 state: title(string), content(string)
// 제출 버튼: content.length < 10 이거나 isPending이면 disabled
// Day 9에 textarea → Tiptap으로만 이 파일을 교체
```

#### `features/journal/components/JournalList.tsx`

```typescript
// Props: entries, onDelete, isDeleting
// 상태별 분기: isLoading → 스켈레톤, isError → 에러, data.length === 0 → 안내
// 각 항목: 제목(없으면 content 앞 50자), 날짜, analysis_status 배지, 삭제 버튼
// 삭제: window.confirm() 후 onDelete(id) 호출
```

**analysis_status 배지 색상 맵:**

```typescript
const STATUS_BADGE = {
  pending: 'bg-gray-100 text-gray-600',
  processing: 'bg-blue-100 text-blue-600',
  completed: 'bg-green-100 text-green-600',
  failed: 'bg-red-100 text-red-600',
} as const satisfies Record<AnalysisStatus, string>;
```

---

### 수정할 파일 (1개)

#### `app/(app)/journal/page.tsx` — 전면 재작성

**컴포넌트 구성 (분리 후):**

```
JournalPage ('use client')
├── JournalForm
│   ├── Props: onSubmit(data), isPending
│   └── 내부: title/content useState, 유효성 검사
└── JournalList
    ├── Props: entries, isLoading, isError, onDelete, isDeleting
    └── 내부: 상태별 분기, 배지 렌더링
```

**page.tsx 역할 (오케스트레이션만):**

```typescript
'use client';

export default function JournalPage() {
  const { data: entries, isLoading, isError } = useEntries();
  const createMutation = useCreateEntry();
  const deleteMutation = useDeleteEntry();

  return (
    <div className="p-6 space-y-8">
      <JournalForm
        onSubmit={(data) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
      />
      <JournalList
        entries={entries ?? []}
        isLoading={isLoading}
        isError={isError}
        onDelete={(id) => deleteMutation.mutate(id)}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
```

---

## 구현 순서 (권장)

```
1. BE
   ① journal/dto/create-entry.dto.ts
   ② journal/dto/entry-response.dto.ts
   ③ journal/journal.service.ts
   ④ journal/journal.controller.ts
   ⑤ journal/journal.module.ts
   ⑥ app/app.module.ts 수정
   ⑦ main.ts 수정 (ValidationPipe)

2. FE
   ① features/journal/types/index.ts
   ② features/journal/api/index.ts
   ③ features/journal/hooks/useEntries.ts
   ④ features/journal/hooks/useCreateEntry.ts
   ⑤ features/journal/hooks/useDeleteEntry.ts
   ⑥ features/journal/components/JournalForm.tsx
   ⑦ features/journal/components/JournalList.tsx
   ⑧ app/(app)/journal/page.tsx 재작성 (JournalForm + JournalList 조합)
```

---

## 검증 체크리스트

### BE

- [ ] `POST /api/entries` — content 10자 미만 시 400 에러
- [ ] `GET /api/entries` — soft delete된 항목 미노출
- [ ] `DELETE /api/entries/:id` — 타인 항목 삭제 불가 (RLS 보호)
- [ ] `Authorization: Bearer <token>` 없으면 401

### FE

- [ ] 저장 버튼 클릭 → 목록 자동 갱신 (invalidation)
- [ ] 삭제 confirm → 목록에서 즉시 제거
- [ ] content 10자 미만 시 저장 불가 (disabled)
- [ ] analysis_status 배지 정상 표시

---

## 주요 설계 결정

| 결정                             | 이유                                                      |
| -------------------------------- | --------------------------------------------------------- |
| entries CRUD에 `anon` 클라이언트 | RLS 정책이 user_id 자동 필터링                            |
| create에 `admin` 클라이언트      | entries 테이블 INSERT RLS 정책이 service_role 필요        |
| ENTRY_SELECT_COLUMNS 상수        | embedding(large), deleted_at 노출 방지 + 모든 쿼리 일관성 |
| soft delete (`deleted_at`)       | DB 설계 그대로 준수, 복구 가능성 유지                     |
| `@devjournal/types` alias        | FE tsconfig에 이미 정의됨, 상대경로 안쓰고 깔끔하게       |
| textarea (Tiptap 아님)           | Tiptap은 Day 9에 교체 예정 — 조기 최적화 금지             |
