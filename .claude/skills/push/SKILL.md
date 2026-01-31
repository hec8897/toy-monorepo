---
name: push
description: 현재 브랜치를 원격 저장소에 푸시합니다. 푸시 전 상태 확인 및 사용자 승인을 받습니다.
---

# Git Push

현재 브랜치의 커밋을 원격 저장소에 푸시합니다.

## 실행 방법

`/push` 또는 `/push <remote> <branch>`

- 인자 없이 실행: 현재 브랜치를 origin에 푸시
- remote/branch 지정: 해당 원격/브랜치로 푸시

## 푸시 절차

### 1. 상태 확인

```bash
git status
git log origin/<branch>..HEAD --oneline
git branch -vv
```

확인 사항:

- 푸시할 커밋 목록
- 원격 브랜치 추적 상태
- 스테이징되지 않은 변경사항

### 2. 사용자 확인

**⚠️ 중요: 푸시 실행 전 반드시 사용자에게 확인을 받습니다.**

표시할 정보:

- 현재 브랜치명
- 푸시할 커밋 수 및 목록
- 대상 원격 저장소

### 3. 푸시 실행

```bash
# 원격 브랜치가 없는 경우
git push -u origin <branch>

# 이미 추적 중인 경우
git push
```

## 주의사항

### 금지 사항

- ❌ `git push --force` 사용 금지 (사용자 명시적 요청 제외)
- ❌ `main`, `develop` 브랜치 직접 푸시 금지 (PR 사용)
- ❌ `--no-verify` 옵션 사용 금지

### 브랜치 보호 규칙

| 브랜치    | 직접 푸시 | PR 필요 |
| --------- | --------- | ------- |
| `main`    | ❌        | ✅      |
| `develop` | ❌        | ✅      |
| 그 외     | ✅        | -       |

### 충돌 발생 시

1. `git pull --rebase origin <branch>` 로 최신 변경사항 가져오기
2. 충돌 해결 후 다시 푸시
3. 사용자에게 충돌 상황 안내

## 출력 형식

```markdown
## 📤 푸시 준비

**브랜치**: feature/user-auth → origin/feature/user-auth
**커밋 수**: 3개

### 푸시할 커밋

- abc1234 feat: Add login endpoint
- def5678 feat: Add JWT validation
- ghi9012 test: Add auth tests

푸시를 진행할까요?
```
