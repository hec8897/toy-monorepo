# 프론트엔드 코드 스타일 가이드 🎨

> 참고: [Frontend Fundamentals - Code Quality](https://frontend-fundamentals.com/code-quality/code/)

---

## 🎯 4가지 핵심 기준

| 기준        | 의미                                     | 우선순위            |
| ----------- | ---------------------------------------- | ------------------- |
| 가독성      | 코드를 읽고 이해하기 쉬운 정도           | 일반적으로 최우선   |
| 예측 가능성 | 함수/컴포넌트 동작을 예측할 수 있는 정도 | 높음                |
| 응집도      | 함께 수정될 코드가 같이 있는 정도        | 위험도 높을 때 우선 |
| 결합도      | 코드 수정 시 영향 범위 (낮을수록 좋음)   | 높음                |

---

## 1️⃣ 가독성 (Readability)

### 맥락 줄이기

```typescript
// ❌ 한 함수에 너무 많은 로직
function processOrder(order: Order) {
  // 검증 로직 20줄...
  // 계산 로직 30줄...
  // 저장 로직 20줄...
}

// ✅ 로직별로 분리
function processOrder(order: Order) {
  validateOrder(order);
  const total = calculateTotal(order);
  saveOrder(order, total);
}
```

### 이름 붙이기

```typescript
// ❌ 매직 넘버와 복잡한 조건
if (user.age >= 19 && user.status === 1 && !user.blocked) { ... }

// ✅ 명확한 이름 부여
const ADULT_AGE = 19;
const STATUS_ACTIVE = 1;
const isEligibleUser = user.age >= ADULT_AGE
  && user.status === STATUS_ACTIVE
  && !user.blocked;

if (isEligibleUser) { ... }
```

### 순차적 흐름

```typescript
// ❌ 복잡한 삼항 연산자
const result = a ? (b ? x : y) : c ? z : w;

// ✅ 단순한 조건문
if (a && b) return x;
if (a) return y;
if (c) return z;
return w;
```

---

## 2️⃣ 예측 가능성 (Predictability)

### 이름 중복 방지

```typescript
// ❌ 같은 이름, 다른 동작
// utils/format.ts
export function formatDate(date: Date) { ... }
// helpers/format.ts
export function formatDate(date: Date) { ... } // 다른 구현

// ✅ 명확하게 구분
export function formatDateToKorean(date: Date) { ... }
export function formatDateToISO(date: Date) { ... }
```

### 반환 타입 통일

```typescript
// ❌ 유사 함수인데 반환 타입이 다름
function getUserById(id: string): User | null { ... }
function getUserByEmail(email: string): User | undefined { ... }

// ✅ 반환 타입 통일
function getUserById(id: string): User | null { ... }
function getUserByEmail(email: string): User | null { ... }
```

### 숨은 로직 명시화

```typescript
// ❌ 부수 효과가 숨겨져 있음
function getUser(id: string) {
  analytics.track('user_fetched'); // 숨겨진 부수 효과
  return fetchUser(id);
}

// ✅ 명시적으로 분리
function getUser(id: string) {
  return fetchUser(id);
}

function getUserWithTracking(id: string) {
  analytics.track('user_fetched');
  return fetchUser(id);
}
```

---

## 3️⃣ 응집도 (Cohesion)

### 함께 수정되는 파일은 같은 위치에

```
// ❌ 기능별로 흩어진 구조
components/
  UserProfile.tsx
hooks/
  useUserProfile.ts
types/
  userProfile.ts

// ✅ 함께 수정되는 파일은 같은 폴더에
features/
  user-profile/
    UserProfile.tsx
    useUserProfile.ts
    types.ts
    index.ts
```

### 매직 넘버 제거

```typescript
// ❌ 의미 없는 숫자가 여러 곳에
if (items.length > 10) { ... }
const pageSize = 10;

// ✅ 상수로 정의
const MAX_ITEMS_PER_PAGE = 10;
if (items.length > MAX_ITEMS_PER_PAGE) { ... }
const pageSize = MAX_ITEMS_PER_PAGE;
```

---

## 4️⃣ 결합도 (Coupling)

### 책임 단일화

```typescript
// ❌ 여러 책임이 섞인 컴포넌트
function UserDashboard() {
  // 사용자 데이터 fetching
  // 알림 데이터 fetching
  // 통계 계산
  // UI 렌더링
}

// ✅ 책임별로 분리
function UserDashboard() {
  return (
    <>
      <UserInfo />
      <NotificationList />
      <UserStats />
    </>
  );
}
```

### 중복 코드 허용 (때로는)

```typescript
// ⚠️ 섣부른 추상화보다 중복이 나을 때도 있음
// 두 컴포넌트가 현재는 비슷하지만 독립적으로 변경될 가능성이 높다면
// 공통 컴포넌트로 묶지 않는 것이 좋을 수 있음
```

### Props Drilling 제거

```typescript
// ❌ 여러 단계를 거쳐 props 전달
<App user={user}>
  <Layout user={user}>
    <Sidebar user={user}>
      <UserAvatar user={user} />

// ✅ Context 또는 상태 관리 라이브러리 사용
const user = useUser(); // Zustand, Context 등
<UserAvatar />
```

---

## ⚖️ 기준 간 충돌 시

| 상황                      | 우선 기준   |
| ------------------------- | ----------- |
| 일반적인 경우             | 가독성      |
| 버그 위험이 높은 로직     | 응집도      |
| 자주 변경되는 코드        | 낮은 결합도 |
| 팀원이 자주 실수하는 부분 | 예측 가능성 |

---

## 📋 코드 리뷰 체크리스트

- [ ] 함수가 한 가지 일만 하는가?
- [ ] 변수/함수 이름이 의도를 명확히 표현하는가?
- [ ] 매직 넘버가 상수로 정의되어 있는가?
- [ ] 관련 코드가 같은 위치에 있는가?
- [ ] 불필요한 의존성이 없는가?
