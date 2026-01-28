# PR 코드 리뷰

현재 브랜치의 변경사항을 리뷰하고 PR 생성 전 수정 제안을 제공합니다.

> 리뷰 기준: [Frontend Fundamentals - 좋은 코드](https://frontend-fundamentals.com/code-quality/code/)

## 실행 방법

`/review-pr` 또는 `/review-pr <base-branch>`
또는 pr 을 생성하기를 요청했을때

base-branch를 지정하지 않으면 `develop` 브랜치를 기준으로 비교합니다.

## 리뷰 절차

1. **변경사항 분석**
   - `git diff <base-branch>...HEAD`로 변경된 코드 확인
   - 변경된 파일 목록과 커밋 히스토리 파악

2. **코드 리뷰 수행** - 아래 4가지 원칙을 기준으로 리뷰

---

## 좋은 코드 4가지 원칙

### 1. 가독성 (Readability)

코드가 읽기 쉬운 정도. 동작을 빠르게 이해할 수 있어야 합니다.

#### 체크리스트

- [ ] **맥락 줄이기**: 같이 실행되지 않는 코드가 분리되어 있는가?
- [ ] **구현 상세 추상화**: 복잡한 로직이 적절히 추상화되어 있는가?
- [ ] **명확한 이름**: 복잡한 조건, 매직 넘버에 의미 있는 이름이 붙어 있는가?
- [ ] **위에서 아래로 읽히는 흐름**: 코드가 자연스럽게 위에서 아래로 흐르는가?
- [ ] **적절한 함수/컴포넌트 크기**: 한 함수가 너무 많은 일을 하지 않는가?

#### 안티패턴 예시

```tsx
// Bad: 매직 넘버, 불명확한 조건
if (status === 1 && count > 5) { ... }

// Good: 의미 있는 이름
const isActive = status === STATUS.ACTIVE;
const hasEnoughItems = count > MIN_ITEM_COUNT;
if (isActive && hasEnoughItems) { ... }
```

---

### 2. 예측 가능성 (Predictability)

함수나 컴포넌트의 동작을 이름, 파라미터, 반환값만으로 예측할 수 있어야 합니다.

#### 체크리스트

- [ ] **이름과 동작 일치**: 함수/컴포넌트 이름이 실제 동작을 정확히 설명하는가?
- [ ] **숨은 로직 없음**: 이름에서 예상하지 못한 부수효과가 있는가?
- [ ] **일관된 반환 타입**: 같은 종류의 함수가 일관된 반환 타입을 가지는가?
- [ ] **명확한 Props**: 컴포넌트 Props가 동작을 예측할 수 있게 하는가?
- [ ] **이름 충돌 없음**: 같은 이름이 다른 의미로 사용되지 않는가?

#### 안티패턴 예시

```tsx
// Bad: 이름과 다른 숨은 동작
function getUser(id: string) {
  const user = fetchUser(id);
  analytics.track('user_viewed'); // 숨은 부수효과
  return user;
}

// Good: 이름이 동작을 명확히 설명
function getUser(id: string) {
  return fetchUser(id);
}

function trackAndGetUser(id: string) {
  analytics.track('user_viewed');
  return fetchUser(id);
}
```

---

### 3. 응집도 (Cohesion)

함께 수정되어야 할 코드가 함께 위치해야 합니다.

#### 체크리스트

- [ ] **함께 변경되는 코드 근접 배치**: 관련 코드가 같은 파일/디렉토리에 있는가?
- [ ] **매직 넘버 상수화**: 여러 곳에서 사용되는 값이 상수로 정의되어 있는가?
- [ ] **폼 응집도**: 폼 관련 로직(검증, 상태, 제출)이 함께 관리되는가?
- [ ] **컴포넌트 응집도**: 컴포넌트와 관련 스타일, 타입, 유틸이 함께 있는가?
- [ ] **Feature 기반 구조**: 기능 단위로 파일이 구성되어 있는가?

#### 안티패턴 예시

```
// Bad: 타입별 분리 (응집도 낮음)
/components/Button.tsx
/styles/Button.css
/types/Button.ts
/utils/buttonUtils.ts

// Good: 기능별 분리 (응집도 높음)
/components/Button/
  ├── Button.tsx
  ├── Button.styles.ts
  ├── Button.types.ts
  └── Button.utils.ts
```

---

### 4. 결합도 (Coupling)

코드 수정 시 영향 범위가 최소화되어야 합니다.

#### 체크리스트

- [ ] **책임 분리**: 각 모듈이 단일 책임을 가지는가?
- [ ] **Props Drilling 최소화**: 불필요한 Props 전달 체인이 있는가?
- [ ] **적절한 추상화 수준**: 과도한 추상화로 결합도가 높아지지 않았는가?
- [ ] **의존성 방향**: 의존성이 한 방향으로 흐르는가?
- [ ] **중복 허용**: 잘못된 추상화보다 중복이 나을 때를 인식하는가?

#### 안티패턴 예시

```tsx
// Bad: 과도한 Props Drilling
<App>
  <Layout user={user}>
    <Sidebar user={user}>
      <UserInfo user={user} />
    </Sidebar>
  </Layout>
</App>

// Good: Context 또는 상태 관리 활용
<UserProvider value={user}>
  <App>
    <Layout>
      <Sidebar>
        <UserInfo /> {/* useUser() 훅으로 접근 */}
      </Sidebar>
    </Layout>
  </App>
</UserProvider>
```

---

## 추가 체크리스트

### 타입 안전성

- [ ] `any` 타입 사용 여부
- [ ] 적절한 타입/인터페이스 정의
- [ ] 공유 타입은 `@toy-monorepo/types` 사용

### 보안

- [ ] XSS 취약점 (dangerouslySetInnerHTML)
- [ ] 하드코딩된 API 키, 토큰
- [ ] 민감한 정보 클라이언트 노출

### Next.js 패턴

- [ ] Server Component vs Client Component 적절한 선택
- [ ] 'use client' 지시문 필요 여부

---

3. **결과 출력**
   - 발견된 이슈를 심각도별로 분류 (Critical, Warning, Info)
   - 각 이슈에 대한 구체적인 수정 제안 제공
   - 파일 경로와 라인 번호 명시

## 출력 형식

```markdown
## 리뷰 요약

- **변경 파일**: N개
- **추가**: +X줄 / **삭제**: -Y줄
- **이슈**: Critical: N, Warning: N, Info: N

## Critical Issues

### [파일명:라인번호] 이슈 제목

**원칙**: 가독성 | 예측 가능성 | 응집도 | 결합도
**문제**: 문제 설명
**수정 제안**: 구체적인 해결 방법

## Warnings

...

## 개선 제안

...

## 리뷰 통과 여부

- [ ] Critical 이슈 없음
- [ ] 주요 Warning 해결됨
```
