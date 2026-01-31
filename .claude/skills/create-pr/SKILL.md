---
name: create-pr
description: GitHub Pull Request를 생성합니다. 변경사항 분석 후 PR 제목과 본문을 자동 생성합니다.
---

# Create Pull Request

현재 브랜치의 변경사항을 분석하고 GitHub PR을 생성합니다.

## 실행 방법

`/create-pr` 또는 `/create-pr <base-branch>`

- 푸시가 안되어 있을 경우 푸시 진행
- 인자 없이 실행: `develop` 브랜치를 base로 PR 생성
- base-branch 지정: 해당 브랜치를 base로 PR 생성

## PR 생성 절차

### 1. 사전 검토 (review-pr 자동 실행)

PR 생성 전 `/review-pr`을 실행하여 코드 품질을 검토합니다.

- Critical 이슈가 있으면 PR 생성 전 수정 권장
- 사용자 선택에 따라 리뷰 건너뛰기 가능

### 2. 변경사항 분석

```bash
git status
git diff <base-branch>...HEAD
git log <base-branch>..HEAD --oneline
git diff <base-branch>...HEAD --stat
```

### 3. 원격 브랜치 확인

```bash
git branch -vv
git push -u origin <current-branch>  # 필요시
```

### 4. PR 정보 생성

**PR 제목 규칙:**

- 70자 이하
- Conventional Commits 형식: `<type>(<scope>): <description>`
- 예시: `feat(backend): 올리브영 베스트 랭킹 크롤링 기능 구현`

---

## PR 본문 템플릿

```markdown
## 🔄 변경 사항 요약

[변경사항을 1-3줄로 요약]

### [BE/FE/공통]

- 주요 변경 1
- 주요 변경 2

## 📝 커밋 목록

- `<hash>` <commit message> - _<author>_
- `<hash>` <commit message> - _<author>_

## 📂 수정된 파일

### 🎨 Frontend

- 🆕 `path/to/new/file.tsx` (+N, -N)
- ✏️ `path/to/modified/file.tsx` (+N, -N)
- 🗑️ `path/to/deleted/file.tsx` (+N, -N)

### ⚙️ Backend

- ...

### 📦 Shared Packages

- ...

### 🔧 Configuration

- ...

### 📚 Documentation

- ...

## 📊 통계

- **N** files changed
- **N** insertions(+)
- **N** deletions(-)
- **N** total changes

## 🌲 브랜치

- **From**: `<source-branch>`
- **To**: `<target-branch>`

## Test plan

- [ ] 테스트 항목 1
- [ ] 테스트 항목 2

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## 파일 분류 규칙

| 경로 패턴              | 카테고리        | 아이콘 |
| ---------------------- | --------------- | ------ |
| `apps/frontend/**`     | Frontend        | 🎨     |
| `apps/backend/**`      | Backend         | ⚙️     |
| `packages/**`          | Shared Packages | 📦     |
| `*.json`, `*.config.*` | Configuration   | 🔧     |
| `*.md`, `docs/**`      | Documentation   | 📚     |
| `.claude/**`           | Documentation   | 📚     |

| 변경 타입 | 아이콘 |
| --------- | ------ |
| 새 파일   | 🆕     |
| 수정      | ✏️     |
| 삭제      | 🗑️     |

### 5. 사용자 확인

**⚠️ 중요: PR 생성 전 반드시 사용자에게 확인을 받습니다.**

확인 사항:

- PR 제목
- PR 본문 내용
- Base 브랜치

### 6. PR 생성

```bash
gh pr create --base <base-branch> --title "<title>" --body "$(cat <<'EOF'
<PR body content>
EOF
)"
```

## Git Flow 브랜치 전략

| 브랜치 타입 | Base 브랜치 | PR 대상   |
| ----------- | ----------- | --------- |
| `feature/*` | `develop`   | `develop` |
| `release/*` | `develop`   | `main`    |
| `hotfix/*`  | `main`      | `main`    |

## 주의사항

- PR 생성 전 원격에 브랜치가 푸시되어 있어야 함
- 같은 브랜치로 이미 열린 PR이 있으면 경고
- Draft PR 생성 옵션 제공 (`--draft`)

## 생성 완료 후

PR URL을 사용자에게 반환합니다:

```
✅ PR이 생성되었습니다!
🔗 https://github.com/user/repo/pull/123
```
