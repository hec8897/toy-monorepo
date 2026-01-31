---
name: commit
description: Git 커밋을 생성합니다. 변경사항 분석 후 Conventional Commits 스타일로 커밋 메시지를 작성합니다.
---

# Git Commit

현재 변경사항을 분석하고 Conventional Commits 스타일로 커밋을 생성합니다.

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

### 3. 사용자 확인

**⚠️ 중요: 커밋 실행 전 반드시 사용자에게 확인을 받습니다.**

확인 사항:

- 커밋할 파일 목록
- 생성된 커밋 메시지
- 스테이징되지 않은 변경사항 포함 여부

### 4. 커밋 실행

```bash
git add <files>
git commit -m "$(cat <<'EOF'
<commit message>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

## 주의사항

- `.env`, `credentials.json` 등 민감한 파일은 커밋하지 않음
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
