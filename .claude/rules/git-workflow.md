# Git Flow 운용 전략 🌿

이 저장소는 **Git Flow 기반** 브랜치 전략을 사용합니다.

---

## 📌 메인 브랜치

| 브랜치    | 용도               | 규칙                                   |
| --------- | ------------------ | -------------------------------------- |
| `main`    | 프로덕션 준비 코드 | 릴리스/핫픽스만 머지, 태그로 버전 관리 |
| `develop` | 개발 통합 브랜치   | 모든 feature의 base, 다음 릴리스 준비  |

---

## 🌱 지원 브랜치

### Feature 브랜치

| 항목      | 내용                                                      |
| --------- | --------------------------------------------------------- |
| 용도      | 새 기능 개발                                              |
| Base      | `develop`                                                 |
| 명명 규칙 | `feature/<scope>-<description>`                           |
| 예시      | `feature/api-user-registration`, `feature/web-login-page` |
| 완료 후   | PR → `develop` (Squash & Merge)                           |

```bash
# Feature 브랜치 워크플로우
git checkout develop && git pull origin develop
git checkout -b feature/api-user-profile

# 작업 완료 후
git add . && git commit -m "feat: Add user profile API"
git push -u origin feature/api-user-profile
gh pr create --base develop --title "Add user profile API"
```

### Release 브랜치

| 항목      | 내용                                           |
| --------- | ---------------------------------------------- |
| 용도      | 릴리스 준비 (버전 업데이트, 버그 수정, 문서화) |
| Base      | `develop`                                      |
| 명명 규칙 | `release/<version>`                            |
| 예시      | `release/0.1.0`                                |
| 완료 후   | `main`과 `develop` 모두에 머지                 |

```bash
# Release 브랜치 워크플로우
git checkout develop
git checkout -b release/0.1.0

# 버전 업데이트 후 main으로 머지
git checkout main
git merge --no-ff release/0.1.0
git tag -a v0.1.0 -m "Release version 0.1.0"
git push origin main --tags

# develop으로도 머지
git checkout develop
git merge --no-ff release/0.1.0
git push origin develop
```

### Hotfix 브랜치

| 항목      | 내용                           |
| --------- | ------------------------------ |
| 용도      | 프로덕션 긴급 버그 수정        |
| Base      | `main`                         |
| 명명 규칙 | `hotfix/<issue-description>`   |
| 예시      | `hotfix/fix-login-crash`       |
| 완료 후   | `main`과 `develop` 모두에 머지 |

```bash
# Hotfix 브랜치 워크플로우
git checkout main
git checkout -b hotfix/fix-critical-bug
git commit -m "fix: Fix critical bug in authentication"

# main으로 머지 및 태그
git checkout main
git merge --no-ff hotfix/fix-critical-bug
git tag -a v0.1.1 -m "Hotfix 0.1.1"
git push origin main --tags

# develop으로도 머지
git checkout develop
git merge --no-ff hotfix/fix-critical-bug
git push origin develop
```

---

## 📝 커밋 메시지 규칙

**Conventional Commits** 스타일 사용:

```
<type>: <subject>

<body>

<footer>
```

| Type       | 용도                         |
| ---------- | ---------------------------- |
| `feat`     | 새로운 기능                  |
| `fix`      | 버그 수정                    |
| `docs`     | 문서 변경                    |
| `style`    | 코드 포맷팅 (기능 변경 없음) |
| `refactor` | 리팩토링                     |
| `test`     | 테스트 추가/수정             |
| `chore`    | 빌드, 설정 등                |

**예시**:

```bash
git commit -m "feat: Add user registration API endpoint"
git commit -m "fix: Resolve JWT token expiration issue"
```

---

## 🔒 PR 및 브랜치 보호 규칙

### PR 규칙

| 항목        | 규칙                               |
| ----------- | ---------------------------------- |
| Base 브랜치 | 대부분 `develop` (hotfix는 `main`) |
| 리뷰        | 모든 PR은 코드 리뷰 후 머지        |
| 머지 전략   | Squash & Merge                     |
| CI          | GitHub Actions 통과 필수           |

### 커밋 타입별 PR 대상 브랜치

| 커밋 타입                                  | PR 대상   | 이유                               |
| ------------------------------------------ | --------- | ---------------------------------- |
| `feat`, `fix`, `refactor`, `test`, `style` | `develop` | 기능/버그는 develop 통해 통합      |
| `chore`, `docs`                            | `main`    | 설정·문서는 develop 거칠 필요 없음 |
| `hotfix/*` 브랜치                          | `main`    | 긴급 수정은 바로 main에 반영       |

> `chore`, `docs` 타입은 `main`에 직접 PR 생성 가능.

### 브랜치 보호

- `main`, `develop` 브랜치는 **직접 push 금지**
- PR을 통한 머지만 허용
- 최소 1명의 리뷰 승인 필요
- CI 테스트 통과 필수

---

## ⚠️ 주의사항

- **Git 커밋 및 푸시는 반드시 사용자에게 확인 후 실행**
- Force push, reset --hard 등 파괴적 명령어 사용 금지
