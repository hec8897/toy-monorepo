---
name: commit
description: Git 커밋을 생성합니다. 변경사항 분석 후 Conventional Commits 스타일로 커밋 메시지를 작성합니다.
---

# Git Commit

현재 스테이징에 추가된 파일들 변경사항을 분석하고 Conventional Commits 스타일로 커밋을 생성합니다.
현재 스테이징된 파일이 없으면 git add . 명령어로 전체 추가합니다.

## 실행 방법

`/commit` 또는 `/commit <message>`

- 메시지 없이 실행: 변경사항 분석 후 커밋 메시지 자동 생성
- 메시지 지정: 해당 메시지로 커밋 (형식 검증 수행)

## 커밋 절차

### 1. 변경사항 확인

```bash
git status
git diff --staged
git diff
```

### 2. 커밋 메시지 생성

**Conventional Commits 형식:**

```
<type>: <subject>

<body>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

**커밋 타입:**

| Type       | 용도                         |
| ---------- | ---------------------------- |
| `feat`     | 새로운 기능                  |
| `fix`      | 버그 수정                    |
| `docs`     | 문서 변경                    |
| `style`    | 코드 포맷팅 (기능 변경 없음) |
| `refactor` | 리팩토링                     |
| `test`     | 테스트 추가/수정             |
| `chore`    | 빌드, 설정 등                |

### 3. 커밋 실행

```bash
git add <files>
git commit -m "$(cat <<'EOF'
<commit message>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

## 주의사항

- **사용자가 명시적으로 요청할 때만 커밋 실행** — 코드 수정 완료 후 자동으로 커밋하지 않음
- **hook 통과 시 즉시 실행** — pre-commit hook이 통과하면 사용자 확인 없이 바로 커밋
- **hook 실패 또는 민감 파일 감지 시에만 사용자에게 확인** — `.env`, `credentials.json` 등
- pre-commit hook 실패 시 새로운 커밋 생성 (amend 금지)
- 변경사항이 없으면 빈 커밋 생성하지 않음
- `git add -A` 대신 특정 파일을 명시적으로 스테이징

## 예시 커밋 메시지

```
feat: Add user authentication API endpoint

- JWT 토큰 기반 인증 구현
- 로그인/로그아웃 엔드포인트 추가
- bcrypt를 사용한 비밀번호 해싱

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```
